import { Attendance, AttendanceStatus, Prisma } from "@prisma/client";
import prisma from "../config/database";
import { config } from "../config";
import { settingsService } from "./settings.service";
import { AttendanceSchedule, PunchType } from "../types";
import { getTodayDate } from "../utils/helpers";
import {
  formatEatTime,
  formatEthiopianDateLabel,
  formatTimeLabel,
  getMinutesSinceMidnightEat,
  toEthiopianDateString,
  toMinutes,
} from "../utils/ethiopian-time";
import { AppError } from "../utils/response";

interface AttendanceActionInput {
  userId: string;
  punch: PunchType;
  ipAddress: string;
}

const userSelect = {
  id: true,
  name: true,
  email: true,
  employeeId: true,
  department: true,
};

type AttendanceRecord = Attendance & {
  user?: {
    id: string;
    name: string;
    email: string;
    employeeId: string;
    department: string | null;
  };
};

const parseTimeStr = (timeStr: string) => {
  const [hour, minute] = timeStr.split(":").map(Number);
  return { hour, minute };
};

const getWindowConfig = () => {
  const dbSettings = settingsService.getSettingsSync();
  const morningStart = parseTimeStr(dbSettings.morningCheckInStart);
  const morningEnd = parseTimeStr(dbSettings.morningCheckInEnd);
  const lunchStart = parseTimeStr(dbSettings.lunchStartTime);
  const lunchReturn = parseTimeStr(dbSettings.lunchReturnDeadline);
  const finalOut = parseTimeStr(dbSettings.workEndTime);

  return {
    morningInStart: toMinutes(morningStart.hour, morningStart.minute),
    morningInEnd: toMinutes(morningEnd.hour, morningEnd.minute),
    lunchOutStart: toMinutes(lunchStart.hour, lunchStart.minute),
    lunchReturnDeadline: toMinutes(lunchReturn.hour, lunchReturn.minute),
    finalOutStart: toMinutes(finalOut.hour, finalOut.minute),
    gracePeriodMinutes: dbSettings.gracePeriodMinutes,
    labels: {
      morningIn: `${formatTimeLabel(morningStart.hour, morningStart.minute)} - ${formatTimeLabel(morningEnd.hour, morningEnd.minute)}`,
      lunchOut: `after ${formatTimeLabel(lunchStart.hour, lunchStart.minute)}`,
      lunchReturn: `before ${formatTimeLabel(lunchReturn.hour, lunchReturn.minute)}`,
      finalOut: `after ${formatTimeLabel(finalOut.hour, finalOut.minute)}`,
    },
    raw: {
      morningIn: {
        startHour: morningStart.hour,
        startMinute: morningStart.minute,
        endHour: morningEnd.hour,
        endMinute: morningEnd.minute,
      },
      lunchOut: {
        startHour: lunchStart.hour,
        startMinute: lunchStart.minute,
      },
      lunchReturn: {
        deadlineHour: lunchReturn.hour,
        deadlineMinute: lunchReturn.minute,
      },
      finalOut: {
        startHour: finalOut.hour,
        startMinute: finalOut.minute,
      },
    },
  };
};

