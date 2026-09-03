import type { Prisma, PrismaClient } from "@prisma/client";
import {
  accessControlPermissionDefinitions,
  defaultPermissionCodesForRole,
} from "../../../common/constants/access-control-permission.constant.js";
import { Permissions } from "../../../common/constants/permission.constant.js";
import { getPrismaClient } from "../../../config/database.js";
import { AppError, ErrorCode } from "../../../common/errors/index.js";

export type AccessControlTransaction = Prisma.TransactionClient;

export const provisionAccessControlPermissions = async (
  transaction: AccessControlTransaction,
  companyId: number,
) => {
  const existingPermissions = await transaction.lmsPermission.findMany({
    where: { companyId },
    select: { code: true },
  });
  const existingCodes = new Set(existingPermissions.map(({ code }) => code));
  const permissions = await Promise.all(
    accessControlPermissionDefinitions.map((definition) =>
      transaction.lmsPermission.upsert({
        where: { companyId_code: { companyId, code: definition.code } },
        update: {
          description: definition.description,
          module: definition.module,
        },
        create: {
          companyId,
          code: definition.code,
          description: definition.description,
          module: definition.module,
        },
      }),
    ),
  );
  const permissionByCode = new Map(
    permissions.map((permission) => [permission.code, permission]),
  );
  const roles = await transaction.appRole.findMany({
    where: { companyId, isActive: true },
    select: { id: true, name: true, lmsPolicyInitializedAt: true },
  });

  for (const role of roles) {
    const defaultCodes = defaultPermissionCodesForRole(role.name);
    const codesToGrant = role.lmsPolicyInitializedAt
      ? defaultCodes.filter((code) => !existingCodes.has(code))
      : defaultCodes;
    const assignments = codesToGrant.flatMap((code) => {
      const permission = permissionByCode.get(code);
      return permission
        ? [{ companyId, appRoleId: role.id, permissionId: permission.id }]
        : [];
    });

    if (assignments.length > 0) {
      await transaction.lmsRolePermission.createMany({
        data: assignments,
        skipDuplicates: true,
      });
    }
    if (!role.lmsPolicyInitializedAt) {
      await transaction.appRole.update({
        where: { id: role.id },
        data: { lmsPolicyInitializedAt: new Date() },
      });
    }
  }
};

export class AccessControlRepository {
  private get prisma(): PrismaClient {
    return getPrismaClient();
  }

  async list(companyId: number) {
    await this.prisma.$transaction((transaction) =>
      provisionAccessControlPermissions(transaction, companyId),
    );
    const [roles, permissions] = await Promise.all([
      this.prisma.appRole.findMany({
        where: { companyId },
        include: {
          _count: { select: { appUsers: { where: { isActive: true } } } },
          lmsPermissions: {
            where: { companyId },
            select: { permission: { select: { code: true } } },
          },
        },
        orderBy: [{ isActive: "desc" }, { name: "asc" }],
      }),
      this.prisma.lmsPermission.findMany({
        where: { companyId },
        select: { code: true, description: true, module: true },
        orderBy: [{ module: "asc" }, { code: "asc" }],
      }),
    ]);
    return {
      roles: roles.map((role) => ({
        id: role.id,
        name: role.name,
        description: role.description,
        isActive: role.isActive,
        employeeCount: role._count.appUsers,
        permissionCodes: role.lmsPermissions
          .map(({ permission }) => permission.code)
          .sort(),
      })),
      permissions,
    };
  }

  async replaceRolePermissions(input: {
    companyId: number;
    actorUserId?: number;
    roleId: number;
    actorRoleId?: number;
    permissionCodes: string[];
  }) {
    return this.prisma.$transaction(
      async (transaction) => {
        await provisionAccessControlPermissions(transaction, input.companyId);
        const role = await transaction.appRole.findFirst({
          where: { id: input.roleId, companyId: input.companyId },
          select: { id: true, name: true, isActive: true },
        });
        if (!role) throw new AppError("Role not found.", 404, ErrorCode.NOT_FOUND);
        if (!role.isActive) {
          throw new AppError(
            "Permissions cannot be changed for an inactive role.",
            409,
            ErrorCode.CONFLICT,
          );
        }

        const permissions = await transaction.lmsPermission.findMany({
          where: {
            companyId: input.companyId,
            code: { in: input.permissionCodes },
          },
          select: { id: true, code: true },
        });
        if (permissions.length !== input.permissionCodes.length) {
          const found = new Set(permissions.map(({ code }) => code));
          throw new AppError(
            `One or more permission codes are invalid: ${input.permissionCodes.filter((code) => !found.has(code)).join(", ")}`,
            400,
            ErrorCode.BAD_REQUEST,
          );
        }
        if (
          input.actorRoleId &&
          input.roleId === input.actorRoleId &&
          !input.permissionCodes.includes(Permissions.ACCESS_CONTROL_MANAGE)
        ) {
          throw new AppError(
            "You cannot remove access-control management from your own role.",
            409,
            ErrorCode.CONFLICT,
          );
        }

        const previousAssignments =
          await transaction.lmsRolePermission.findMany({
            where: { companyId: input.companyId, appRoleId: input.roleId },
            select: { permission: { select: { code: true } } },
          });
        const previousPermissionCodes = previousAssignments
          .map(({ permission }) => permission.code)
          .sort();
        if (
          previousPermissionCodes.includes(Permissions.ACCESS_CONTROL_MANAGE) &&
          !input.permissionCodes.includes(Permissions.ACCESS_CONTROL_MANAGE)
        ) {
          const otherActiveManager = await transaction.appRole.findFirst({
            where: {
              companyId: input.companyId,
              id: { not: input.roleId },
              isActive: true,
              appUsers: { some: { isActive: true } },
              lmsPermissions: {
                some: {
                  companyId: input.companyId,
                  permission: { code: Permissions.ACCESS_CONTROL_MANAGE },
                },
              },
            },
            select: { id: true },
          });
          if (!otherActiveManager) {
            throw new AppError(
              "At least one active employee role must retain access-control management.",
              409,
              ErrorCode.CONFLICT,
            );
          }
        }

        await transaction.lmsRolePermission.deleteMany({
          where: { companyId: input.companyId, appRoleId: input.roleId },
        });
        if (permissions.length > 0) {
          await transaction.lmsRolePermission.createMany({
            data: permissions.map((permission) => ({
              companyId: input.companyId,
              appRoleId: input.roleId,
              permissionId: permission.id,
            })),
          });
        }
        await transaction.appRole.update({
          where: { id: input.roleId },
          data: { lmsPolicyInitializedAt: new Date() },
        });
        if (input.actorUserId) {
          await transaction.auditLog.create({
            data: {
              companyId: input.companyId,
              actorUserId: input.actorUserId,
              entityType: "EMS_ROLE_PERMISSION_POLICY",
              action: "ROLE_PERMISSIONS_REPLACED",
              beforeJson: {
                roleId: role.id,
                roleName: role.name,
                permissionCodes: previousPermissionCodes,
              },
              afterJson: {
                roleId: role.id,
                roleName: role.name,
                permissionCodes: input.permissionCodes,
              },
            },
          });
        }
        return role;
      },
      { isolationLevel: "Serializable" },
    );
  }
}

export const accessControlRepository = new AccessControlRepository();
