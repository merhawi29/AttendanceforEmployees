import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth.middleware";
import { ReportController } from "../controllers/report.controller";

const router = Router();

// All report analytics routes require Admin authorization
router.use(authenticate, authorize("ADMIN"));

router.get("/attendance", ReportController.getAttendanceAnalytics);
router.get("/leave", ReportController.getLeaveAnalytics);
router.get("/overtime", ReportController.getOvertimeAnalytics);
router.get("/payroll", ReportController.getPayrollAnalytics);
router.get("/department", ReportController.getDepartmentAnalytics);
router.get("/executive", ReportController.getExecutiveDashboard);
router.get("/employee-performance", ReportController.getEmployeePerformanceAnalytics);

export default router;
