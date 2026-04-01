import "dotenv/config";
import { createApp } from "./app.js";
import { connectDatabase } from "./config/database.js";
import { env } from "./config/env.js";
import { logger } from "./lib/logger.js";

const app = createApp();

async function start() {
  await connectDatabase();

  return new Promise((resolve, reject) => {
    const server = app.listen(env.PORT, () => {
      logger.info(`API listening on port ${env.PORT}`, {
        environment: env.NODE_ENV
      });
      resolve(server);
    });

    server.on("error", reject);
  });
}

void start().catch((error) => {
  logger.error("Failed to start API", error);
  process.exit(1);
});
