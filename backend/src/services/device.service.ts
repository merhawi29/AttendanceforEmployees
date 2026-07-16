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
}): { valid: boolean; reason?: string; deviceType?: string; signals?: Record<string, any> } {
  const ua = device.userAgent || "";
  const platform = device.platform || "";
  const maxTouchPoints = device.maxTouchPoints || 0;
  const screenWidth = device.screenWidth || 0;
  const screenHeight = device.screenHeight || 0;

  const signals: Record<string, any> = {
    userAgent: ua,
    platform,
    maxTouchPoints,
    screenWidth,
    screenHeight,
  };

  // --- Mobile signal detection ---

  const hasAndroidUA = /Android/i.test(ua);
  const hasIPhoneUA = /iPhone/i.test(ua);
  const hasIPadUA = /iPad/i.test(ua);
  const hasIPodUA = /iPod/i.test(ua);
  const hasMobileUA = /Mobile/i.test(ua);
  const hasTabletUA = /Tablet/i.test(ua);
  const hasOperaMiniUA = /Opera Mini/i.test(ua);
  const hasIEMobileUA = /IEMobile/i.test(ua);

  const hasAnyMobileUA = hasAndroidUA || hasIPhoneUA || hasIPadUA || hasIPodUA || hasMobileUA || hasTabletUA || hasOperaMiniUA || hasIEMobileUA;

  const isArmPlatform = platform.toLowerCase().includes("arm") || platform.toLowerCase().includes("aarch64");
  const isAndroidPlatform = platform.toLowerCase().includes("android");
  const isIPadDesktopMode = platform === "MacIntel" && maxTouchPoints > 0;

  const minDimension = Math.min(screenWidth, screenHeight);
  const hasSmallTouchScreen = minDimension > 0 && minDimension < 768 && maxTouchPoints > 0;

  const mobileSignals = [
    hasAnyMobileUA ? "mobile-ua" : null,
    isAndroidPlatform ? "android-platform" : null,
    isIPadDesktopMode ? "ipad-desktop-mode" : null,
    isArmPlatform ? "arm-platform" : null,
    hasSmallTouchScreen ? "small-touch-screen" : null,
  ].filter(Boolean);

  let detectedType = "desktop";
  if (mobileSignals.length > 0) {
    if (hasIPhoneUA || hasIPadUA || hasIPodUA || isIPadDesktopMode) {
      detectedType = "ios-device";
    } else if (hasAndroidUA || isAndroidPlatform) {
      detectedType = "android-device";
    } else if (hasTabletUA || hasSmallTouchScreen) {
      detectedType = "tablet";
    } else {
      detectedType = "mobile";
    }
  }

  signals.detectedType = detectedType;
  signals.mobileSignals = mobileSignals;

  console.log("[DeviceValidation] Input signals:", JSON.stringify(signals, null, 2));

  // --- Block mobile devices ---

  if (hasIPhoneUA || hasIPadUA || hasIPodUA || isIPadDesktopMode) {
    console.log("[DeviceValidation] BLOCKED: iOS device detected", mobileSignals);
    return { valid: false, reason: "Mobile devices (iPhone, iPad, iPod) are not allowed. Please use a desktop or laptop computer.", deviceType: detectedType, signals };
  }

  if (hasAndroidUA || isAndroidPlatform) {
    console.log("[DeviceValidation] BLOCKED: Android device detected", mobileSignals);
    return { valid: false, reason: "Mobile devices (Android) are not allowed. Please use a desktop or laptop computer.", deviceType: detectedType, signals };
  }

  if (hasOperaMiniUA || hasIEMobileUA) {
    console.log("[DeviceValidation] BLOCKED: Mobile browser detected", mobileSignals);
    return { valid: false, reason: "Mobile browsers are not allowed. Please use a desktop or laptop computer.", deviceType: detectedType, signals };
  }

  if (hasSmallTouchScreen) {
    console.log("[DeviceValidation] BLOCKED: Tablet/small touch screen detected", mobileSignals);
    return { valid: false, reason: "Tablet devices are not allowed. Please use a desktop or laptop computer.", deviceType: detectedType, signals };
  }

  if (hasMobileUA && !platform.startsWith("Win") && !platform.startsWith("Linux") && platform !== "MacIntel") {
    console.log("[DeviceValidation] BLOCKED: Generic mobile device detected", mobileSignals);
    return { valid: false, reason: "Mobile devices are not allowed. Please use a desktop or laptop computer.", deviceType: detectedType, signals };
  }

  // --- Allow desktop platforms ---

  if (!platform) {
    console.log("[DeviceValidation] BLOCKED: No platform information available", signals);
    return { valid: false, reason: "Unable to verify device platform. Please use a supported desktop browser.", deviceType: "unknown", signals };
  }

  const isWindows = platform.startsWith("Win");
  const isMac = platform === "MacIntel";
  const isLinuxDesktop = platform.startsWith("Linux") && !isArmPlatform;

  if (isWindows || isMac || isLinuxDesktop) {
    console.log("[DeviceValidation] ALLOWED: Desktop detected", { platform, detectedType, isWindows, isMac, isLinuxDesktop });
    return { valid: true, deviceType: "desktop", signals };
  }

  console.log("[DeviceValidation] BLOCKED: Unrecognized platform", signals);
  return { valid: false, reason: "Only Windows, macOS, or Linux desktop computers are allowed.", deviceType: "unknown", signals };
}

export const deviceService = {
  async register(data: RegisterDeviceInput) {
    const validation = validateDeviceFingerprint(data);
    if (!validation.valid) {
      console.log("[DeviceRegister] Registration rejected:", validation.reason, validation.signals);
      throw new AppError(
        403,
        validation.reason || "Attendance is only allowed from approved desktop or laptop computers.",
        undefined,
        "DEVICE_FORBIDDEN"
      );
    }
    console.log("[DeviceRegister] Device validated as:", validation.deviceType, "– proceeding with registration");

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
