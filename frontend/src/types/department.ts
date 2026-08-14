export interface Department {
  id: string;
  code: string;
  name: string;
  description: string | null;
  managerId: string | null;
  parentDepartmentId: string | null;
  costCenterCode: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  head?: {
    id: string;
    name: string;
    email: string;
    employeeId: string;
  } | null;
  parentDepartment?: {
    id: string;
    code: string;
    name: string;
  } | null;
  memberCount: number;
  subDepartmentCount: number;
}

export interface DepartmentTreeItem {
  id: string;
  code: string;
  name: string;
  parentDepartmentId: string | null;
  _count: {
    members: number;
  };
}

export interface DepartmentListResponse {
  departments: Department[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface DepartmentFormData {
  code: string;
  name: string;
  description?: string;
  managerId?: string;
  parentDepartmentId?: string;
  costCenterCode?: string;
  isActive?: boolean;
}

export interface GetDepartmentsParams {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
  parentDepartmentId?: string;
  sortBy?: "name" | "code" | "createdAt" | "updatedAt";
  sortOrder?: "asc" | "desc";
}
