import { z } from "zod";
import { OvertimeCategory, OvertimeStatus } from "@prisma/client";

export const createOvertimeSchema = z.object({
  date: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid date format. Expected YYYY-MM-DD",
  }),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: "Invalid start time format. Expected HH:MM (24-hour)",
  }),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: "Invalid end time format. Expected HH:MM (24-hour)",
  }),
  category: z.nativeEnum(OvertimeCategory).default(OvertimeCategory.NORMAL_DAY),
  reason: z.string().min(3, "Reason must be at least 3 characters long").max(1000, "Reason is too long"),
});

export const managerApprovalSchema = z.object({
  action: z.enum(["APPROVE", "REJECT"]),
  comment: z.string().max(500, "Comment must not exceed 500 characters").optional().nullable(),
});

export const adminApprovalSchema = z.object({
  action: z.enum(["APPROVE", "REJECT"]),
  comment: z.string().max(500, "Comment must not exceed 500 characters").optional().nullable(),
});

export const overtimeIdParamSchema = z.object({
  id: z.string().min(1, "Overtime request ID is required"),
});

export const getOvertimeRequestsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  status: z.nativeEnum(OvertimeStatus).optional(),
  departmentId: z.string().optional(),
  userId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  search: z.string().optional(),
  sortBy: z.enum(["date", "createdAt", "totalHours"]).default("date"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type CreateOvertimeInput = z.infer<typeof createOvertimeSchema>;
export type ManagerApprovalInput = z.infer<typeof managerApprovalSchema>;
export type AdminApprovalInput = z.infer<typeof adminApprovalSchema>;
export type GetOvertimeRequestsQuery = z.infer<typeof getOvertimeRequestsQuerySchema>;
