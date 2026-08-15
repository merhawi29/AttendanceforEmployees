import { Request, Response, NextFunction } from "express";
import { ReportService } from "../services/report.service";

export class ReportController {
  static async getAttendanceAnalytics(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await ReportService.getAttendanceAnalytics(req.query as any);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  static async getLeaveAnalytics(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await ReportService.getLeaveAnalytics(req.query as any);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  static async getOvertimeAnalytics(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await ReportService.getOvertimeAnalytics(req.query as any);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  static async getPayrollAnalytics(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await ReportService.getPayrollAnalytics(req.query as any);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  static async getDepartmentAnalytics(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await ReportService.getDepartmentAnalytics(req.query as any);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  static async getExecutiveDashboard(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await ReportService.getExecutiveDashboard(req.query as any);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  static async getEmployeePerformanceAnalytics(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await ReportService.getEmployeePerformanceAnalytics(req.query as any);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }
}
