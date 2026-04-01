import { ZodError } from "zod";
import { logger } from "../lib/logger.js";

export function errorHandler(error, _request, response, _next) {
  if (error instanceof SyntaxError && "body" in error) {
    return response.status(400).json({
      code: "INVALID_JSON",
      message: "Request body contains invalid JSON."
    });
  }

  if (error instanceof ZodError) {
    return response.status(400).json({
      code: "VALIDATION_ERROR",
      message: error.issues[0]?.message || "Request validation failed."
    });
  }

  if (error?.code === 11000) {
    return response.status(409).json({
      code: "DUPLICATE_RESOURCE",
      message: "This value already exists."
    });
  }

  if (error?.name === "ValidationError") {
    return response.status(400).json({
      code: "VALIDATION_ERROR",
      message: error.message
    });
  }

  if (error?.status) {
    return response.status(error.status).json({
      code: error.code || "REQUEST_ERROR",
      message: error.message
    });
  }

  logger.error("Unhandled error", error);

  return response.status(500).json({
    code: "INTERNAL_SERVER_ERROR",
    message: "An unexpected error occurred."
  });
}
