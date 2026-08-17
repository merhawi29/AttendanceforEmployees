import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth.middleware";
import {
  createJob,
  updateJob,
  deleteJob,
  getJobs,
  getJobById,
  createApplication,
  updateApplicationStatus,
  rateApplication,
  getApplications,
  convertHiredToEmployee,
  scheduleInterview,
  submitInterviewFeedback,
  getInterviews,
  getAtsAnalytics,
} from "../controllers/ats.controller";
import { Role } from "../types";

const router = Router();

// Public route for candidates submitting application
router.post("/applications/public", createApplication);

router.use(authenticate);
router.use(authorize(Role.ADMIN));

// Job Postings
router.get("/jobs", getJobs);
router.get("/jobs/:jobId", getJobById);
router.post("/jobs", createJob);
router.patch("/jobs/:jobId", updateJob);
router.delete("/jobs/:jobId", deleteJob);

// Applications
router.get("/applications", getApplications);
router.post("/applications", createApplication);
router.patch("/applications/:applicationId/status", updateApplicationStatus);
router.patch("/applications/:applicationId/rate", rateApplication);
router.post("/applications/:applicationId/convert-employee", convertHiredToEmployee);

// Interviews
router.get("/interviews", getInterviews);
router.post("/interviews", scheduleInterview);
router.patch("/interviews/:interviewId/feedback", submitInterviewFeedback);

// Analytics
router.get("/analytics", getAtsAnalytics);

export default router;
