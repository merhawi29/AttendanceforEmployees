import bcrypt from "bcryptjs";
import prisma from "../config/database";
import { formatUserResponse } from "../utils/helpers";
import { AppError } from "../utils/response";
import { Role } from "../types";
import { logger } from "../utils/logger";

export const userService = {
  async getAll() {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
    });
    return users.map(formatUserResponse);
  },

  async update(
    id: string,
    data: {
      name?: string;
      department?: string;
      isActive?: boolean;
      role?: Role;
    },
    actorId?: string
  ) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new AppError(404, "User not found", undefined, "USER_NOT_FOUND");
    }

    if (data.role && user.role === Role.ADMIN && data.role !== Role.ADMIN) {
      const adminCount = await prisma.user.count({ where: { role: Role.ADMIN, isActive: true } });
      if (adminCount <= 1) {
        throw new AppError(400, "Cannot demote the last active admin", undefined, "LAST_ADMIN");
      }
    }

    if (data.isActive === false && user.role === Role.ADMIN) {
      const adminCount = await prisma.user.count({ where: { role: Role.ADMIN, isActive: true } });
      if (adminCount <= 1) {
        throw new AppError(400, "Cannot deactivate the last active admin", undefined, "LAST_ADMIN");
      }
    }

    const updated = await prisma.user.update({
      where: { id },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.department !== undefined ? { department: data.department } : {}),
        ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
        ...(data.role !== undefined ? { role: data.role } : {}),
      },
    });

    if (data.isActive === false) {
      await prisma.refreshToken.deleteMany({ where: { userId: id } });
    }

    logger.info({ userId: id, actorId, changes: data }, "user updated");
    return formatUserResponse(updated);
  },

  async delete(id: string, actorId?: string) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new AppError(404, "User not found", undefined, "USER_NOT_FOUND");
    }

    if (user.role === Role.ADMIN) {
      const adminCount = await prisma.user.count({ where: { role: Role.ADMIN } });
      if (adminCount <= 1) {
        throw new AppError(400, "Cannot delete the last admin account", undefined, "LAST_ADMIN");
      }
    }

    await prisma.user.delete({ where: { id } });
    logger.info({ userId: id, actorId }, "user deleted");
  },

  async resetPassword(userId: string, newPassword: string, actorId?: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new AppError(404, "User not found", undefined, "USER_NOT_FOUND");
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    // Force user to log in again by deleting all refresh tokens
    await prisma.refreshToken.deleteMany({ where: { userId } });

    logger.info({ userId, actorId }, "user password reset by admin");
  },

  async getUserSummary(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new AppError(404, "User not found", undefined, "USER_NOT_FOUND");
    }

    const records = await prisma.attendance.findMany({
      where: { userId },
    });

    const totalPresentDays = records.filter((r) => r.status === "PRESENT").length;
    const totalLateDays = records.filter((r) => r.status === "LATE").length;
    const totalAbsentDays = records.filter((r) => r.status === "ABSENT").length;
    const totalDays = totalPresentDays + totalLateDays + totalAbsentDays;
    const attendancePercentage = totalDays > 0
      ? Math.round(((totalPresentDays + totalLateDays) / totalDays) * 100)
      : 100;

    return {
      employeeCode: user.employeeId,
      department: user.department,
      email: user.email,
      phone: "—",
      hireDate: user.createdAt.toISOString().split("T")[0],
      attendancePercentage,
      totalPresentDays,
      totalLateDays,
      totalAbsentDays,
    };
  },
};

export const ipService = {
  async getAll() {
    return prisma.allowedIp.findMany({ orderBy: { createdAt: "desc" } });
  },

  async create(ipAddress: string, description?: string) {
    const existing = await prisma.allowedIp.findUnique({ where: { ipAddress } });
    if (existing) {
      throw new AppError(409, "IP address already registered", undefined, "IP_EXISTS");
    }
    return prisma.allowedIp.create({
      data: { ipAddress, description },
    });
  },

  async toggle(id: string, isActive: boolean) {
    const ip = await prisma.allowedIp.findUnique({ where: { id } });
    if (!ip) {
      throw new AppError(404, "IP address not found", undefined, "IP_NOT_FOUND");
    }
    return prisma.allowedIp.update({ where: { id }, data: { isActive } });
  },

  async remove(id: string) {
    const ip = await prisma.allowedIp.findUnique({ where: { id } });
    if (!ip) {
      throw new AppError(404, "IP address not found", undefined, "IP_NOT_FOUND");
    }
    await prisma.allowedIp.delete({ where: { id } });
  },
};
