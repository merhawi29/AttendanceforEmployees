import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth.middleware";
import { validate } from "../middleware/validate.middleware";
import { leaveController } from "../controllers/leave.controller";
import {
  createLeaveTypeSchema,
  updateLeaveTypeSchema,
  createLeaveRequestSchema,
  managerApprovalSchema,
  adminApprovalSchema,
  leaveRequestIdParamSchema,
  getLeaveRequestsQuerySchema,
  updateLeaveBalanceSchema,
} from "../validators/leave.validator";
import { Role } from "@prisma/client";

const router = Router();

router.use(authenticate);

// Leave Types
router.get("/types", leaveController.getLeaveTypes);
router.post(
  "/types",
  authorize(Role.ADMIN),
  validate(createLeaveTypeSchema),
  leaveController.createLeaveType
);
router.put(
  "/types/:id",
  authorize(Role.ADMIN),
  validate(updateLeaveTypeSchema),
  leaveController.updateLeaveType
);

// Leave Balances
router.get("/balances/my", leaveController.getMyBalances);
router.get("/balances/user/:userId", authorize(Role.ADMIN), leaveController.getUserBalances);
router.post(
  "/balances",
  authorize(Role.ADMIN),
  validate(updateLeaveBalanceSchema),
  leaveController.updateBalance
);

// Leave Requests
router.post(
  "/requests",
  validate(createLeaveRequestSchema),
  leaveController.submitRequest
);
router.get("/requests/my", validate(getLeaveRequestsQuerySchema), leaveController.getMyRequests);
router.get(
  "/requests",
  authorize(Role.ADMIN),
  validate(getLeaveRequestsQuerySchema),
  leaveController.getAllRequests
);
router.get(
  "/requests/:id",
  validate(leaveRequestIdParamSchema),
  leaveController.getRequestById
);
router.put(
  "/requests/:id/approve-manager",
  validate(managerApprovalSchema),
  leaveController.managerApprove
);
router.put(
  "/requests/:id/approve-admin",
  authorize(Role.ADMIN),
  validate(adminApprovalSchema),
  leaveController.adminApprove
);
router.put(
  "/requests/:id/cancel",
  validate(leaveRequestIdParamSchema),
  leaveController.cancelRequest
);

// Calendar & Reports
router.get("/calendar", leaveController.getCalendar);
router.get("/reports/departments", authorize(Role.ADMIN), leaveController.getDepartmentReports);
router.get("/reports", authorize(Role.ADMIN), leaveController.getReports);

export default router;
