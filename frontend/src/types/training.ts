export type TrainingStatus = "UPCOMING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";

export type EnrollmentStatus = "ENROLLED" | "IN_PROGRESS" | "COMPLETED" | "DROPPED" | "FAILED";

export interface TrainingProgram {
  id: string;
  code: string;
  title: string;
  description: string;
  category?: string | null;
  trainerName?: string | null;
  location?: string | null;
  startDate: string;
  endDate: string;
  capacity: number;
  status: TrainingStatus;
  createdAt: string;
  updatedAt: string;
  _count?: {
    enrollments: number;
  };
}

export interface TrainingEnrollment {
  id: string;
  trainingProgramId: string;
  employeeId: string;
  enrolledDate: string;
  status: EnrollmentStatus;
  score?: number | null;
  certificateUrl?: string | null;
  certificateNo?: string | null;
  issueDate?: string | null;
  feedback?: string | null;
  createdAt: string;
  updatedAt: string;
  trainingProgram?: TrainingProgram;
  employee?: {
    id: string;
    name: string;
    employeeId: string;
    email?: string;
    department?: string | null;
  };
}

export interface CategoryDistribution {
  category: string;
  count: number;
}

export interface TrainingAnalytics {
  totalPrograms: number;
  activeSessions: number;
  completedPrograms: number;
  totalEnrollments: number;
  completedEnrollments: number;
  certificatesIssued: number;
  completionRate: number;
  categoryBreakdown: CategoryDistribution[];
}
