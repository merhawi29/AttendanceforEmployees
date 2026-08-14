export interface PositionDepartment {
  id: string;
  code: string;
  name: string;
}

export interface Position {
  id: string;
  code: string;
  title: string;
  description?: string | null;
  departmentId: string;
  jobLevel?: string | null;
  minSalary?: number | null;
  maxSalary?: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  department?: PositionDepartment;
}

export interface PositionListResponse {
  positions: Position[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface CreatePositionInput {
  code: string;
  title: string;
  departmentId: string;
  description?: string | null;
  jobLevel?: string | null;
  minSalary?: number | null;
  maxSalary?: number | null;
  isActive?: boolean;
}

export interface UpdatePositionInput {
  code?: string;
  title?: string;
  departmentId?: string;
  description?: string | null;
  jobLevel?: string | null;
  minSalary?: number | null;
  maxSalary?: number | null;
  isActive?: boolean;
}
