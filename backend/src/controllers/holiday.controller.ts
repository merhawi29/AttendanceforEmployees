import { Response, NextFunction } from "express";
import { AuthRequest } from "../types";
import { HolidayService } from "../services/holiday.service";
import { sendSuccess } from "../utils/response";

export const holidayController = {
  async getHolidays(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await HolidayService.getHolidays(req.query as any);
      return sendSuccess(res, result, "Holidays retrieved successfully");
    } catch (err) {
      next(err);
    }
  },

  async getHolidayById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const holiday = await HolidayService.getHolidayById(req.params.id);
      return sendSuccess(res, holiday, "Holiday retrieved successfully");
    } catch (err) {
      next(err);
    }
  },

  async createHoliday(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const holiday = await HolidayService.createHoliday(req.body);
      return sendSuccess(res, holiday, "Holiday created successfully", 201);
    } catch (err) {
      next(err);
    }
  },

  async updateHoliday(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const holiday = await HolidayService.updateHoliday(req.params.id, req.body);
      return sendSuccess(res, holiday, "Holiday updated successfully");
    } catch (err) {
      next(err);
    }
  },

  async deleteHoliday(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const holiday = await HolidayService.deleteHoliday(req.params.id);
      return sendSuccess(res, holiday, "Holiday deleted successfully");
    } catch (err) {
      next(err);
    }
  },

  async getUpcomingHolidays(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 5;
      const upcoming = await HolidayService.getUpcomingHolidays(limit);
      return sendSuccess(res, upcoming, "Upcoming holidays retrieved successfully");
    } catch (err) {
      next(err);
    }
  },

  async getHolidayStats(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const stats = await HolidayService.getHolidayStats();
      return sendSuccess(res, stats, "Holiday statistics retrieved successfully");
    } catch (err) {
      next(err);
    }
  },

  async getHolidayCalendar(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const year = req.query.year ? parseInt(req.query.year as string, 10) : new Date().getFullYear();
      const month = req.query.month ? parseInt(req.query.month as string, 10) : undefined;
      const calendar = await HolidayService.getHolidayCalendar(year, month);
      return sendSuccess(res, calendar, "Holiday calendar retrieved successfully");
    } catch (err) {
      next(err);
    }
  },

  async getHolidaySummaryReport(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const year = req.query.year ? parseInt(req.query.year as string, 10) : new Date().getFullYear();
      const report = await HolidayService.getHolidaySummaryReport(year);
      return sendSuccess(res, report, "Holiday summary report retrieved successfully");
    } catch (err) {
      next(err);
    }
  },
};
