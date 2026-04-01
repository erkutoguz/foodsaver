function toNumber(value, fallback) {
  if (value === undefined || value === "") {
    return fallback;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export const env = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: toNumber(process.env.PORT, 4000),
  CLIENT_ORIGIN: process.env.CLIENT_ORIGIN || "*",
  LOG_LEVEL: process.env.LOG_LEVEL || "info",
  MONGODB_URI: process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/foodsaver",
  JWT_SECRET: process.env.JWT_SECRET || "dev-secret-change-me",
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "7d"
};
