export type HolidayType = "PUBLIC" | "COMPANY" | "REGIONAL";

export interface Holiday {
  id: string;
  name: string;
  description: string | null;
  holidayDate: string;
  holidayType: HolidayType;
  isRecurring: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  calendarDate?: string;
  formattedDate?: string;
}

export interface CreateHolidayInput {
  name: string;
  description?: string | null;
  holidayDate: string;
  holidayType?: HolidayType;
  isRecurring?: boolean;
  isActive?: boolean;
}

export interface UpdateHolidayInput {
  name?: string;
  description?: string | null;
  holidayDate?: string;
  holidayType?: HolidayType;
  isRecurring?: boolean;
  isActive?: boolean;
}

export interface HolidayStats {
  totalHolidays: number;
  publicHolidays: number;
  companyHolidays: number;
  regionalHolidays: number;
  holidaysThisMonth: number;
  nextHoliday: Holiday | null;
}

export interface HolidayCalendarEvent extends Holiday {
  calendarDate: string;
}

export interface HolidaySummaryReport {
  year: number;
  summary: {
    totalHolidays: number;
    publicHolidays: number;
    companyHolidays: number;
    regionalHolidays: number;
  };
  holidaysByType: Array<{
    name: string;
    count: number;
    type: HolidayType;
  }>;
  holidaysByMonth: Array<{
    month: string;
    monthIndex: number;
    count: number;
  }>;
  records: Holiday[];
}
