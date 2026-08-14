import { z } from "zod";

export const createPositionSchema = z.object({
  body: z.object({
    code: z
      .string()
      .min(2, "Position code must be at least 2 characters")
      .max(20, "Position code cannot exceed 20 characters")
      .regex(/^[A-Z0-9_-]+$/i, "Position code must be alphanumeric (letters, numbers, hyphens, underscores)"),
    title: z
      .string()
      .min(2, "Position title must be at least 2 characters")
      .max(100, "Position title cannot exceed 100 characters"),
    departmentId: z.string().cuid("Invalid department ID"),
    description: z.string().max(500, "Description cannot exceed 500 characters").optional().nullable(),
    jobLevel: z.string().max(50, "Job level cannot exceed 50 characters").optional().nullable(),
    minSalary: z.number().min(0, "Minimum salary must be non-negative").optional().nullable(),
    maxSalary: z.number().min(0, "Maximum salary must be non-negative").optional().nullable(),
    isActive: z.boolean().optional().default(true),
  }).refine(
    (data) => {
      if (data.minSalary !== undefined && data.minSalary !== null && data.maxSalary !== undefined && data.maxSalary !== null) {
        return data.maxSalary >= data.minSalary;
      }
      return true;
    },
    {
      message: "Maximum salary must be greater than or equal to minimum salary",
      path: ["maxSalary"],
    }
  ),
});

export const updatePositionSchema = z.object({
  params: z.object({
    id: z.string().cuid("Invalid position ID"),
  }),
  body: z.object({
    code: z
      .string()
      .min(2, "Position code must be at least 2 characters")
      .max(20, "Position code cannot exceed 20 characters")
      .regex(/^[A-Z0-9_-]+$/i, "Position code must be alphanumeric")
      .optional(),
    title: z
      .string()
      .min(2, "Position title must be at least 2 characters")
      .max(100, "Position title cannot exceed 100 characters")
      .optional(),
    departmentId: z.string().cuid("Invalid department ID").optional(),
    description: z.string().max(500, "Description cannot exceed 500 characters").optional().nullable(),
    jobLevel: z.string().max(50, "Job level cannot exceed 50 characters").optional().nullable(),
    minSalary: z.number().min(0, "Minimum salary must be non-negative").optional().nullable(),
    maxSalary: z.number().min(0, "Maximum salary must be non-negative").optional().nullable(),
    isActive: z.boolean().optional(),
  }).refine(
    (data) => {
      if (data.minSalary !== undefined && data.minSalary !== null && data.maxSalary !== undefined && data.maxSalary !== null) {
        return data.maxSalary >= data.minSalary;
      }
      return true;
    },
    {
      message: "Maximum salary must be greater than or equal to minimum salary",
      path: ["maxSalary"],
    }
  ),
});

export const positionIdParamSchema = z.object({
  params: z.object({
    id: z.string().cuid("Invalid position ID"),
  }),
});

export const getPositionsQuerySchema = z.object({
  query: z.object({
    page: z.string().optional().transform((val) => (val ? Math.max(1, parseInt(val, 10)) : 1)),
    limit: z.string().optional().transform((val) => (val ? Math.min(100, Math.max(1, parseInt(val, 10))) : 10)),
    search: z.string().optional(),
    departmentId: z.string().optional(),
    jobLevel: z.string().optional(),
    isActive: z.string().optional().transform((val) => (val === "true" ? true : val === "false" ? false : undefined)),
    sortBy: z.enum(["title", "code", "jobLevel", "createdAt", "updatedAt"]).optional().default("title"),
    sortOrder: z.enum(["asc", "desc"]).optional().default("asc"),
  }),
});

export type CreatePositionInput = z.infer<typeof createPositionSchema>["body"];
export type UpdatePositionInput = z.infer<typeof updatePositionSchema>["body"];
export type GetPositionsQuery = z.infer<typeof getPositionsQuerySchema>["query"];
