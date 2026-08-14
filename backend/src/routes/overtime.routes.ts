import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth.middleware";
import { validate } from "../middleware/validate.middleware";
import { overtimeController } from "../controllers/overtime.controller";
import {
  createOvertimeSchema,
  managerApprovalSchema,
  adminApprovalSchema,
  overtimeIdParamSchema,
  getOvertimeRequestsQuerySchema,
} from "../validators/overtime.validator";
import { Role } from "@prisma/client";

const router = Router();

router.use(authenticate);

// Employee OT Request & History
router.post(
  "/requests",
  validate(createOvertimeSchema),
  overtimeController.submitRequest
);

router.get(
  "/requests/my",
  validate(getOvertimeRequestsQuerySchema),
  overtimeController.getMyRequests
);

// Admin & Manager OT Management
router.get(
  "/requests",
  authorize(Role.ADMIN),
  validate(getOvertimeRequestsQuerySchema),
  overtimeController.getAllRequests
);

router.get(
  "/requests/:id",
  validate(overtimeIdParamSchema),
  overtimeController.getRequestById
);

router.put(
  "/requests/:id/approve-manager",
  validate(managerApprovalSchema),
  overtimeController.managerApprove
);

router.put(
  "/requests/:id/approve-admin",
  authorize(Role.ADMIN),
  validate(adminApprovalSchema),
  overtimeController.adminApprove
);

router.put(
  "/requests/:id/cancel",
  validate(overtimeIdParamSchema),
  overtimeController.cancelRequest
);

// Reports & Metrics
router.get(
  "/reports/department",
  authorize(Role.ADMIN),
  overtimeController.getDepartmentReports
);

router.get(
  "/reports/monthly",
  authorize(Role.ADMIN),
  overtimeController.getMonthlyReports
);

router.get(
  "/metrics",
  authorize(Role.ADMIN),
  overtimeController.getAdminMetrics
);

export default router;
