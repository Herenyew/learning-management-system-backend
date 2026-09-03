import type { CurrentUser } from "../../modules/auth/auth.types.js";

declare global {
  namespace Express {
    /**
     * After authenticate() runs, req.user is always populated.
     * We narrow appUserId and appRoleId to non-optional here so controllers
     * behind the authenticate middleware don't need null-checks on every call.
     * The `? never` trick removes the optional modifier from those fields.
     */
    interface Request {
      user: Omit<CurrentUser, "appUserId" | "appRoleId"> & {
        appUserId: number;
        appRoleId: number | undefined;
      };
      sessionId?: string;
    }
  }
}

export {};
