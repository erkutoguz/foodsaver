import bcrypt from "bcryptjs";
import { User } from "../models/user.model.js";
import { createToken, toUserResponse } from "../lib/auth.js";
import { createError } from "../utils/http-error.js";

export async function registerUser({ fullName, email, password }) {
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

  return {
    token: createToken(user),
    user: toUserResponse(user)
  };
}

export async function loginUser({ email, password }) {
  const user = await User.findOne({ email });

  if (!user) {
    throw createError(401, "INVALID_CREDENTIALS", "Email or password is incorrect.");
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash);

  if (!passwordMatches) {
    throw createError(401, "INVALID_CREDENTIALS", "Email or password is incorrect.");
  }

  return {
    token: createToken(user),
    user: toUserResponse(user)
  };
}

export function getCurrentUser(requestUser) {
  return {
    user: toUserResponse(requestUser)
  };
}
