import { NextFunction, Request, Response } from "express";

import { AppError, ErrorCode } from "../errors/index.js";

export function requirePermission(permission: string) {
  return (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    if (!req.user) {
      throw new AppError(
        "Authentication required.",
        401,
        ErrorCode.UNAUTHORIZED
      );
    }

    if (!req.user.permissions.includes(permission)) {
      throw new AppError(
        "Permission denied.",
        403,
        ErrorCode.FORBIDDEN
      );
    }

    next();
  };
}