const formatAttendance = (attendance: AttendanceRecord) => {
  const hasAnyPunch = !!(
    attendance.morningIn ||
    attendance.lunchOut ||
    attendance.lunchReturn ||
    attendance.finalOut
  );

  let computedStatus: string | null = attendance.status;

  if (hasAnyPunch) {
    if (!attendance.status) {
      let targetStatus = "PRESENT";
      const windows = getWindowConfig();
      if (attendance.morningIn) {
        const morningInDate = new Date(attendance.morningIn);
        const morningMinutes = morningInDate.getHours() * 60 + morningInDate.getMinutes();
        if (morningMinutes > windows.morningInEnd) {
          targetStatus = "LATE";
        }
      }
      if (attendance.lunchReturn) {
        const lunchReturnDate = new Date(attendance.lunchReturn);
        const lunchReturnMinutes = lunchReturnDate.getHours() * 60 + lunchReturnDate.getMinutes();
        if (lunchReturnMinutes > windows.lunchReturnDeadline + windows.gracePeriodMinutes) {
          targetStatus = "LATE";
        }
      }
      computedStatus = targetStatus;
    }
  } else {
    const today = getTodayDate();
    const recordDate = new Date(attendance.date);
    const recordDateStr = recordDate.toISOString().split("T")[0];
    const todayDateStr = today.toISOString().split("T")[0];

    if (recordDateStr === todayDateStr) {
      const now = new Date();
      const minutes = getMinutesSinceMidnightEat(now);
      const windows = getWindowConfig();
      if (minutes >= windows.finalOutStart) {
        computedStatus = "ABSENT";
      } else {
        computedStatus = "PENDING";
      }
    } else if (recordDate < today) {
      computedStatus = "ABSENT";
    }
  }

  return {
    id: attendance.id,
    userId: attendance.userId,
    date: attendance.date,
    morningIn: attendance.morningIn,
    lunchOut: attendance.lunchOut,
    lunchReturn: attendance.lunchReturn,
    finalOut: attendance.finalOut,
    user: attendance.user
      ? {
          id: attendance.user.id,
          name: attendance.user.name,
          email: attendance.user.email,
          employeeId: attendance.user.employeeId,
          department: attendance.user.department,
        }
      : undefined,
    ethiopianDate: attendance.date.toISOString().split("T")[0],
    ethiopianDateLabel: attendance.date.toISOString().split("T")[0],
    status: computedStatus as AttendanceStatus | null,
    ipAddress: attendance.ipAddress,
  };
};

const buildSchedule = (attendance: Attendance | null, now: Date = new Date()): AttendanceSchedule => {
  const minutes = getMinutesSinceMidnightEat(now);
  const windows = getWindowConfig();
  const formattedDate = now.toISOString().split("T")[0];

  const hasMorningIn = !!attendance?.morningIn;
  const hasLunchOut = !!attendance?.lunchOut;
  const hasLunchReturn = !!attendance?.lunchReturn;
  const hasFinalOut = !!attendance?.finalOut;

  const morningIn: AttendanceSchedule["steps"]["MORNING_IN"] = {
    recorded: hasMorningIn,
    enabled: false,
    message: "",
  };
  if (hasMorningIn) {
    morningIn.message = "Morning check-in recorded";
  } else if (minutes < windows.morningInStart) {
    morningIn.message = `Check-in available from ${formatTimeLabel(windows.raw.morningIn.startHour, windows.raw.morningIn.startMinute)}`;
  } else if (minutes <= windows.morningInEnd) {
    morningIn.enabled = true;
    morningIn.message = `Check in now (${windows.labels.morningIn})`;
  } else {
    morningIn.enabled = false;
    morningIn.message = `Morning attendance is closed. Lunch Break at ${formatTimeLabel(windows.raw.lunchOut.startHour, windows.raw.lunchOut.startMinute)}`;
  }

  const lunchOut: AttendanceSchedule["steps"]["LUNCH_OUT"] = {
    recorded: hasLunchOut,
    enabled: false,
    message: "",
  };
  if (!hasMorningIn) {
    lunchOut.message = "Complete morning check-in first";
  } else if (hasLunchOut) {
    lunchOut.message = "Lunch out recorded";
  } else if (minutes < windows.lunchOutStart) {
    lunchOut.message = `Lunch out available after ${formatTimeLabel(windows.raw.lunchOut.startHour, windows.raw.lunchOut.startMinute)}`;
  } else {
    lunchOut.enabled = true;
    lunchOut.message = "Record lunch break";
  }

  const lunchReturn: AttendanceSchedule["steps"]["LUNCH_RETURN"] = {
    recorded: hasLunchReturn,
    enabled: false,
    message: "",
  };
  if (!hasLunchOut) {
    lunchReturn.message = "Record lunch out first";
  } else if (hasLunchReturn) {
    lunchReturn.message = "Lunch return recorded";
  } else {
    lunchReturn.enabled = true;
    if (minutes <= windows.lunchReturnDeadline) {
      lunchReturn.message = `Return before ${formatTimeLabel(windows.raw.lunchReturn.deadlineHour, windows.raw.lunchReturn.deadlineMinute)}`;
    } else if (minutes <= windows.lunchReturnDeadline + windows.gracePeriodMinutes) {
      lunchReturn.message = "Lunch return (grace period)";
    } else {
      lunchReturn.message = "Lunch return (marked late)";
    }
  }

  const finalOut: AttendanceSchedule["steps"]["FINAL_OUT"] = {
    recorded: hasFinalOut,
    enabled: false,
    message: "",
  };
  if (!hasLunchReturn) {
    finalOut.message = "Complete lunch return first";
  } else if (hasFinalOut) {
    finalOut.message = "Final checkout recorded";
  } else if (minutes < windows.finalOutStart) {
    finalOut.message = `Checkout available after ${formatTimeLabel(windows.raw.finalOut.startHour, windows.raw.finalOut.startMinute)}`;
  } else {
    finalOut.enabled = true;
    finalOut.message = "Record end of workday";
  }

  return {
    currentEatTime: formatEatTime(now),
    ethiopianDate: formattedDate,
    ethiopianDateLabel: formattedDate,
    steps: {
      MORNING_IN: morningIn,
      LUNCH_OUT: lunchOut,
      LUNCH_RETURN: lunchReturn,
      FINAL_OUT: finalOut,
    },
  };
};

