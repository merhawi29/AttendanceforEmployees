export type PerformanceRating = "OUTSTANDING" | "VERY_GOOD" | "GOOD" | "FAIR" | "POOR";

export type GoalStatus = "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";

export interface PerformanceGoal {
  id: string;
  employeeId: string;
  title: string;
  description?: string | null;
  targetDate: string;
  progressPercentage: number;
  status: GoalStatus;
  createdAt: string;
  updatedAt: string;
  employee?: {
    id: string;
    name: string;
    employeeId: string;
    department?: string | null;
    role?: string;
  };
}

export interface PerformanceReview {
  id: string;
  employeeId: string;
  reviewerId: string;
  reviewDate: string;
  overallScore: number;
  rating: PerformanceRating;
  strengths?: string | null;
  weaknesses?: string | null;
  comments?: string | null;
  recommendation?: string | null;
  createdAt: string;
  updatedAt: string;
  employee?: {
    id: string;
    name: string;
    employeeId: string;
    department?: string | null;
    role?: string;
    avatarUrl?: string | null;
  };
  reviewer?: {
    id: string;
    name: string;
    employeeId: string;
    role?: string;
  };
}

export interface DepartmentRanking {
  department: string;
  avgScore: number;
  employeeCount: number;
}

export interface PerformanceTrend {
  month: string;
  avgScore: number;
  reviewCount: number;
}

export interface PerformanceAnalytics {
  totalReviews: number;
  totalGoals: number;
  completedGoals: number;
  goalCompletionRate: number;
  avgScore: number;
  ratingDistribution: Record<PerformanceRating, number>;
  departmentRankings: DepartmentRanking[];
  topPerformers: PerformanceReview[];
  promotionRecommendations: number;
}
