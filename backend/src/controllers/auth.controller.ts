import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import prisma from "../config/database";
import { AuthRequest } from "../types";
import { authService } from "../services/auth.service";
import { asyncHandler, sendSuccess, AppError } from "../utils/response";
import { setAuthCookies, clearAuthCookies, getRefreshTokenFromRequest } from "../utils/cookies";
import { getClientIp } from "../utils/helpers";

export const login = asyncHandler(async (req: AuthRequest, res: Response) => {
  const result = await authService.login(req.body, {
    ip: getClientIp(req),
    requestId: req.requestId,
  });

  setAuthCookies(res, result.accessToken, result.refreshToken);

  sendSuccess(res, { token: result.accessToken, user: result.user }, "Login successful");
});

export const register = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = await authService.register(req.body);
  sendSuccess(res, user, "Employee registered successfully", 201);
});

export const refresh = asyncHandler(async (req: AuthRequest, res: Response) => {
  const refreshToken = getRefreshTokenFromRequest(req);
  if (!refreshToken) {
    throw new AppError(401, "Refresh token required", undefined, "REFRESH_REQUIRED");
  }

  const result = await authService.refresh(refreshToken);
  setAuthCookies(res, result.accessToken, result.refreshToken);
  sendSuccess(res, { user: result.user }, "Token refreshed successfully");
});

export const logout = asyncHandler(async (req: AuthRequest, res: Response) => {
  await authService.logout(getRefreshTokenFromRequest(req));
  clearAuthCookies(res);
  sendSuccess(res, null, "Logged out successfully");
});

export const logoutAll = asyncHandler(async (req: AuthRequest, res: Response) => {
  await authService.logoutAll(req.user!.userId);
  clearAuthCookies(res);
  sendSuccess(res, null, "Logged out from all devices");
});

export const getProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = await authService.getProfile(req.user!.userId);
  sendSuccess(res, user, "Profile retrieved");
});

export const getMe = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = await authService.getProfile(req.user!.userId);
  sendSuccess(res, user, "Current user retrieved");
});

export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body;
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });

  if (!user) {
    throw new AppError(404, "User with this email does not exist", undefined, "USER_NOT_FOUND");
  }

  const token = crypto.randomBytes(32).toString("hex");
  const expiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

  await prisma.user.update({
    where: { id: user.id },
    data: {
      resetToken: token,
      resetExpire: expiry,
    },
  });

  sendSuccess(res, { token }, "Reset token generated successfully");
});

export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  const { token, newPassword } = req.body;

  const user = await prisma.user.findFirst({
    where: {
      resetToken: token,
      resetExpire: {
        gt: new Date(),
      },
    },
  });

  if (!user) {
    throw new AppError(400, "Invalid or expired reset token", undefined, "INVALID_TOKEN");
  }

  const hashedPassword = await bcrypt.hash(newPassword, 12);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashedPassword,
      resetToken: null,
      resetExpire: null,
    },
  });

  // Force user to re-login by deleting all active sessions/refresh tokens
  await prisma.refreshToken.deleteMany({ where: { userId: user.id } });

  sendSuccess(res, null, "Password reset successfully");
});
