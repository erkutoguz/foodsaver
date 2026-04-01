export function errorHandler(error, _request, response, _next) {
  if (error instanceof SyntaxError && "body" in error) {
    return response.status(400).json({
      code: "INVALID_JSON",
      message: "Request body contains invalid JSON."
    });
  }

  return response.status(500).json({
    code: "INTERNAL_SERVER_ERROR",
    message: "An unexpected error occurred."
  });
}
