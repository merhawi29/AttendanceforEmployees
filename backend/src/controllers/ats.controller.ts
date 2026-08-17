import { Response } from "express";
import { AuthRequest } from "../types";
import { atsService } from "../services/ats.service";
import { asyncHandler, sendSuccess } from "../utils/response";
import {
  createJobSchema,
  updateJobSchema,
  createApplicationSchema,
  updateApplicationStatusSchema,
  rateApplicationSchema,
  scheduleInterviewSchema,
  submitInterviewFeedbackSchema,
  convertHiredSchema,
} from "../validators/ats.validator";
import { JobStatus, ApplicationStatus, InterviewStatus } from "@prisma/client";

// --- JOB POSTINGS ---
export const createJob = asyncHandler(async (req: AuthRequest, res: Response) => {
  const validated = createJobSchema.parse(req.body);
  const job = await atsService.createJob(validated);
  sendSuccess(res, job, "Job posting created successfully", 201);
});

export const updateJob = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { jobId } = req.params;
  const validated = updateJobSchema.parse(req.body);
  const job = await atsService.updateJob(jobId, validated);
  sendSuccess(res, job, "Job posting updated successfully");
});

export const deleteJob = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { jobId } = req.params;
  await atsService.deleteJob(jobId);
  sendSuccess(res, null, "Job posting deleted successfully");
});

export const getJobs = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { status, department, search } = req.query;
  const jobs = await atsService.getJobs({
    status: status as JobStatus | undefined,
    department: department as string | undefined,
    search: search as string | undefined,
  });
  sendSuccess(res, jobs, "Job postings retrieved");
});

export const getJobById = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { jobId } = req.params;
  const job = await atsService.getJobById(jobId);
  sendSuccess(res, job, "Job posting details retrieved");
});

// --- APPLICATIONS ---
export const createApplication = asyncHandler(async (req: AuthRequest, res: Response) => {
  const validated = createApplicationSchema.parse(req.body);
  const application = await atsService.createApplication(validated);
  sendSuccess(res, application, "Application submitted successfully", 201);
});

export const updateApplicationStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { applicationId } = req.params;
  const validated = updateApplicationStatusSchema.parse(req.body);
  const application = await atsService.updateApplicationStatus(applicationId, validated.status, validated.notes);
  sendSuccess(res, application, "Candidate application stage updated");
});

export const rateApplication = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { applicationId } = req.params;
  const validated = rateApplicationSchema.parse(req.body);
  const application = await atsService.rateApplication(applicationId, validated.rating, validated.notes);
  sendSuccess(res, application, "Candidate rating saved");
});

export const getApplications = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { jobPostingId, status, search } = req.query;
  const applications = await atsService.getApplications({
    jobPostingId: jobPostingId as string | undefined,
    status: status as ApplicationStatus | undefined,
    search: search as string | undefined,
  });
  sendSuccess(res, applications, "Job applications retrieved");
});

export const convertHiredToEmployee = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { applicationId } = req.params;
  const validated = convertHiredSchema.parse(req.body);
  const newUser = await atsService.convertHiredToEmployee(
    applicationId,
    validated.employeeId,
    validated.department,
    validated.role,
    validated.password
  );
  sendSuccess(res, newUser, "Candidate onboarded as Employee successfully", 201);
});

// --- INTERVIEWS ---
export const scheduleInterview = asyncHandler(async (req: AuthRequest, res: Response) => {
  const validated = scheduleInterviewSchema.parse(req.body);
  const interview = await atsService.scheduleInterview(validated);
  sendSuccess(res, interview, "Interview scheduled successfully", 201);
});

export const submitInterviewFeedback = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { interviewId } = req.params;
  const validated = submitInterviewFeedbackSchema.parse(req.body);
  const interview = await atsService.submitInterviewFeedback(
    interviewId,
    validated.feedback,
    validated.score,
    validated.status as InterviewStatus
  );
  sendSuccess(res, interview, "Interview feedback submitted");
});

export const getInterviews = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { jobApplicationId, status } = req.query;
  const interviews = await atsService.getInterviews({
    jobApplicationId: jobApplicationId as string | undefined,
    status: status as InterviewStatus | undefined,
  });
  sendSuccess(res, interviews, "Interviews retrieved");
});

// --- ANALYTICS ---
export const getAtsAnalytics = asyncHandler(async (_req: AuthRequest, res: Response) => {
  const analytics = await atsService.getAtsAnalytics();
  sendSuccess(res, analytics, "ATS analytics retrieved");
});
