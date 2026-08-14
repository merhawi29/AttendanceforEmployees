import { Response, NextFunction } from "express";
import { AuthRequest } from "../types";
import { overtimeService } from "../services/overtime.service";
import { sendSuccess } from "../utils/response";

export const overtimeController = {
  async submitRequest(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const request = await overtimeService.submitOvertimeRequest(req.user!.userId, req.body);
      return sendSuccess(res, request, "Overtime request submitted successfully", 201);
    } catch (err) {
      next(err);
    }
  },

  async getMyRequests(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await overtimeService.getOvertimeRequests({
        ...req.query,
        userId: req.user!.userId,
      } as any);
      return sendSuccess(res, result, "My overtime requests retrieved successfully");
    } catch (err) {
      next(err);
    }
  },

  async getAllRequests(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await overtimeService.getOvertimeRequests(req.query as any);
      return sendSuccess(res, result, "Overtime requests retrieved successfully");
    } catch (err) {
      next(err);
    }
  },

  async getRequestById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const request = await overtimeService.getOvertimeRequestById(req.params.id);
      return sendSuccess(res, request, "Overtime request details retrieved successfully");
    } catch (err) {
      next(err);
    }
  },

  async managerApprove(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const request = await overtimeService.approveByManager(
        req.params.id,
        req.user!.userId,
        req.body
      );
      return sendSuccess(res, request, `Overtime request ${req.body.action.toLowerCase()}d by manager`);
    } catch (err) {
      next(err);
    }
  },

  async adminApprove(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const request = await overtimeService.approveByAdmin(
        req.params.id,
        req.user!.userId,
        req.body
      );
      return sendSuccess(res, request, `Overtime request ${req.body.action.toLowerCase()}d by admin`);
    } catch (err) {
      next(err);
    }
  },

  async cancelRequest(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const request = await overtimeService.cancelOvertimeRequest(
        req.params.id,
        req.user!.userId
      );
      return sendSuccess(res, request, "Overtime request cancelled successfully");
    } catch (err) {
      next(err);
    }
  },

  async getDepartmentReports(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const year = req.query.year ? parseInt(req.query.year as string, 10) : new Date().getFullYear();
      const month = req.query.month ? parseInt(req.query.month as string, 10) : undefined;
      const reports = await overtimeService.getDepartmentOvertimeReports(year, month);
      return sendSuccess(res, reports, "Department overtime reports retrieved successfully");
    } catch (err) {
      next(err);
    }
  },

  async getMonthlyReports(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const year = req.query.year ? parseInt(req.query.year as string, 10) : new Date().getFullYear();
      const month = req.query.month ? parseInt(req.query.month as string, 10) : undefined;
      const reports = await overtimeService.getMonthlyOvertimeReports(year, month);
      return sendSuccess(res, reports, "Monthly overtime reports retrieved successfully");
    } catch (err) {
      next(err);
    }
  },

  async getAdminMetrics(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const metrics = await overtimeService.getAdminOvertimeMetrics();
      return sendSuccess(res, metrics, "Admin overtime metrics retrieved successfully");
    } catch (err) {
      next(err);
    }
  },
};
