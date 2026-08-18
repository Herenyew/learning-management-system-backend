import type { CurrentUser } from "../common/auth/current-user.js";

declare global {
  namespace Express {
    interface Request {
      user: CurrentUser;
    }
  }
}

export {};
