import { z } from "zod";
import { normalizeTimeValue } from "../utils/time-format";

const timeFieldSchema = z
  .string()
  .trim()
  .transform((value) => normalizeTimeValue(value))
  .refine((value) => /^\d{2}:\d{2}$/.test(value), "Format must be HH:MM");

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password must be at most 128 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number");

const ipv4Regex =
  /^(?:(?:25[0-5]|2[0-4]\d|[01]?\d?\d)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d?\d)$/;
const ipv6Regex = /^([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}$/;

export const ipAddressSchema = z
  .string()
  .trim()
  .refine(
    (value) => ipv4Regex.test(value) || ipv6Regex.test(value) || value === "localhost",
    "Invalid IP address format"
  );

export const cuidSchema = z.string().min(1).max(191);

export const loginSchema = z.object({
  body: z.object({
    email: z.string().trim().email("Invalid email address").max(255),
    password: z.string().min(1, "Password is required").max(128),
  }),
});

export const registerSchema = z.object({
  body: z
    .object({
      email: z.string().trim().email("Invalid email address").max(255),
      password: passwordSchema,
      name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
      employeeCode: z.string().trim().min(2).max(50).optional(),
      employeeId: z.string().trim().min(2).max(50).optional(),
      department: z.string().trim().min(1, "Department is required").max(100),
      role: z.enum(["EMPLOYEE"]).optional(),
    })
    .refine((data) => data.employeeCode || data.employeeId, {
      message: "Employee code is required",
      path: ["employeeCode"],
    }),
});

export const refreshSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1).optional(),
  }),
});

export const attendanceActionSchema = z.object({
  body: z.object({
    punch: z.enum(["MORNING_IN", "LUNCH_OUT", "LUNCH_RETURN", "FINAL_OUT"]),
  }),
});

export const dateQuerySchema = z.object({
  query: z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD").optional(),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    userId: cuidSchema.optional(),
  }),
});

export const allowedIpSchema = z.object({
  body: z.object({
    ipAddress: ipAddressSchema,
    description: z.string().trim().max(255).optional(),
  }),
});

export const toggleIpSchema = z.object({
  params: z.object({
    id: cuidSchema,
  }),
  body: z.object({
    isActive: z.boolean(),
  }),
});

export const updateUserSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(100).optional(),
    department: z.string().trim().min(1).max(100).optional(),
    isActive: z.boolean().optional(),
    role: z.enum(["ADMIN", "EMPLOYEE"]).optional(),
  }),
  params: z.object({
    id: cuidSchema,
  }),
});

export const idParamSchema = z.object({
  params: z.object({
    id: cuidSchema,
  }),
});

export const adminResetPasswordSchema = z.object({
  body: z.object({
    userId: cuidSchema,
    newPassword: passwordSchema,
  }),
});

export const changePasswordSchema = z.object({
  body: z.object({
    oldPassword: z.string().min(1, "Old password is required"),
    newPassword: passwordSchema,
  }),
});

export const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string().trim().email("Invalid email address"),
  }),
});

export const resetPasswordSchema = z.object({
  body: z.object({
    token: z.string().min(1, "Token is required"),
    newPassword: passwordSchema,
  }),
});

export const settingsSchema = z.object({
  body: z.object({
    morningCheckInStart: timeFieldSchema,
    morningCheckInEnd: timeFieldSchema,
    lunchStartTime: timeFieldSchema,
    lunchReturnDeadline: timeFieldSchema,
    workEndTime: timeFieldSchema,
    gracePeriodMinutes: z.coerce.number().int().min(0).max(120),
  }),
});

export const registerDeviceSchema = z.object({
  body: z.object({
    deviceId: z.string().min(1, "Device ID is required").max(255),
    deviceName: z.string().trim().max(255).optional(),
    browser: z.string().trim().max(100).optional(),
    operatingSystem: z.string().trim().max(100).optional(),
    userAgent: z.string().trim().max(500).optional(),
  }),
});

export const approveDeviceSchema = z.object({
  params: z.object({
    id: cuidSchema,
  }),
  body: z.object({
    isApproved: z.boolean(),
  }),
});

export const adminEditAttendanceSchema = z.object({
  body: z.object({
    morningIn: z.string().nullable().optional(),
    lunchOut: z.string().nullable().optional(),
    lunchReturn: z.string().nullable().optional(),
    finalOut: z.string().nullable().optional(),
    status: z.enum(["PRESENT", "LATE", "ABSENT", "HALF_DAY", "LUNCH_MISSING"]).nullable().optional(),
  }),
  params: z.object({
    id: cuidSchema,
  }),
});

