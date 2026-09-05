import type { NextFunction, Response } from "express";
import type { AuthRequest } from "../auth-request.js";
import { AppError, ErrorCode } from "../../../common/errors/index.js";
import {
  roleIdParamsSchema,
  updateRolePermissionsSchema,
  createRoleSchema,
  updateRoleSchema,
  roleIdAndPermissionIdSchema,
  bulkAssignPermissionsSchema,
  bulkRevokePermissionsSchema,
  listPermissionsQuerySchema,
  createPermissionSchema,
  updatePermissionSchema,
  permissionIdParamsSchema,
  roleStatusSchema,
} from "./access-control.dto.js";
import { accessControlService } from "./access-control.service.js";

export class AccessControlController {
  list = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user?.companyId) {
        throw new AppError("Company context is required.", 401, ErrorCode.UNAUTHORIZED);
      }
      const data = await accessControlService.list(req.user.companyId);
      res.json({
        success: true,
        message: "Access control roles and permissions retrieved successfully.",
        data,
      });
    } catch (error) {
      next(error);
    }
  };

  updateRolePermissions = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user?.companyId) {
        throw new AppError("Company context is required.", 401, ErrorCode.UNAUTHORIZED);
      }
      const { roleId } = roleIdParamsSchema.parse(req.params);
      const { permissionCodes } = updateRolePermissionsSchema.parse(req.body);
      const data = await accessControlService.updateRolePermissions({
        companyId: req.user.companyId,
        actorUserId: req.user.appUserId,
        // Use appRoleId (resolved LMS integer) so the self-lockout guard compares
        // the same type on both sides (both are LMS AppRole.id integers).
        actorRoleId: req.user.appRoleId ?? undefined,
        roleId,
        permissionCodes,
      });
      res.json({
        success: true,
        message: "Role permissions updated successfully.",
        data,
      });
    } catch (error) {
      next(error);
    }
  };

    me = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new AppError("Authenticated user context is required.", 401, ErrorCode.UNAUTHORIZED);
      }
      res.json({
        success: true,
        data: {
          permissions: req.user.permissions || [],
          role: req.user.role,
          roleId: req.user.roleId,
          appUserId: req.user.appUserId,
          appRoleId: req.user.appRoleId ?? null,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /* ─── Role Management ────────────────────────────────────────────────── */

  getRoleById = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { roleId } = roleIdParamsSchema.parse(req.params);
      const data = await accessControlService.getRoleById(roleId, req.user.companyId);
      res.json({ success: true, data });
    } catch (error) { next(error); }
  };

  createRole = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = createRoleSchema.parse(req.body);
      const role = await accessControlService.createRole(data, req.user.companyId, req.user.appUserId);
      res.status(201).json({ success: true, data: role, message: "Role created." });
    } catch (error) { next(error); }
  };

  updateRole = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { roleId } = roleIdParamsSchema.parse(req.params);
      const data = updateRoleSchema.parse(req.body);
      const role = await accessControlService.updateRole(roleId, data, req.user.companyId, req.user.appUserId);
      res.json({ success: true, data: role, message: "Role updated." });
    } catch (error) { next(error); }
  };

  deleteRole = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { roleId } = roleIdParamsSchema.parse(req.params);
      await accessControlService.deleteRole(roleId, req.user.companyId, req.user.appUserId);
      res.json({ success: true, data: null, message: "Role deleted." });
        } catch (error) { next(error); }
  };

  toggleRoleStatus = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { roleId } = roleIdParamsSchema.parse(req.params);
      const { isActive } = roleStatusSchema.parse(req.body);
      const role = await accessControlService.toggleRoleStatus(roleId, isActive, req.user.companyId, req.user.appUserId);
      res.json({ success: true, data: role, message: `Role ${isActive ? "activated" : "deactivated"}.` });
    } catch (error) { next(error); }
  };

  getRolePermissions = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { roleId } = roleIdParamsSchema.parse(req.params);
      const data = await accessControlService.getRolePermissions(roleId, req.user.companyId);
      res.json({ success: true, data });
    } catch (error) { next(error); }
  };

  revokePermission = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { roleId, permissionId } = roleIdAndPermissionIdSchema.parse({ roleId: req.params.roleId, permissionId: req.params.permissionId });
      await accessControlService.revokePermissionFromRole(roleId, permissionId, req.user.companyId, req.user.appUserId);
      res.json({ success: true, data: null, message: "Permission revoked from role." });
    } catch (error) { next(error); }
  };

  bulkAssignPermissions = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { roleId } = roleIdParamsSchema.parse(req.params);
      const { permissionIds } = bulkAssignPermissionsSchema.parse(req.body);
      await accessControlService.bulkAssignPermissionsToRole(roleId, permissionIds, req.user.companyId, req.user.appUserId);
      res.json({ success: true, data: null, message: `Assigned ${permissionIds.length} permissions to role.` });
    } catch (error) { next(error); }
  };

  bulkRevokePermissions = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { roleId } = roleIdParamsSchema.parse(req.params);
      const { permissionIds } = bulkRevokePermissionsSchema.parse(req.body);
      await accessControlService.bulkRevokePermissionsFromRole(roleId, permissionIds, req.user.companyId, req.user.appUserId);
      res.json({ success: true, data: null, message: `Revoked ${permissionIds.length} permissions from role.` });
    } catch (error) { next(error); }
  };

  /* ─── Permission Management ────────────────────────────────────────────── */

  listPermissions = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { module } = listPermissionsQuerySchema.parse(req.query);
      const data = await accessControlService.getPermissions(req.user.companyId, module ? { module } : undefined);
      res.json({ success: true, data });
    } catch (error) { next(error); }
  };

  createPermission = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = createPermissionSchema.parse(req.body);
      const permission = await accessControlService.createPermission(data, req.user.companyId, req.user.appUserId);
      res.status(201).json({ success: true, data: permission, message: "Permission created." });
    } catch (error) { next(error); }
  };

  updatePermission = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = permissionIdParamsSchema.parse(req.params);
      const data = updatePermissionSchema.parse(req.body);
      const permission = await accessControlService.updatePermission(id, data, req.user.companyId, req.user.appUserId);
      res.json({ success: true, data: permission, message: "Permission updated." });
    } catch (error) { next(error); }
  };

  deletePermission = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = permissionIdParamsSchema.parse(req.params);
      await accessControlService.deletePermission(id, req.user.companyId, req.user.appUserId);
      res.json({ success: true, data: null, message: "Permission deleted." });
    } catch (error) { next(error); }
  };
}

export const accessControlController = new AccessControlController();
