import prisma from "../config/database";
import { PerformanceRating, GoalStatus, Prisma } from "@prisma/client";
import { AppError } from "../utils/response";

export interface CreateGoalInput {
  employeeId: string;
  title: string;
  description?: string;
  targetDate: string;
  progressPercentage?: number;
  status?: GoalStatus;
}

export interface UpdateGoalInput {
  title?: string;
  description?: string;
  targetDate?: string;
  progressPercentage?: number;
  status?: GoalStatus;
}

export interface CreateReviewInput {
  employeeId: string;
  reviewerId: string;
  reviewDate?: string;
  overallScore: number;
  rating?: PerformanceRating;
  strengths?: string;
  weaknesses?: string;
  comments?: string;
  recommendation?: string;
}

export interface UpdateReviewInput {
  reviewDate?: string;
  overallScore?: number;
  rating?: PerformanceRating;
  strengths?: string;
  weaknesses?: string;
  comments?: string;
  recommendation?: string;
}

function calculateRating(score: number): PerformanceRating {
  if (score >= 90) return PerformanceRating.OUTSTANDING;
  if (score >= 80) return PerformanceRating.VERY_GOOD;
  if (score >= 70) return PerformanceRating.GOOD;
  if (score >= 60) return PerformanceRating.FAIR;
  return PerformanceRating.POOR;
}

