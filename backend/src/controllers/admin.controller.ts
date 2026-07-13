import { Response } from "express";
import { AuthRequest } from "../types";
import { userService, ipService } from "../services/admin.service";
import { settingsService } from "../services/settings.service";
import { attendanceService } from "../services/attendance.service";
import { asyncHandler, sendSuccess } from "../utils/response";
import { getClientIp, normalizeIp } from "../utils/helpers";

export const getUsers = asyncHandler(async (_req: AuthRequest, res: Response) => {
  const users = await userService.getAll();
  sendSuccess(res, users, "Users retrieved");
});

export const updateUser = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = await userService.update(String(req.params.id), req.body);
  sendSuccess(res, user, "User updated");
});

export const deleteUser = asyncHandler(async (req: AuthRequest, res: Response) => {
  await userService.delete(String(req.params.id));
  sendSuccess(res, null, "User deleted");
});

export const getAllowedIps = asyncHandler(async (_req: AuthRequest, res: Response) => {
  const ips = await ipService.getAll();
  sendSuccess(res, ips, "Allowed IPs retrieved");
});

export const addAllowedIp = asyncHandler(async (req: AuthRequest, res: Response) => {
  const ip = await ipService.create(req.body.ipAddress, req.body.description);
  sendSuccess(res, ip, "IP address added", 201);
});

export const toggleAllowedIp = asyncHandler(async (req: AuthRequest, res: Response) => {
  const ip = await ipService.toggle(String(req.params.id), req.body.isActive);
  sendSuccess(res, ip, "IP status updated");
});

export const deleteAllowedIp = asyncHandler(async (req: AuthRequest, res: Response) => {
  await ipService.remove(String(req.params.id));
  sendSuccess(res, null, "IP address removed");
});

export const resetPassword = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { userId, newPassword } = req.body;
  await userService.resetPassword(userId, newPassword, req.user!.userId);
  sendSuccess(res, null, "User password reset successfully");
});

export const getSettings = asyncHandler(async (_req: AuthRequest, res: Response) => {
  const settings = await settingsService.getSettings();
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
  sendSuccess(res, settings, "Settings retrieved");
});

export const updateSettings = asyncHandler(async (req: AuthRequest, res: Response) => {
  const settings = await settingsService.updateSettings(req.body);
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
  sendSuccess(res, settings, "Settings updated");
});

export const editAttendance = asyncHandler(async (req: AuthRequest, res: Response) => {
  const result = await attendanceService.adminEditAttendance(String(req.params.id), req.body);
  sendSuccess(res, result, "Attendance record updated successfully");
});

export const getUserSummary = asyncHandler(async (req: AuthRequest, res: Response) => {
  const summary = await userService.getUserSummary(String(req.params.id));
  sendSuccess(res, summary, "User attendance summary retrieved");
});

export const getMyIp = asyncHandler(async (req: AuthRequest, res: Response) => {
  const ip = normalizeIp(getClientIp(req));
  sendSuccess(res, { ip }, "Your IP address detected");
});
