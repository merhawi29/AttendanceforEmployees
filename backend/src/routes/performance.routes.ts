import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth.middleware";
import {
  createGoal,
  updateGoal,
  updateGoalProgress,
  deleteGoal,
  getGoals,
  createReview,
  updateReview,
  deleteReview,
  getReviews,
  getReviewById,
  getDashboardAnalytics,
  getTopPerformers,
  getDepartmentRankings,
  getPerformanceTrends,
} from "../controllers/performance.controller";
import { Role } from "../types";

const router = Router();

router.use(authenticate);

// Goals
router.get("/goals", getGoals);
router.post("/goals", createGoal);
router.patch("/goals/:goalId", updateGoal);
router.patch("/goals/:goalId/progress", updateGoalProgress);
router.delete("/goals/:goalId", deleteGoal);

// Reviews
router.get("/reviews", getReviews);
router.get("/reviews/:reviewId", getReviewById);
router.post("/reviews", authorize(Role.ADMIN), createReview);
router.patch("/reviews/:reviewId", authorize(Role.ADMIN), updateReview);
router.delete("/reviews/:reviewId", authorize(Role.ADMIN), deleteReview);

// Analytics & Reports
router.get("/analytics", authorize(Role.ADMIN), getDashboardAnalytics);
router.get("/top-performers", authorize(Role.ADMIN), getTopPerformers);
router.get("/department-rankings", authorize(Role.ADMIN), getDepartmentRankings);
router.get("/trends", authorize(Role.ADMIN), getPerformanceTrends);

export default router;
