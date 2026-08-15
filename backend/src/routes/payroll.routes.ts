import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth.middleware";
import { validate } from "../middleware/validate.middleware";
import { payrollController } from "../controllers/payroll.controller";
import {
  upsertSalaryStructureSchema,
  generatePayrollSchema,
  getPayrollRecordsQuerySchema,
  updatePayrollRecordSchema,
  batchUpdateStatusSchema,
  payrollReportQuerySchema,
} from "../validators/payroll.validator";

const router = Router();

// All payroll routes require authentication
router.use(authenticate);

// Employee Self-Service Endpoint
router.get("/my-payslips", payrollController.getMyPayslips);

// Admin-only Endpoints below
router.use(authorize("ADMIN"));

// Salary Structure Routes
router.get("/salary-structures", payrollController.getSalaryStructures);
router.post(
  "/salary-structures",
  validate(upsertSalaryStructureSchema),
  payrollController.upsertSalaryStructure
);

// Payroll Processing & Records Routes
router.post(
  "/generate",
  validate(generatePayrollSchema),
  payrollController.generatePayroll
);

router.get(
  "/records",
  validate(getPayrollRecordsQuerySchema),
  payrollController.getPayrollRecords
);

router.patch(
  "/batch-status",
  validate(batchUpdateStatusSchema),
  payrollController.batchUpdateStatus
);

router.get("/records/:id", payrollController.getPayrollById);

router.put(
  "/records/:id",
  validate(updatePayrollRecordSchema),
  payrollController.updatePayrollRecord
);

router.delete("/records/:id", payrollController.deletePayrollRecord);

// Reports Routes
router.get(
  "/reports/monthly-summary",
  validate(payrollReportQuerySchema),
  payrollController.getMonthlySummaryReport
);

router.get(
  "/reports/department-summary",
  validate(payrollReportQuerySchema),
  payrollController.getDepartmentSummaryReport
);

router.get(
  "/reports/total-cost",
  validate(payrollReportQuerySchema),
  payrollController.getTotalPayrollCostReport
);

export default router;
