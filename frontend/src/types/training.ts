export type TrainingStatus = "OPEN" | "CLOSED" | "UPCOMING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";

export type EnrollmentStatus = "PENDING" | "APPROVED" | "REJECTED" | "COMPLETED" | "ENROLLED" | "IN_PROGRESS" | "DROPPED" | "FAILED";

export interface TrainingProgram {
  id: string;
  code: string;
  title: string;
  description: string;
  category?: string | null;
  trainerName?: string | null;
  location?: string | null;
  materialsUrl?: string | null;
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

export interface AvailableTrainingProgram {
  id: string;
  code: string;
  title: string;
  description: string;
  category?: string | null;
  trainerName?: string | null;
  location?: string | null;
  materialsUrl?: string | null;
  startDate: string;
  endDate: string;
  capacity: number;
  status: TrainingStatus;
  enrolledCount: number;
  isFull: boolean;
  myEnrollment?: {
    id: string;
    status: EnrollmentStatus;
    appliedAt: string;
  } | null;
}

export interface TrainingEnrollment {
  id: string;
  trainingProgramId: string;
  employeeId: string;
  enrolledDate: string;
  appliedAt?: string;
  approvedAt?: string | null;
  approvedById?: string | null;
  completionDate?: string | null;
  remarks?: string | null;
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
  approvedBy?: {
    id: string;
    name: string;
    email: string;
  } | null;
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

export interface AdminTrainingStats {
  totalTrainings: number;
  openTrainings: number;
  pendingRequests: number;
  approvedParticipants: number;
  completedTrainings: number;
}

export interface EmployeeTrainingStats {
  availableTrainings: number;
  pendingRequests: number;
  approvedTrainings: number;
  completedTrainings: number;
}