export const performanceService = {
  // --- GOALS SERVICE ---
  async createGoal(data: CreateGoalInput) {
    const employee = await prisma.user.findUnique({
      where: { id: data.employeeId },
    });
    if (!employee) {
      throw new AppError(404, "Employee not found", undefined, "USER_NOT_FOUND");
    }

    const progress = data.progressPercentage ?? 0;
    let status = data.status || GoalStatus.NOT_STARTED;
    if (progress === 100) {
      status = GoalStatus.COMPLETED;
    } else if (progress > 0 && status === GoalStatus.NOT_STARTED) {
      status = GoalStatus.IN_PROGRESS;
    }

    return prisma.performanceGoal.create({
      data: {
        employeeId: data.employeeId,
        title: data.title,
        description: data.description || null,
        targetDate: new Date(data.targetDate),
        progressPercentage: progress,
        status,
      },
      include: {
        employee: {
          select: { id: true, name: true, employeeId: true, department: true, role: true },
        },
      },
    });
  },

  async updateGoal(goalId: string, data: UpdateGoalInput, currentUserId?: string, userRole?: string) {
    const goal = await prisma.performanceGoal.findUnique({ where: { id: goalId } });
    if (!goal) {
      throw new AppError(404, "Performance goal not found", undefined, "GOAL_NOT_FOUND");
    }

    if (userRole === "EMPLOYEE" && goal.employeeId !== currentUserId) {
      throw new AppError(403, "You can only update your own goals", undefined, "FORBIDDEN");
    }

    const updateData: Prisma.PerformanceGoalUpdateInput = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.targetDate !== undefined) updateData.targetDate = new Date(data.targetDate);

    let progress = data.progressPercentage ?? goal.progressPercentage;
    if (data.progressPercentage !== undefined) {
      updateData.progressPercentage = data.progressPercentage;
    }

    let status = data.status ?? goal.status;
    if (progress === 100) {
      status = GoalStatus.COMPLETED;
    } else if (progress > 0 && status === GoalStatus.NOT_STARTED) {
      status = GoalStatus.IN_PROGRESS;
    }
    updateData.status = status;

    return prisma.performanceGoal.update({
      where: { id: goalId },
      data: updateData,
      include: {
        employee: {
          select: { id: true, name: true, employeeId: true, department: true, role: true },
        },
      },
    });
  },

  async updateGoalProgress(goalId: string, progressPercentage: number, status?: GoalStatus, currentUserId?: string, userRole?: string) {
    return this.updateGoal(goalId, { progressPercentage, status }, currentUserId, userRole);
  },

  async deleteGoal(goalId: string, currentUserId?: string, userRole?: string) {
    const goal = await prisma.performanceGoal.findUnique({ where: { id: goalId } });
    if (!goal) {
      throw new AppError(404, "Performance goal not found", undefined, "GOAL_NOT_FOUND");
    }

    if (userRole === "EMPLOYEE" && goal.employeeId !== currentUserId) {
      throw new AppError(403, "You can only delete your own goals", undefined, "FORBIDDEN");
    }

    return prisma.performanceGoal.delete({ where: { id: goalId } });
  },

  async getGoals(query: { employeeId?: string; status?: GoalStatus; department?: string; search?: string }) {
    const where: Prisma.PerformanceGoalWhereInput = {};

    if (query.employeeId) {
      where.employeeId = query.employeeId;
    }

    if (query.status) {
      where.status = query.status;
    }

    if (query.department) {
      where.employee = { department: query.department };
    }

    if (query.search) {
      where.OR = [
        { title: { contains: query.search } },
        { description: { contains: query.search } },
        { employee: { name: { contains: query.search } } },
      ];
    }

    return prisma.performanceGoal.findMany({
      where,
      include: {
        employee: {
          select: { id: true, name: true, employeeId: true, department: true, role: true },
        },
      },
      orderBy: { targetDate: "asc" },
    });
  },

  // --- REVIEWS SERVICE ---
  async createReview(data: CreateReviewInput) {
    const employee = await prisma.user.findUnique({ where: { id: data.employeeId } });
    if (!employee) {
      throw new AppError(404, "Employee not found", undefined, "USER_NOT_FOUND");
    }

    const reviewer = await prisma.user.findUnique({ where: { id: data.reviewerId } });
    if (!reviewer) {
      throw new AppError(404, "Reviewer not found", undefined, "REVIEWER_NOT_FOUND");
    }

    const rating = data.rating || calculateRating(data.overallScore);
    const reviewDate = data.reviewDate ? new Date(data.reviewDate) : new Date();

    return prisma.performanceReview.create({
      data: {
        employeeId: data.employeeId,
        reviewerId: data.reviewerId,
        reviewDate,
        overallScore: data.overallScore,
        rating,
        strengths: data.strengths || null,
        weaknesses: data.weaknesses || null,
        comments: data.comments || null,
        recommendation: data.recommendation || null,
      },
      include: {
        employee: {
          select: { id: true, name: true, employeeId: true, department: true, role: true },
        },
        reviewer: {
          select: { id: true, name: true, employeeId: true, role: true },
        },
      },
    });
  },

  async updateReview(reviewId: string, data: UpdateReviewInput) {
    const review = await prisma.performanceReview.findUnique({ where: { id: reviewId } });
    if (!review) {
      throw new AppError(404, "Performance review not found", undefined, "REVIEW_NOT_FOUND");
    }

    const updateData: Prisma.PerformanceReviewUpdateInput = {};
    if (data.reviewDate !== undefined) updateData.reviewDate = new Date(data.reviewDate);
    if (data.overallScore !== undefined) {
      updateData.overallScore = data.overallScore;
      updateData.rating = data.rating || calculateRating(data.overallScore);
    } else if (data.rating !== undefined) {
      updateData.rating = data.rating;
    }
    if (data.strengths !== undefined) updateData.strengths = data.strengths;
    if (data.weaknesses !== undefined) updateData.weaknesses = data.weaknesses;
    if (data.comments !== undefined) updateData.comments = data.comments;
    if (data.recommendation !== undefined) updateData.recommendation = data.recommendation;

    return prisma.performanceReview.update({
      where: { id: reviewId },
      data: updateData,
      include: {
        employee: {
          select: { id: true, name: true, employeeId: true, department: true, role: true },
        },
        reviewer: {
          select: { id: true, name: true, employeeId: true, role: true },
        },
      },
    });
  },

  async deleteReview(reviewId: string) {
    const review = await prisma.performanceReview.findUnique({ where: { id: reviewId } });
    if (!review) {
      throw new AppError(404, "Performance review not found", undefined, "REVIEW_NOT_FOUND");
    }
    return prisma.performanceReview.delete({ where: { id: reviewId } });
  },

  async getReviews(query: { employeeId?: string; rating?: PerformanceRating; department?: string; search?: string }) {
    const where: Prisma.PerformanceReviewWhereInput = {};

    if (query.employeeId) {
      where.employeeId = query.employeeId;
    }

    if (query.rating) {
      where.rating = query.rating;
    }

    if (query.department) {
      where.employee = { department: query.department };
    }

    if (query.search) {
      where.OR = [
        { employee: { name: { contains: query.search } } },
        { comments: { contains: query.search } },
        { strengths: { contains: query.search } },
      ];
    }

    return prisma.performanceReview.findMany({
      where,
      include: {
        employee: {
          select: { id: true, name: true, employeeId: true, department: true, role: true },
        },
        reviewer: {
          select: { id: true, name: true, employeeId: true, role: true },
        },
      },
      orderBy: { reviewDate: "desc" },
    });
  },

  async getReviewById(reviewId: string) {
    const review = await prisma.performanceReview.findUnique({
      where: { id: reviewId },
      include: {
        employee: {
          select: { id: true, name: true, employeeId: true, department: true, role: true },
        },
        reviewer: {
          select: { id: true, name: true, employeeId: true, role: true },
        },
      },
    });

    if (!review) {
      throw new AppError(404, "Performance review not found", undefined, "REVIEW_NOT_FOUND");
    }

    return review;
  },

  // --- ANALYTICS & DASHBOARD ---
  async getDashboardAnalytics() {
    const totalReviews = await prisma.performanceReview.count();
    const totalGoals = await prisma.performanceGoal.count();
    const completedGoals = await prisma.performanceGoal.count({
      where: { status: GoalStatus.COMPLETED },
    });

    const reviews = await prisma.performanceReview.findMany({
      select: { overallScore: true, rating: true },
    });

    const avgScore = reviews.length
      ? Math.round((reviews.reduce((acc, r) => acc + r.overallScore, 0) / reviews.length) * 10) / 10
      : 0;

    const ratingDistribution: Record<PerformanceRating, number> = {
      OUTSTANDING: 0,
      VERY_GOOD: 0,
      GOOD: 0,
      FAIR: 0,
      POOR: 0,
    };

    reviews.forEach((r) => {
      if (ratingDistribution[r.rating] !== undefined) {
        ratingDistribution[r.rating]++;
      }
    });

    const goalCompletionRate = totalGoals ? Math.round((completedGoals / totalGoals) * 100) : 0;

    // Top Department Rankings
    const departmentRankings = await this.getDepartmentRankings();

    // Top Performers
    const topPerformers = await this.getTopPerformers(5);

    // Promotion recommendations count
    const promotionRecommendations = await prisma.performanceReview.count({
      where: {
        OR: [
          { recommendation: { contains: "PROMOTION" } },
          { rating: PerformanceRating.OUTSTANDING },
        ],
      },
    });

    return {
      totalReviews,
      totalGoals,
      completedGoals,
      goalCompletionRate,
      avgScore,
      ratingDistribution,
      departmentRankings,
      topPerformers,
      promotionRecommendations,
    };
  },

  async getTopPerformers(limit = 10) {
    const reviews = await prisma.performanceReview.findMany({
      take: limit * 2,
      include: {
        employee: {
          select: { id: true, name: true, employeeId: true, department: true, avatarUrl: true },
        },
      },
      orderBy: { overallScore: "desc" },
    });

    // Deduplicate by employeeId keeping highest review
    const seen = new Set<string>();
    const top: Array<typeof reviews[0]> = [];

    for (const r of reviews) {
      if (!seen.has(r.employeeId)) {
        seen.add(r.employeeId);
        top.push(r);
      }
      if (top.length >= limit) break;
    }

    return top;
  },

  async getDepartmentRankings() {
    const reviews = await prisma.performanceReview.findMany({
      include: {
        employee: {
          select: { department: true },
        },
      },
    });

    const deptMap: Record<string, { totalScore: number; count: number }> = {};

    reviews.forEach((r) => {
      const dept = r.employee?.department || "Unassigned";
      if (!deptMap[dept]) {
        deptMap[dept] = { totalScore: 0, count: 0 };
      }
      deptMap[dept].totalScore += r.overallScore;
      deptMap[dept].count += 1;
    });

    const rankings = Object.entries(deptMap).map(([department, data]) => ({
      department,
      avgScore: Math.round((data.totalScore / data.count) * 10) / 10,
      employeeCount: data.count,
    }));

    return rankings.sort((a, b) => b.avgScore - a.avgScore);
  },

  async getPerformanceTrends() {
    const reviews = await prisma.performanceReview.findMany({
      select: { reviewDate: true, overallScore: true },
      orderBy: { reviewDate: "asc" },
    });

    const monthMap: Record<string, { totalScore: number; count: number }> = {};

    reviews.forEach((r) => {
      const monthKey = new Date(r.reviewDate).toISOString().slice(0, 7); // YYYY-MM
      if (!monthMap[monthKey]) {
        monthMap[monthKey] = { totalScore: 0, count: 0 };
      }
      monthMap[monthKey].totalScore += r.overallScore;
      monthMap[monthKey].count += 1;
    });

    return Object.entries(monthMap).map(([month, data]) => ({
      month,
      avgScore: Math.round((data.totalScore / data.count) * 10) / 10,
      reviewCount: data.count,
    }));
  },
};
