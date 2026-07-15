import prisma from "../config/database";
import { AppError } from "../utils/response";

interface RegisterDeviceInput {
  employeeId: string;
  deviceId: string;
  deviceName?: string;
  browser?: string;
  operatingSystem?: string;
  userAgent?: string;
  ipAddress?: string;
  platform?: string;
  maxTouchPoints?: number;
  screenWidth?: number;
  screenHeight?: number;
  fingerprint?: string;
}

export function validateDeviceFingerprint(device: {
  userAgent?: string | null;
  platform?: string | null;
  maxTouchPoints?: number | null;
  screenWidth?: number | null;
  screenHeight?: number | null;
}): { valid: boolean; reason?: string } {
  const ua = device.userAgent || "";
  const platform = device.platform || "";
  const maxTouchPoints = device.maxTouchPoints || 0;
  const screenWidth = device.screenWidth || 0;
  const screenHeight = device.screenHeight || 0;

  // 1. Block common mobile User-Agents
  const mobileUAPatterns = [/Android/i, /iPhone/i, /iPad/i, /iPod/i, /Mobile/i, /Tablet/i, /Opera Mini/i, /IEMobile/i];
  if (mobileUAPatterns.some((p) => p.test(ua))) {
    return { valid: false, reason: "Mobile user-agent detected." };
  }

  // 2. Block iPad in Desktop mode (platform MacIntel + touch capability)
  if (platform === "MacIntel" && maxTouchPoints > 0) {
    return { valid: false, reason: "iPad/iOS device in Desktop Mode detected." };
  }

  // 3. Block Android in Desktop mode
  const isArmLinux = platform.toLowerCase().includes("arm") || platform.toLowerCase().includes("aarch64") || platform.toLowerCase().includes("android");
  if (isArmLinux) {
    return { valid: false, reason: "ARM/Android device detected." };
  }

  // 4. Block tablets & mobile screens based on size and touch
  const minDimension = Math.min(screenWidth, screenHeight);
  if (minDimension > 0 && minDimension < 600 && maxTouchPoints > 0) {
    return { valid: false, reason: "Mobile or tablet screen characteristics detected." };
  }

  // 5. Only allow approved desktop operating systems/platforms:
  const isWindows = platform.startsWith("Win");
  const isMac = platform === "MacIntel" && maxTouchPoints === 0;
  const isLinuxDesktop = (platform.startsWith("Linux") || platform.includes("x86")) && !isArmLinux;

  if (!platform) {
    return { valid: false, reason: "Unable to verify device platform." };
  }

  if (!isWindows && !isMac && !isLinuxDesktop) {
    return { valid: false, reason: "Only Windows, macOS, or Linux desktop computers are allowed." };
  }

  return { valid: true };
}

