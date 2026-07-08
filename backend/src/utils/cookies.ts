import { CookieOptions, Response } from "express";
import { config } from "../config";

const baseCookieOptions = (): CookieOptions => ({
  httpOnly: true,
  secure: config.nodeEnv === "production",
  sameSite: config.nodeEnv === "production" ? "none" : "strict",
  path: "/",
  ...(config.cookieDomain ? { domain: config.cookieDomain } : {}),
});

const ACCESS_MAX_AGE_MS = 15 * 60 * 1000;
const REFRESH_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export const setAuthCookies = (
  res: Response,
  accessToken: string,
  refreshToken: string
): void => {
  res.cookie("accessToken", accessToken, {
    ...baseCookieOptions(),
    maxAge: ACCESS_MAX_AGE_MS,
  });
  res.cookie("refreshToken", refreshToken, {
    ...baseCookieOptions(),
    maxAge: REFRESH_MAX_AGE_MS,
  });
};

export const clearAuthCookies = (res: Response): void => {
  res.clearCookie("accessToken", baseCookieOptions());
  res.clearCookie("refreshToken", baseCookieOptions());
};

export const getRefreshTokenFromRequest = (req: {
  cookies?: Record<string, string>;
  body?: { refreshToken?: string };
}): string | undefined => req.cookies?.refreshToken || req.body?.refreshToken;
