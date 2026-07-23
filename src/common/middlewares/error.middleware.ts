import { Request, Response, NextFunction } from "express";

import logger from "../config/logger.js";
import { env } from "../config/env.js";
import { AppError, ErrorCode } from "../common/errors/index.js";

export default function errorMiddleware(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  logger.error(err.stack ?? err.message);

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      statusCode: err.statusCode,
      code: err.code,
      message: err.message,
      details: err.details,
    });
  }

  return res.status(500).json({
    success: false,
    statusCode: 500,
    code: ErrorCode.INTERNAL_SERVER_ERROR,
    message: "Internal Server Error",

    ...(env.app.nodeEnv === "development" && {
      error: err.message,
      stack: err.stack,
    }),
  });
}