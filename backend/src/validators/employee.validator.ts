import { z } from "zod";

export const createEmployeeSchema = z.object({
  body: z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    name: z.string().optional(),
    firstName: z.string().min(1, "First name is required").optional().nullable(),
    middleName: z.string().optional().nullable(),
    lastName: z.string().optional().nullable(),
    employeeId: z.string().min(2, "Employee ID must be at least 2 characters"),
    gender: z.enum(["MALE", "FEMALE", "OTHER"]).optional().nullable(),
    dateOfBirth: z.string().optional().nullable(),
    address: z.string().optional().nullable(),
    avatarUrl: z.string().optional().nullable(),
    departmentId: z.string().cuid("Invalid department ID").optional().nullable(),
    positionId: z.string().cuid("Invalid position ID").optional().nullable(),
    managerId: z.string().cuid("Invalid manager ID").optional().nullable(),
    phone: z.string().max(30, "Phone number cannot exceed 30 characters").optional().nullable(),
    hireDate: z.string().optional().nullable(),
    employmentType: z.enum(["FULL_TIME", "PART_TIME", "CONTRACT", "INTERN", "TEMPORARY"]).optional().default("FULL_TIME"),
    employmentStatus: z.enum(["ACTIVE", "INACTIVE", "ON_LEAVE", "TERMINATED", "PROBATION"]).optional().default("ACTIVE"),
    salary: z.number().min(0, "Salary must be non-negative").optional().nullable(),
    role: z.enum(["ADMIN", "EMPLOYEE"]).optional().default("EMPLOYEE"),
    isActive: z.boolean().optional().default(true),
  }),
});

export const updateEmployeeSchema = z.object({
  params: z.object({
    id: z.string().cuid("Invalid employee user ID"),
  }),
  body: z.object({
    email: z.string().email("Invalid email address").optional(),
    password: z.string().min(6, "Password must be at least 6 characters").optional(),
    name: z.string().optional(),
    firstName: z.string().optional().nullable(),
    middleName: z.string().optional().nullable(),
    lastName: z.string().optional().nullable(),
    employeeId: z.string().min(2, "Employee ID must be at least 2 characters").optional(),
    gender: z.enum(["MALE", "FEMALE", "OTHER"]).optional().nullable(),
    dateOfBirth: z.string().optional().nullable(),
    address: z.string().optional().nullable(),
    avatarUrl: z.string().optional().nullable(),
    departmentId: z.string().cuid("Invalid department ID").optional().nullable(),
    positionId: z.string().cuid("Invalid position ID").optional().nullable(),
    managerId: z.string().cuid("Invalid manager ID").optional().nullable(),
    phone: z.string().max(30, "Phone number cannot exceed 30 characters").optional().nullable(),
    hireDate: z.string().optional().nullable(),
    employmentType: z.enum(["FULL_TIME", "PART_TIME", "CONTRACT", "INTERN", "TEMPORARY"]).optional(),
    employmentStatus: z.enum(["ACTIVE", "INACTIVE", "ON_LEAVE", "TERMINATED", "PROBATION"]).optional(),
    salary: z.number().min(0, "Salary must be non-negative").optional().nullable(),
    role: z.enum(["ADMIN", "EMPLOYEE"]).optional(),
    isActive: z.boolean().optional(),
  }),
});

export const employeeIdParamSchema = z.object({
  params: z.object({
    id: z.string().cuid("Invalid employee user ID"),
  }),
});

export const getEmployeesQuerySchema = z.object({
  query: z.object({
    page: z.string().optional().transform((val) => (val ? Math.max(1, parseInt(val, 10)) : 1)),
    limit: z.string().optional().transform((val) => (val ? Math.min(100, Math.max(1, parseInt(val, 10))) : 10)),
    search: z.string().optional(),
    departmentId: z.string().optional(),
    positionId: z.string().optional(),
    role: z.enum(["ADMIN", "EMPLOYEE"]).optional(),
    employmentStatus: z.enum(["ACTIVE", "INACTIVE", "ON_LEAVE", "TERMINATED", "PROBATION"]).optional(),
    isActive: z.string().optional().transform((val) => (val === "true" ? true : val === "false" ? false : undefined)),
    sortBy: z.enum(["name", "email", "employeeId", "createdAt", "updatedAt", "hireDate"]).optional().default("name"),
    sortOrder: z.enum(["asc", "desc"]).optional().default("asc"),
  }),
});

export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>["body"];
export type UpdateEmployeeInput = z.infer<typeof updateEmployeeSchema>["body"];
export type GetEmployeesQuery = z.infer<typeof getEmployeesQuerySchema>["query"];
