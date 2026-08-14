import { z } from "zod";

export const createLeaveTypeSchema = z.object({
  body: z.object({
    code: z
      .string()
      .min(2, "Leave type code must be at least 2 characters")
      .max(20, "Code cannot exceed 20 characters")
      .regex(/^[A-Z0-9_-]+$/i, "Code must be alphanumeric"),
    name: z.string().min(2, "Name must be at least 2 characters").max(100),
    description: z.string().max(500).optional().nullable(),
    defaultDaysPerYear: z.number().min(0, "Days per year must be non-negative").default(0),
    isPaid: z.boolean().optional().default(true),
    requiresApproval: z.boolean().optional().default(true),
    isActive: z.boolean().optional().default(true),
  }),
});

export const updateLeaveTypeSchema = z.object({
  params: z.object({
    id: z.string().cuid("Invalid leave type ID"),
  }),
  body: z.object({
    code: z.string().min(2).max(20).regex(/^[A-Z0-9_-]+$/i).optional(),
    name: z.string().min(2).max(100).optional(),
    description: z.string().max(500).optional().nullable(),
    defaultDaysPerYear: z.number().min(0).optional(),
    isPaid: z.boolean().optional(),
    requiresApproval: z.boolean().optional(),
    isActive: z.boolean().optional(),
  }),
});

export const createLeaveRequestSchema = z.object({
  body: z.object({
    leaveTypeId: z.string().cuid("Invalid leave type ID"),
    startDate: z.string().refine((val) => !isNaN(Date.parse(val)), "Invalid start date"),
    endDate: z.string().refine((val) => !isNaN(Date.parse(val)), "Invalid end date"),
    reason: z.string().min(3, "Please provide a reason for the leave request"),
  }),
});

export const managerApprovalSchema = z.object({
  params: z.object({
    id: z.string().cuid("Invalid leave request ID"),
  }),
  body: z.object({
    action: z.enum(["APPROVE", "REJECT"]),
    comment: z.string().optional().nullable(),
  }),
});

export const adminApprovalSchema = z.object({
  params: z.object({
    id: z.string().cuid("Invalid leave request ID"),
  }),
  body: z.object({
    action: z.enum(["APPROVE", "REJECT"]),
    comment: z.string().optional().nullable(),
  }),
});

export const leaveRequestIdParamSchema = z.object({
  params: z.object({
    id: z.string().cuid("Invalid leave request ID"),
  }),
});

export const getLeaveRequestsQuerySchema = z.object({
  query: z.object({
    page: z.string().optional().transform((val) => (val ? Math.max(1, parseInt(val, 10)) : 1)),
    limit: z.string().optional().transform((val) => (val ? Math.min(100, Math.max(1, parseInt(val, 10))) : 10)),
    status: z.enum(["PENDING", "APPROVED_BY_MANAGER", "APPROVED", "REJECTED", "CANCELLED"]).optional(),
    departmentId: z.string().optional(),
    leaveTypeId: z.string().optional(),
    userId: z.string().optional(),
    year: z.string().optional().transform((val) => (val ? parseInt(val, 10) : new Date().getFullYear())),
    search: z.string().optional(),
    sortBy: z.enum(["createdAt", "startDate", "status"]).optional().default("createdAt"),
    sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
  }),
});

export const updateLeaveBalanceSchema = z.object({
  body: z.object({
    userId: z.string().cuid("Invalid user ID"),
    leaveTypeId: z.string().cuid("Invalid leave type ID"),
    year: z.number().int().min(2000).max(2100),
    allocatedDays: z.number().min(0, "Allocated days must be non-negative"),
  }),
});

export type CreateLeaveTypeInput = z.infer<typeof createLeaveTypeSchema>["body"];
export type UpdateLeaveTypeInput = z.infer<typeof updateLeaveTypeSchema>["body"];
export type CreateLeaveRequestInput = z.infer<typeof createLeaveRequestSchema>["body"];
export type ManagerApprovalInput = z.infer<typeof managerApprovalSchema>["body"];
export type AdminApprovalInput = z.infer<typeof adminApprovalSchema>["body"];
export type GetLeaveRequestsQuery = z.infer<typeof getLeaveRequestsQuerySchema>["query"];
export type UpdateLeaveBalanceInput = z.infer<typeof updateLeaveBalanceSchema>["body"];
