import dotenv from "dotenv";

dotenv.config();

const WEAK_SECRETS = new Set([
  "fallback-secret-change-me",
  "fallback-refresh-secret-change-me",
  "your-super-secret-jwt-key-change-in-production",
  "your-super-secret-refresh-key-change-in-production",
  "your-secret-key",
]);

export const config = {
  port: parseInt(process.env.PORT || "4000", 10),
  nodeEnv: process.env.NODE_ENV || "development",
  jwtSecret: process.env.JWT_SECRET || "fallback-secret-change-me",
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || "fallback-refresh-secret-change-me",
  jwtAccessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "15m",
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:3000",
  ipRestrictionEnabled: process.env.IP_RESTRICTION_ENABLED !== "false",
  cookieDomain: process.env.COOKIE_DOMAIN || undefined,
  logLevel: process.env.LOG_LEVEL || "info",
  morning: {
    startHour: 6,
    startMinute: 0,
    endHour: 12,
    endMinute: 0,
    lateAfterHour: 9,
    lateAfterMinute: 15,
  },
  afternoon: {
    startHour: 12,
    startMinute: 0,
    endHour: 18,
    endMinute: 0,
    lateAfterHour: 13,
    lateAfterMinute: 15,
  },
};

export const validateConfig = (): void => {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required");
  }

  if (config.nodeEnv === "production") {
    if (!process.env.JWT_SECRET || WEAK_SECRETS.has(process.env.JWT_SECRET)) {
      throw new Error("JWT_SECRET must be set to a strong value in production");
    }
    if (!process.env.JWT_REFRESH_SECRET || WEAK_SECRETS.has(process.env.JWT_REFRESH_SECRET)) {
      throw new Error("JWT_REFRESH_SECRET must be set to a strong value in production");
    }
    if (process.env.JWT_SECRET === process.env.JWT_REFRESH_SECRET) {
      throw new Error("JWT_SECRET and JWT_REFRESH_SECRET must be different");
    }
  }
};