const applyAutomaticStatus = async (
  attendance: Attendance,
  now: Date = new Date()
): Promise<Attendance> => {
  const hasAnyPunch = !!(
    attendance.morningIn ||
    attendance.lunchOut ||
    attendance.lunchReturn ||
    attendance.finalOut
  );

  const updates: Prisma.AttendanceUpdateInput = {};

  if (hasAnyPunch) {
    if (!attendance.status) {
      let targetStatus: AttendanceStatus = "PRESENT";
      const windows = getWindowConfig();
      if (attendance.morningIn) {
        const morningMinutes = attendance.morningIn.getHours() * 60 + attendance.morningIn.getMinutes();
        if (morningMinutes > windows.morningInEnd) {
          targetStatus = "LATE";
        }
      }
      if (attendance.lunchReturn) {
        const lunchReturnMinutes = attendance.lunchReturn.getHours() * 60 + attendance.lunchReturn.getMinutes();
        if (lunchReturnMinutes > windows.lunchReturnDeadline + windows.gracePeriodMinutes) {
          targetStatus = "LATE";
        }
      }
      if (attendance.status !== targetStatus) {
        updates.status = targetStatus;
      }
    }
  } else {
    if (attendance.status !== null) {
      updates.status = null;
    }
  }

  if (Object.keys(updates).length === 0) {
    return attendance;
  }

  return prisma.attendance.update({
    where: { id: attendance.id },
    data: updates,
  });
};

