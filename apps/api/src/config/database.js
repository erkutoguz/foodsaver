import mongoose from "mongoose";
import { env } from "./env.js";
import { logger } from "../lib/logger.js";

export async function connectDatabase() {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  await mongoose.connect(env.MONGODB_URI);
  logger.info("MongoDB connected", {
    database: mongoose.connection.name
  });

  return mongoose.connection;
}
