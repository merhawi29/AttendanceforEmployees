import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth.middleware";
import {
  createProgram,
  updateProgram,
  deleteProgram,
  getPrograms,
  getProgramById,
  enrollEmployee,
  updateEnrollment,
  cancelEnrollment,
  getEmployeeTrainings,
  getTrainingAnalytics,
} from "../controllers/training.controller";
import { Role } from "../types";

const router = Router();

router.use(authenticate);

// Employee Self-Service Endpoint
router.get("/my-trainings", getEmployeeTrainings);

// Admin Management Routes
router.use(authorize(Role.ADMIN));

// Programs
router.get("/programs", getPrograms);
router.get("/programs/:programId", getProgramById);
router.post("/programs", createProgram);
router.patch("/programs/:programId", updateProgram);
router.delete("/programs/:programId", deleteProgram);

// Enrollments
router.post("/enroll", enrollEmployee);
router.patch("/enrollments/:enrollmentId", updateEnrollment);
router.delete("/enrollments/:enrollmentId", cancelEnrollment);

// Analytics
router.get("/analytics/dashboard", getTrainingAnalytics);

export default router;
