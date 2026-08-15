import { apiRequest } from "@/lib/api";

export interface AttendanceAnalyticsData {
  summary: {
    totalRecords: number;
    totalEmployees: number;
    present: number;
    late: number;
    absent: number;
    halfDay: number;
    onLeave: number;
    attendancePercentage: number;
  };
  trend: Array<{ date: string; present: number; late: number; absent: number; halfDay: number }>;
  departmentBreakdown: Array<{ name: string; present: number; late: number; absent: number }>;
  records: any[];
}

export interface LeaveAnalyticsData {
  summary: {
    totalRequests: number;
    approvedRequests: number;
    pendingRequests: number;
    rejectedRequests: number;
    totalDaysUsed: number;
    currentlyOnLeave: number;
  };
  leaveByDepartment: Array<{ department: string; requests: number; days: number }>;
  leaveByType: Array<{ typeName: string; count: number; days: number }>;
  topEmployees: Array<{ employeeId: string; name: string; department: string; requests: number; totalDays: number }>;
  departmentSummary: Array<{ department: string; requests: number; days: number }>;
  records: any[];
}

export interface OvertimeAnalyticsData {
  summary: {
    totalRequests: number;
    approvedRequestsCount: number;
    pendingRequestsCount: number;
    rejectedRequestsCount: number;
    totalHours: number;
    approvedHours: number;
    payrollWeightedHours: number;
    avgOtPerEmployee: number;
  };
  otByDepartment: Array<{ department: string; hours: number; approvedHours: number; count: number }>;
  topEmployees: Array<{ employeeId: string; name: string; department: string; totalHours: number; approvedHours: number }>;
  departmentSummary: Array<{ department: string; hours: number; approvedHours: number; count: number }>;
  records: any[];
}

export interface PayrollAnalyticsData {
  summary: {
    recordCount: number;
    totalPayrollCost: number;
    totalGrossSalary: number;
    totalNetSalary: number;
    totalDeductions: number;
    totalBonuses: number;
    avgEmployeeSalary: number;
  };
  departmentSummary: Array<{ department: string; count: number; totalGross: number; totalNet: number; totalDeductions: number }>;
  highestPaid: any[];
  lowestPaid: any[];
  records: any[];
}

export interface DepartmentKpiData {
  departments: Array<{
    id: string;
    code: string;
    name: string;
    employeeCount: number;
    attendanceRate: number;
    leaveDaysUsed: number;
    otHours: number;
    payrollCost: number;
    activeEmployees: number;
  }>;
  rankings: {
    bestPerforming: any;
    highestAttendance: any;
    highestOvertime: any;
    highestPayroll: any;
  };
}

export interface ExecutiveDashboardData {
  cards: {
    totalEmployees: number;
    activeEmployees: number;
    presentToday: number;
    onLeaveToday: number;
    lateToday: number;
    totalOvertimeHoursMonth: number;
    totalPayrollCostMonth: number;
    attendancePercentage: number;
    employeeGrowthRate: number;
  };
}

export interface EmployeePerformanceData {
  topPerforming: Array<{ id: string; name: string; employeeId: string; department: string; position: string; attendancePercentage: number; lateCount: number; absentCount: number; leaveDays: number; otHours: number; totalEarnings: number }>;
  mostPunctual: Array<{ id: string; name: string; employeeId: string; department: string; position: string; attendancePercentage: number; lateCount: number; absentCount: number; leaveDays: number; otHours: number; totalEarnings: number }>;
  mostOvertime: Array<{ id: string; name: string; employeeId: string; department: string; position: string; attendancePercentage: number; lateCount: number; absentCount: number; leaveDays: number; otHours: number; totalEarnings: number }>;
  all: Array<{ id: string; name: string; employeeId: string; department: string; position: string; attendancePercentage: number; lateCount: number; absentCount: number; leaveDays: number; otHours: number; totalEarnings: number }>;
}

export async function fetchLeaveAnalytics(query?: Record<string, string>): Promise<LeaveAnalyticsData> {
  const queryString = query ? "?" + new URLSearchParams(query).toString() : "";
  return apiRequest<LeaveAnalyticsData>(`/reports/leave${queryString}`);
}

export async function fetchOvertimeAnalytics(query?: Record<string, string>): Promise<OvertimeAnalyticsData> {
  const queryString = query ? "?" + new URLSearchParams(query).toString() : "";
  return apiRequest<OvertimeAnalyticsData>(`/reports/overtime${queryString}`);
}

export async function fetchPayrollAnalytics(query?: Record<string, string>): Promise<PayrollAnalyticsData> {
  const queryString = query ? "?" + new URLSearchParams(query).toString() : "";
  return apiRequest<PayrollAnalyticsData>(`/reports/payroll${queryString}`);
}

export async function fetchDepartmentAnalytics(query?: Record<string, string>): Promise<DepartmentKpiData> {
  const queryString = query ? "?" + new URLSearchParams(query).toString() : "";
  return apiRequest<DepartmentKpiData>(`/reports/department${queryString}`);
}

export async function fetchExecutiveDashboard(query?: Record<string, string>): Promise<ExecutiveDashboardData> {
  const queryString = query ? "?" + new URLSearchParams(query).toString() : "";
  return apiRequest<ExecutiveDashboardData>(`/reports/executive${queryString}`);
}

export async function fetchEmployeePerformanceAnalytics(query?: Record<string, string>): Promise<EmployeePerformanceData> {
  const queryString = query ? "?" + new URLSearchParams(query).toString() : "";
  return apiRequest<EmployeePerformanceData>(`/reports/employee-performance${queryString}`);
}
