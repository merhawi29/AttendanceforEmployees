export type LeaveRequestStatus =
  | "PENDING"
  | "APPROVED_BY_MANAGER"
  | "APPROVED"
  | "REJECTED"
  | "CANCELLED";

export interface LeaveType {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  defaultDaysPerYear: number;
  isPaid: boolean;
  requiresApproval: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LeaveBalance {
  id: string;
  userId: string;
  leaveTypeId: string;
  leaveTypeName: string;
  leaveTypeCode: string;
  isPaid: boolean;
  year: number;
  allocatedDays: number;
  usedDays: number;
  pendingDays: number;
  remainingDays: number;
}

export interface LeaveRequest {
  id: string;
  userId: string;
  leaveTypeId: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  status: LeaveRequestStatus;
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
  leaveType?: {
    id: string;
    code: string;
    name: string;
    isPaid: boolean;
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

export interface LeaveRequestsResponse {
  requests: LeaveRequest[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface CreateLeaveRequestInput {
  leaveTypeId: string;
  startDate: string;
  endDate: string;
  reason: string;
}

export interface LeaveReportUserBalance {
  userId: string;
  userName: string;
  employeeId: string;
  department?: string | null;
  leaveTypeId: string;
  leaveTypeName: string;
  allocatedDays: number;
  usedDays: number;
  pendingDays: number;
  remainingDays: number;
}

export interface LeaveReportResponse {
  year: number;
  summary: {
    totalAllocated: number;
    totalUsed: number;
    totalPending: number;
    totalRemaining: number;
  };
  leaveTypes: Array<{ id: string; code: string; name: string }>;
  userBalances: LeaveReportUserBalance[];
}

export interface DepartmentLeaveReportItem {
  departmentId: string | null;
  departmentName: string;
  departmentCode: string | null;
  employeeCount: number;
  totalAllocated: number;
  totalUsed: number;
  totalPending: number;
  totalRemaining: number;
}

export interface DepartmentLeaveReportResponse {
  year: number;
  summary: {
    totalDepartments: number;
    totalEmployees: number;
    totalAllocated: number;
    totalUsed: number;
    totalPending: number;
    totalRemaining: number;
  };
  departments: DepartmentLeaveReportItem[];
}
