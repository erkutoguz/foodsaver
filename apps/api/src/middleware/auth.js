import { User } from "../models/user.model.js";
import { verifyToken } from "../lib/auth.js";
import { createError } from "../utils/http-error.js";

export async function requireAuth(request, _response, next) {
  try {
    const authorizationHeader = request.headers.authorization;

    if (!authorizationHeader || !authorizationHeader.startsWith("Bearer ")) {
      throw createError(401, "AUTH_REQUIRED", "Authentication is required.");
    }

    const token = authorizationHeader.slice(7).trim();

    if (!token) {
      throw createError(401, "AUTH_REQUIRED", "Authentication token is missing.");
    }

    let payload;

    try {
      payload = verifyToken(token);
    } catch {
      throw createError(401, "INVALID_TOKEN", "Authentication token is invalid or expired.");
    }

    const user = await User.findById(payload.sub);

    if (!user) {
      throw createError(401, "INVALID_TOKEN", "Authentication token is invalid.");
    }

    request.user = user;
    next();
  } catch (error) {
    next(error);
  }
}
