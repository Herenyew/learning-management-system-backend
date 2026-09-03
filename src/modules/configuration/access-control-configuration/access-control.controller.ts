import type { NextFunction, Response } from "express";
import type { AuthRequest } from "../auth-request.js";
import { AppError, ErrorCode } from "../../../common/errors/index.js";
import {
  roleIdParamsSchema,
  updateRolePermissionsSchema,
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
          // appRoleId: the resolved LMS AppRole.id (integer), populated by auth.middleware.
          // ConfigRolePermissions uses this to prevent self-lockout on access_control.manage.
          appRoleId: req.user.appRoleId ?? null,
        },
      });
    } catch (error) {
      next(error);
    }
  };
}

export const accessControlController = new AccessControlController();
