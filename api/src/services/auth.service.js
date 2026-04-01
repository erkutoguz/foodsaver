import bcrypt from "bcryptjs";
import { createToken, toUserResponse } from "../lib/auth.js";
import { createUser, findUserByEmail } from "../repositories/user.repository.js";
import { createError } from "../utils/http-error.js";

export async function registerUser({ fullName, email, password }) {
  const existingUser = await findUserByEmail(email);

  if (existingUser) {
    throw createError(409, "EMAIL_ALREADY_USED", "This email address is already registered.");
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await createUser({
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
  const user = await findUserByEmail(email);

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
