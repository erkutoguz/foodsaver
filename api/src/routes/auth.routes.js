import { Router } from "express";
import bcrypt from "bcryptjs";
import { User } from "../models/user.model.js";
import { createToken, toUserResponse } from "../lib/auth.js";
import { requireAuth } from "../middleware/auth.js";
import { createError } from "../utils/http-error.js";

const authRouter = Router();

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function validateRegisterBody(body) {
  const fullName = String(body.fullName || "").trim();
  const email = normalizeEmail(body.email);
  const password = String(body.password || "");

  if (!fullName) {
    throw createError(400, "FULL_NAME_REQUIRED", "Full name is required.");
  }

  if (!email || !email.includes("@")) {
    throw createError(400, "INVALID_EMAIL", "A valid email address is required.");
  }

  if (password.length < 6) {
    throw createError(400, "INVALID_PASSWORD", "Password must be at least 6 characters.");
  }

  return {
    fullName,
    email,
    password
  };
}

function validateLoginBody(body) {
  const email = normalizeEmail(body.email);
  const password = String(body.password || "");

  if (!email || !password) {
    throw createError(400, "EMAIL_AND_PASSWORD_REQUIRED", "Email and password are required.");
  }

  return {
    email,
    password
  };
}

authRouter.post("/register", async (request, response, next) => {
  try {
    const { fullName, email, password } = validateRegisterBody(request.body);
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      throw createError(409, "EMAIL_ALREADY_USED", "This email address is already registered.");
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      fullName,
      email,
      passwordHash
    });

    response.status(201).json({
      token: createToken(user),
      user: toUserResponse(user)
    });
  } catch (error) {
    next(error);
  }
});

authRouter.post("/login", async (request, response, next) => {
  try {
    const { email, password } = validateLoginBody(request.body);
    const user = await User.findOne({ email });

    if (!user) {
      throw createError(401, "INVALID_CREDENTIALS", "Email or password is incorrect.");
    }

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);

    if (!passwordMatches) {
      throw createError(401, "INVALID_CREDENTIALS", "Email or password is incorrect.");
    }

    response.json({
      token: createToken(user),
      user: toUserResponse(user)
    });
  } catch (error) {
    next(error);
  }
});

authRouter.get("/me", requireAuth, async (request, response) => {
  response.json({
    user: toUserResponse(request.user)
  });
});

export { authRouter };
