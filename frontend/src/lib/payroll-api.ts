import { apiRequest } from "./api";
import {
  EmployeeSalaryStructureItem,
  PayrollRecordsResponse,
  PayrollRecord,
  GeneratePayrollResult,
  PayrollStatus,
  MonthlyPayrollSummaryReport,
  DepartmentPayrollSummaryReport,
  TotalPayrollCostReport,
} from "@/types/payroll";

export const payrollApi = {
  getSalaryStructures: (params?: { search?: string; departmentId?: string; page?: number; limit?: number }) => {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.set("search", params.search);
    if (params?.departmentId) queryParams.set("departmentId", params.departmentId);
    if (params?.page) queryParams.set("page", params.page.toString());
    if (params?.limit) queryParams.set("limit", params.limit.toString());

    return apiRequest<{ data: EmployeeSalaryStructureItem[]; pagination: any }>(
      `/payroll/salary-structures?${queryParams.toString()}`
    );
  },

  upsertSalaryStructure: (data: {
    userId: string;
    basicSalary?: number;
    housingAllowance?: number;
    transportAllowance?: number;
    otherAllowance?: number;
    bonus?: number;
    deduction?: number;
  }) => {
    return apiRequest<any>("/payroll/salary-structures", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  generatePayroll: (data: {
    month: number;
    year: number;
    departmentId?: string | null;
    overwriteDrafts?: boolean;
  }) => {
    return apiRequest<GeneratePayrollResult>("/payroll/generate", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  getPayrollRecords: (params?: {
    page?: number;
    limit?: number;
    month?: number;
    year?: number;
    departmentId?: string;
    userId?: string;
    status?: PayrollStatus;
    search?: string;
    sortBy?: string;
    sortOrder?: string;
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.set("page", params.page.toString());
    if (params?.limit) queryParams.set("limit", params.limit.toString());
    if (params?.month) queryParams.set("month", params.month.toString());
    if (params?.year) queryParams.set("year", params.year.toString());
    if (params?.departmentId) queryParams.set("departmentId", params.departmentId);
    if (params?.userId) queryParams.set("userId", params.userId);
    if (params?.status) queryParams.set("status", params.status);
    if (params?.search) queryParams.set("search", params.search);
    if (params?.sortBy) queryParams.set("sortBy", params.sortBy);
    if (params?.sortOrder) queryParams.set("sortOrder", params.sortOrder);

    return apiRequest<PayrollRecordsResponse>(`/payroll/records?${queryParams.toString()}`);
  },

  getPayrollById: (id: string) => {
    return apiRequest<PayrollRecord>(`/payroll/records/${id}`);
  },

  updatePayrollRecord: (
    id: string,
    data: {
      basicSalary?: number;
      housingAllowance?: number;
      transportAllowance?: number;
      otherAllowance?: number;
      bonus?: number;
      deduction?: number;
      remarks?: string | null;
      status?: PayrollStatus;
    }
  ) => {
    return apiRequest<PayrollRecord>(`/payroll/records/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  batchUpdateStatus: (payrollIds: string[], status: PayrollStatus) => {
    return apiRequest<{ updatedCount: number; status: PayrollStatus; message: string }>(
      "/payroll/batch-status",
      {
        method: "PATCH",
        body: JSON.stringify({ payrollIds, status }),
      }
    );
  },

  deletePayrollRecord: (id: string) => {
    return apiRequest<{ success: boolean; message: string }>(`/payroll/records/${id}`, {
      method: "DELETE",
    });
  },

  getMyPayslips: (year?: number) => {
    const queryParams = new URLSearchParams();
    if (year) queryParams.set("year", year.toString());
    return apiRequest<PayrollRecord[]>(`/payroll/my-payslips?${queryParams.toString()}`);
  },

  getMonthlySummaryReport: (params?: { month?: number; year?: number; departmentId?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.month) queryParams.set("month", params.month.toString());
    if (params?.year) queryParams.set("year", params.year.toString());
    if (params?.departmentId) queryParams.set("departmentId", params.departmentId);
    return apiRequest<MonthlyPayrollSummaryReport>(
      `/payroll/reports/monthly-summary?${queryParams.toString()}`
    );
  },

  getDepartmentSummaryReport: (params?: { month?: number; year?: number; departmentId?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.month) queryParams.set("month", params.month.toString());
    if (params?.year) queryParams.set("year", params.year.toString());
    if (params?.departmentId) queryParams.set("departmentId", params.departmentId);
    return apiRequest<DepartmentPayrollSummaryReport[]>(
      `/payroll/reports/department-summary?${queryParams.toString()}`
    );
  },

  getTotalPayrollCostReport: (params?: { year?: number; departmentId?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.year) queryParams.set("year", params.year.toString());
    if (params?.departmentId) queryParams.set("departmentId", params.departmentId);
    return apiRequest<TotalPayrollCostReport>(
      `/payroll/reports/total-cost?${queryParams.toString()}`
    );
  },
};
