import { User } from "../models/user.model.js";

export function findUserByEmail(email) {
  return User.findOne({ email });
}

export function findUserById(userId) {
  return User.findById(userId);
}

export function createUser(payload) {
  return User.create(payload);
}
