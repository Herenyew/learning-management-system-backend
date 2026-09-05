import { getPrismaClient } from "../../../config/database.js";
import { AppError, ErrorCode } from "../../../common/errors/index.js";
import { cacheService, CacheKeys } from "../../../common/cache/cache.service.js";
import { userRoleRepository } from "./user-role.repository.js";

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
  } catch { /* audit must never block */ }
}

async function invalidateUserCache(userId: number) {
  await Promise.all([
    cacheService.del(CacheKeys.userRoles(userId)),
    cacheService.del(CacheKeys.userPermissions(userId)),
  ]);
}

export const userRoleService = {
  async getUserRoles(userId: number) {
    const cached = await cacheService.get<object[]>(CacheKeys.userRoles(userId));
    if (cached) return cached;

    const roles = await userRoleRepository.findByUser(userId);
    await cacheService.set(CacheKeys.userRoles(userId), roles, 60);
    return roles;
  },

  getUsersByRole(roleId: number, companyId: number) {
    return userRoleRepository.findByRole(roleId, companyId);
  },

  async assignRole(
    userId: number,
    roleId: number,
    assignedBy: number,
    options: { isManual?: boolean; notes?: string; expiresAt?: Date },
    companyId: number,
  ) {
    const [user, role] = await Promise.all([
      prisma().appUser.findFirst({ where: { id: userId, companyId } }),
      prisma().appRole.findFirst({ where: { id: roleId, companyId } }),
    ]);
    if (!user) throw new AppError("User not found.", 404, ErrorCode.NOT_FOUND);
    if (!role) throw new AppError("Role not found.", 404, ErrorCode.NOT_FOUND);

    const existing = await userRoleRepository.findOne(userId, roleId);

    let assignment;
    if (existing) {
      if (existing.isActive) {
        throw new AppError("User already has this role.", 409, ErrorCode.CONFLICT);
      }
      // Reactivate the existing deactivated record
      assignment = await userRoleRepository.reactivate(existing.id, {
        assignedBy,
        isManual: options.isManual ?? true,
        notes: options.notes,
        expiresAt: options.expiresAt,
      });
    } else {
      assignment = await userRoleRepository.create({
        companyId,
        userId,
        appRoleId: roleId,
        assignedBy,
        isManual: options.isManual ?? true,
        notes: options.notes,
        expiresAt: options.expiresAt,
      });
    }

    await auditLog({
      companyId, actorUserId: assignedBy,
      entityType: "USER_ROLE", entityId: String(assignment.id),
      action: "ASSIGNED", afterJson: { userId, roleId, isManual: options.isManual },
    });
    await invalidateUserCache(userId);
    return assignment;
  },

  async revokeRole(
    userId: number,
    roleId: number,
    performedBy: number,
    companyId: number,
  ) {
    const assignment = await userRoleRepository.findOne(userId, roleId);
    if (!assignment || !assignment.isActive) {
      throw new AppError("Role assignment not found.", 404, ErrorCode.NOT_FOUND);
    }
    if (!assignment.isManual) {
      throw new AppError(
        "Cannot manually revoke EMS-assigned roles. Update the role in EMS instead.",
        409,
        ErrorCode.CONFLICT,
      );
    }

    await userRoleRepository.deactivate(userId, roleId);
    await auditLog({
      companyId, actorUserId: performedBy,
      entityType: "USER_ROLE", entityId: String(assignment.id),
      action: "REVOKED", beforeJson: { userId, roleId },
    });
    await invalidateUserCache(userId);
  },

  async bulkAssign(
    roleId: number,
    userIds: number[],
    assignedBy: number,
    companyId: number,
  ) {
    const role = await prisma().appRole.findFirst({ where: { id: roleId, companyId } });
    if (!role) throw new AppError("Role not found.", 404, ErrorCode.NOT_FOUND);

    await userRoleRepository.bulkCreate(
      userIds.map((userId) => ({
        companyId,
        userId,
        appRoleId: roleId,
        assignedBy,
        isManual: true,
      })),
    );

    await Promise.all(userIds.flatMap((uid) => [
      cacheService.del(CacheKeys.userRoles(uid)),
      cacheService.del(CacheKeys.userPermissions(uid)),
    ]));
  },

  /**
   * Get the union of permissions from the user's primary role + all active
   * UserRoleAssignment records.  This is the effective permission set.
   */
  async getEffectivePermissions(userId: number, companyId: number): Promise<string[]> {
    const cached = await cacheService.get<string[]>(CacheKeys.userPermissions(userId));
    if (cached) return cached;

    const [user, assignments] = await Promise.all([
      prisma().appUser.findFirst({
        where: { id: userId, companyId },
        select: {
          roleId: true,
          role: {
            select: {
              lmsPermissions: {
                where: { companyId },
                select: { permission: { select: { code: true } } },
              },
            },
          },
        },
      }),
      userRoleRepository.findByUser(userId),
    ]);

    const codes = new Set<string>();

    // Primary role permissions
    user?.role?.lmsPermissions.forEach((rp) => codes.add(rp.permission.code));

    // Additional role permissions (union)
    assignments.forEach((a) =>
      a.appRole.lmsPermissions.forEach((rp) => codes.add(rp.permission.code)),
    );

        const result = Array.from(codes).sort();
    await cacheService.set(CacheKeys.userPermissions(userId), result, 60);
    return result;
  },

  /**
   * Get all roles for a user — primary role + all active UserRoleAssignments.
   */
  async getUserAllRoles(userId: number, companyId: number) {
    const assignments = await userRoleRepository.findByUser(userId);
    const user = await prisma().appUser.findFirst({
      where: { id: userId, companyId },
      select: { roleId: true, role: { select: { id: true, name: true, description: true } } },
    });

    const roles: Array<{ id: number; name: string; description: string | null; isPrimary: boolean; isManual: boolean }> = [];

    if (user?.roleId && user.role) {
      roles.push({
        id: user.role.id,
        name: user.role.name,
        description: user.role.description,
        isPrimary: true,
        isManual: false,
      });
    }

    for (const a of assignments) {
      roles.push({
        id: a.appRole.id,
        name: a.appRole.name,
        description: a.appRole.description,
        isPrimary: false,
        isManual: a.isManual,
      });
    }

    return roles;
  },

  /**
   * Get the user's primary role (the AppUser.roleId, not assignment-based).
   */
  async getUserPrimaryRole(userId: number, companyId: number) {
    return prisma().appUser.findFirst({
      where: { id: userId, companyId },
      select: {
        role: { select: { id: true, name: true, description: true, isActive: true } },
      },
    });
  },

  /**
   * Permission check helpers — used by guards/middleware.
   * These are thin wrappers around getEffectivePermissions with caching.
   */
  async hasPermission(userId: number, permissionCode: string, companyId: number): Promise<boolean> {
    const permissions = await this.getEffectivePermissions(userId, companyId);
    return permissions.includes(permissionCode);
  },

  async hasAllPermissions(userId: number, permissionCodes: string[], companyId: number): Promise<boolean> {
    const permissions = await this.getEffectivePermissions(userId, companyId);
    return permissionCodes.every((code) => permissions.includes(code));
  },

  async hasAnyPermission(userId: number, permissionCodes: string[], companyId: number): Promise<boolean> {
    const permissions = await this.getEffectivePermissions(userId, companyId);
    return permissionCodes.some((code) => permissions.includes(code));
  },

  /**
   * Build the user's accessible menu from their effective permissions.
   * Returns a structured menu tree based on the permission codes the user holds.
   */
  async getUserMenu(userId: number, companyId: number) {
    const permissions = await this.getEffectivePermissions(userId, companyId);
    const permSet = new Set(permissions);

    // Menu definitions — each item maps to a permission code or group of codes
    const menuDefs = [
      {
        id: "dashboard",
        label: "Dashboard",
        icon: "dashboard",
        permission: "dashboard.view",
      },
      {
        id: "catalog",
        label: "Catalog",
        icon: "catalog",
        permission: "course.read",
      },
      {
        id: "courses",
        label: "My Courses",
        icon: "courses",
        permission: "course.view",
      },
      {
        id: "learning-programs",
        label: "Learning Programs",
        icon: "programs",
        permission: "program.read",
      },
      {
        id: "tna",
        label: "Training Needs",
        icon: "tna",
        permission: "tna.view_all",
      },
      {
        id: "assessments",
        label: "Assessments",
        icon: "assessments",
        permission: "assessment.view",
      },
      {
        id: "certificates",
        label: "Certificates",
        icon: "certificates",
        permission: "certificate.issue",
      },
      {
        id: "analytics",
        label: "Analytics",
        icon: "analytics",
        permission: "analytics.view",
      },
      {
        id: "gamification",
        label: "Gamification",
        icon: "gamification",
        permission: "gamification_config.manage",
      },
      {
        id: "notifications",
        label: "Notifications",
        icon: "notifications",
        permission: "notification_config.manage",
      },
      {
        id: "search",
        label: "Search",
        icon: "search",
        permission: "course.read",
      },
    ];

    const menuItems = menuDefs
      .filter((item) => permSet.has(item.permission))
      .map(({ permission, ...rest }) => rest);

    return menuItems;
  },
};