const validatePunch = (
  punch: PunchType,
  attendance: Attendance,
  now: Date
): { data: Prisma.AttendanceUpdateInput; message: string } => {
  const minutes = getMinutesSinceMidnightEat(now);
  const windows = getWindowConfig();

  switch (punch) {
    case "MORNING_IN": {
      if (attendance.morningIn) {
        throw new AppError(409, "Morning check-in already recorded", undefined, "DUPLICATE_PUNCH");
      }
      if (minutes < windows.morningInStart) {
        throw new AppError(
          400,
          `Morning check-in opens at ${formatTimeLabel(windows.raw.morningIn.startHour, windows.raw.morningIn.startMinute)}`,
          undefined,
          "OUTSIDE_TIME_WINDOW"
        );
      }
      if (minutes > windows.morningInEnd) {
        throw new AppError(
          400,
          `Morning attendance is closed. Lunch Break at ${formatTimeLabel(windows.raw.lunchOut.startHour, windows.raw.lunchOut.startMinute)}`,
          undefined,
          "OUTSIDE_TIME_WINDOW"
        );
      }
      return {
        data: {
          morningIn: now,
          status: "PRESENT",
        },
        message: "Morning check-in recorded",
      };
    }
    case "LUNCH_OUT": {
      if (!attendance.morningIn) {
        throw new AppError(400, "Morning check-in required before lunch out", undefined, "PREREQUISITE_REQUIRED");
      }
      if (attendance.lunchOut) {
        throw new AppError(409, "Lunch out already recorded", undefined, "DUPLICATE_PUNCH");
      }
      if (minutes < windows.lunchOutStart) {
        throw new AppError(
          400,
          `Lunch out is available after ${formatTimeLabel(windows.raw.lunchOut.startHour, windows.raw.lunchOut.startMinute)}`,
          undefined,
          "OUTSIDE_TIME_WINDOW"
        );
      }
      return {
        data: { lunchOut: now, status: attendance.status === "LATE" ? "LATE" : "PRESENT" },
        message: "Lunch out recorded",
      };
    }
    case "LUNCH_RETURN": {
      if (!attendance.lunchOut) {
        throw new AppError(400, "Lunch out required before lunch return", undefined, "PREREQUISITE_REQUIRED");
      }
      if (attendance.lunchReturn) {
        throw new AppError(409, "Lunch return already recorded", undefined, "DUPLICATE_PUNCH");
      }
      const isLate = minutes > windows.lunchReturnDeadline + windows.gracePeriodMinutes; // after deadline + grace period
      return {
        data: {
          lunchReturn: now,
          status: isLate ? "LATE" : (attendance.status === "LATE" ? "LATE" : "PRESENT"),
        },
        message: isLate ? "Lunch return recorded (Late)" : "Lunch return recorded",
      };
    }
    case "FINAL_OUT": {
      if (!attendance.lunchReturn) {
        throw new AppError(400, "Lunch return required before checkout", undefined, "PREREQUISITE_REQUIRED");
      }
      if (attendance.finalOut) {
        throw new AppError(409, "Final checkout already recorded", undefined, "DUPLICATE_PUNCH");
      }
      if (minutes < windows.finalOutStart) {
        throw new AppError(
          400,
          `Checkout is available after ${formatTimeLabel(windows.raw.finalOut.startHour, windows.raw.finalOut.startMinute)}`,
          undefined,
          "OUTSIDE_TIME_WINDOW"
        );
      }
      return {
        data: { finalOut: now, status: attendance.status === "LATE" ? "LATE" : "PRESENT" },
        message: "Final checkout recorded",
      };
    }
    default:
      throw new AppError(400, "Invalid punch type", undefined, "INVALID_PUNCH");
  }
};

