import { Response } from "express";
import { AuthRequest } from "../types";
import { attendanceService } from "../services/attendance.service";
import { getClientIp } from "../utils/helpers";
import { asyncHandler, sendSuccess } from "../utils/response";
import { logger } from "../utils/logger";

export const recordAttendance = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { session, action } = req.body;
  const ipAddress = getClientIp(req);

  const attendance = await attendanceService.recordAction({
    userId: req.user!.userId,
    session,
    action,
    ipAddress,
  });

  logger.info(
    {
      userId: req.user!.userId,
      session,
      action,
      ipAddress,
      requestId: req.requestId,
    },
    "attendance recorded"
  );

  sendSuccess(res, attendance, `${session} ${action.replace("_", " ").toLowerCase()} recorded`);
});

export const getMyToday = asyncHandler(async (req: AuthRequest, res: Response) => {
  const attendance = await attendanceService.getMyToday(req.user!.userId);
  sendSuccess(res, attendance, "Today's attendance retrieved");
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
