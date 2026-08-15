import { PayrollStatus } from "@prisma/client";

export interface SalaryStructureInput {
  userId: string;
  basicSalary?: number;
  housingAllowance?: number;
  transportAllowance?: number;
  otherAllowance?: number;
  bonus?: number;
  deduction?: number;
}

export interface GeneratePayrollInput {
  month: number; // 1 - 12
  year: number;  // e.g. 2026
  departmentId?: string; // Optional: filter by department
  overwriteDrafts?: boolean;
}

export interface GetPayrollRecordsQuery {
  page?: number;
  limit?: number;
  month?: number;
  year?: number;
  departmentId?: string;
  userId?: string;
  status?: PayrollStatus;
  search?: string;
  sortBy?: "createdAt" | "month" | "netSalary" | "status";
  sortOrder?: "asc" | "desc";
}

export interface UpdatePayrollRecordInput {
  basicSalary?: number;
  housingAllowance?: number;
  transportAllowance?: number;
  otherAllowance?: number;
  bonus?: number;
  deduction?: number;
  remarks?: string | null;
  status?: PayrollStatus;
}

export interface BatchUpdateStatusInput {
  payrollIds: string[];
  status: PayrollStatus;
}

export interface PayrollReportQuery {
  month?: number;
  year?: number;
  departmentId?: string;
}

export interface MonthlyPayrollSummaryResponse {
  month: number;
  year: number;
  totalEmployees: number;
  draftCount: number;
  processedCount: number;
  paidCount: number;
  totalBasicSalary: number;
  totalAllowances: number;
  totalDeductions: number;
  totalGrossSalary: number;
  totalNetSalary: number;
}

export interface DepartmentPayrollSummaryResponse {
  departmentId: string | null;
  departmentName: string;
  departmentCode: string | null;
  employeeCount: number;
  totalBasicSalary: number;
  totalAllowances: number;
  totalDeductions: number;
  totalGrossSalary: number;
  totalNetSalary: number;
}

export interface TotalPayrollCostResponse {
  year: number;
  annualTotalGross: number;
  annualTotalNet: number;
  annualTotalAllowances: number;
  annualTotalDeductions: number;
  monthlyBreakdown: {
    month: number;
    employeeCount: number;
    grossSalary: number;
    netSalary: number;
    totalAllowances: number;
    totalDeductions: number;
  }[];
}
