import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";

import logger from "../../config/logger.js";
import { env } from "../../config/env.js";
import { AppError, ErrorCode } from "../../common/errors/index.js";

export default function errorMiddleware(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  logger.error(err.stack ?? err.message);

  // ── Known application errors ──────────────────────────────────────────────
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      statusCode: err.statusCode,
      code: err.code,
      message: err.message,
      details: err.details,
    });
  }

  // ── Zod validation errors (from z.parse() in controllers / middleware) ────
  // These originate from invalid request body / query / param shapes and should
  // always return 400 Bad Request, never 500 Internal Server Error.
  if (err instanceof ZodError) {
    const zodErr = err as ZodError;
    const details = zodErr.issues.map((issue) => ({
      path: issue.path.join("."),
      message: issue.message,
    }));
    return res.status(400).json({
      success: false,
      statusCode: 400,
      code: ErrorCode.VALIDATION_ERROR,
      message: "Request validation failed.",
      details,
    });
  }

  // ── Unexpected / unclassified errors ─────────────────────────────────────
  return res.status(500).json({
    success: false,
    statusCode: 500,
    code: ErrorCode.INTERNAL_SERVER_ERROR,
    message: "Internal Server Error",
    // Expose internals only in development — never in production.
    ...(env.app.nodeEnv === "development" && {
      error: err.message,
      stack: err.stack,
    }),
  });
}
