import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth.middleware";
import { ipRestriction } from "../middleware/ip.middleware";
import { deviceRestriction } from "../middleware/device.middleware";
import { validate } from "../middleware/validate.middleware";
import { attendanceActionSchema, dateQuerySchema } from "../validators/schemas";
import * as attendanceController from "../controllers/attendance.controller";
import { Role } from "../types";

const router = Router();

router.use(authenticate);

router.get("/settings", attendanceController.getSettings);

router.post(
  "/check",
  ipRestriction,
  deviceRestriction,
  validate(attendanceActionSchema),
  attendanceController.recordAttendance
);

router.get("/today", attendanceController.getMyToday);
router.get("/history", validate(dateQuerySchema), attendanceController.getMyHistory);

router.get(
  "/all",
  authorize(Role.ADMIN),
  validate(dateQuerySchema),
  attendanceController.getAllAttendances
);

router.get(
  "/stats",
  authorize(Role.ADMIN),
  attendanceController.getDashboardStats
);

export default router;
