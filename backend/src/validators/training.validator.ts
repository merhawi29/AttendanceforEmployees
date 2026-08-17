import { z } from "zod";

export const createProgramSchema = z.object({
  code: z.string().min(2, "Program code is required").max(50),
  title: z.string().min(2, "Program title is required").max(150),
  description: z.string().min(5, "Description is required"),
  category: z.string().optional().default("Technical"),
  trainerName: z.string().optional(),
  location: z.string().optional(),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  capacity: z.number().min(1).optional().default(20),
  status: z.enum(["UPCOMING", "IN_PROGRESS", "COMPLETED", "CANCELLED"]).optional().default("UPCOMING"),
});

export const updateProgramSchema = z.object({
  code: z.string().min(2).max(50).optional(),
  title: z.string().min(2).max(150).optional(),
  description: z.string().min(5).optional(),
  category: z.string().optional(),
  trainerName: z.string().optional(),
  location: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  capacity: z.number().min(1).optional(),
  status: z.enum(["UPCOMING", "IN_PROGRESS", "COMPLETED", "CANCELLED"]).optional(),
});

export const enrollEmployeeSchema = z.object({
  trainingProgramId: z.string().min(1, "Training Program ID is required"),
  employeeId: z.string().min(1, "Employee ID is required"),
  status: z.enum(["ENROLLED", "IN_PROGRESS", "COMPLETED", "DROPPED", "FAILED"]).optional().default("ENROLLED"),
  notes: z.string().optional(),
});

export const updateEnrollmentSchema = z.object({
  status: z.enum(["ENROLLED", "IN_PROGRESS", "COMPLETED", "DROPPED", "FAILED"]).optional(),
  score: z.number().min(0).max(100).optional(),
  certificateUrl: z.string().optional(),
  certificateNo: z.string().optional(),
  issueDate: z.string().optional(),
  feedback: z.string().optional(),
});
