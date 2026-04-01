import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export function createToken(user) {
  return jwt.sign(
    {
      sub: user._id.toString(),
      email: user.email
    },
    env.JWT_SECRET,
    {
      expiresIn: env.JWT_EXPIRES_IN
    }
  );
}

export function verifyToken(token) {
  return jwt.verify(token, env.JWT_SECRET);
}

export function toUserResponse(user) {
  return {
    id: user._id.toString(),
    fullName: user.fullName,
    email: user.email,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  };
}
