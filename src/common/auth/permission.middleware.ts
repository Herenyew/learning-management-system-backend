import { NextFunction, Request, Response } from "express";
import { AppError, ErrorCode } from "../errors/index.js";

type PermissionMode = "ALL" | "ANY";

/**
 * Express middleware to enforce LMS RBAC permissions.
 *
 * @param permission Single permission code string or array of codes.
 * @param mode "ALL" requires user to have ALL listed permissions; "ANY" requires at least one.
 */
export function requirePermission(
  permission: string | string[],
  mode: PermissionMode = "ALL"
) {
  const requiredPermissions = Array.isArray(permission) ? permission : [permission];

  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new AppError(
        "Authentication required.",
        401,
        ErrorCode.UNAUTHORIZED
      );
    }

    const userPermissions = new Set(req.user.permissions || []);

    const hasPermission =
      mode === "ALL"
        ? requiredPermissions.every((p) => userPermissions.has(p))
        : requiredPermissions.some((p) => userPermissions.has(p));

    if (!hasPermission) {
      throw new AppError(
        "Permission denied.",
        403,
        ErrorCode.FORBIDDEN
      );
    }

    next();
  };
}