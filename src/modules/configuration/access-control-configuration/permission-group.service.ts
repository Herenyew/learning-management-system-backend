import { getPrismaClient } from "../../../config/database.js";
import { AppError, ErrorCode } from "../../../common/errors/index.js";
import { permissionGroupRepository } from "./permission-group.repository.js";

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

export const permissionGroupService = {
  list(companyId: number) {
    return permissionGroupRepository.findAll(companyId);
  },

  async getById(id: number, companyId: number) {
    const group = await permissionGroupRepository.findById(id, companyId);
    if (!group) throw new AppError("Permission group not found.", 404, ErrorCode.NOT_FOUND);
    return group;
  },

  async create(
    data: { name: string; description?: string; module: string },
    companyId: number,
    actorUserId: number,
  ) {
    const existing = await permissionGroupRepository.findByName(data.name, companyId);
    if (existing) {
      throw new AppError(`Permission group "${data.name}" already exists.`, 409, ErrorCode.CONFLICT);
    }

    const group = await permissionGroupRepository.create({ ...data, companyId });
    await auditLog({
      companyId, actorUserId,
      entityType: "PERMISSION_GROUP", entityId: String(group.id),
      action: "CREATED", afterJson: group as object,
    });
    return group;
  },

  async update(
    id: number,
    data: Partial<{ name: string; description: string; module: string; isActive: boolean }>,
    companyId: number,
    actorUserId: number,
  ) {
    const before = await permissionGroupRepository.findById(id, companyId);
    if (!before) throw new AppError("Permission group not found.", 404, ErrorCode.NOT_FOUND);

    if (data.name && data.name !== before.name) {
      const existing = await permissionGroupRepository.findByName(data.name, companyId);
      if (existing) {
        throw new AppError(`Permission group "${data.name}" already exists.`, 409, ErrorCode.CONFLICT);
      }
    }

    const updated = await permissionGroupRepository.update(id, data);
    await auditLog({
      companyId, actorUserId,
      entityType: "PERMISSION_GROUP", entityId: String(id),
      action: "UPDATED", beforeJson: before as object, afterJson: updated as object,
    });
    return updated;
  },

  async delete(id: number, companyId: number, actorUserId: number) {
    const group = await permissionGroupRepository.findById(id, companyId);
    if (!group) throw new AppError("Permission group not found.", 404, ErrorCode.NOT_FOUND);

    await permissionGroupRepository.delete(id, companyId);
    await auditLog({
      companyId, actorUserId,
      entityType: "PERMISSION_GROUP", entityId: String(id),
      action: "DELETED", beforeJson: group as object,
    });
  },

  async assignPermissions(
    groupId: number,
    permissionIds: number[],
    companyId: number,
    actorUserId: number,
  ) {
    const group = await permissionGroupRepository.findById(groupId, companyId);
    if (!group) throw new AppError("Permission group not found.", 404, ErrorCode.NOT_FOUND);

    await prisma().lmsPermission.updateMany({
      where: { id: { in: permissionIds }, companyId },
      data: { groupId },
    });
    await auditLog({
      companyId, actorUserId,
      entityType: "PERMISSION_GROUP", entityId: String(groupId),
      action: "PERMISSIONS_ASSIGNED", afterJson: { permissionIds },
    });
    return permissionGroupRepository.findById(groupId, companyId);
  },
};
