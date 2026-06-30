import app from "./app";
import { config, validateConfig } from "./config";
import prisma from "./config/database";
import { logger } from "./utils/logger";

const startServer = async () => {
  try {
    validateConfig();
    await prisma.$connect();
    logger.info("Database connected");

    app.listen(config.port, () => {
      logger.info({ port: config.port, env: config.nodeEnv }, "Server started");
    });
  } catch (error) {
    logger.error({ err: error }, "Failed to start server");
    process.exit(1);
  }
};

process.on("SIGINT", async () => {
  await prisma.$disconnect();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await prisma.$disconnect();
  process.exit(0);
});

process.on("unhandledRejection", (reason) => {
  logger.error({ err: reason }, "Unhandled promise rejection");
});

process.on("uncaughtException", (error) => {
  logger.error({ err: error }, "Uncaught exception");
  process.exit(1);
});

startServer();
