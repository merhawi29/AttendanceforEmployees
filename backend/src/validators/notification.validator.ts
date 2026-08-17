import { z } from "zod";

export const broadcastNotificationSchema = z.object({
  title: z.string().min(2, "Title is required").max(150),
  message: z.string().min(5, "Message is required"),
  type: z.enum([
    "SYSTEM",
    "LEAVE",
    "OVERTIME",
    "ASSET",
    "TRAINING",
    "DOCUMENT",
    "PERFORMANCE",
    "ATS",
    "PAYROLL",
  ]).optional().default("SYSTEM"),
  link: z.string().optional(),
  targetRole: z.enum(["ALL", "ADMIN", "EMPLOYEE"]).optional().default("ALL"),
});

export const markReadSchema = z.object({
  isRead: z.boolean().optional().default(true),
});
