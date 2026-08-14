export interface EmployeeDepartment {
  id: string;
  code: string;
  name: string;
}

export interface EmployeePosition {
  id: string;
  code: string;
  title: string;
  jobLevel?: string | null;
  departmentId?: string | null;
}

export interface EmployeeManager {
  id: string;
  name: string;
  employeeId: string;
  email?: string;
}

export interface Employee {
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
  department?: string | null;
  departmentId?: string | null;
  positionId?: string | null;
  managerId?: string | null;
  phone?: string | null;
  hireDate?: string | null;
  employmentType?: string | null;
  employmentStatus?: "ACTIVE" | "INACTIVE" | "ON_LEAVE" | "TERMINATED" | "PROBATION" | null;
  salary?: number | null;
  role: "ADMIN" | "EMPLOYEE";
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  departmentRef?: EmployeeDepartment | null;
  position?: EmployeePosition | null;
  manager?: EmployeeManager | null;
  directReports?: EmployeeManager[];
  employeeDevices?: Array<{
    id: string;
    deviceId: string;
    deviceName?: string | null;
    browser?: string | null;
    operatingSystem?: string | null;
    isApproved: boolean;
    lastUsedAt?: string | null;
  }>;
  attendances?: Array<{
    id: string;
    date: string;
    ethiopianDate: string;
    status: string;
    morningIn?: string | null;
    finalOut?: string | null;
  }>;
}

export interface EmployeeListResponse {
  employees: Employee[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface CreateEmployeeInput {
  email: string;
  password: string;
  name?: string;
  firstName?: string | null;
  middleName?: string | null;
  lastName?: string | null;
  employeeId: string;
  gender?: "MALE" | "FEMALE" | "OTHER" | null;
  dateOfBirth?: string | null;
  address?: string | null;
  avatarUrl?: string | null;
  departmentId?: string | null;
  positionId?: string | null;
  managerId?: string | null;
  phone?: string | null;
  hireDate?: string | null;
  employmentType?: string;
  employmentStatus?: "ACTIVE" | "INACTIVE" | "ON_LEAVE" | "TERMINATED" | "PROBATION";
  salary?: number | null;
  role?: "ADMIN" | "EMPLOYEE";
  isActive?: boolean;
}

export interface UpdateEmployeeInput {
  email?: string;
  password?: string;
  name?: string;
  firstName?: string | null;
  middleName?: string | null;
  lastName?: string | null;
  employeeId?: string;
  gender?: "MALE" | "FEMALE" | "OTHER" | null;
  dateOfBirth?: string | null;
  address?: string | null;
  avatarUrl?: string | null;
  departmentId?: string | null;
  positionId?: string | null;
  managerId?: string | null;
  phone?: string | null;
  hireDate?: string | null;
  employmentType?: string;
  employmentStatus?: "ACTIVE" | "INACTIVE" | "ON_LEAVE" | "TERMINATED" | "PROBATION";
  salary?: number | null;
  role?: "ADMIN" | "EMPLOYEE";
  isActive?: boolean;
}
