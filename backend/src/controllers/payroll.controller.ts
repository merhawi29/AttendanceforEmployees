import { Response } from "express";
import { AuthRequest } from "../types";
import { payrollService } from "../services/payroll.service";
import { sendSuccess, asyncHandler, AppError } from "../utils/response";

export const payrollController = {
  getSalaryStructures: asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await payrollService.getSalaryStructures(req.query as any);
    return sendSuccess(res, result, "Salary structures retrieved successfully");
  }),

  upsertSalaryStructure: asyncHandler(async (req: AuthRequest, res: Response) => {
    const structure = await payrollService.upsertSalaryStructure(req.body);
    return sendSuccess(res, structure, "Salary structure saved successfully");
  }),

  generatePayroll: asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await payrollService.generatePayroll(req.body);
    return sendSuccess(res, result, "Payroll generated successfully", 201);
  }),

  getPayrollRecords: asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await payrollService.getPayrollRecords(req.query as any);
    return sendSuccess(res, result, "Payroll records retrieved successfully");
  }),

  getPayrollById: asyncHandler(async (req: AuthRequest, res: Response) => {
    const record = await payrollService.getPayrollById(req.params.id);

    // If user is EMPLOYEE, ensure they can only view their own payslips
    if (req.user?.role === "EMPLOYEE" && record.userId !== req.user.userId) {
      throw new AppError(403, "You can only view your own payslips", undefined, "FORBIDDEN");
    }

    return sendSuccess(res, record, "Payroll record retrieved successfully");
  }),

  updatePayrollRecord: asyncHandler(async (req: AuthRequest, res: Response) => {
    const record = await payrollService.updatePayrollRecord(req.params.id, req.body);
    return sendSuccess(res, record, "Payroll record updated successfully");
  }),

  batchUpdateStatus: asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await payrollService.batchUpdateStatus(req.body);
    return sendSuccess(res, result, "Payroll status updated successfully");
  }),

  deletePayrollRecord: asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await payrollService.deletePayrollRecord(req.params.id);
    return sendSuccess(res, result, "Payroll record deleted successfully");
  }),

  getMyPayslips: asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) {
      throw new AppError(401, "Authentication required", undefined, "AUTH_REQUIRED");
    }

    const year = req.query.year ? parseInt(req.query.year as string, 10) : undefined;
    const payslips = await payrollService.getEmployeePayslips(userId, year);
    return sendSuccess(res, payslips, "My payslips retrieved successfully");
  }),

  getMonthlySummaryReport: asyncHandler(async (req: AuthRequest, res: Response) => {
    const report = await payrollService.getMonthlySummaryReport(req.query as any);
    return sendSuccess(res, report, "Monthly summary report generated successfully");
  }),

  getDepartmentSummaryReport: asyncHandler(async (req: AuthRequest, res: Response) => {
    const report = await payrollService.getDepartmentSummaryReport(req.query as any);
    return sendSuccess(res, report, "Department summary report generated successfully");
  }),

  getTotalPayrollCostReport: asyncHandler(async (req: AuthRequest, res: Response) => {
    const report = await payrollService.getTotalPayrollCostReport(req.query as any);
    return sendSuccess(res, report, "Total payroll cost report generated successfully");
  }),
};
