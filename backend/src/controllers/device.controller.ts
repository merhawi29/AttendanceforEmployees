import { Response } from "express";
import { AuthRequest } from "../types";
import { deviceService } from "../services/device.service";
import { getClientIp } from "../utils/helpers";
import { asyncHandler, sendSuccess } from "../utils/response";

export const registerDevice = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { deviceId, deviceName, browser, operatingSystem, userAgent, platform, maxTouchPoints, screenWidth, screenHeight, fingerprint } = req.body;
  const ipAddress = getClientIp(req);

  const device = await deviceService.register({
    employeeId: req.user!.userId,
    deviceId,
    deviceName,
    browser,
    operatingSystem,
    userAgent,
    ipAddress,
    platform,
    maxTouchPoints,
    screenWidth,
    screenHeight,
    fingerprint,
  });

  sendSuccess(res, device, "Device registered successfully", 201);
});

export const getDeviceStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
  const status = await deviceService.getStatus(req.user!.userId);
  sendSuccess(res, status, "Device status retrieved");
});

export const getMyDevices = asyncHandler(async (req: AuthRequest, res: Response) => {
  const devices = await deviceService.getMyDevices(req.user!.userId);
  sendSuccess(res, devices, "Devices retrieved");
});

export const resetMyDevices = asyncHandler(async (req: AuthRequest, res: Response) => {
  await deviceService.resetMyDevices(req.user!.userId);
  sendSuccess(res, null, "All devices reset. Please re-register.");
});

export const adminGetAllDevices = asyncHandler(async (_req: AuthRequest, res: Response) => {
  const devices = await deviceService.getAll();
  sendSuccess(res, devices, "Devices retrieved");
});

export const adminApproveDevice = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { isApproved } = req.body;
  const device = await deviceService.approve(String(req.params.id), isApproved);
  sendSuccess(res, deviceService.formatDevice(device), isApproved ? "Device approved" : "Device unapproved");
});

export const adminToggleDevice = asyncHandler(async (req: AuthRequest, res: Response) => {
  const device = await deviceService.toggleActive(String(req.params.id));
  sendSuccess(res, deviceService.formatDevice(device), "Device status toggled");
});

export const adminDeleteDevice = asyncHandler(async (req: AuthRequest, res: Response) => {
  await deviceService.delete(String(req.params.id));
  sendSuccess(res, null, "Device removed");
});
