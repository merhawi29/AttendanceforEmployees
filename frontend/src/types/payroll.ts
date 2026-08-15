export type PayrollStatus = "DRAFT" | "PROCESSED" | "PAID";

export interface SalaryStructure {
  id: string | null;
  userId: string;
  basicSalary: number;
  housingAllowance: number;
  transportAllowance: number;
  otherAllowance: number;
  bonus: number;
  deduction: number;
  updatedAt: string | null;
}

export interface EmployeeSalaryStructureItem {
  user: {
    id: string;
    name: string;
    email: string;
    employeeId: string;
    department?: { id: string; name: string; code: string } | null;
    position?: { id: string; title: string; code: string } | null;
  };
  salaryStructure: SalaryStructure;
  computed: {
    totalAllowances: number;
    grossSalary: number;
    totalDeductions: number;
    netSalary: number;
  };
}

export interface PayrollRecord {
  id: string;
  userId: string;
  month: number;
  year: number;
  basicSalary: number;
  housingAllowance: number;
  transportAllowance: number;
  otherAllowance: number;
  bonus: number;
  totalAllowances: number;
  deduction: number;
  totalDeductions: number;
  grossSalary: number;
  netSalary: number;
  status: PayrollStatus;
  remarks?: string | null;
  processedAt?: string | null;
  paidAt?: string | null;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    employeeId: string;
    phone?: string | null;
    hireDate?: string | null;
    avatarUrl?: string | null;
    departmentRef?: { id: string; name: string; code: string } | null;
    position?: { id: string; title: string; code: string } | null;
  };
}

export interface PayrollRecordsResponse {
  records: PayrollRecord[];
  summary: {
    totalRecords: number;
    totalGrossSalary: number;
    totalAllowances: number;
    totalDeductions: number;
    totalNetSalary: number;
  };
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface GeneratePayrollResult {
  month: number;
  year: number;
  totalTargetEmployees: number;
  generatedCount: number;
  updatedDraftCount: number;
  skippedCount: number;
  message: string;
}

export interface MonthlyPayrollSummaryReport {
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

export interface DepartmentPayrollSummaryReport {
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

export interface TotalPayrollCostReport {
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
