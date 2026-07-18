import { Response, NextFunction } from "express";
import prisma from "../config/database";
import { AuthRequest } from "../types";
import { AppError } from "../utils/response";
import { validateDeviceFingerprint } from "../services/device.service";

export const deviceRestriction = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
) => {
  try {
    const deviceId = req.headers["x-device-id"] as string;
    const fingerprint = req.headers["x-device-fingerprint"] as string;

    if (!deviceId) {
      return next(
        new AppError(403, "Device registration required. Please register your device.", undefined, "DEVICE_REQUIRED")
      );
    }

    const device = await prisma.employeeDevice.findUnique({
      where: { deviceId },
    });

    if (!device) {
      return next(
        new AppError(403, "Device not recognized. Please register your device.", undefined, "DEVICE_NOT_FOUND")
      );
    }

    if (!device.isActive) {
      return next(
        new AppError(403, "Device has been deactivated. Contact your administrator.", undefined, "DEVICE_INACTIVE")
      );
    }

    if (!device.isApproved) {
      return next(
        new AppError(403, "Device pending approval. Contact your administrator.", undefined, "DEVICE_NOT_APPROVED")
      );
    }

    if (device.employeeId !== req.user!.userId) {
      return next(
        new AppError(403, "Device is registered to another user.", undefined, "DEVICE_MISMATCH")
      );
    }

    if (device.fingerprint && device.fingerprint !== fingerprint) {
      return next(
        new AppError(403, "Device fingerprint mismatch. Access denied.", undefined, "DEVICE_FORBIDDEN")
      );
    }

    // Dynamic fingerprint validation on every check
    const validation = validateDeviceFingerprint({
      userAgent: device.userAgent,
      platform: device.platform,
      maxTouchPoints: device.maxTouchPoints,
      screenWidth: device.screenWidth,
      screenHeight: device.screenHeight,
    });

    if (!validation.valid) {
      // Invalidate the device immediately in the database
      await prisma.employeeDevice.update({
        where: { id: device.id },
        data: { isApproved: false, isActive: false },
      });
      return next(
        new AppError(403, "Attendance is only allowed from approved desktop or laptop computers.", undefined, "DEVICE_FORBIDDEN")
      );
    }

    await prisma.employeeDevice.update({
      where: { id: device.id },
      data: { lastUsedAt: new Date() },
    });

    next();
  } catch (error) {
    if (error instanceof AppError) {
      return next(error);
    }
    next(new AppError(500, "Device verification failed"));
  }
};
