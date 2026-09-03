import type { Request } from "express";
import type { ParamsDictionary, Query } from "express-serve-static-core";

/**
 * Request contract after the authentication middleware has completed.
 *
 * This is just a typed alias for Express Request — req.user is attached
 * by the global Express.Request augmentation in src/common/types/express.d.ts.
 * Configuration routes are mounted behind authenticate(), so req.user is
 * always populated by the time a controller runs.
 */
export type AuthRequest<
  Params extends ParamsDictionary = ParamsDictionary,
  ResBody = any,
  ReqBody = any,
  ReqQuery extends Query = any,
> = Request<Params, ResBody, ReqBody, ReqQuery>;
