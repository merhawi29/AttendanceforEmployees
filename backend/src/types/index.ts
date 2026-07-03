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

export type PunchType = "MORNING_IN" | "LUNCH_OUT" | "LUNCH_RETURN" | "FINAL_OUT";

export interface StepSchedule {
  enabled: boolean;
  message: string;
  recorded: boolean;
}

export interface AttendanceSchedule {
  currentEatTime: string;
  ethiopianDate: string;
  ethiopianDateLabel: string;
  steps: Record<PunchType, StepSchedule>;
}

export interface AttendanceSummary {
  totalEmployees: number;
  presentToday: number;
  absentToday: number;
  lateToday: number;
  lunchMissingToday: number;
}

export { AttendanceStatus, Role };
