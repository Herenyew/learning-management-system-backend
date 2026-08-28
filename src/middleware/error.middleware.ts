import { Request, Response, NextFunction } from "express";

import logger from "../config/logger.js";
import { env } from "../config/env.js";

export default function errorMiddleware(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  logger.error(err.stack ?? err.message);

  res.status(500).json({
    success: false,
    statusCode: 500,
    message: "Internal Server Error",

    ...(env.app.nodeEnv === "development" && {
      error: err.message,
      stack: err.stack,
    }),
  });
}