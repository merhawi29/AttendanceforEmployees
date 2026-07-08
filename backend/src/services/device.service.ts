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
}

export const deviceService = {
  async register(data: RegisterDeviceInput) {
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

  formatDevice(device: Record<string, unknown>) {
    return {
      id: device.id,
      employeeId: device.employeeId,
      deviceId: device.deviceId,
      deviceName: device.deviceName,
      browser: device.browser,
      operatingSystem: device.operatingSystem,
      ipAddress: device.ipAddress,
      isApproved: device.isApproved,
      isActive: device.isActive,
      createdAt: device.createdAt instanceof Date ? device.createdAt.toISOString() : device.createdAt,
      updatedAt: device.updatedAt instanceof Date ? device.updatedAt.toISOString() : device.updatedAt,
      lastUsedAt: device.lastUsedAt instanceof Date ? device.lastUsedAt.toISOString() : device.lastUsedAt,
      employee: device.user || undefined,
    };
  },
};