export const attendanceService = {
  async recordAction({ userId, punch, ipAddress }: AttendanceActionInput) {
    const now = new Date();
    const today = getTodayDate();

    return prisma.$transaction(async (tx) => {
      let attendance = await tx.attendance.findUnique({
        where: { userId_date: { userId, date: today } },
      });

      if (!attendance) {
        attendance = await tx.attendance.create({
          data: {
            userId,
            date: today,
            ethiopianDate: toEthiopianDateString(now),
          },
        });
      }

      attendance = await applyAutomaticStatus(attendance, now);

      const { data, message } = validatePunch(punch, attendance, now);

      const updated = await tx.attendance.update({
        where: { id: attendance.id },
        data: {
          ...data,
          ...(punch === "MORNING_IN" ? { ipAddress } : {}),
        },
        include: { user: { select: userSelect } },
      });

      return {
        attendance: formatAttendance(updated),
        schedule: buildSchedule(updated, now),
        message,
      };
    });
  },

  async getMyToday(userId: string) {
    const now = new Date();
    const today = getTodayDate();

    let attendance = await prisma.attendance.findUnique({
      where: { userId_date: { userId, date: today } },
    });

    const minutes = getMinutesSinceMidnightEat(now);
    const windows = getWindowConfig();
    const isAfterWork = minutes >= windows.finalOutStart;

    if (!attendance) {
      if (isAfterWork) {
        const virtualAttendance: Attendance = {
          id: `virtual-${userId}-${today.getTime()}`,
          userId,
          date: today,
          ethiopianDate: toEthiopianDateString(now),
          morningIn: null,
          lunchOut: null,
          lunchReturn: null,
          finalOut: null,
          status: "ABSENT",
          ipAddress: null,
          createdAt: now,
          updatedAt: now,
        };
        return {
          attendance: formatAttendance(virtualAttendance),
          schedule: buildSchedule(virtualAttendance, now),
        };
      } else {
        return {
          attendance: null,
          schedule: buildSchedule(null, now),
        };
      }
    } else {
      attendance = await applyAutomaticStatus(attendance, now);

      const hasAnyPunch = !!(
        attendance.morningIn ||
        attendance.lunchOut ||
        attendance.lunchReturn ||
        attendance.finalOut
      );

      if (!hasAnyPunch && isAfterWork) {
        const attendanceWithComputedStatus = {
          ...attendance,
          status: "ABSENT" as const,
        };
        return {
          attendance: formatAttendance(attendanceWithComputedStatus),
          schedule: buildSchedule(attendanceWithComputedStatus, now),
        };
      }
    }

    return {
      attendance: attendance ? formatAttendance(attendance) : null,
      schedule: buildSchedule(attendance, now),
    };
  },

  async getMyHistory(userId: string, startDate?: string, endDate?: string) {
    const where: { userId: string; date?: { gte?: Date; lte?: Date } } = { userId };

    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }

    const records = await prisma.attendance.findMany({
      where,
      orderBy: { date: "desc" },
      take: 30,
    });

    return records.map(formatAttendance);
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
      (record) =>
        record.morningIn !== null ||
        record.lunchOut !== null ||
        record.lunchReturn !== null ||
        record.finalOut !== null
    ).length;

    const windows = getWindowConfig();
    const lateToday = todayAttendances.filter((record) => {
      if (record.morningIn === null) return false;
      const morningMinutes = record.morningIn.getHours() * 60 + record.morningIn.getMinutes();
      return morningMinutes > windows.morningInEnd;
    }).length;

    const lunchMissingToday = todayAttendances.filter(
      (record) => record.morningIn !== null && record.lunchOut !== null && record.lunchReturn === null
    ).length;

    const now = new Date();
    const minutes = getMinutesSinceMidnightEat(now);
    const isAfterWork = minutes >= windows.finalOutStart;
    const absentToday = isAfterWork ? (totalEmployees - presentToday) : 0;

    const formattedDate = today.toISOString().split("T")[0];

    return {
      totalEmployees,
      presentToday,
      absentToday,
      lateToday,
      lunchMissingToday,
      date: formattedDate,
      ethiopianDate: formattedDate,
      ethiopianDateLabel: formattedDate,
    };
  },

  async adminEditAttendance(
    id: string,
    data: {
      morningIn?: string | null;
      lunchOut?: string | null;
      lunchReturn?: string | null;
      finalOut?: string | null;
      status?: AttendanceStatus | null;
    }
  ) {
    const record = await prisma.attendance.findUnique({
      where: { id },
    });

    if (!record) {
      throw new AppError(404, "Attendance record not found", undefined, "RECORD_NOT_FOUND");
    }

    const updates: Prisma.AttendanceUpdateInput = {};
    if (data.morningIn !== undefined) {
      updates.morningIn = data.morningIn ? new Date(data.morningIn) : null;
    }
    if (data.lunchOut !== undefined) {
      updates.lunchOut = data.lunchOut ? new Date(data.lunchOut) : null;
    }
    if (data.lunchReturn !== undefined) {
      updates.lunchReturn = data.lunchReturn ? new Date(data.lunchReturn) : null;
    }
    if (data.finalOut !== undefined) {
      updates.finalOut = data.finalOut ? new Date(data.finalOut) : null;
    }
    if (data.status !== undefined) {
      updates.status = data.status;
    }

    const updated = await prisma.attendance.update({
      where: { id },
      data: updates,
      include: { user: { select: userSelect } },
    });

    return formatAttendance(updated);
  },
};
