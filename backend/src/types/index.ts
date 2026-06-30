import { AttendanceStatus, Role } from "@prisma/client";
import { Request } from "express";

export interface JwtPayload {
  userId: string;
  email: string;
  role: Role;
  type: "access" | "refresh";
  jti?: string;
}

export interface AuthRequest extends Request {
  user?: JwtPayload;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  errors?: Record<string, string[]>;
  code?: string;
  requestId?: string;
}

export type SessionType = "MORNING" | "AFTERNOON";
export type ActionType = "CHECK_IN" | "CHECK_OUT";

export interface AttendanceSummary {
  totalEmployees: number;
  presentToday: number;
  absentToday: number;
  lateToday: number;
}

export { AttendanceStatus, Role };
