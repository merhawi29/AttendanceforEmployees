import prisma from "../config/database";
import { PerformanceRating, GoalStatus, GoalProgressAction, Prisma } from "@prisma/client";
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
  note?: string;
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

    const progress = Math.max(0, Math.min(100, data.progressPercentage ?? 0));
    let status = data.status || GoalStatus.NOT_STARTED;

    // Direct creation at 100% via admin/manager sets COMPLETED, but status is sanitized if invalid
    if (progress === 100 && status !== GoalStatus.COMPLETED) {
      status = GoalStatus.COMPLETION_REQUESTED;
    } else if (progress > 0 && status === GoalStatus.NOT_STARTED) {
      status = GoalStatus.IN_PROGRESS;
    }

    const goal = await prisma.performanceGoal.create({
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
        progressHistories: {
          include: {
            submittedBy: { select: { id: true, name: true, role: true, employeeId: true } },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (progress > 0) {
      await prisma.goalProgressHistory.create({
        data: {
          goalId: goal.id,
          submittedById: data.employeeId,
          previousProgress: 0,
          newProgress: progress,
          note: "Initial goal creation",
          action: progress === 100 ? GoalProgressAction.COMPLETION_REQUESTED : GoalProgressAction.PROGRESS_UPDATE,
        },
      });
    }

    return this.getGoalById(goal.id);
  },

  async updateGoal(goalId: string, data: UpdateGoalInput, currentUserId?: string, userRole?: string) {
    const goal = await prisma.performanceGoal.findUnique({ where: { id: goalId } });
    if (!goal) {
      throw new AppError(404, "Performance goal not found", undefined, "GOAL_NOT_FOUND");
    }

    if (userRole === "EMPLOYEE") {
      if (goal.employeeId !== currentUserId) {
        throw new AppError(403, "You can only update your own goals", undefined, "FORBIDDEN");
      }
      // Employees cannot edit title, description, or targetDate configuration
      if (data.title !== undefined || data.description !== undefined || data.targetDate !== undefined) {
        throw new AppError(403, "Employees are not allowed to edit goal configuration (title, description, target date)", undefined, "FORBIDDEN");
      }
    }

    const updateData: Prisma.PerformanceGoalUpdateInput = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.targetDate !== undefined) updateData.targetDate = new Date(data.targetDate);

    const prevProgress = goal.progressPercentage;
    let newProgress = data.progressPercentage !== undefined ? data.progressPercentage : prevProgress;
    newProgress = Math.max(0, Math.min(100, newProgress));
    updateData.progressPercentage = newProgress;

    let status = data.status ?? goal.status;
    let historyAction: GoalProgressAction = GoalProgressAction.PROGRESS_UPDATE;

    if (userRole === "EMPLOYEE") {
      // Employees CANNOT mark a goal COMPLETED directly
      if (newProgress === 100) {
        status = GoalStatus.COMPLETION_REQUESTED;
        historyAction = GoalProgressAction.COMPLETION_REQUESTED;
      } else if (newProgress > 0 && (status === GoalStatus.NOT_STARTED || status === GoalStatus.COMPLETION_REQUESTED)) {
        status = GoalStatus.IN_PROGRESS;
      } else if (data.status === GoalStatus.COMPLETED) {
        throw new AppError(403, "Employees cannot directly mark a goal as COMPLETED. Submit 100% to request completion.", undefined, "FORBIDDEN");
      }
    } else {
      // Managers / Admins
      if (newProgress === 100 && status !== GoalStatus.COMPLETED) {
        status = GoalStatus.COMPLETED;
      } else if (newProgress > 0 && status === GoalStatus.NOT_STARTED) {
        status = GoalStatus.IN_PROGRESS;
      }
    }

    updateData.status = status;

    const updatedGoal = await prisma.performanceGoal.update({
      where: { id: goalId },
      data: updateData,
    });

    if (data.progressPercentage !== undefined || data.note) {
      await prisma.goalProgressHistory.create({
        data: {
          goalId,
          submittedById: currentUserId || goal.employeeId,
          previousProgress: prevProgress,
          newProgress,
          note: data.note || null,
          action: historyAction,
        },
      });
    }

    return this.getGoalById(goalId);
  },

  async updateGoalProgress(
    goalId: string,
    progressPercentage: number,
    note?: string,
    currentUserId?: string,
    userRole?: string
  ) {
    if (progressPercentage < 0 || progressPercentage > 100) {
      throw new AppError(400, "Progress percentage must be between 0 and 100", undefined, "VALIDATION_ERROR");
    }

    return this.updateGoal(
      goalId,
      { progressPercentage, note },
      currentUserId,
      userRole
    );
  },

  async reviewGoalCompletion(
    goalId: string,
    action: "APPROVE" | "REJECT",
    feedback?: string,
    reviewerId?: string,
    reviewerRole?: string
  ) {
    if (!reviewerId || (reviewerRole !== "ADMIN" && reviewerRole !== "MANAGER" && reviewerRole !== "HR_MANAGER")) {
      throw new AppError(403, "Only Managers and Admins can review goal completion requests", undefined, "FORBIDDEN");
    }

    const goal = await prisma.performanceGoal.findUnique({
      where: { id: goalId },
      include: {
        employee: {
          select: { id: true, name: true, employeeId: true, department: true, departmentId: true, managerId: true },
        },
      },
    });

    if (!goal) {
      throw new AppError(404, "Performance goal not found", undefined, "GOAL_NOT_FOUND");
    }

    // Verify Manager Authorization for the employee's goal
    if (reviewerRole === "MANAGER") {
      const reviewer = await prisma.user.findUnique({
        where: { id: reviewerId },
        select: { id: true, department: true, departmentId: true },
      });

      const isDirectManager = goal.employee.managerId === reviewerId;
      const isSameDepartment =
        (reviewer?.departmentId && goal.employee.departmentId === reviewer.departmentId) ||
        (reviewer?.department && goal.employee.department === reviewer.department);

      if (!isDirectManager && !isSameDepartment) {
        throw new AppError(
          403,
          "You are only authorized to review goal completion requests for employees in your department or direct management line.",
          undefined,
          "FORBIDDEN"
        );
      }
    }

    const prevProgress = goal.progressPercentage;
    let nextStatus: GoalStatus;
    let nextProgress: number;
    let historyAction: GoalProgressAction;

    if (action === "APPROVE") {
      nextStatus = GoalStatus.COMPLETED;
      nextProgress = 100;
      historyAction = GoalProgressAction.APPROVED;
    } else {
      nextStatus = GoalStatus.IN_PROGRESS;
      nextProgress = goal.progressPercentage;
      historyAction = GoalProgressAction.REJECTED;
    }

    await prisma.performanceGoal.update({
      where: { id: goalId },
      data: {
        status: nextStatus,
        progressPercentage: nextProgress,
      },
    });

    await prisma.goalProgressHistory.create({
      data: {
        goalId,
        submittedById: reviewerId,
        previousProgress: prevProgress,
        newProgress: nextProgress,
        note: null,
        action: historyAction,
        feedback: feedback || null,
      },
    });

    return this.getGoalById(goalId);
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

  async getGoalById(goalId: string) {
    const goal = await prisma.performanceGoal.findUnique({
      where: { id: goalId },
      include: {
        employee: {
          select: { id: true, name: true, employeeId: true, department: true, role: true },
        },
        progressHistories: {
          include: {
            submittedBy: { select: { id: true, name: true, role: true, employeeId: true } },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!goal) {
      throw new AppError(404, "Performance goal not found", undefined, "GOAL_NOT_FOUND");
    }

    return goal;
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
        progressHistories: {
          include: {
            submittedBy: { select: { id: true, name: true, role: true, employeeId: true } },
          },
          orderBy: { createdAt: "desc" },
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
