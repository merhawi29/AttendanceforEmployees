import { z } from "zod";
import { PayrollStatus } from "@prisma/client";

export const upsertSalaryStructureSchema = z.object({
  body: z.object({
    userId: z.string().cuid("Invalid employee user ID"),
    basicSalary: z.number().min(0, "Basic salary must be non-negative").optional(),
    housingAllowance: z.number().min(0, "Housing allowance must be non-negative").optional(),
    transportAllowance: z.number().min(0, "Transport allowance must be non-negative").optional(),
    otherAllowance: z.number().min(0, "Other allowance must be non-negative").optional(),
    bonus: z.number().min(0, "Bonus must be non-negative").optional(),
    deduction: z.number().min(0, "Deduction must be non-negative").optional(),
  }),
});

export const generatePayrollSchema = z.object({
  body: z.object({
    month: z.number().int().min(1).max(12),
    year: z.number().int().min(2000).max(2100),
    departmentId: z.string().optional().nullable(),
    overwriteDrafts: z.boolean().optional().default(false),
  }),
});

export const getPayrollRecordsQuerySchema = z.object({
  query: z.object({
    page: z.string().optional().transform((val) => (val ? Math.max(1, parseInt(val, 10)) : 1)),
    limit: z.string().optional().transform((val) => (val ? Math.min(100, Math.max(1, parseInt(val, 10))) : 10)),
    month: z.string().optional().transform((val) => (val ? parseInt(val, 10) : undefined)),
    year: z.string().optional().transform((val) => (val ? parseInt(val, 10) : undefined)),
    departmentId: z.string().optional(),
    userId: z.string().optional(),
    status: z.nativeEnum(PayrollStatus).optional(),
    search: z.string().optional(),
    sortBy: z.enum(["createdAt", "month", "netSalary", "status"]).optional().default("createdAt"),
    sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
  }),
});

export const updatePayrollRecordSchema = z.object({
  params: z.object({
    id: z.string().cuid("Invalid payroll record ID"),
  }),
  body: z.object({
    basicSalary: z.number().min(0).optional(),
    housingAllowance: z.number().min(0).optional(),
    transportAllowance: z.number().min(0).optional(),
    otherAllowance: z.number().min(0).optional(),
    bonus: z.number().min(0).optional(),
    deduction: z.number().min(0).optional(),
    remarks: z.string().max(1000).optional().nullable(),
    status: z.nativeEnum(PayrollStatus).optional(),
  }),
});

export const batchUpdateStatusSchema = z.object({
  body: z.object({
    payrollIds: z.array(z.string().cuid("Invalid payroll record ID")).min(1, "Select at least one payroll record"),
    status: z.nativeEnum(PayrollStatus),
  }),
});

export const payrollReportQuerySchema = z.object({
  query: z.object({
    month: z.string().optional().transform((val) => (val ? parseInt(val, 10) : undefined)),
    year: z.string().optional().transform((val) => (val ? parseInt(val, 10) : new Date().getFullYear())),
    departmentId: z.string().optional(),
  }),
});

export type UpsertSalaryStructureInput = z.infer<typeof upsertSalaryStructureSchema>["body"];
export type GeneratePayrollInputBody = z.infer<typeof generatePayrollSchema>["body"];
export type GetPayrollRecordsQueryParsed = z.infer<typeof getPayrollRecordsQuerySchema>["query"];
export type UpdatePayrollRecordInputBody = z.infer<typeof updatePayrollRecordSchema>["body"];
export type BatchUpdateStatusInputBody = z.infer<typeof batchUpdateStatusSchema>["body"];
export type PayrollReportQueryParsed = z.infer<typeof payrollReportQuerySchema>["query"];
