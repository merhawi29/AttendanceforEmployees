import { Response } from "express";
import { AuthRequest } from "../types";
import { performanceService } from "../services/performance.service";
import { asyncHandler, sendSuccess } from "../utils/response";
import {
  createGoalSchema,
  updateGoalSchema,
  updateGoalProgressSchema,
  reviewGoalCompletionSchema,
  createReviewSchema,
  updateReviewSchema,
} from "../validators/performance.validator";
import { GoalStatus, PerformanceRating } from "@prisma/client";

// --- GOAL CONTROLLERS ---
export const createGoal = asyncHandler(async (req: AuthRequest, res: Response) => {
  const validated = createGoalSchema.parse(req.body);
  const goal = await performanceService.createGoal(validated);
  sendSuccess(res, goal, "Performance goal created successfully", 201);
});

export const updateGoal = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { goalId } = req.params;
  const validated = updateGoalSchema.parse(req.body);
  const goal = await performanceService.updateGoal(
    goalId,
    validated,
    req.user?.userId,
    req.user?.role
  );
  sendSuccess(res, goal, "Performance goal updated successfully");
});

export const updateGoalProgress = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { goalId } = req.params;
  const validated = updateGoalProgressSchema.parse(req.body);
  const goal = await performanceService.updateGoalProgress(
    goalId,
    validated.progressPercentage,
    validated.note,
    req.user?.userId,
    req.user?.role
  );
  sendSuccess(res, goal, "Goal progress updated successfully");
});

export const reviewGoalCompletion = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { goalId } = req.params;
  const validated = reviewGoalCompletionSchema.parse(req.body);
  const goal = await performanceService.reviewGoalCompletion(
    goalId,
    validated.action,
    validated.feedback,
    req.user?.userId,
    req.user?.role
  );
  sendSuccess(res, goal, `Goal completion request ${validated.action === "APPROVE" ? "approved" : "rejected"} successfully`);
});

export const getGoalHistory = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { goalId } = req.params;
  const goal = await performanceService.getGoalById(goalId);
  sendSuccess(res, goal.progressHistories, "Goal progress history retrieved");
});

export const deleteGoal = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { goalId } = req.params;
  await performanceService.deleteGoal(goalId, req.user?.userId, req.user?.role);
  sendSuccess(res, null, "Performance goal deleted successfully");
});

export const getGoals = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { employeeId, status, department, search } = req.query;

  // If user is employee and no employeeId requested, default to self
  let targetEmployeeId = employeeId as string | undefined;
  if (req.user?.role === "EMPLOYEE" && !targetEmployeeId) {
    targetEmployeeId = req.user.userId;
  }

  const goals = await performanceService.getGoals({
    employeeId: targetEmployeeId,
    status: status as GoalStatus | undefined,
    department: department as string | undefined,
    search: search as string | undefined,
  });

  sendSuccess(res, goals, "Performance goals retrieved");
});

// --- REVIEW CONTROLLERS ---
export const createReview = asyncHandler(async (req: AuthRequest, res: Response) => {
  const validated = createReviewSchema.parse(req.body);
  const review = await performanceService.createReview({
    ...validated,
    reviewerId: req.user!.userId,
  });
  sendSuccess(res, review, "Performance review submitted successfully", 201);
});

export const updateReview = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { reviewId } = req.params;
  const validated = updateReviewSchema.parse(req.body);
  const review = await performanceService.updateReview(reviewId, validated);
  sendSuccess(res, review, "Performance review updated successfully");
});

export const deleteReview = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { reviewId } = req.params;
  await performanceService.deleteReview(reviewId);
  sendSuccess(res, null, "Performance review deleted successfully");
});

export const getReviews = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { employeeId, rating, department, search } = req.query;

  let targetEmployeeId = employeeId as string | undefined;
  if (req.user?.role === "EMPLOYEE" && !targetEmployeeId) {
    targetEmployeeId = req.user.userId;
  }

  const reviews = await performanceService.getReviews({
    employeeId: targetEmployeeId,
    rating: rating as PerformanceRating | undefined,
    department: department as string | undefined,
    search: search as string | undefined,
  });

  sendSuccess(res, reviews, "Performance reviews retrieved");
});

export const getReviewById = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { reviewId } = req.params;
  const review = await performanceService.getReviewById(reviewId);

  if (req.user?.role === "EMPLOYEE" && review.employeeId !== req.user.userId) {
    res.status(403).json({ success: false, message: "Forbidden" });
    return;
  }

  sendSuccess(res, review, "Performance review details retrieved");
});

// --- ANALYTICS CONTROLLERS ---
export const getDashboardAnalytics = asyncHandler(async (_req: AuthRequest, res: Response) => {
  const analytics = await performanceService.getDashboardAnalytics();
  sendSuccess(res, analytics, "Performance dashboard analytics retrieved");
});

export const getTopPerformers = asyncHandler(async (req: AuthRequest, res: Response) => {
  const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
  const performers = await performanceService.getTopPerformers(limit);
  sendSuccess(res, performers, "Top performers retrieved");
});

export const getDepartmentRankings = asyncHandler(async (_req: AuthRequest, res: Response) => {
  const rankings = await performanceService.getDepartmentRankings();
  sendSuccess(res, rankings, "Department rankings retrieved");
});

export const getPerformanceTrends = asyncHandler(async (_req: AuthRequest, res: Response) => {
  const trends = await performanceService.getPerformanceTrends();
  sendSuccess(res, trends, "Performance trends retrieved");
});
