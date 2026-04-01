import { Router } from "express";
import bcrypt from "bcryptjs";
import { User } from "../models/user.model.js";
import { createToken, toUserResponse } from "../lib/auth.js";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { loginSchema, registerSchema } from "../validators/auth.schemas.js";
import { createError } from "../utils/http-error.js";

const authRouter = Router();

authRouter.post("/register", validate(registerSchema), async (request, response, next) => {
  try {
    const { fullName, email, password } = request.body;
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

authRouter.post("/login", validate(loginSchema), async (request, response, next) => {
  try {
    const { email, password } = request.body;
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
