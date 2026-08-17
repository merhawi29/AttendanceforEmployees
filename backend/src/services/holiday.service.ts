import { Holiday, HolidayType, Prisma } from "@prisma/client";
import prisma from "../config/database";
import { AppError } from "../utils/response";
import { CreateHolidayInput, GetHolidaysQuery, UpdateHolidayInput } from "../validators/holiday.validator";

export class HolidayService {
  /**
   * Create a new Holiday record
   */
  static async createHoliday(data: CreateHolidayInput): Promise<Holiday> {
    const holidayDate = new Date(data.holidayDate);
    
    return prisma.holiday.create({
      data: {
        name: data.name.trim(),
        description: data.description ? data.description.trim() : null,
        holidayDate,
        holidayType: data.holidayType,
        isRecurring: data.isRecurring ?? false,
        isActive: data.isActive ?? true,
      },
    });
  }

  /**
   * Update an existing Holiday record
   */
  static async updateHoliday(id: string, data: UpdateHolidayInput): Promise<Holiday> {
    const existing = await prisma.holiday.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError(404, "Holiday not found", undefined, "HOLIDAY_NOT_FOUND");
    }

    const updates: Prisma.HolidayUpdateInput = {};
    if (data.name !== undefined) updates.name = data.name.trim();
    if (data.description !== undefined) updates.description = data.description ? data.description.trim() : null;
    if (data.holidayDate !== undefined) updates.holidayDate = new Date(data.holidayDate);
    if (data.holidayType !== undefined) updates.holidayType = data.holidayType;
    if (data.isRecurring !== undefined) updates.isRecurring = data.isRecurring;
    if (data.isActive !== undefined) updates.isActive = data.isActive;

