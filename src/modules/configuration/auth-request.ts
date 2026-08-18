import type { Request } from "express";
import type { ParamsDictionary, Query } from "express-serve-static-core";

/**
 * Request contract after the authentication middleware has completed.
 *
 * Configuration routes are mounted behind that middleware, so controllers
 * can rely on a populated tenant and actor context without defensive casts.
 */
export type AuthRequest<
  Params extends ParamsDictionary = ParamsDictionary,
  ResBody = any,
  ReqBody = any,
  ReqQuery extends Query = any,
> = Request<Params, ResBody, ReqBody, ReqQuery>;
