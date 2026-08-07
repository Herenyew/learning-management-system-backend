// src/common/middlewares/validation.middleware.ts
import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";
import { AppError, ErrorCode } from "../errors/index.js";

/**
 * Validates `req.body` against the given Zod schema.
 */
export function validateBody(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
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

/**
 * Validates `req.params` against the given Zod schema.
 */
export function validateParams(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.params);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return next(
          new AppError(
            "Invalid URL parameters.",
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

/**
 * Validates `req.query` against the given Zod schema.
 */
export function validateQuery(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.query);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return next(
          new AppError(
            "Invalid query parameters.",
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

// Alias for backward compatibility (if any existing code uses `validate`)
export const validate = validateBody;