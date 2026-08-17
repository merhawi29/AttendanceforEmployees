import { z } from "zod";

export const createHolidaySchema = z.object({
  body: z.object({
    name: z.string().min(2, "Name must be at least 2 characters").max(150),
    description: z.string().max(500).optional().nullable(),
    holidayDate: z.string().refine((val) => !isNaN(Date.parse(val)), "Invalid holiday date"),
    holidayType: z.enum(["PUBLIC", "COMPANY", "REGIONAL"]).default("PUBLIC"),
    isRecurring: z.boolean().optional().default(false),
    isActive: z.boolean().optional().default(true),
  }),
});

export const updateHolidaySchema = z.object({
  params: z.object({
    id: z.string().cuid("Invalid holiday ID"),
  }),
  body: z.object({
    name: z.string().min(2).max(150).optional(),
    description: z.string().max(500).optional().nullable(),
    holidayDate: z.string().refine((val) => !isNaN(Date.parse(val)), "Invalid holiday date").optional(),
    holidayType: z.enum(["PUBLIC", "COMPANY", "REGIONAL"]).optional(),
    isRecurring: z.boolean().optional(),
    isActive: z.boolean().optional(),
  }),
});

export const holidayIdParamSchema = z.object({
  params: z.object({
    id: z.string().cuid("Invalid holiday ID"),
  }),
});

export const getHolidaysQuerySchema = z.object({
  query: z.object({
    page: z.string().optional().transform((val) => (val ? Math.max(1, parseInt(val, 10)) : 1)),
    limit: z.string().optional().transform((val) => (val ? Math.min(100, Math.max(1, parseInt(val, 10))) : 10)),
    year: z.string().optional().transform((val) => (val ? parseInt(val, 10) : undefined)),
    type: z.enum(["PUBLIC", "COMPANY", "REGIONAL"]).optional(),
    search: z.string().optional(),
    isActive: z.string().optional().transform((val) => (val !== undefined ? val === "true" : undefined)),
    sortBy: z.enum(["holidayDate", "name", "createdAt"]).optional().default("holidayDate"),
    sortOrder: z.enum(["asc", "desc"]).optional().default("asc"),
  }),
});

export type CreateHolidayInput = z.infer<typeof createHolidaySchema>["body"];
export type UpdateHolidayInput = z.infer<typeof updateHolidaySchema>["body"];
export type GetHolidaysQuery = z.infer<typeof getHolidaysQuerySchema>["query"];
