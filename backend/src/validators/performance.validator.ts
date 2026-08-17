import { z } from "zod";

export const createGoalSchema = z.object({
  employeeId: z.string().min(1, "Employee ID is required"),
  title: z.string().min(2, "Goal title must be at least 2 characters").max(255),
  description: z.string().optional(),
  targetDate: z.string().min(1, "Target date is required"),
  progressPercentage: z.number().min(0).max(100).optional().default(0),
  status: z.enum(["NOT_STARTED", "IN_PROGRESS", "COMPLETED", "CANCELLED"]).optional().default("NOT_STARTED"),
});

export const updateGoalSchema = z.object({
  title: z.string().min(2).max(255).optional(),
  description: z.string().optional(),
  targetDate: z.string().optional(),
  progressPercentage: z.number().min(0).max(100).optional(),
  status: z.enum(["NOT_STARTED", "IN_PROGRESS", "COMPLETED", "CANCELLED"]).optional(),
});

export const updateGoalProgressSchema = z.object({
  progressPercentage: z.number().min(0, "Progress cannot be negative").max(100, "Progress cannot exceed 100%"),
  status: z.enum(["NOT_STARTED", "IN_PROGRESS", "COMPLETED", "CANCELLED"]).optional(),
});

export const createReviewSchema = z.object({
  employeeId: z.string().min(1, "Employee ID is required"),
  reviewDate: z.string().optional(),
  overallScore: z.number().min(0, "Score cannot be negative").max(100, "Score cannot exceed 100"),
  rating: z.enum(["OUTSTANDING", "VERY_GOOD", "GOOD", "FAIR", "POOR"]).optional(),
  strengths: z.string().optional(),
  weaknesses: z.string().optional(),
  comments: z.string().optional(),
  recommendation: z.string().optional(),
});

export const updateReviewSchema = z.object({
  reviewDate: z.string().optional(),
  overallScore: z.number().min(0).max(100).optional(),
  rating: z.enum(["OUTSTANDING", "VERY_GOOD", "GOOD", "FAIR", "POOR"]).optional(),
  strengths: z.string().optional(),
  weaknesses: z.string().optional(),
  comments: z.string().optional(),
  recommendation: z.string().optional(),
});
