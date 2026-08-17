import { Response } from "express";
import { AuthRequest } from "../types";
import { trainingService } from "../services/training.service";
import { asyncHandler, sendSuccess } from "../utils/response";
import {
  createProgramSchema,
  updateProgramSchema,
  enrollEmployeeSchema,
  updateEnrollmentSchema,
  applyTrainingSchema,
  approveEnrollmentSchema,
  rejectEnrollmentSchema,
  completeEnrollmentSchema,
} from "../validators/training.validator";
import { TrainingStatus, EnrollmentStatus } from "@prisma/client";

// --- PROGRAMS ---
export const createProgram = asyncHandler(async (req: AuthRequest, res: Response) => {
  const validated = createProgramSchema.parse(req.body);
  const program = await trainingService.createProgram(validated);
  sendSuccess(res, program, "Training program created successfully", 201);
});

export const updateProgram = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { programId } = req.params;
  const validated = updateProgramSchema.parse(req.body);
  const program = await trainingService.updateProgram(programId, validated);
  sendSuccess(res, program, "Training program updated successfully");
});

export const deleteProgram = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { programId } = req.params;
  await trainingService.deleteProgram(programId);
  sendSuccess(res, null, "Training program deleted successfully");
});

export const getPrograms = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { status, category, search } = req.query;
  const programs = await trainingService.getPrograms({
    status: status as TrainingStatus | undefined,
    category: category as string | undefined,
    search: search as string | undefined,
  });
  sendSuccess(res, programs, "Training programs retrieved");
});

export const getProgramById = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { programId } = req.params;
  const program = await trainingService.getProgramById(programId);
  sendSuccess(res, program, "Training program details retrieved");
});

// --- EMPLOYEE APPLICATION & AVAILABLE COURSES ---
export const applyTraining = asyncHandler(async (req: AuthRequest, res: Response) => {
  const validated = applyTrainingSchema.parse(req.body);
  const employeeId = req.user!.userId;
  const enrollment = await trainingService.applyTraining({
    trainingProgramId: validated.trainingProgramId,
    employeeId,
  });
  sendSuccess(res, enrollment, "Training application submitted successfully", 201);
});

export const getAvailableTrainings = asyncHandler(async (req: AuthRequest, res: Response) => {
  const employeeId = req.user!.userId;
  const trainings = await trainingService.getAvailableTrainings(employeeId);
  sendSuccess(res, trainings, "Available training programs retrieved");
});

export const getEmployeeTrainings = asyncHandler(async (req: AuthRequest, res: Response) => {
  const targetUserId = req.user?.role === "EMPLOYEE" ? req.user.userId : (req.query.employeeId as string) || req.user!.userId;
  const trainings = await trainingService.getEmployeeTrainings(targetUserId);
  sendSuccess(res, trainings, "Employee training courses retrieved");
});

// --- ADMIN APPROVAL WORKFLOW ---
export const approveEnrollment = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { enrollmentId } = req.params;
  const validated = approveEnrollmentSchema.parse(req.body);
  const adminId = req.user!.userId;
  const enrollment = await trainingService.approveEnrollment(enrollmentId, adminId, validated.remarks);
  sendSuccess(res, enrollment, "Training enrollment request approved");
});

export const rejectEnrollment = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { enrollmentId } = req.params;
  const validated = rejectEnrollmentSchema.parse(req.body);
  const adminId = req.user!.userId;
  const enrollment = await trainingService.rejectEnrollment(enrollmentId, adminId, validated.remarks);
  sendSuccess(res, enrollment, "Training enrollment request rejected");
});

export const completeEnrollment = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { enrollmentId } = req.params;
  const validated = completeEnrollmentSchema.parse(req.body);
  const adminId = req.user!.userId;
  const enrollment = await trainingService.completeEnrollment(enrollmentId, adminId, validated);
  sendSuccess(res, enrollment, "Training completed and certificate issued");
});

export const enrollEmployee = asyncHandler(async (req: AuthRequest, res: Response) => {
  const validated = enrollEmployeeSchema.parse(req.body);
  const enrollment = await trainingService.enrollEmployee(validated);
  sendSuccess(res, enrollment, "Employee enrolled in training program successfully", 201);
});

export const updateEnrollment = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { enrollmentId } = req.params;
  const validated = updateEnrollmentSchema.parse(req.body);
  const enrollment = await trainingService.updateEnrollment(enrollmentId, validated);
  sendSuccess(res, enrollment, "Enrollment progress and certification updated");
});

export const cancelEnrollment = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { enrollmentId } = req.params;
  await trainingService.cancelEnrollment(enrollmentId);
  sendSuccess(res, null, "Employee enrollment cancelled");
});

export const getAdminEnrollments = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { status, trainingProgramId, search } = req.query;
  const enrollments = await trainingService.getAdminEnrollments({
    status: status as EnrollmentStatus | undefined,
    trainingProgramId: trainingProgramId as string | undefined,
    search: search as string | undefined,
  });
  sendSuccess(res, enrollments, "Training enrollment requests retrieved");
});

// --- STATS & ANALYTICS ---
export const getTrainingStats = asyncHandler(async (req: AuthRequest, res: Response) => {
  const role = req.user!.role;
  const userId = req.user!.userId;
  const stats = await trainingService.getTrainingStats(role, userId);
  sendSuccess(res, stats, "Training dashboard statistics retrieved");
});

export const getTrainingAnalytics = asyncHandler(async (_req: AuthRequest, res: Response) => {
  const analytics = await trainingService.getTrainingAnalytics();
  sendSuccess(res, analytics, "Training analytics retrieved");
});
