import jwt, { SignOptions } from "jsonwebtoken";
import { randomUUID } from "crypto";
import { config } from "../config";
import { JwtPayload } from "../types";

const basePayload = (payload: Omit<JwtPayload, "type" | "jti">) => ({
  userId: payload.userId,
  email: payload.email,
  role: payload.role,
});

export const signAccessToken = (payload: Omit<JwtPayload, "type" | "jti">): string => {
  const options: SignOptions = { expiresIn: config.jwtAccessExpiresIn as SignOptions["expiresIn"] };
  return jwt.sign({ ...basePayload(payload), type: "access" }, config.jwtSecret, options);
};

export const signRefreshToken = (payload: Omit<JwtPayload, "type" | "jti">): { token: string; jti: string } => {
  const jti = randomUUID();
  const options: SignOptions = { expiresIn: config.jwtRefreshExpiresIn as SignOptions["expiresIn"] };
  const token = jwt.sign(
    { ...basePayload(payload), type: "refresh", jti },
    config.jwtRefreshSecret,
    options
  );
  return { token, jti };
};

export const verifyAccessToken = (token: string): JwtPayload => {
  const decoded = jwt.verify(token, config.jwtSecret) as JwtPayload;
  if (decoded.type !== "access") {
    throw new Error("Invalid token type");
  }
  return decoded;
};

export const verifyRefreshToken = (token: string): JwtPayload => {
  const decoded = jwt.verify(token, config.jwtRefreshSecret) as JwtPayload;
  if (decoded.type !== "refresh" || !decoded.jti) {
    throw new Error("Invalid token type");
  }
  return decoded;
};

export const getRefreshTokenExpiry = (): Date => {
  const match = config.jwtRefreshExpiresIn.match(/^(\d+)([smhd])$/);
  if (!match) {
    return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  }

  const value = parseInt(match[1], 10);
  const unit = match[2];
  const multipliers: Record<string, number> = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };

  return new Date(Date.now() + value * multipliers[unit]);
};
