import { User } from "@prisma/client";
import { SessionType } from "../types";
import { config } from "../config";

export const getClientIp = (req: { headers: Record<string, string | string[] | undefined>; socket: { remoteAddress?: string | null }; ip?: string }): string => {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") {
    return forwarded.split(",")[0].trim();
  }
  if (Array.isArray(forwarded) && forwarded.length > 0) {
    return forwarded[0].split(",")[0].trim();
  }
  return req.socket.remoteAddress || req.ip || "unknown";
};

export const normalizeIp = (ip: string): string => {
  if (ip.startsWith("::ffff:")) {
    return ip.slice(7);
  }
  return ip;
};

export const getTodayDate = (): Date => {
  const now = new Date();
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
};

export const formatDate = (date: Date): string => {
  return date.toISOString().split("T")[0];
};

export const isLate = (
  checkInTime: Date,
  lateAfterHour: number,
  lateAfterMinute: number
): boolean => {
  const lateThreshold = new Date(checkInTime);
  lateThreshold.setHours(lateAfterHour, lateAfterMinute, 0, 0);
  return checkInTime > lateThreshold;
};

export const isWithinSessionWindow = (session: SessionType, now: Date = new Date()): boolean => {
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const window =
    session === "MORNING"
      ? {
          start: config.morning.startHour * 60 + config.morning.startMinute,
          end: config.morning.endHour * 60 + config.morning.endMinute,
        }
      : {
          start: config.afternoon.startHour * 60 + config.afternoon.startMinute,
          end: config.afternoon.endHour * 60 + config.afternoon.endMinute,
        };

  return currentMinutes >= window.start && currentMinutes <= window.end;
};

export const getSessionWindowLabel = (session: SessionType): string => {
  const window = session === "MORNING" ? config.morning : config.afternoon;
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${pad(window.startHour)}:${pad(window.startMinute)} - ${pad(window.endHour)}:${pad(window.endMinute)}`;
};

export const omitPassword = <T extends { password?: string }>(
  user: T
): Omit<T, "password"> => {
  const { password: _, ...rest } = user;
  return rest;
};

export const formatUserResponse = (user: User) => ({
  id: user.id,
  email: user.email,
  name: user.name,
  role: user.role,
  isActive: user.isActive,
  createdAt: user.createdAt.toISOString(),
  employeeId: user.employeeId,
  department: user.department,
});
