import { NextFunction, Request, Response } from "express";
import authService from "./auth.service.js";
import { AppError, ErrorCode } from "../errors/index.js";

export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const authorization = req.headers.authorization;
    console.log("Authorization header:", authorization);
    if (!authorization || !authorization.startsWith("Bearer ")) {
      throw new AppError(
        "Missing or malformed Authorization header.",
        401,
        ErrorCode.UNAUTHORIZED
      );
    }

    const token = authorization.substring(7).trim();

    if (!token) {
      throw new AppError(
        "Authentication token missing.",
        401,
        ErrorCode.UNAUTHORIZED
      );
    }

    req.user = await authService.authenticate(token);

    next();
  } catch (error) {
    next(error);
  }
}