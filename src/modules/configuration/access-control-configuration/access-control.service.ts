import { getPrismaClient } from "../../../config/database.js";
import { notificationRealtimeHub } from "../../notifications/realtime-hub.js";
import { accessControlRepository } from "./access-control.repository.js";
import { cacheService, CacheKeys } from "../../../common/cache/cache.service.js";
import { AppError, ErrorCode } from "../../../common/errors/index.js";
import { permissionGroupService } from "./permission-group.service.js";

const prisma = () => getPrismaClient();

async function auditLog(data: {
  companyId: number;
  actorUserId: number;
  entityType: string;
  entityId: string;
  action: string;
  beforeJson?: object;
  afterJson?: object;
}) {
  try {
    await prisma().auditLog.create({
      data: {
        companyId: data.companyId,
        actorUserId: data.actorUserId,
        entityType: data.entityType,
        entityId: data.entityId,
        action: data.action,
        beforeJson: data.beforeJson,
        afterJson: data.afterJson,
      },
    });
  } catch { /* audit must never block the primary operation */ }
}

// System roles that cannot be deleted or deactivated
const SYSTEM_ROLE_NAMES = new Set(["Learner", "Manager", "HR User", "Admin", "CEO", "Finance"]);


export const accessControlService = {
  list(companyId: number) {
    return accessControlRepository.list(companyId);
  },

  async updateRolePermissions(input: {
    companyId: number;
    actorUserId?: number;
    roleId: number;
    actorRoleId?: number;
    permissionCodes: string[];
  }) {
    await accessControlRepository.replaceRolePermissions(input);

    // Find ALL active users who hold this role — both as their primary role
    // (AppUser.roleId) and via role assignment (UserRoleAssignment). Users who
    // gained/lost a permission need their session refreshed so usePermission()
    // reflects the change within ~1 second via SSE.
    const [primaryUsers, assignedUsers] = await Promise.all([
      getPrismaClient().appUser.findMany({
        where: {
          companyId: input.companyId,
          roleId: input.roleId,
          isActive: true,
        },
        select: { id: true },
      }),
      getPrismaClient().userRoleAssignment.findMany({
        where: {
          companyId: input.companyId,
          appRoleId: input.roleId,
          isActive: true,
        },
        select: { userId: true },
      }),
    ]);

    // Dedupe by user id (a user could hold the role both ways).
    const affectedUserIds = Array.from(
      new Set([
        ...primaryUsers.map((u) => u.id),
        ...assignedUsers.map((a) => a.userId),
      ]),
    );

    if (affectedUserIds.length > 0) {
      notificationRealtimeHub.publishToUsers(
        input.companyId,
        affectedUserIds,
        {
          reason: "permissions.changed",
          occurredAt: new Date().toISOString(),
        },
      );
    }

        return accessControlRepository.list(input.companyId);
  },

  /**
   * Get a single role with its permission codes.
   */
  async getRoleById(roleId: number, companyId: number) {
    const role = await prisma().appRole.findFirst({
      where: { id: roleId, companyId },
      include: {
        lmsPermissions: {
          where: { companyId },
          select: { permission: { select: { id: true, code: true, description: true, module: true} } },
        },
        _count: { select: { appUsers: { where: { isActive: true } } } },
      },
    });
    if (!role) throw new AppError("Role not found.", 404, ErrorCode.NOT_FOUND);

    return {
      id: role.id,
      name: role.name,
      description: role.description,
      isActive: role.isActive,
      companyId: role.companyId,
      lastSyncedAt: role.lastSyncedAt,
      lmsPolicyInitializedAt: role.lmsPolicyInitializedAt,
      employeeCount: role._count.appUsers,
      permissions: role.lmsPermissions.map((rp) => rp.permission),
    };
  },

    /**
   * Get role with permissions — alias for getRoleById.
   */
  getRoleWithPermissions(roleId: number, companyId: number) {
    return this.getRoleById(roleId, companyId);
  },

  /**
   * Toggle a role's active status.
   * System roles cannot be deactivated.
   */
  async toggleRoleStatus(roleId: number, isActive: boolean, companyId: number, actorUserId: number) {
    const role = await prisma().appRole.findFirst({ where: { id: roleId, companyId } });
    if (!role) throw new AppError("Role not found.", 404, ErrorCode.NOT_FOUND);

    if (SYSTEM_ROLE_NAMES.has(role.name) && !isActive) {
      throw new AppError(`System role "${role.name}" cannot be deactivated.`, 409, ErrorCode.CONFLICT);
    }

    const updated = await prisma().appRole.update({ where: { id: roleId }, data: { isActive } });

    await auditLog({
      companyId, actorUserId,
      entityType: "ROLE", entityId: String(roleId),
      action: isActive ? "ACTIVATED" : "DEACTIVATED",
      beforeJson: { isActive: role.isActive },
      afterJson: { isActive },
    });

    return updated;
  },

    async createRole(data: { name: string; description?: string; isActive?: boolean }, companyId: number, actorUserId: number) {
    const existing = await prisma().appRole.findFirst({
      where: { companyId, name: { equals: data.name, mode: "insensitive" } },
    });
    if (existing) throw new AppError(`Role "${data.name}" already exists.`, 409, ErrorCode.CONFLICT);

    // AppRole.id is supplied by EMS (not auto-increment). For LMS-created roles we
    // allocate the next available integer id in the company's range to avoid
    // collisions with EMS-sync'd roles.
    const maxId = await prisma().appRole.aggregate({
      where: { companyId },
      _max: { id: true },
    });
    const nextId = (maxId._max.id ?? 0) + 1;

    const role = await prisma().appRole.create({
      data: { id: nextId, companyId, name: data.name, description: data.description, isActive: data.isActive ?? true },
    });

    await auditLog({
      companyId, actorUserId,
      entityType: "ROLE", entityId: String(role.id),
      action: "CREATED",
      afterJson: { id: role.id, name: role.name, description: role.description, isActive: role.isActive },
    });

    return role;
  },

  async updateRole(roleId: number, data: { name?: string; description?: string; isActive?: boolean }, companyId: number, actorUserId: number) {
    const role = await prisma().appRole.findFirst({ where: { id: roleId, companyId } });
    if (!role) throw new AppError("Role not found.", 404, ErrorCode.NOT_FOUND);

    if (data.name && data.name !== role.name) {
      const dup = await prisma().appRole.findFirst({
        where: { companyId, name: { equals: data.name, mode: "insensitive" }, id: { not: roleId } },
      });
      if (dup) throw new AppError(`Role "${data.name}" already exists.`, 409, ErrorCode.CONFLICT);
    }

    if (SYSTEM_ROLE_NAMES.has(role.name) && data.isActive === false) {
      throw new AppError(`System role "${role.name}" cannot be deactivated.`, 409, ErrorCode.CONFLICT);
    }

    const updated = await prisma().appRole.update({
      where: { id: roleId },
      data: { name: data.name, description: data.description, isActive: data.isActive },
    });

    await auditLog({
      companyId, actorUserId,
      entityType: "ROLE", entityId: String(roleId),
      action: "UPDATED",
      beforeJson: { name: role.name, description: role.description, isActive: role.isActive },
      afterJson: { name: updated.name, description: updated.description, isActive: updated.isActive },
    });

    return updated;
  },

  async deleteRole(roleId: number, companyId: number, actorUserId: number) {
    const role = await prisma().appRole.findFirst({
      where: { id: roleId, companyId },
      include: { _count: { select: { appUsers: { where: { isActive: true } } } } },
    });
    if (!role) throw new AppError("Role not found.", 404, ErrorCode.NOT_FOUND);
    if (SYSTEM_ROLE_NAMES.has(role.name)) throw new AppError(`System role "${role.name}" cannot be deleted.`, 409, ErrorCode.CONFLICT);
    if (role._count.appUsers > 0) throw new AppError(`Role "${role.name}" has ${role._count.appUsers} active user(s) and cannot be deleted.`, 409, ErrorCode.CONFLICT);

    await prisma().$transaction(async (tx) => {
      await tx.lmsRolePermission.deleteMany({ where: { appRoleId: roleId, companyId } });
      await tx.userRoleAssignment.updateMany({ where: { appRoleId: roleId, isActive: true }, data: { isActive: false } });
      await tx.appRole.delete({ where: { id: roleId } });
    });

    await auditLog({ companyId, actorUserId, entityType: "ROLE", entityId: String(roleId), action: "DELETED", beforeJson: { name: role.name, description: role.description, isActive: role.isActive } });
        await cacheService.del(CacheKeys.rolePermissions(roleId));
  },

  /* ─── Role-Permission Assignment ───────────────────────────────────────── */

  async assignPermissionToRole(roleId: number, permissionId: number, companyId: number, performedBy: number) {
    const [role, permission] = await Promise.all([
      prisma().appRole.findFirst({ where: { id: roleId, companyId } }),
      prisma().lmsPermission.findFirst({ where: { id: permissionId, companyId } }),
    ]);
    if (!role) throw new AppError("Role not found.", 404, ErrorCode.NOT_FOUND);
    if (!permission) throw new AppError("Permission not found.", 404, ErrorCode.NOT_FOUND);

    await prisma().$transaction(async (tx) => {
      const existing = await tx.lmsRolePermission.findFirst({ where: { appRoleId: roleId, permissionId, companyId } });
      if (!existing) {
        await tx.lmsRolePermission.create({ data: { companyId, appRoleId: roleId, permissionId } });
      }
    });

    await auditLog({ companyId, actorUserId: performedBy, entityType: "ROLE_PERMISSION", entityId: String(roleId), action: "ASSIGNED", afterJson: { roleId, permissionId, permissionCode: permission.code } });
    await cacheService.del(CacheKeys.rolePermissions(roleId));
  },

  async revokePermissionFromRole(roleId: number, permissionId: number, companyId: number, performedBy: number) {
    const [role, permission] = await Promise.all([
      prisma().appRole.findFirst({ where: { id: roleId, companyId } }),
      prisma().lmsPermission.findFirst({ where: { id: permissionId, companyId } }),
    ]);
    if (!role) throw new AppError("Role not found.", 404, ErrorCode.NOT_FOUND);
    if (!permission) throw new AppError("Permission not found.", 404, ErrorCode.NOT_FOUND);

    await prisma().lmsRolePermission.deleteMany({ where: { appRoleId: roleId, permissionId, companyId } });
    await auditLog({ companyId, actorUserId: performedBy, entityType: "ROLE_PERMISSION", entityId: String(roleId), action: "REVOKED", beforeJson: { roleId, permissionId, permissionCode: permission.code } });
    await cacheService.del(CacheKeys.rolePermissions(roleId));
  },

  async getRolePermissions(roleId: number, companyId: number) {
    const role = await prisma().appRole.findFirst({
      where: { id: roleId, companyId },
      include: {
        lmsPermissions: {
          where: { companyId },
          select: { permission: { select: { id: true, code: true, description: true, module: true } } },
        },
      },
    });
    if (!role) throw new AppError("Role not found.", 404, ErrorCode.NOT_FOUND);
        return role.lmsPermissions.map((rp) => rp.permission).sort((a, b) => a.code.localeCompare(b.code));
  },

  async bulkAssignPermissionsToRole(roleId: number, permissionIds: number[], companyId: number, performedBy: number) {
    const role = await prisma().appRole.findFirst({ where: { id: roleId, companyId } });
    if (!role) throw new AppError("Role not found.", 404, ErrorCode.NOT_FOUND);

    const existing = await prisma().lmsRolePermission.findMany({
      where: { appRoleId: roleId, permissionId: { in: permissionIds }, companyId },
      select: { permissionId: true },
    });
    const existingIds = new Set(existing.map((a) => a.permissionId));
    const newAssignments = permissionIds
      .filter((pid) => !existingIds.has(pid))
      .map((pid) => ({ companyId, appRoleId: roleId, permissionId: pid }));

    if (newAssignments.length > 0) {
      await prisma().lmsRolePermission.createMany({ data: newAssignments });
    }
    await auditLog({ companyId, actorUserId: performedBy, entityType: "ROLE_PERMISSION", entityId: String(roleId), action: "ASSIGNED", afterJson: { roleId, permissionIds: newAssignments.map((a) => a.permissionId) } });
    await cacheService.del(CacheKeys.rolePermissions(roleId));
  },

  async bulkRevokePermissionsFromRole(roleId: number, permissionIds: number[], companyId: number, performedBy: number) {
    const role = await prisma().appRole.findFirst({ where: { id: roleId, companyId } });
    if (!role) throw new AppError("Role not found.", 404, ErrorCode.NOT_FOUND);

    const deleted = await prisma().lmsRolePermission.deleteMany({ where: { appRoleId: roleId, permissionId: { in: permissionIds }, companyId } });
    await auditLog({ companyId, actorUserId: performedBy, entityType: "ROLE_PERMISSION", entityId: String(roleId), action: "REVOKED", beforeJson: { roleId, permissionIds, deletedCount: deleted.count } });
    await cacheService.del(CacheKeys.rolePermissions(roleId));
  },

  async replaceRolePermissions(input: { companyId: number; actorUserId?: number; roleId: number; actorRoleId?: number; permissionCodes: string[] }) {
    await this.updateRolePermissions(input);
    await cacheService.del(CacheKeys.rolePermissions(input.roleId));
  },

  /* ─── Permission Management ──────────────────────────────────────────── */

  async getPermissions(companyId: number, filters?: { module?: string }) {
    const where: { companyId: number; module?: string } = { companyId };
    if (filters?.module) where.module = filters.module;
    return prisma().lmsPermission.findMany({
      where,
      include: { group: { select: { id: true, name: true, module: true } } },
      orderBy: [{ module: "asc" }, { code: "asc" }],
    });
  },

  async getPermissionGroups(companyId: number) {
    return permissionGroupService.list(companyId);
  },

  async createPermission(data: { code: string; description?: string; module: string; groupId?: number }, companyId: number, actorUserId: number) {
    const existing = await prisma().lmsPermission.findFirst({ where: { companyId, code: data.code } });
    if (existing) throw new AppError(`Permission "${data.code}" already exists.`, 409, ErrorCode.CONFLICT);

    if (data.groupId) {
      const group = await prisma().permissionGroup.findFirst({ where: { id: data.groupId, companyId } });
      if (!group) throw new AppError("Permission group not found.", 404, ErrorCode.NOT_FOUND);
    }

    const permission = await prisma().lmsPermission.create({
      data: { companyId, code: data.code, description: data.description, module: data.module, groupId: data.groupId },
    });
    await auditLog({ companyId, actorUserId, entityType: "PERMISSION", entityId: String(permission.id), action: "CREATED", afterJson: permission as object });
    return permission;
  },

  async updatePermission(id: number, data: { code?: string; description?: string; module?: string; groupId?: number | null }, companyId: number, actorUserId: number) {
    const before = await prisma().lmsPermission.findFirst({ where: { id, companyId } });
    if (!before) throw new AppError("Permission not found.", 404, ErrorCode.NOT_FOUND);

    if (data.code && data.code !== before.code) {
      const dup = await prisma().lmsPermission.findFirst({ where: { companyId, code: data.code, id: { not: id } } });
      if (dup) throw new AppError(`Permission "${data.code}" already exists.`, 409, ErrorCode.CONFLICT);
    }

    if (data.groupId !== undefined && data.groupId !== null) {
      const group = await prisma().permissionGroup.findFirst({ where: { id: data.groupId, companyId } });
      if (!group) throw new AppError("Permission group not found.", 404, ErrorCode.NOT_FOUND);
    }

    const updated = await prisma().lmsPermission.update({
      where: { id },
      data: { code: data.code, description: data.description, module: data.module, groupId: data.groupId ?? undefined },
    });
    await auditLog({ companyId, actorUserId, entityType: "PERMISSION", entityId: String(id), action: "UPDATED", beforeJson: before as object, afterJson: updated as object });
    return updated;
  },

  async deletePermission(id: number, companyId: number, actorUserId: number) {
    const permission = await prisma().lmsPermission.findFirst({ where: { id, companyId } });
    if (!permission) throw new AppError("Permission not found.", 404, ErrorCode.NOT_FOUND);

    const count = await prisma().lmsRolePermission.count({ where: { permissionId: id, companyId } });
    if (count > 0) throw new AppError("Cannot delete a permission that is assigned to roles.", 409, ErrorCode.CONFLICT);

    await prisma().lmsPermission.delete({ where: { id } });
    await auditLog({ companyId, actorUserId, entityType: "PERMISSION", entityId: String(id), action: "DELETED", beforeJson: permission as object });
  },
};
