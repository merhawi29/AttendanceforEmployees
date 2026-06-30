import { Response, NextFunction } from "express";
import { Role, AuthRequest } from "../types";
import { verifyAccessToken } from "../utils/jwt";
import { AppError } from "../utils/response";
import prisma from "../config/database";

const extractAccessToken = (req: AuthRequest): string | null => {
  if (req.cookies?.accessToken) {
    return req.cookies.accessToken;
  }

  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.split(" ")[1];
  }

  return null;
};

export const authenticate = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
) => {
  const token = extractAccessToken(req);
  if (!token) {
    return next(new AppError(401, "Authentication required", undefined, "AUTH_REQUIRED"));
  }

  try {
    const payload = verifyAccessToken(token);

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, isActive: true },
    });

    if (!user) {
      return next(new AppError(401, "User not found", undefined, "USER_NOT_FOUND"));
    }

    if (!user.isActive) {
      return next(new AppError(403, "Account is deactivated", undefined, "ACCOUNT_INACTIVE"));
    }

    req.user = payload;
    next();
  } catch {
    next(new AppError(401, "Invalid or expired access token", undefined, "INVALID_TOKEN"));
  }
};

export const authorize = (...roles: Role[]) => {
  return (req: AuthRequest, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError(401, "Authentication required", undefined, "AUTH_REQUIRED"));
    }
    if (!roles.includes(req.user.role)) {
      return next(new AppError(403, "Insufficient permissions", undefined, "FORBIDDEN"));
    }
    next();
  };
};
