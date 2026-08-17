export type JobStatus = "DRAFT" | "OPEN" | "ON_HOLD" | "CLOSED";

export type ApplicationStatus =
  | "APPLIED"
  | "SCREENED"
  | "INTERVIEW_SCHEDULED"
  | "OFFER_EXTENDED"
  | "HIRED"
  | "REJECTED";

export type InterviewType = "PHONE_SCREEN" | "TECHNICAL" | "HR" | "MANAGER" | "FINAL";

export type InterviewStatus = "SCHEDULED" | "COMPLETED" | "CANCELLED" | "NO_SHOW";

export interface JobPosting {
  id: string;
  code: string;
  title: string;
  department?: string | null;
  location?: string | null;
  employmentType: string;
  description: string;
  requirements?: string | null;
  minSalary?: number | null;
  maxSalary?: number | null;
  status: JobStatus;
  closingDate?: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: {
    applications: number;
  };
}

export interface Interview {
  id: string;
  jobApplicationId: string;
  interviewerId: string;
  interviewType: InterviewType;
  scheduledAt: string;
  location?: string | null;
  status: InterviewStatus;
  feedback?: string | null;
  score?: number | null;
  createdAt: string;
  updatedAt: string;
  interviewer?: {
    id: string;
    name: string;
    email: string;
  };
  jobApplication?: {
    id: string;
    applicantName: string;
    email: string;
    jobPosting?: {
      id: string;
      code: string;
      title: string;
    };
  };
}

export interface JobApplication {
  id: string;
  jobPostingId: string;
  applicantName: string;
  email: string;
  phone?: string | null;
  resumeUrl?: string | null;
  coverLetter?: string | null;
  experienceYears?: number | null;
  currentCompany?: string | null;
  status: ApplicationStatus;
  rating?: number | null;
  notes?: string | null;
  appliedDate: string;
  createdAt: string;
  updatedAt: string;
  jobPosting?: {
    id: string;
    code: string;
    title: string;
    department?: string | null;
  };
  interviews?: Interview[];
}

export interface AtsAnalytics {
  totalJobs: number;
  openJobs: number;
  totalApplications: number;
  hiredCount: number;
  scheduledInterviews: number;
  conversionRate: number;
  stageDistribution: Record<ApplicationStatus, number>;
  recentApplications: JobApplication[];
}
