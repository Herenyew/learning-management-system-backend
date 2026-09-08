import { getPrismaClient } from "../../../config/database.js";
import { AppError, ErrorCode } from "../../../common/errors/index.js";
import { cacheService, CacheKeys } from "../../../common/cache/cache.service.js";
import { fetchEmsCompanyRoles } from "../../../integration/http/ems-http.client.js";
import { emsMappingRepository } from "./ems-mapping.repository.js";

const prisma = () => getPrismaClient();

async function invalidateUserCache(userId: number) {
  await Promise.all([
    cacheService.del(CacheKeys.userRoles(userId)),
    cacheService.del(CacheKeys.userPermissions(userId)),
  ]);
}

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

export const emsMappingService = {
  list(companyId: number) {
    return emsMappingRepository.findAll(companyId);
  },

  /**
   * List real EMS role names for the Access Control "EMS Mappings" picker.
   * Returns an empty array when EMS is unreachable — the UI falls back to
   * manual entry in that case.
   */
  async listEmsRoles(accessToken?: string): Promise<Array<{ name: string }>> {
    if (!accessToken) return [];
    const roles = await fetchEmsCompanyRoles(accessToken);
    return roles.map((role) => ({ name: role.name })).filter((r) => r.name.length > 0);
  },

  async getById(id: number, companyId: number) {
    const mapping = await emsMappingRepository.findById(id, companyId);
    if (!mapping) throw new AppError("EMS mapping not found.", 404, ErrorCode.NOT_FOUND);
    return mapping;
  },

  async create(
    data: { emsRoleName: string; appRoleId: number; autoAssign?: boolean; priority?: number },
    companyId: number,
    actorUserId: number,
  ) {
    const role = await prisma().appRole.findFirst({
      where: { id: data.appRoleId, companyId },
    });
    if (!role) throw new AppError("LMS role not found.", 404, ErrorCode.NOT_FOUND);

    const mapping = await emsMappingRepository.create({ ...data, companyId });
    await auditLog({
      companyId, actorUserId,
      entityType: "EMS_MAPPING", entityId: String(mapping.id),
      action: "CREATED", afterJson: mapping as object,
    });
    await cacheService.del(CacheKeys.emsMappings(companyId));
    return mapping;
  },

  async update(
    id: number,
    data: Partial<{ emsRoleName: string; appRoleId: number; isActive: boolean; autoAssign: boolean; priority: number }>,
    companyId: number,
    actorUserId: number,
  ) {
    const before = await emsMappingRepository.findById(id, companyId);
    if (!before) throw new AppError("EMS mapping not found.", 404, ErrorCode.NOT_FOUND);

    const updated = await emsMappingRepository.update(id, data);
    await auditLog({
      companyId, actorUserId,
      entityType: "EMS_MAPPING", entityId: String(id),
      action: "UPDATED", beforeJson: before as object, afterJson: updated as object,
    });
    await cacheService.del(CacheKeys.emsMappings(companyId));
    return updated;
  },

  async delete(id: number, companyId: number, actorUserId: number) {
    const mapping = await emsMappingRepository.findById(id, companyId);
    if (!mapping) throw new AppError("EMS mapping not found.", 404, ErrorCode.NOT_FOUND);

    await emsMappingRepository.delete(id);
    await auditLog({
      companyId, actorUserId,
      entityType: "EMS_MAPPING", entityId: String(id),
      action: "DELETED", beforeJson: mapping as object,
    });
    await cacheService.del(CacheKeys.emsMappings(companyId));
  },

  /**
   * Resolve the LMS AppRole id for a given EMS role name.
   * Used by auth.middleware to do DB-driven role resolution.
   */
  async resolveRole(emsRoleName: string, companyId: number): Promise<number | null> {
    const cacheKey = `${CacheKeys.emsMappings(companyId)}:${emsRoleName.toLowerCase()}`;
    const cached = await cacheService.get<{ appRoleId: number }>(cacheKey);
    if (cached) return cached.appRoleId;

    const mapping = await emsMappingRepository.findByEmsRole(emsRoleName, companyId);
    if (mapping) {
      await cacheService.set(cacheKey, { appRoleId: mapping.appRoleId }, 300);
      return mapping.appRoleId;
    }
    return null;
  },

  /**
   * Resolve an EMS role by name (alias used by callers expecting the mapping object).
   */
  getEMSMappingByEmsRole(emsRoleName: string, companyId: number) {
    return emsMappingRepository.findByEmsRole(emsRoleName, companyId);
  },

  /**
   * Sync a batch of EMS users to LMS, creating/updating UserRoleAssignment records
   * for any user whose EMS role matches an active EMSRoleMapping with autoAssign=true.
   *
   * @param emsUsers  Array of { userId, emsRoleName, ... } from the EMS event or manual trigger
   * @param companyId The company context
   * @param actorUserId  The system user performing the sync (use 0 for system/EMS)
   */
  async syncFromEMS(
    emsUsers: Array<{ userId: number; emsRoleName: string }>,
    companyId: number,
    actorUserId: number = 0,
  ): Promise<{
    processed: number;
    assigned: number;
    skipped: number;
    errors: Array<{ userId: number; emsRoleName: string; reason: string }>;
  }> {
    // Load all active mappings for this company once
    const mappings = await emsMappingRepository.findAll(companyId);
    const autoAssignMap = new Map<string, number>();
    for (const mapping of mappings) {
      if (mapping.isActive && mapping.autoAssign) {
        autoAssignMap.set(mapping.emsRoleName.toLowerCase(), mapping.appRoleId);
      }
    }

    let processed = 0;
    let assigned = 0;
    let skipped = 0;
    const errors: Array<{ userId: number; emsRoleName: string; reason: string }> = [];

    for (const emsUser of emsUsers) {
      processed++;
      const roleId = autoAssignMap.get(emsUser.emsRoleName.toLowerCase());

      if (!roleId) {
        // No matching active auto-assign mapping — skip
        skipped++;
        continue;
      }

      try {
        const [user, role] = await Promise.all([
          prisma().appUser.findFirst({ where: { id: emsUser.userId, companyId } }),
          prisma().appRole.findFirst({ where: { id: roleId, companyId } }),
        ]);

        if (!user) {
          errors.push({ userId: emsUser.userId, emsRoleName: emsUser.emsRoleName, reason: "User not found in LMS" });
          skipped++;
          continue;
        }
        if (!role) {
          errors.push({ userId: emsUser.userId, emsRoleName: emsUser.emsRoleName, reason: "Mapped LMS role not found" });
          skipped++;
          continue;
        }

        const existing = await prisma().userRoleAssignment.findFirst({
          where: { userId: user.id, appRoleId: role.id, companyId },
        });

        if (existing) {
          if (existing.isActive) {
            // Already assigned and active — nothing to do
            skipped++;
            continue;
          }
          // Reactivate a previously deactivated assignment
          await prisma().userRoleAssignment.update({
            where: { id: existing.id },
            data: { isActive: true },
          });
        } else {
          // Create a new auto-assigned role
          await prisma().userRoleAssignment.create({
            data: {
              companyId,
              userId: user.id,
              appRoleId: role.id,
              assignedBy: actorUserId,
              isManual: false,
              isActive: true,
            },
          });
        }

        assigned++;
        await invalidateUserCache(user.id);

        await auditLog({
          companyId,
          actorUserId,
          entityType: "USER_ROLE",
          entityId: String(user.id),
          action: "SYNCED",
          afterJson: { userId: user.id, roleId: role.id, emsRoleName: emsUser.emsRoleName },
        });
      } catch (err) {
        errors.push({
          userId: emsUser.userId,
          emsRoleName: emsUser.emsRoleName,
          reason: err instanceof Error ? err.message : "Unexpected error",
        });
        skipped++;
      }
    }

    // Invalidate the company-level EMS mapping cache so it refreshes
    await cacheService.del(CacheKeys.emsMappings(companyId));

    return { processed, assigned, skipped, errors };
  },
};
