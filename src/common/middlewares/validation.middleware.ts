import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";

import { AppError, ErrorCode } from "../errors/index.js";

export function validate(schema: ZodSchema) {
  return (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      schema.parse({
        body: req.body,
        params: req.params,
        query: req.query,
      });

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return next(
          new AppError(
            "Validation failed.",
            400,
            ErrorCode.VALIDATION_ERROR,
            error.issues
          )
        );
      }

      next(error);
    }
  };
}