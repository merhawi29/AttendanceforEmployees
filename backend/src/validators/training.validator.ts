import { z } from "zod";

export const createProgramSchema = z.object({
  code: z.string().min(2, "Program code is required").max(50),
  title: z.string().min(2, "Program title is required").max(150),
  description: z.string().optional().default("Corporate skill development course"),
  category: z.string().optional().default("Technical"),
  trainerName: z.string().optional(),
  location: z.string().optional(),
  materialsUrl: z.string().optional(),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  capacity: z.number().min(1).optional().default(20),
  status: z.enum(["OPEN", "CLOSED", "UPCOMING", "IN_PROGRESS", "COMPLETED", "CANCELLED"]).optional().default("OPEN"),
});

export const updateProgramSchema = z.object({
  code: z.string().min(2).max(50).optional(),
  title: z.string().min(2).max(150).optional(),
  description: z.string().min(5).optional(),
  category: z.string().optional(),
  trainerName: z.string().optional(),
  location: z.string().optional(),
  materialsUrl: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  capacity: z.number().min(1).optional(),
  status: z.enum(["OPEN", "CLOSED", "UPCOMING", "IN_PROGRESS", "COMPLETED", "CANCELLED"]).optional(),
});

export const enrollEmployeeSchema = z.object({
  trainingProgramId: z.string().min(1, "Training Program ID is required"),
  employeeId: z.string().min(1, "Employee ID is required"),
  status: z.enum(["PENDING", "APPROVED", "REJECTED", "COMPLETED", "ENROLLED", "IN_PROGRESS", "DROPPED", "FAILED"]).optional().default("APPROVED"),
  notes: z.string().optional(),
  remarks: z.string().optional(),
});

export const applyTrainingSchema = z.object({
  trainingProgramId: z.string().min(1, "Training Program ID is required"),
});

export const approveEnrollmentSchema = z.object({
  remarks: z.string().optional(),
});

export const rejectEnrollmentSchema = z.object({
  remarks: z.string().optional(),
});

export const completeEnrollmentSchema = z.object({
  score: z.number().min(0).max(100).optional(),
  certificateNo: z.string().optional(),
  certificateUrl: z.string().optional(),
  completionDate: z.string().optional(),
  feedback: z.string().optional(),
  remarks: z.string().optional(),
});

export const updateEnrollmentSchema = z.object({
  status: z.enum(["PENDING", "APPROVED", "REJECTED", "COMPLETED", "ENROLLED", "IN_PROGRESS", "DROPPED", "FAILED"]).optional(),
  score: z.number().min(0).max(100).optional(),
  certificateUrl: z.string().optional(),
  certificateNo: z.string().optional(),
  issueDate: z.string().optional(),
  feedback: z.string().optional(),
  remarks: z.string().optional(),
});
