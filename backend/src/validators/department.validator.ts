import { z } from "zod";

export const createDepartmentSchema = z.object({
  body: z.object({
    code: z
      .string()
      .min(2, "Department code must be at least 2 characters")
      .max(20, "Department code cannot exceed 20 characters")
      .regex(/^[A-Z0-9_-]+$/i, "Department code must be alphanumeric (letters, numbers, hyphens, underscores)"),
    name: z
      .string()
      .min(2, "Department name must be at least 2 characters")
      .max(100, "Department name cannot exceed 100 characters"),
    description: z.string().max(500, "Description cannot exceed 500 characters").optional().nullable(),
    managerId: z.string().cuid("Invalid manager user ID").optional().nullable(),
    parentDepartmentId: z.string().cuid("Invalid parent department ID").optional().nullable(),
    costCenterCode: z.string().max(50, "Cost center code cannot exceed 50 characters").optional().nullable(),
    isActive: z.boolean().optional().default(true),
  }),
});

export const updateDepartmentSchema = z.object({
  params: z.object({
    id: z.string().cuid("Invalid department ID"),
  }),
  body: z.object({
    code: z
      .string()
      .min(2, "Department code must be at least 2 characters")
      .max(20, "Department code cannot exceed 20 characters")
      .regex(/^[A-Z0-9_-]+$/i, "Department code must be alphanumeric")
      .optional(),
    name: z
      .string()
      .min(2, "Department name must be at least 2 characters")
      .max(100, "Department name cannot exceed 100 characters")
      .optional(),
    description: z.string().max(500, "Description cannot exceed 500 characters").optional().nullable(),
    managerId: z.string().cuid("Invalid manager user ID").optional().nullable(),
    parentDepartmentId: z.string().cuid("Invalid parent department ID").optional().nullable(),
    costCenterCode: z.string().max(50, "Cost center code cannot exceed 50 characters").optional().nullable(),
    isActive: z.boolean().optional(),
  }),
});

export const departmentIdParamSchema = z.object({
  params: z.object({
    id: z.string().cuid("Invalid department ID"),
  }),
});

export const getDepartmentsQuerySchema = z.object({
  query: z.object({
    page: z.string().optional().transform((val) => (val ? Math.max(1, parseInt(val, 10)) : 1)),
    limit: z.string().optional().transform((val) => (val ? Math.min(100, Math.max(1, parseInt(val, 10))) : 10)),
    search: z.string().optional(),
    isActive: z.string().optional().transform((val) => (val === "true" ? true : val === "false" ? false : undefined)),
    parentDepartmentId: z.string().optional(),
    sortBy: z.enum(["name", "code", "createdAt", "updatedAt"]).optional().default("name"),
    sortOrder: z.enum(["asc", "desc"]).optional().default("asc"),
  }),
});

export type CreateDepartmentInput = z.infer<typeof createDepartmentSchema>["body"];
export type UpdateDepartmentInput = z.infer<typeof updateDepartmentSchema>["body"];
export type GetDepartmentsQuery = z.infer<typeof getDepartmentsQuerySchema>["query"];
