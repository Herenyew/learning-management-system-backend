import { NextFunction, Request, Response } from "express";

import authService from "./auth.service.js";

export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const authorization = req.headers.authorization;
    // Extract the token from the authorization header
    if (!authorization?.startsWith("Bearer ")) {
      throw new Error("Missing authorization header.");
    }

    const token = authorization.replace("Bearer ", "");

    req.user = await authService.authenticate(token);

    next();
  } catch (error) {
    next(error);
  }
}