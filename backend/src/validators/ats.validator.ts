import { z } from "zod";

export const createJobSchema = z.object({
  code: z.string().min(2, "Job code is required").max(50),
  title: z.string().min(2, "Job title must be at least 2 characters").max(255),
  department: z.string().optional(),
  location: z.string().optional(),
  employmentType: z.string().optional().default("FULL_TIME"),
  description: z.string().min(10, "Job description must be detailed"),
  requirements: z.string().optional(),
  minSalary: z.number().optional(),
  maxSalary: z.number().optional(),
  status: z.enum(["DRAFT", "OPEN", "ON_HOLD", "CLOSED"]).optional().default("OPEN"),
  closingDate: z.string().optional(),
});

export const updateJobSchema = z.object({
  code: z.string().min(2).max(50).optional(),
  title: z.string().min(2).max(255).optional(),
  department: z.string().optional(),
  location: z.string().optional(),
  employmentType: z.string().optional(),
  description: z.string().optional(),
  requirements: z.string().optional(),
  minSalary: z.number().optional(),
  maxSalary: z.number().optional(),
  status: z.enum(["DRAFT", "OPEN", "ON_HOLD", "CLOSED"]).optional(),
  closingDate: z.string().optional(),
});

export const createApplicationSchema = z.object({
  jobPostingId: z.string().min(1, "Job posting ID is required"),
  applicantName: z.string().min(2, "Applicant name is required"),
  email: z.string().email("Valid email address is required"),
  phone: z.string().optional(),
  resumeUrl: z.string().optional(),
  coverLetter: z.string().optional(),
  experienceYears: z.number().min(0).optional(),
  currentCompany: z.string().optional(),
  notes: z.string().optional(),
});

export const updateApplicationStatusSchema = z.object({
  status: z.enum(["APPLIED", "SCREENED", "INTERVIEW_SCHEDULED", "OFFER_EXTENDED", "HIRED", "REJECTED"]),
  notes: z.string().optional(),
});

export const rateApplicationSchema = z.object({
  rating: z.number().min(1).max(5),
  notes: z.string().optional(),
});

export const scheduleInterviewSchema = z.object({
  jobApplicationId: z.string().min(1, "Job application ID is required"),
  interviewerId: z.string().min(1, "Interviewer ID is required"),
  interviewType: z.enum(["PHONE_SCREEN", "TECHNICAL", "HR", "MANAGER", "FINAL"]).optional().default("TECHNICAL"),
  scheduledAt: z.string().min(1, "Scheduled date and time is required"),
  location: z.string().optional(),
});

export const submitInterviewFeedbackSchema = z.object({
  feedback: z.string().min(5, "Feedback commentary is required"),
  score: z.number().min(0).max(100),
  status: z.enum(["SCHEDULED", "COMPLETED", "CANCELLED", "NO_SHOW"]).optional().default("COMPLETED"),
});

export const convertHiredSchema = z.object({
  employeeId: z.string().min(2, "Employee ID (e.g. EMP009) is required"),
  department: z.string().optional().default("Engineering"),
  role: z.enum(["ADMIN", "EMPLOYEE"]).optional().default("EMPLOYEE"),
  password: z.string().min(6).optional().default("employee123"),
});
