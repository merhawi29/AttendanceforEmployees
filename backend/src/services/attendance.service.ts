import { Attendance, AttendanceStatus, Prisma } from "@prisma/client";
import prisma from "../config/database";
import { settingsService } from "./settings.service";
import { AttendanceSchedule, PunchType } from "../types";
import { getTodayDate } from "../utils/helpers";
import {
  formatEatTime,
  formatEthiopianDateLabel,
  formatTimeLabel,
  getMinutesSinceMidnightEat,
  getSecondsSinceMidnightEat,
  getDateMinutesEat,
  getDateSecondsEat,
  toEthiopianDateString,
  toMinutes,
  toSeconds,
} from "../utils/ethiopian-time";
import { AppError } from "../utils/response";
import { logger } from "../utils/logger";
import { HolidayService } from "./holiday.service";


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

import { parseTimeToHoursMinutes } from "../utils/time-format";

const parseTimeStr = (timeStr: string) => {
  const parsed = parseTimeToHoursMinutes(timeStr);
  if (!parsed) {
    logger.error({ timeStr }, "Invalid time format in settings, using fallback");
    return { hour: 0, minute: 0 };
  }
  return parsed;
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
    morningInStartSec: toSeconds(morningStart.hour, morningStart.minute, 0),
    morningInEndSec: toSeconds(morningEnd.hour, morningEnd.minute, 0),
    lunchOutStartSec: toSeconds(lunchStart.hour, lunchStart.minute, 0),
    lunchReturnDeadlineSec: toSeconds(lunchReturn.hour, lunchReturn.minute, 0),
    finalOutStartSec: toSeconds(finalOut.hour, finalOut.minute, 0),
    gracePeriodMinutes: dbSettings.gracePeriodMinutes,
    gracePeriodSeconds: dbSettings.gracePeriodMinutes * 60,
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

const formatAttendance = (attendance: AttendanceRecord, isHoliday = false) => {
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
        const morningSecs = getDateSecondsEat(new Date(attendance.morningIn));
        if (morningSecs > windows.morningInEndSec) {
          targetStatus = "LATE";
        }
      }
      if (attendance.lunchReturn) {
        const lunchReturnSecs = getDateSecondsEat(new Date(attendance.lunchReturn));
        if (lunchReturnSecs > windows.lunchReturnDeadlineSec + windows.gracePeriodSeconds) {
          targetStatus = "LATE";
        }
      }
      computedStatus = targetStatus;
    }
  } else {
    if (isHoliday || attendance.status === "HOLIDAY") {
      computedStatus = "HOLIDAY";
    } else {
      const today = getTodayDate();
      const recordDate = new Date(attendance.date);
      const recordDateStr = recordDate.toISOString().split("T")[0];
      const todayDateStr = today.toISOString().split("T")[0];

      if (recordDateStr === todayDateStr) {
        const now = new Date();
        const seconds = getSecondsSinceMidnightEat(now);
        const windows = getWindowConfig();
        if (seconds > windows.morningInEndSec) {
          computedStatus = "ABSENT";
        } else {
          computedStatus = "PENDING";
        }
      } else if (recordDate < today) {
        computedStatus = "ABSENT";
      }
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
  const seconds = getSecondsSinceMidnightEat(now);
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
  } else if (seconds < windows.morningInStartSec) {
    morningIn.message = `Check-in available from ${formatTimeLabel(windows.raw.morningIn.startHour, windows.raw.morningIn.startMinute)}`;
  } else if (seconds <= windows.morningInEndSec) {
    morningIn.enabled = true;
    morningIn.message = `Check in now (${windows.labels.morningIn})`;
  } else {
    morningIn.enabled = false;
    morningIn.message = `Morning attendance is closed. Lunch Break starts at ${formatTimeLabel(windows.raw.lunchOut.startHour, windows.raw.lunchOut.startMinute)}`;
  }

  const lunchOut: AttendanceSchedule["steps"]["LUNCH_OUT"] = {
    recorded: hasLunchOut,
    enabled: false,
    message: "",
  };
  if (hasLunchOut) {
    lunchOut.message = "Lunch out recorded";
  } else if (seconds < windows.lunchOutStartSec) {
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
    if (seconds <= windows.lunchReturnDeadlineSec) {
      lunchReturn.message = `Return before ${formatTimeLabel(windows.raw.lunchReturn.deadlineHour, windows.raw.lunchReturn.deadlineMinute)}`;
    } else if (seconds <= windows.lunchReturnDeadlineSec + windows.gracePeriodSeconds) {
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
  if (hasFinalOut) {
    finalOut.message = "Final checkout recorded";
  } else if (seconds < windows.finalOutStartSec) {
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
        const morningSecs = getDateSecondsEat(attendance.morningIn);
        if (morningSecs > windows.morningInEndSec) {
          targetStatus = "LATE";
        }
      }
      if (attendance.lunchReturn) {
        const lunchReturnSecs = getDateSecondsEat(attendance.lunchReturn);
        if (lunchReturnSecs > windows.lunchReturnDeadlineSec + windows.gracePeriodSeconds) {
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
  const seconds = getSecondsSinceMidnightEat(now);
  const windows = getWindowConfig();
  const serverTime = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true });

  logger.info(
    {
      punch,
      serverTime,
      serverSeconds: seconds,
      windows: {
        morningInSec: `${windows.morningInStartSec}-${windows.morningInEndSec}`,
        lunchOutStartSec: windows.lunchOutStartSec,
        lunchReturnDeadlineSec: windows.lunchReturnDeadlineSec,
        finalOutStartSec: windows.finalOutStartSec,
      },
    },
    `Attendance punch validation: ${punch}`
  );

  switch (punch) {
    case "MORNING_IN": {
      if (attendance.morningIn) {
        throw new AppError(409, "Morning check-in already recorded", undefined, "DUPLICATE_PUNCH");
      }
      if (seconds < windows.morningInStartSec) {
        throw new AppError(
          400,
          `Morning check-in opens at ${formatTimeLabel(windows.raw.morningIn.startHour, windows.raw.morningIn.startMinute)}`,
          undefined,
          "OUTSIDE_TIME_WINDOW"
        );
      }
      if (seconds > windows.morningInEndSec) {
        throw new AppError(
          400,
          `Morning attendance is closed. Lunch Break starts at ${formatTimeLabel(windows.raw.lunchOut.startHour, windows.raw.lunchOut.startMinute)}`,
          undefined,
          "OUTSIDE_TIME_WINDOW"
        );
      }
      logger.info({ punch, serverTime, accepted: true }, "Punch ACCEPTED");
      return {
        data: {
          morningIn: now,
          status: "PRESENT",
        },
        message: "Morning check-in recorded",
      };
    }
    case "LUNCH_OUT": {
      const allowedTime = formatTimeLabel(windows.raw.lunchOut.startHour, windows.raw.lunchOut.startMinute);
      const isBeforeAllowed = seconds < windows.lunchOutStartSec;

      if (attendance.lunchOut) {
        throw new AppError(409, "Lunch out already recorded", undefined, "DUPLICATE_PUNCH");
      }
      if (isBeforeAllowed) {
        logger.warn(
          { punch, serverTime, serverSeconds: seconds, allowedStartSec: windows.lunchOutStartSec, allowedTime },
          "LUNCH OUT REJECTED: before allowed time"
        );
        throw new AppError(
          400,
          `Lunch break is not available until ${allowedTime}.`,
          undefined,
          "OUTSIDE_TIME_WINDOW"
        );
      }
      logger.info({ punch, serverTime, accepted: true }, "Punch ACCEPTED");
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
      if (now.getTime() <= new Date(attendance.lunchOut).getTime()) {
        throw new AppError(400, "Lunch return must be after lunch out", undefined, "INVALID_TIME_ORDER");
      }
      const isLate = seconds > windows.lunchReturnDeadlineSec + windows.gracePeriodSeconds;
      logger.info({ punch, serverTime, accepted: true, isLate }, "Punch ACCEPTED");
      return {
        data: {
          lunchReturn: now,
          status: isLate ? "LATE" : (attendance.status === "LATE" ? "LATE" : "PRESENT"),
        },
        message: isLate ? "Lunch return recorded (Late)" : "Lunch return recorded",
      };
    }
    case "FINAL_OUT": {
      if (attendance.finalOut) {
        throw new AppError(409, "Final checkout already recorded", undefined, "DUPLICATE_PUNCH");
      }
      if (seconds < windows.finalOutStartSec) {
        throw new AppError(
          400,
          `Checkout is available after ${formatTimeLabel(windows.raw.finalOut.startHour, windows.raw.finalOut.startMinute)}`,
          undefined,
          "OUTSIDE_TIME_WINDOW"
        );
      }
      logger.info({ punch, serverTime, accepted: true }, "Punch ACCEPTED");
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
    const settings = await settingsService.getSettings();
    const todayHoliday = await HolidayService.isHolidayDate(today);

    let attendance = await prisma.attendance.findUnique({
      where: { userId_date: { userId, date: today } },
    });

    const minutes = getMinutesSinceMidnightEat(now);
    const windows = getWindowConfig();
    const isAfterWork = minutes >= windows.finalOutStart;

    if (!attendance) {
      if (isAfterWork || todayHoliday) {
        const virtualAttendance: Attendance = {
          id: `virtual-${userId}-${today.getTime()}`,
          userId,
          date: today,
          ethiopianDate: toEthiopianDateString(now),
          morningIn: null,
          lunchOut: null,
          lunchReturn: null,
          finalOut: null,
          status: todayHoliday ? "HOLIDAY" : "ABSENT",
          ipAddress: null,
          createdAt: now,
          updatedAt: now,
        };
        return {
          attendance: formatAttendance(virtualAttendance, !!todayHoliday),
          schedule: buildSchedule(virtualAttendance, now),
          settings,
          holiday: todayHoliday ? { name: todayHoliday.name, type: todayHoliday.holidayType } : null,
        };
      } else {
        return {
          attendance: null,
          schedule: buildSchedule(null, now),
          settings,
          holiday: null,
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

      if (!hasAnyPunch && (isAfterWork || todayHoliday)) {
        const attendanceWithComputedStatus = {
          ...attendance,
          status: (todayHoliday ? "HOLIDAY" : "ABSENT") as AttendanceStatus,
        };
        return {
          attendance: formatAttendance(attendanceWithComputedStatus, !!todayHoliday),
          schedule: buildSchedule(attendanceWithComputedStatus, now),
          settings,
          holiday: todayHoliday ? { name: todayHoliday.name, type: todayHoliday.holidayType } : null,
        };
      }
    }

    return {
      attendance: attendance ? formatAttendance(attendance, !!todayHoliday) : null,
      schedule: buildSchedule(attendance, now),
      settings,
      holiday: todayHoliday ? { name: todayHoliday.name, type: todayHoliday.holidayType } : null,
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

    return Promise.all(
      records.map(async (r) => {
        const isH = await HolidayService.isHolidayDate(r.date);
        return formatAttendance(r, !!isH);
      })
    );
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

    return Promise.all(
      records.map(async (r) => {
        const isH = await HolidayService.isHolidayDate(r.date);
        return formatAttendance(r, !!isH);
      })
    );
  },

  async getDashboardStats() {
    const today = getTodayDate();
    const todayHoliday = await HolidayService.isHolidayDate(today);

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
      const morningSecs = getDateSecondsEat(record.morningIn);
      return morningSecs > windows.morningInEndSec;
    }).length;

    const lunchMissingToday = todayAttendances.filter(
      (record) => record.morningIn !== null && record.lunchOut !== null && record.lunchReturn === null
    ).length;

    const now = new Date();
    const seconds = getSecondsSinceMidnightEat(now);
    const isMorningClosed = seconds > windows.morningInEndSec;
    const absentToday = isMorningClosed && !todayHoliday ? Math.max(0, totalEmployees - presentToday) : 0;

    const formattedDate = today.toISOString().split("T")[0];

    return {
      totalEmployees,
      presentToday,
      absentToday,
      lateToday,
      lunchMissingToday,
      isHoliday: !!todayHoliday,
      holidayName: todayHoliday ? todayHoliday.name : null,
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

    const windows = getWindowConfig();
    const serverTime = new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true });

    logger.info(
      { attendanceId: id, userId: record.userId, serverTime, data },
      "Admin edit attendance: validating"
    );

    const resolveTime = (
      value: string | null | undefined,
      existing: Date | null
    ): Date | null => {
      if (value === undefined) return existing;
      if (value === null) return null;
      return new Date(value);
    };

    const resolvedMorningIn = resolveTime(data.morningIn, record.morningIn);
    const resolvedLunchOut = resolveTime(data.lunchOut, record.lunchOut);
    const resolvedLunchReturn = resolveTime(data.lunchReturn, record.lunchReturn);
    const resolvedFinalOut = resolveTime(data.finalOut, record.finalOut);

    if (resolvedMorningIn) {
      const secs = getDateSecondsEat(resolvedMorningIn);
      if (secs < windows.morningInStartSec || secs > windows.morningInEndSec) {
        throw new AppError(
          400,
          `Morning check-in must be between ${formatTimeLabel(windows.raw.morningIn.startHour, windows.raw.morningIn.startMinute)} and ${formatTimeLabel(windows.raw.morningIn.endHour, windows.raw.morningIn.endMinute)}`,
          undefined,
          "OUTSIDE_TIME_WINDOW"
        );
      }
    }

    if (resolvedLunchOut) {
      const secs = getDateSecondsEat(resolvedLunchOut);
      if (secs < windows.lunchOutStartSec) {
        const allowedTime = formatTimeLabel(windows.raw.lunchOut.startHour, windows.raw.lunchOut.startMinute);
        logger.warn(
          { attendanceId: id, lunchOut: data.lunchOut, serverSeconds: secs, allowedStartSec: windows.lunchOutStartSec, allowedTime },
          "Admin edit LUNCH OUT REJECTED: before allowed time"
        );
        throw new AppError(
          400,
          `Lunch break is not available until ${allowedTime}.`,
          undefined,
          "OUTSIDE_TIME_WINDOW"
        );
      }
    }

    if (resolvedLunchReturn) {
      if (!resolvedLunchOut) {
        throw new AppError(
          400,
          "Lunch out is required before setting lunch return",
          undefined,
          "PREREQUISITE_REQUIRED"
        );
      }
      if (resolvedLunchReturn <= resolvedLunchOut) {
        throw new AppError(
          400,
          "Lunch return must be after lunch out",
          undefined,
          "INVALID_TIME_ORDER"
        );
      }
    }

    if (resolvedFinalOut) {
      if (resolvedMorningIn && resolvedFinalOut <= resolvedMorningIn) {
        throw new AppError(
          400,
          "Final checkout must be after morning check-in",
          undefined,
          "INVALID_TIME_ORDER"
        );
      }
      if (resolvedLunchReturn && resolvedFinalOut <= resolvedLunchReturn) {
        throw new AppError(
          400,
          "Final checkout must be after lunch return",
          undefined,
          "INVALID_TIME_ORDER"
        );
      }
      if (!resolvedLunchReturn && resolvedLunchOut && resolvedFinalOut <= resolvedLunchOut) {
        throw new AppError(
          400,
          "Final checkout must be after lunch out",
          undefined,
          "INVALID_TIME_ORDER"
        );
      }
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
