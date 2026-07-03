import { Response } from "express";
import { AuthRequest } from "../types";
import { attendanceService } from "../services/attendance.service";
import { getClientIp } from "../utils/helpers";
import { asyncHandler, sendSuccess } from "../utils/response";
import { logger } from "../utils/logger";

export const recordAttendance = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { punch } = req.body;
  const ipAddress = getClientIp(req);

  const result = await attendanceService.recordAction({
    userId: req.user!.userId,
    punch,
    ipAddress,
  });

  logger.info(
    {
      userId: req.user!.userId,
      punch,
      ipAddress,
      requestId: req.requestId,
    },
    "attendance recorded"
  );

  sendSuccess(res, result, result.message);
});

export const getMyToday = asyncHandler(async (req: AuthRequest, res: Response) => {
  const result = await attendanceService.getMyToday(req.user!.userId);
  sendSuccess(res, result, "Today's attendance retrieved");
});

export const getMyHistory = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { startDate, endDate } = req.query as { startDate?: string; endDate?: string };
  const history = await attendanceService.getMyHistory(
    req.user!.userId,
    startDate,
    endDate
  );
  sendSuccess(res, history, "Attendance history retrieved");
});

export const getAllAttendances = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { date, startDate, endDate, userId } = req.query as {
    date?: string;
    startDate?: string;
    endDate?: string;
    userId?: string;
  };
  const attendances = await attendanceService.getAllAttendances({
    date,
    startDate,
    endDate,
    userId,
  });
  sendSuccess(res, attendances, "Attendances retrieved");
});

export const getDashboardStats = asyncHandler(async (_req: AuthRequest, res: Response) => {
  const stats = await attendanceService.getDashboardStats();
  sendSuccess(res, stats, "Dashboard stats retrieved");
});

export const getSettings = asyncHandler(async (_req: AuthRequest, res: Response) => {
  const { settingsService } = await import("../services/settings.service");
  const settings = await settingsService.getSettings();
  sendSuccess(res, settings, "Settings retrieved");
});
