import { Response } from "express";
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
