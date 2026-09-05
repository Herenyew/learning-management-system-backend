import type { NextFunction, Response } from "express";
import type { AuthRequest } from "../auth-request.js";
import { AppError, ErrorCode } from "../../../common/errors/index.js";
import {
  createEmsMappingSchema,
  updateEmsMappingSchema,
  syncFromEmsSchema,
  createPermissionGroupSchema,
  updatePermissionGroupSchema,
  assignPermissionsToGroupSchema,
  assignRoleToUserSchema,
  bulkAssignRoleSchema,
} from "./access-control.dto.js";
import { emsMappingService } from "./ems-mapping.service.js";
import { permissionGroupService } from "./permission-group.service.js";
import { userRoleService } from "./user-role.service.js";

const asyncWrap =
  (fn: (req: AuthRequest, res: Response) => Promise<void>) =>
  (req: AuthRequest, res: Response, next: NextFunction) =>
    fn(req, res).catch(next);

const ok = (res: Response, data: unknown, message = "OK", status = 200) =>
  res.status(status).json({
    success: true,
    data,
    message,
    timestamp: new Date().toISOString(),
  });

// ─── Permission Group Controller ─────────────────────────────────────────────

export const permissionGroupController = {
  list: asyncWrap(async (req, res) => {
    ok(res, await permissionGroupService.list(req.user.companyId));
  }),

  getById: asyncWrap(async (req, res) => {
    ok(res, await permissionGroupService.getById(Number(req.params.id), req.user.companyId));
  }),

  create: asyncWrap(async (req, res) => {
    const data = createPermissionGroupSchema.parse(req.body);
    const group = await permissionGroupService.create(data, req.user.companyId, req.user.appUserId);
    ok(res, group, "Permission group created.", 201);
  }),

  update: asyncWrap(async (req, res) => {
    const data = updatePermissionGroupSchema.parse(req.body);
    ok(res, await permissionGroupService.update(Number(req.params.id), data, req.user.companyId, req.user.appUserId), "Permission group updated.");
  }),

  delete: asyncWrap(async (req, res) => {
    await permissionGroupService.delete(Number(req.params.id), req.user.companyId, req.user.appUserId);
    ok(res, null, "Permission group deleted.");
  }),

  assignPermissions: asyncWrap(async (req, res) => {
    const { permissionIds } = assignPermissionsToGroupSchema.parse(req.body);
    ok(
      res,
      await permissionGroupService.assignPermissions(Number(req.params.id), permissionIds, req.user.companyId, req.user.appUserId),
      "Permissions assigned to group.",
    );
  }),
};

// ─── EMS Mapping Controller ───────────────────────────────────────────────────

export const emsMappingController = {
  list: asyncWrap(async (req, res) => {
    ok(res, await emsMappingService.list(req.user.companyId));
  }),

  create: asyncWrap(async (req, res) => {
    const data = createEmsMappingSchema.parse(req.body);
    ok(res, await emsMappingService.create(data, req.user.companyId, req.user.appUserId), "EMS mapping created.", 201);
  }),

  update: asyncWrap(async (req, res) => {
    const data = updateEmsMappingSchema.parse(req.body);
    ok(res, await emsMappingService.update(Number(req.params.id), data, req.user.companyId, req.user.appUserId), "EMS mapping updated.");
  }),

    delete: asyncWrap(async (req, res) => {
    await emsMappingService.delete(Number(req.params.id), req.user.companyId, req.user.appUserId);
    ok(res, null, "EMS mapping deleted.");
  }),

  sync: asyncWrap(async (req, res) => {
    const data = syncFromEmsSchema.parse(req.body);
    const result = await emsMappingService.syncFromEMS(
      data.emsUsers,
      req.user.companyId,
      req.user.appUserId,
    );
    ok(res, result, `EMS sync complete: ${result.assigned} assigned, ${result.skipped} skipped.`);
  }),
};

// ─── User Role Controller ─────────────────────────────────────────────────────

export const userRoleController = {
  getUserRoles: asyncWrap(async (req, res) => {
    ok(res, await userRoleService.getUserRoles(Number(req.params.userId)));
  }),

  getUserAllRoles: asyncWrap(async (req, res) => {
    ok(res, await userRoleService.getUserAllRoles(Number(req.params.userId), req.user.companyId));
  }),

  getUserMenu: asyncWrap(async (req, res) => {
    ok(res, await userRoleService.getUserMenu(Number(req.params.userId), req.user.companyId));
  }),

  getUserPrimaryRole: asyncWrap(async (req, res) => {
    ok(res, await userRoleService.getUserPrimaryRole(Number(req.params.userId), req.user.companyId));
  }),

  getUsersByRole: asyncWrap(async (req, res) => {
    ok(res, await userRoleService.getUsersByRole(Number(req.params.roleId), req.user.companyId));
  }),

  getEffectivePermissions: asyncWrap(async (req, res) => {
    ok(res, await userRoleService.getEffectivePermissions(Number(req.params.userId), req.user.companyId));
  }),

  assignRole: asyncWrap(async (req, res) => {
    const { roleId, notes, expiresAt, isManual } = assignRoleToUserSchema.parse(req.body);
    const result = await userRoleService.assignRole(
      Number(req.params.userId),
      roleId,
      req.user.appUserId,
      { isManual: isManual ?? true, notes, expiresAt: expiresAt ? new Date(expiresAt) : undefined },
      req.user.companyId,
    );
    ok(res, result, "Role assigned.", 201);
  }),

  revokeRole: asyncWrap(async (req, res) => {
    await userRoleService.revokeRole(
      Number(req.params.userId),
      Number(req.params.roleId),
      req.user.appUserId,
      req.user.companyId,
    );
    ok(res, null, "Role revoked.");
  }),

  bulkAssign: asyncWrap(async (req, res) => {
    const { roleId, userIds } = bulkAssignRoleSchema.parse(req.body);
    await userRoleService.bulkAssign(roleId, userIds, req.user.appUserId, req.user.companyId);
    ok(res, null, `Role assigned to ${userIds.length} users.`);
  }),
};
