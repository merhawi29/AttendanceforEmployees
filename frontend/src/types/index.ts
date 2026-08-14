export type Role = "ADMIN" | "EMPLOYEE";

export type AttendanceStatus =
  | "PRESENT"
  | "LATE"
  | "ABSENT"
  | "HALF_DAY"
  | "LUNCH_MISSING"
  | "PENDING";

export type PunchType = "MORNING_IN" | "LUNCH_OUT" | "LUNCH_RETURN" | "FINAL_OUT";

export interface User {
  id: string;
  email: string;
  name: string;
  firstName?: string | null;
  middleName?: string | null;
  lastName?: string | null;
  employeeId: string;
  gender?: "MALE" | "FEMALE" | "OTHER" | null;
  dateOfBirth?: string | null;
  address?: string | null;
  avatarUrl?: string | null;
  department: string | null;
  departmentId?: string | null;
  positionId?: string | null;
  managerId?: string | null;
  phone?: string | null;
  hireDate?: string | null;
  employmentType?: string | null;
  employmentStatus?: "ACTIVE" | "INACTIVE" | "ON_LEAVE" | "TERMINATED" | "PROBATION" | null;
  salary?: number | null;
  role: Role;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
  departmentRef?: { id: string; code: string; name: string } | null;
  position?: { id: string; code: string; title: string; jobLevel?: string | null } | null;
  manager?: { id: string; name: string; employeeId: string; email?: string } | null;
  employeeDevices?: Array<{
    id: string;
    deviceId: string;
    deviceName?: string | null;
    browser?: string | null;
    operatingSystem?: string | null;
    isApproved: boolean;
    lastUsedAt?: string | null;
  }>;
}

export interface Attendance {
  id: string;
  userId: string;
  date: string;
  ethiopianDate: string;
  ethiopianDateLabel?: string;
  morningIn: string | null;
  lunchOut: string | null;
  lunchReturn: string | null;
  finalOut: string | null;
  status: AttendanceStatus | null;
  ipAddress: string | null;
  user?: Pick<User, "id" | "name" | "employeeId" | "email" | "department">;
}

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

export interface TodayAttendanceResponse {
  attendance: Attendance | null;
  schedule: AttendanceSchedule;
  settings: AttendanceSettings;
}

export interface AttendanceSettings {
  morningCheckInStart: string;
  morningCheckInEnd: string;
  lunchStartTime: string;
  lunchReturnDeadline: string;
  workEndTime: string;
  gracePeriodMinutes: number;
}

export interface DashboardStats {
  totalEmployees: number;
  presentToday: number;
  absentToday: number;
  lateToday: number;
  lunchMissingToday: number;
  date: string;
  ethiopianDate: string;
  ethiopianDateLabel: string;
}

export interface AllowedIp {
  id: string;
  ipAddress: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface EmployeeDevice {
  id: string;
  employeeId: string;
  deviceId: string;
  deviceName: string | null;
  browser: string | null;
  operatingSystem: string | null;
  ipAddress: string | null;
  isApproved: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  lastUsedAt: string | null;
  employee?: Pick<User, "id" | "name" | "employeeId" | "email" | "department">;
}

export interface DeviceStatus {
  hasDevice: boolean;
  isApproved: boolean;
  device: EmployeeDevice | null;
  pendingCount: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  errors?: Record<string, string[]>;
  code?: string;
  requestId?: string;
}
