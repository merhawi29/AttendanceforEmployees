import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth.middleware";
import {
  createProgram,
  updateProgram,
  deleteProgram,
  getPrograms,
  getProgramById,
  applyTraining,
  getAvailableTrainings,
  getEmployeeTrainings,
  approveEnrollment,
  rejectEnrollment,
  completeEnrollment,
  enrollEmployee,
  updateEnrollment,
  cancelEnrollment,
  getAdminEnrollments,
  getTrainingStats,
  getTrainingAnalytics,
} from "../controllers/training.controller";
import { Role } from "../types";

const router = Router();

router.use(authenticate);

// --- EMPLOYEE & GENERAL ROUTES ---
router.get("/my-trainings", getEmployeeTrainings);
router.get("/available", getAvailableTrainings);
router.post("/apply", applyTraining);
router.get("/stats", getTrainingStats);

// --- ADMIN MANAGEMENT ROUTES ---
router.use(authorize(Role.ADMIN));

// Programs
router.get("/programs", getPrograms);
router.get("/programs/:programId", getProgramById);
router.post("/programs", createProgram);
router.patch("/programs/:programId", updateProgram);
router.delete("/programs/:programId", deleteProgram);

// Admin Approval & Enrollment Management
router.get("/admin/enrollments", getAdminEnrollments);
router.post("/enroll", enrollEmployee);
router.post("/enrollments/:enrollmentId/approve", approveEnrollment);
router.post("/enrollments/:enrollmentId/reject", rejectEnrollment);
router.post("/enrollments/:enrollmentId/complete", completeEnrollment);
router.patch("/enrollments/:enrollmentId", updateEnrollment);
router.delete("/enrollments/:enrollmentId", cancelEnrollment);

// Analytics
router.get("/analytics/dashboard", getTrainingAnalytics);

export default router;
