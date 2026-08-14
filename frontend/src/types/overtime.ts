export type OvertimeStatus =
  | "PENDING"
  | "APPROVED_BY_MANAGER"
  | "APPROVED"
  | "REJECTED"
  | "CANCELLED";

export type OvertimeCategory =
  | "NORMAL_DAY"
  | "WEEKEND"
  | "PUBLIC_HOLIDAY"
  | "NIGHT_SHIFT";

export interface OvertimeRequest {
  id: string;
  userId: string;
  date: string;
  startTime: string;
  endTime: string;
  totalHours: number;
  category: OvertimeCategory;
  multiplierRate: number;
  reason: string;
  status: OvertimeStatus;
  managerId?: string | null;
  managerComment?: string | null;
  approvedById?: string | null;
  adminComment?: string | null;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
    employeeId: string;
    department?: string | null;
    departmentRef?: { id: string; name: string; code: string } | null;
    position?: { id: string; title: string } | null;
  };
  manager?: {
    id: string;
    name: string;
    employeeId: string;
  } | null;
  approvedBy?: {
    id: string;
    name: string;
    employeeId: string;
  } | null;
}

export interface OvertimeRequestsResponse {
  requests: OvertimeRequest[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface CreateOvertimeInput {
  date: string;
  startTime: string;
  endTime: string;
  category: OvertimeCategory;
  reason: string;
}

export interface DepartmentOvertimeReportItem {
  departmentId: string | null;
  departmentName: string;
  departmentCode: string | null;
  employeeCount: number;
  totalRequests: number;
  approvedHours: number;
  pendingHours: number;
  weightedPayrollHours: number;
}

export interface DepartmentOvertimeReportResponse {
  year: number;
  month?: number | null;
  departments: DepartmentOvertimeReportItem[];
}

export interface MonthlyOvertimeReportResponse {
  year: number;
  month: number;
  summary: {
    totalRequests: number;
    approvedRequests: number;
    pendingRequests: number;
    rejectedRequests: number;
    totalApprovedHours: number;
    totalWeightedHours: number;
  };
  requests: OvertimeRequest[];
}

export interface AdminOvertimeMetricsResponse {
  pendingRequestsCount: number;
  totalApprovedHoursThisMonth: number;
  totalWeightedHoursThisMonth: number;
  topDepartmentThisMonth: string;
  topDepartmentHoursThisMonth: number;
}
