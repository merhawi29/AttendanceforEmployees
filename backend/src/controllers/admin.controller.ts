import { Response } from "express";
import { AuthRequest } from "../types";
import { userService, ipService } from "../services/admin.service";
import { asyncHandler, sendSuccess } from "../utils/response";

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