export const deviceService = {
  async register(data: RegisterDeviceInput) {
    const validation = validateDeviceFingerprint(data);
    if (!validation.valid) {
      throw new AppError(
        403,
        "Attendance is only allowed from approved desktop or laptop computers.",
        undefined,
        "DEVICE_FORBIDDEN"
      );
    }

    const existing = await prisma.employeeDevice.findUnique({
      where: { deviceId: data.deviceId },
    });

    if (existing) {
      if (existing.employeeId !== data.employeeId) {
        throw new AppError(409, "This device is already registered to another employee", undefined, "DEVICE_ALREADY_REGISTERED");
      }
      const updated = await prisma.employeeDevice.update({
        where: { id: existing.id },
        data: {
          deviceName: data.deviceName ?? existing.deviceName,
          browser: data.browser ?? existing.browser,
          operatingSystem: data.operatingSystem ?? existing.operatingSystem,
          userAgent: data.userAgent ?? existing.userAgent,
          ipAddress: data.ipAddress ?? existing.ipAddress,
          platform: data.platform ?? existing.platform,
          maxTouchPoints: data.maxTouchPoints ?? existing.maxTouchPoints,
          screenWidth: data.screenWidth ?? existing.screenWidth,
          screenHeight: data.screenHeight ?? existing.screenHeight,
          fingerprint: data.fingerprint ?? existing.fingerprint,
          isMobile: false,
          lastUsedAt: new Date(),
          isActive: true,
        },
        include: { user: { select: { id: true, name: true, email: true, employeeId: true, department: true } } },
      });
      return this.formatDevice(updated);
    }

    const device = await prisma.employeeDevice.create({
      data: {
        employeeId: data.employeeId,
        deviceId: data.deviceId,
        deviceName: data.deviceName,
        browser: data.browser,
        operatingSystem: data.operatingSystem,
        userAgent: data.userAgent,
        ipAddress: data.ipAddress,
        platform: data.platform,
        maxTouchPoints: data.maxTouchPoints,
        screenWidth: data.screenWidth,
        screenHeight: data.screenHeight,
        fingerprint: data.fingerprint,
        isMobile: false,
        lastUsedAt: new Date(),
      },
      include: { user: { select: { id: true, name: true, email: true, employeeId: true, department: true } } },
    });

    return this.formatDevice(device);
  },

  async getStatus(employeeId: string) {
    const devices = await prisma.employeeDevice.findMany({
      where: { employeeId, isActive: true },
      orderBy: { lastUsedAt: "desc" },
    });

    const approvedDevice = devices.find((d) => d.isApproved);
    return {
      hasDevice: devices.length > 0,
      isApproved: !!approvedDevice,
      device: approvedDevice ? this.formatDevice(approvedDevice) : (devices[0] ? this.formatDevice(devices[0]) : null),
      pendingCount: devices.filter((d) => !d.isApproved).length,
    };
  },

  async getAll() {
    const devices = await prisma.employeeDevice.findMany({
      include: { user: { select: { id: true, name: true, email: true, employeeId: true, department: true } } },
      orderBy: { createdAt: "desc" },
    });
    return devices.map(this.formatDevice);
  },

  async approve(id: string, isApproved: boolean) {
    const device = await prisma.employeeDevice.findUnique({ where: { id } });
    if (!device) {
      throw new AppError(404, "Device not found", undefined, "DEVICE_NOT_FOUND");
    }

    if (isApproved) {
      await prisma.employeeDevice.updateMany({
        where: { employeeId: device.employeeId, isApproved: true },
        data: { isApproved: false },
      });
    }

    return prisma.employeeDevice.update({
      where: { id },
      data: { isApproved },
      include: { user: { select: { id: true, name: true, email: true, employeeId: true, department: true } } },
    });
  },

  async toggleActive(id: string) {
    const device = await prisma.employeeDevice.findUnique({ where: { id } });
    if (!device) {
      throw new AppError(404, "Device not found", undefined, "DEVICE_NOT_FOUND");
    }
    return prisma.employeeDevice.update({
      where: { id },
      data: { isActive: !device.isActive },
      include: { user: { select: { id: true, name: true, email: true, employeeId: true, department: true } } },
    });
  },

  async delete(id: string) {
    const device = await prisma.employeeDevice.findUnique({ where: { id } });
    if (!device) {
      throw new AppError(404, "Device not found", undefined, "DEVICE_NOT_FOUND");
    }
    await prisma.employeeDevice.delete({ where: { id } });
  },

  async getMyDevices(employeeId: string) {
    const devices = await prisma.employeeDevice.findMany({
      where: { employeeId },
      orderBy: { lastUsedAt: "desc" },
    });
    return devices.map(this.formatDevice);
  },

  async resetMyDevices(employeeId: string) {
    await prisma.employeeDevice.updateMany({
      where: { employeeId },
      data: { isApproved: false, isActive: false },
    });
  },

  formatDevice(device: Record<string, any>) {
    return {
      id: device.id,
      employeeId: device.employeeId,
      deviceId: device.deviceId,
      deviceName: device.deviceName,
      browser: device.browser,
      operatingSystem: device.operatingSystem,
      ipAddress: device.ipAddress,
      platform: device.platform,
      maxTouchPoints: device.maxTouchPoints,
      screenWidth: device.screenWidth,
      screenHeight: device.screenHeight,
      isMobile: device.isMobile,
      fingerprint: device.fingerprint,
      isApproved: device.isApproved,
      isActive: device.isActive,
      createdAt: device.createdAt instanceof Date ? device.createdAt.toISOString() : device.createdAt,
      updatedAt: device.updatedAt instanceof Date ? device.updatedAt.toISOString() : device.updatedAt,
      lastUsedAt: device.lastUsedAt instanceof Date ? device.lastUsedAt.toISOString() : device.lastUsedAt,
      employee: device.user || undefined,
    };
  },
};
