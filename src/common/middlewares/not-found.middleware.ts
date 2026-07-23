import { NextFunction, Request, Response } from "express";

export default function notFoundMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  res.status(404).json({
    success: false,
    statusCode: 404,
    message: `Route '${req.originalUrl}' not found.`,
  });
}