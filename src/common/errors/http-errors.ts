import { AppError } from "./app-error.js";
import { ErrorCode } from "./error-codes.js";

// represents a 404 Not Found error, typically thrown when a requested resource cannot be found.
export class NotFoundError extends AppError {
  constructor(resource = "Resource", details?: unknown) {
    super(
      `${resource} not found.`,
      404,
      ErrorCode.NOT_FOUND,
      details
    );
  }
}

// represents a 409 Conflict error, 
// typically thrown when there is a conflict with the current state of the resource,
// such as when trying to create a resource that already exists.
export class ConflictError extends AppError {
  constructor(message = "Conflict.", details?: unknown) {
    super(
      message,
      409,
      ErrorCode.CONFLICT,
      details
    );
  }
}

// represents a 400 Bad Request error, 
// typically thrown when the request is malformed or invalid.
export class ValidationError extends AppError {
  constructor(message = "Validation failed.", details?: unknown) {
    super(
      message,
      400,
      ErrorCode.VALIDATION_ERROR,
      details
    );
  }
}

// represents a 403 Forbidden error, 
// typically thrown when the user does not have permission to access the requested resource.
export class ForbiddenError extends AppError {
  constructor(message = "Forbidden.", details?: unknown) {
    super(
      message,
      403,
      ErrorCode.FORBIDDEN,
      details
    );
  }
}

// represents a 401 Unauthorized error,
// typically thrown when the user is not authenticated or the provided credentials are invalid.
export class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized.", details?: unknown) {
    super(
      message,
      401,
      ErrorCode.UNAUTHORIZED,
      details
    );
  }
}

// represents a 422 Unprocessable Entity error,
// typically thrown when the request is well-formed but cannot be processed due to semantic errors.
export class BusinessRuleError extends AppError {
  constructor(message: string, details?: unknown) {
    super(
      message,
      422,
      ErrorCode.BUSINESS_RULE_VIOLATION,
      details
    );
  }
}