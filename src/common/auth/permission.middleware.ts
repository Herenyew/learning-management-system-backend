import { NextFunction, Request, Response } from "express";
import { AppError, ErrorCode } from "../errors/index.js";
import logger from "../../config/logger.js";

type PermissionMode = "ALL" | "ANY";

/**
 * Express middleware to enforce LMS RBAC permissions.
 *
 * Checks req.user.permissions — the array loaded from the DB by auth.middleware.ts.
 * No role-name or role-ID checks here. The admin already has all permission codes
 * in their permissions array, so no special bypass is needed or wanted.
 *
 * @param permission Single permission code string or array of codes.
 * @param mode "ALL" requires user to have ALL listed permissions (default).
 *             "ANY" requires at least one.
 */
export function requirePermission(
  permission: string | string[],
  mode: PermissionMode = "ALL"
) {
  const required = Array.isArray(permission) ? permission : [permission];

  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new AppError("Authentication required.", 401, ErrorCode.UNAUTHORIZED);
    }

    const userPermissions = new Set(req.user.permissions ?? []);

    if (process.env.NODE_ENV !== 'production') {
      const missing = required.filter(p => !userPermissions.has(p));
      if (missing.length > 0) {
        logger.warn(
          `[PermissionMiddleware] DENIED — user:${(req.user as any)?.email} ` +
          `missing:[${missing.join(', ')}] ` +
          `has ${userPermissions.size} permissions total ` +
          `role:${(req.user as any)?.roleName}`
        );
      }
    }

    const granted =
      mode === "ALL"
        ? required.every((p) => userPermissions.has(p))
        : required.some((p) => userPermissions.has(p));

    if (!granted) {
      throw new AppError("Permission denied.", 403, ErrorCode.FORBIDDEN);
    }

    next();
  };
}
