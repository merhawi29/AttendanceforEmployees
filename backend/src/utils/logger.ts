import pino from "pino";
import { config } from "../config";

export const logger = pino({
  level: config.logLevel,
  transport:
    config.nodeEnv === "development"
      ? { target: "pino-pretty", options: { colorize: true } }
      : undefined,
  redact: {
    paths: ["req.headers.authorization", "req.headers.cookie", "password", "refreshToken"],
    remove: true,
  },
});

export const createChildLogger = (bindings: Record<string, unknown>) => logger.child(bindings);
