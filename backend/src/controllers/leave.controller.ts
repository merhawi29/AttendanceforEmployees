import { Response, NextFunction } from "express";
import { AuthRequest } from "../types";
import { leaveService } from "../services/leave.service";
import { sendSuccess } from "../utils/response";

export const leaveController = {
  // Leave Types
  async getLeaveTypes(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const includeInactive = req.query.includeInactive === "true";
      const types = await leaveService.getLeaveTypes(includeInactive);
      return sendSuccess(res, types, "Leave types retrieved successfully");
    } catch (err) {
      next(err);
    }
  },

  async createLeaveType(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const leaveType = await leaveService.createLeaveType(req.body);
      return sendSuccess(res, leaveType, "Leave type created successfully", 201);
    } catch (err) {
      next(err);
    }
  },

  async updateLeaveType(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const leaveType = await leaveService.updateLeaveType(req.params.id, req.body);
      return sendSuccess(res, leaveType, "Leave type updated successfully");
    } catch (err) {
      next(err);
    }
  },

  // Leave Balances
  async getMyBalances(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const year = req.query.year ? parseInt(req.query.year as string, 10) : new Date().getFullYear();
      const balances = await leaveService.getOrCreateUserBalances(req.user!.userId, year);
      return sendSuccess(res, balances, "Leave balances retrieved successfully");
    } catch (err) {
      next(err);
    }
  },

  async getUserBalances(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { userId } = req.params;
      const year = req.query.year ? parseInt(req.query.year as string, 10) : new Date().getFullYear();
      const balances = await leaveService.getOrCreateUserBalances(userId, year);
      return sendSuccess(res, balances, "User leave balances retrieved successfully");
    } catch (err) {
      next(err);
    }
  },

  async updateBalance(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const balance = await leaveService.updateLeaveBalance(req.body);
      return sendSuccess(res, balance, "Leave balance updated successfully");
    } catch (err) {
      next(err);
    }
  },

  // Leave Requests
  async submitRequest(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const request = await leaveService.submitLeaveRequest(req.user!.userId, req.body);
      return sendSuccess(res, request, "Leave request submitted successfully", 201);
    } catch (err) {
      next(err);
    }
  },

  async getMyRequests(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await leaveService.getLeaveRequests({
        ...req.query,
        userId: req.user!.userId,
      } as any);
      return sendSuccess(res, result, "My leave requests retrieved successfully");
    } catch (err) {
      next(err);
    }
  },

  async getAllRequests(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await leaveService.getLeaveRequests(req.query as any);
      return sendSuccess(res, result, "Leave requests retrieved successfully");
    } catch (err) {
      next(err);
    }
  },

  async getRequestById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const request = await leaveService.getLeaveRequestById(req.params.id);
      return sendSuccess(res, request, "Leave request retrieved successfully");
    } catch (err) {
      next(err);
    }
  },

  async managerApprove(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const request = await leaveService.approveByManager(
        req.params.id,
        req.user!.userId,
        req.body
      );
      return sendSuccess(res, request, `Leave request ${req.body.action.toLowerCase()}d by manager`);
    } catch (err) {
      next(err);
    }
  },

  async adminApprove(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const request = await leaveService.approveByAdmin(
        req.params.id,
        req.user!.userId,
        req.body
      );
      return sendSuccess(res, request, `Leave request ${req.body.action.toLowerCase()}d by admin`);
    } catch (err) {
      next(err);
    }
  },

  async cancelRequest(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const request = await leaveService.cancelLeaveRequest(
        req.params.id,
        req.user!.userId
      );
      return sendSuccess(res, request, "Leave request cancelled successfully");
    } catch (err) {
      next(err);
    }
  },

  // Calendar & Reports
  async getCalendar(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const year = req.query.year ? parseInt(req.query.year as string, 10) : new Date().getFullYear();
      const month = req.query.month ? parseInt(req.query.month as string, 10) : new Date().getMonth() + 1;
      const departmentId = req.query.departmentId as string | undefined;

      const events = await leaveService.getLeaveCalendar(year, month, departmentId);
      return sendSuccess(res, events, "Leave calendar retrieved successfully");
    } catch (err) {
      next(err);
    }
  },

  async getReports(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const year = req.query.year ? parseInt(req.query.year as string, 10) : new Date().getFullYear();
      const departmentId = req.query.departmentId as string | undefined;

      const reports = await leaveService.getLeaveReports(year, departmentId);
      return sendSuccess(res, reports, "Leave reports retrieved successfully");
    } catch (err) {
      next(err);
    }
  },

  async getDepartmentReports(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const year = req.query.year ? parseInt(req.query.year as string, 10) : new Date().getFullYear();
      const departmentId = req.query.departmentId as string | undefined;

      const reports = await leaveService.getDepartmentLeaveReports(year, departmentId);
      return sendSuccess(res, reports, "Department leave reports retrieved successfully");
    } catch (err) {
      next(err);
    }
  },
};