    return prisma.holiday.update({
      where: { id },
      data: updates,
    });
  }

  /**
   * Delete a Holiday record
   */
  static async deleteHoliday(id: string): Promise<Holiday> {
    const existing = await prisma.holiday.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError(404, "Holiday not found", undefined, "HOLIDAY_NOT_FOUND");
    }

    return prisma.holiday.delete({
      where: { id },
    });
  }

  /**
   * Get Holiday by ID
   */
  static async getHolidayById(id: string): Promise<Holiday> {
    const holiday = await prisma.holiday.findUnique({ where: { id } });
    if (!holiday) {
      throw new AppError(404, "Holiday not found", undefined, "HOLIDAY_NOT_FOUND");
    }
    return holiday;
  }

  /**
   * List / Search / Filter Holidays
   */
  static async getHolidays(filters: GetHolidaysQuery) {
    const { page = 1, limit = 10, year, type, search, isActive, sortBy = "holidayDate", sortOrder = "asc" } = filters;
    const skip = (page - 1) * limit;

    const where: Prisma.HolidayWhereInput = {};

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    if (type) {
      where.holidayType = type as HolidayType;
    }

    if (search && search.trim()) {
      where.OR = [
        { name: { contains: search.trim() } },
        { description: { contains: search.trim() } },
      ];
    }

    if (year) {
      const startOfYear = new Date(year, 0, 1);
      const endOfYear = new Date(year, 11, 31, 23, 59, 59, 999);
      where.holidayDate = {
        gte: startOfYear,
        lte: endOfYear,
      };
    }

    const [holidays, total] = await Promise.all([
      prisma.holiday.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
      prisma.holiday.count({ where }),
    ]);

    return {
      holidays,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * Get Upcoming Holidays (from today onwards)
   */
  static async getUpcomingHolidays(limit: number = 5): Promise<Holiday[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const holidays = await prisma.holiday.findMany({
      where: {
        isActive: true,
        OR: [
          { holidayDate: { gte: today } },
          { isRecurring: true },
        ],
      },
      orderBy: { holidayDate: "asc" },
    });

    // Map & sort including recurring annual holidays
    const currentYear = today.getFullYear();
    const resolvedHolidays = holidays.map((h) => {
      const date = new Date(h.holidayDate);
      if (h.isRecurring && date < today) {
        // Adjust year to current or next year
        const nextOccurrence = new Date(currentYear, date.getMonth(), date.getDate());
        if (nextOccurrence < today) {
          nextOccurrence.setFullYear(currentYear + 1);
        }
        return { ...h, resolvedDate: nextOccurrence };
      }
      return { ...h, resolvedDate: date };
    }).filter((h) => h.resolvedDate >= today);

    resolvedHolidays.sort((a, b) => a.resolvedDate.getTime() - b.resolvedDate.getTime());

    return resolvedHolidays.slice(0, limit).map(({ resolvedDate, ...h }) => ({
      ...h,
      holidayDate: resolvedDate,
    }));
  }

  /**
   * Get Holiday Stats (Total, Public, Company, Regional, Holidays This Month)
   */
  static async getHolidayStats() {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    const startOfYear = new Date(currentYear, 0, 1);
    const endOfYear = new Date(currentYear, 11, 31, 23, 59, 59);

    const [total, publicCount, companyCount, regionalCount, allActiveHolidays] = await Promise.all([
      prisma.holiday.count({ where: { isActive: true } }),
      prisma.holiday.count({ where: { isActive: true, holidayType: "PUBLIC" } }),
      prisma.holiday.count({ where: { isActive: true, holidayType: "COMPANY" } }),
      prisma.holiday.count({ where: { isActive: true, holidayType: "REGIONAL" } }),
      prisma.holiday.findMany({ where: { isActive: true } }),
    ]);

    const holidaysThisMonth = allActiveHolidays.filter((h) => {
      const d = new Date(h.holidayDate);
      if (d.getFullYear() === currentYear && d.getMonth() === currentMonth) {
        return true;
      }
      if (h.isRecurring && d.getMonth() === currentMonth) {
        return true;
      }
      return false;
    }).length;

    const upcoming = await this.getUpcomingHolidays(1);
    const nextHoliday = upcoming[0] || null;

    return {
      totalHolidays: total,
      publicHolidays: publicCount,
      companyHolidays: companyCount,
      regionalHolidays: regionalCount,
      holidaysThisMonth,
      nextHoliday,
    };
  }

  /**
   * Get Holiday Calendar for a given year & month
   */
  static async getHolidayCalendar(year: number, month?: number) {
    const targetMonth = month !== undefined ? month - 1 : undefined;

    const holidays = await prisma.holiday.findMany({
      where: { isActive: true },
      orderBy: { holidayDate: "asc" },
    });

    return holidays.filter((h) => {
      const d = new Date(h.holidayDate);
      if (h.isRecurring) {
        return targetMonth !== undefined ? d.getMonth() === targetMonth : true;
      }
      const matchesYear = d.getFullYear() === year;
      const matchesMonth = targetMonth !== undefined ? d.getMonth() === targetMonth : true;
      return matchesYear && matchesMonth;
    }).map((h) => {
      const d = new Date(h.holidayDate);
      const calendarDate = h.isRecurring ? new Date(year, d.getMonth(), d.getDate()) : d;
      return {
        ...h,
        calendarDate: calendarDate.toISOString().split("T")[0],
      };
    });
  }

  /**
   * Holiday Summary Report Analytics
   */
  static async getHolidaySummaryReport(year: number = new Date().getFullYear()) {
    const startOfYear = new Date(year, 0, 1);
    const endOfYear = new Date(year, 11, 31, 23, 59, 59, 999);

    const holidays = await prisma.holiday.findMany({
      where: {
        isActive: true,
      },
      orderBy: { holidayDate: "asc" },
    });

    const yearHolidays = holidays.filter((h) => {
      const d = new Date(h.holidayDate);
      return d.getFullYear() === year || h.isRecurring;
    });

    const publicCount = yearHolidays.filter((h) => h.holidayType === "PUBLIC").length;
    const companyCount = yearHolidays.filter((h) => h.holidayType === "COMPANY").length;
    const regionalCount = yearHolidays.filter((h) => h.holidayType === "REGIONAL").length;

    // Holidays By Type chart data
    const holidaysByType = [
      { name: "Public Holidays", count: publicCount, type: "PUBLIC" },
      { name: "Company Holidays", count: companyCount, type: "COMPANY" },
      { name: "Regional Holidays", count: regionalCount, type: "REGIONAL" },
    ];

    // Holidays By Month chart data (12 months)
    const monthNames = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
    ];

    const holidaysByMonth = monthNames.map((monthName, index) => {
      const count = yearHolidays.filter((h) => {
        const d = new Date(h.holidayDate);
        return d.getMonth() === index;
      }).length;

      return {
        month: monthName,
        monthIndex: index + 1,
        count,
      };
    });

    return {
      year,
      summary: {
        totalHolidays: yearHolidays.length,
        publicHolidays: publicCount,
        companyHolidays: companyCount,
        regionalHolidays: regionalCount,
      },
      holidaysByType,
      holidaysByMonth,
      records: yearHolidays.map((h) => {
        const d = new Date(h.holidayDate);
        const resolved = h.isRecurring ? new Date(year, d.getMonth(), d.getDate()) : d;
        return {
          ...h,
          formattedDate: resolved.toISOString().split("T")[0],
        };
      }),
    };
  }

  /**
   * Helper utility: Checks if a given target date is an active holiday
   */
  static async isHolidayDate(date: Date): Promise<Holiday | null> {
    const targetMonth = date.getMonth();
    const targetDay = date.getDate();
    const dateStr = date.toISOString().split("T")[0];

    const activeHolidays = await prisma.holiday.findMany({
      where: { isActive: true },
    });

    for (const h of activeHolidays) {
      const hDate = new Date(h.holidayDate);
      const hDateStr = hDate.toISOString().split("T")[0];

      if (hDateStr === dateStr) {
        return h;
      }

      if (h.isRecurring && hDate.getMonth() === targetMonth && hDate.getDate() === targetDay) {
        return h;
      }
    }

    return null;
  }
}
