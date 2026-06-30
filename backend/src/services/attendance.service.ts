import { AttendanceStatus } from "@prisma/client";
import prisma from "../config/database";
import { config } from "../config";
import { ActionType, SessionType } from "../types";
import {
  getTodayDate,
  getSessionWindowLabel,
  isLate,
  isWithinSessionWindow,
} from "../utils/helpers";
import { AppError } from "../utils/response";

interface AttendanceActionInput {
  userId: string;
  session: SessionType;
  action: ActionType;
  ipAddress: string;
}

const userSelect = {
  id: true,
  name: true,
  email: true,
  employeeId: true,
  department: true,
};

const formatAttendance = (attendance: {
  id: string;
  userId: string;
  date: Date;
  morningCheckIn: Date | null;
  morningCheckOut: Date | null;
  afternoonCheckIn: Date | null;
  afternoonCheckOut: Date | null;
  morningStatus: AttendanceStatus | null;
  afternoonStatus: AttendanceStatus | null;
  checkInIp: string | null;
  user?: {
    id: string;
    name: string;
    email: string;
    employeeId: string;
    department: string | null;
  };
}) => ({
  ...attendance,
  user: attendance.user
    ? {
        id: attendance.user.id,
        name: attendance.user.name,
        email: attendance.user.email,
        employeeId: attendance.user.employeeId,
        department: attendance.user.department,
      }
    : undefined,
});

const assertIpNotUsedByAnotherUser = async (
  userId: string,
  session: SessionType,
  ipAddress: string,
  today: Date
) => {
  const conflict = await prisma.attendance.findFirst({
    where: {
      date: today,
      checkInIp: ipAddress,
      userId: { not: userId },
      ...(session === "MORNING"
        ? { morningCheckIn: { not: null } }
        : { afternoonCheckIn: { not: null } }),
    },
    include: { user: { select: { name: true } } },
  });

  if (conflict) {
    throw new AppError(
      409,
      "This IP address has already been used for attendance in this session today",
      undefined,
      "IP_SESSION_CONFLICT"
    );
  }
};

export const attendanceService = {
  async recordAction({ userId, session, action, ipAddress }: AttendanceActionInput) {
    const now = new Date();
    const today = getTodayDate();

    if (action === "CHECK_IN" && !isWithinSessionWindow(session, now)) {
      throw new AppError(
        400,
        `Check-in is only allowed during the ${session.toLowerCase()} window (${getSessionWindowLabel(session)})`,
        undefined,
        "OUTSIDE_SESSION_WINDOW"
      );
    }

    return prisma.$transaction(async (tx) => {
      let attendance = await tx.attendance.findUnique({
        where: { userId_date: { userId, date: today } },
      });

      if (!attendance) {
        attendance = await tx.attendance.create({
          data: { userId, date: today },
        });
      }

      if (action === "CHECK_IN") {
        await assertIpNotUsedByAnotherUser(userId, session, ipAddress, today);
      }

      if (session === "MORNING") {
        if (action === "CHECK_IN") {
          if (attendance.morningCheckIn) {
            throw new AppError(409, "Morning check-in already recorded", undefined, "DUPLICATE_CHECK_IN");
          }

          const status = isLate(now, config.morning.lateAfterHour, config.morning.lateAfterMinute)
            ? AttendanceStatus.LATE
            : AttendanceStatus.PRESENT;

          const updated = await tx.attendance.update({
            where: { id: attendance.id },
            data: {
              morningCheckIn: now,
              morningStatus: status,
              checkInIp: ipAddress,
            },
            include: { user: { select: userSelect } },
          });

          return formatAttendance(updated);
        }

        if (!attendance.morningCheckIn) {
          throw new AppError(400, "Morning check-in required before check-out", undefined, "CHECK_IN_REQUIRED");
        }
        if (attendance.morningCheckOut) {
          throw new AppError(409, "Morning check-out already recorded", undefined, "DUPLICATE_CHECK_OUT");
        }

        const updated = await tx.attendance.update({
          where: { id: attendance.id },
          data: { morningCheckOut: now },
          include: { user: { select: userSelect } },
        });

        return formatAttendance(updated);
      }

      if (action === "CHECK_IN") {
        if (attendance.afternoonCheckIn) {
          throw new AppError(409, "Afternoon check-in already recorded", undefined, "DUPLICATE_CHECK_IN");
        }

        const status = isLate(now, config.afternoon.lateAfterHour, config.afternoon.lateAfterMinute)
          ? AttendanceStatus.LATE
          : AttendanceStatus.PRESENT;

        const updated = await tx.attendance.update({
          where: { id: attendance.id },
          data: {
            afternoonCheckIn: now,
            afternoonStatus: status,
            checkInIp: ipAddress,
          },
          include: { user: { select: userSelect } },
        });

        return formatAttendance(updated);
      }

      if (!attendance.afternoonCheckIn) {
        throw new AppError(400, "Afternoon check-in required before check-out", undefined, "CHECK_IN_REQUIRED");
      }
      if (attendance.afternoonCheckOut) {
        throw new AppError(409, "Afternoon check-out already recorded", undefined, "DUPLICATE_CHECK_OUT");
      }

      const updated = await tx.attendance.update({
        where: { id: attendance.id },
        data: { afternoonCheckOut: now },
        include: { user: { select: userSelect } },
      });

      return formatAttendance(updated);
    });
  },

  async getMyToday(userId: string) {
    const today = getTodayDate();
    return prisma.attendance.findUnique({
      where: { userId_date: { userId, date: today } },
    });
  },

  async getMyHistory(userId: string, startDate?: string, endDate?: string) {
    const where: { userId: string; date?: { gte?: Date; lte?: Date } } = { userId };

    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }

    return prisma.attendance.findMany({
      where,
      orderBy: { date: "desc" },
      take: 30,
    });
  },

  async getAllAttendances(filters: {
    date?: string;
    startDate?: string;
    endDate?: string;
    userId?: string;
  }) {
    const where: {
      userId?: string;
      date?: Date | { gte?: Date; lte?: Date };
    } = {};

    if (filters.userId) where.userId = filters.userId;

    if (filters.date) {
      where.date = new Date(filters.date);
    } else if (filters.startDate || filters.endDate) {
      where.date = {};
      if (filters.startDate) (where.date as { gte?: Date }).gte = new Date(filters.startDate);
      if (filters.endDate) (where.date as { lte?: Date }).lte = new Date(filters.endDate);
    } else {
      where.date = getTodayDate();
    }

    const records = await prisma.attendance.findMany({
      where,
      include: { user: { select: userSelect } },
      orderBy: { date: "desc" },
    });

    return records.map(formatAttendance);
  },

  async getDashboardStats() {
    const today = getTodayDate();
    const totalEmployees = await prisma.user.count({
      where: { role: "EMPLOYEE", isActive: true },
    });

    const todayAttendances = await prisma.attendance.findMany({
      where: { date: today },
    });

    const presentToday = todayAttendances.filter(
      (a) =>
        a.morningStatus === "PRESENT" ||
        a.morningStatus === "LATE" ||
        a.afternoonStatus === "PRESENT" ||
        a.afternoonStatus === "LATE"
    ).length;

    const lateToday = todayAttendances.filter(
      (a) => a.morningStatus === "LATE" || a.afternoonStatus === "LATE"
    ).length;

    const absentToday = totalEmployees - presentToday;

    return {
      totalEmployees,
      presentToday,
      absentToday: Math.max(0, absentToday),
      lateToday,
      date: today.toISOString().split("T")[0],
    };
  },
};
