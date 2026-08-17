import { apiRequest } from "./api";
import {
  Holiday,
  HolidayStats,
  HolidayCalendarEvent,
  HolidaySummaryReport,
  CreateHolidayInput,
  UpdateHolidayInput,
} from "@/types/holiday";

export interface GetHolidaysParams {
  page?: number;
  limit?: number;
  year?: number;
  type?: string;
  search?: string;
  isActive?: boolean;
}

export interface GetHolidaysResponse {
  holidays: Holiday[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export async function getHolidays(params?: GetHolidaysParams): Promise<GetHolidaysResponse> {
  const query = new URLSearchParams();
  if (params?.page) query.append("page", params.page.toString());
  if (params?.limit) query.append("limit", params.limit.toString());
  if (params?.year) query.append("year", params.year.toString());
  if (params?.type && params.type !== "ALL") query.append("type", params.type);
  if (params?.search) query.append("search", params.search);
  if (params?.isActive !== undefined) query.append("isActive", params.isActive.toString());

  const queryString = query.toString() ? `?${query.toString()}` : "";
  return apiRequest<GetHolidaysResponse>(`/holidays${queryString}`);
}

export async function getHolidayById(id: string): Promise<Holiday> {
  return apiRequest<Holiday>(`/holidays/${id}`);
}

export async function createHoliday(data: CreateHolidayInput): Promise<Holiday> {
  return apiRequest<Holiday>("/holidays", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateHoliday(id: string, data: UpdateHolidayInput): Promise<Holiday> {
  return apiRequest<Holiday>(`/holidays/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteHoliday(id: string): Promise<Holiday> {
  return apiRequest<Holiday>(`/holidays/${id}`, {
    method: "DELETE",
  });
}

export async function getUpcomingHolidays(limit: number = 5): Promise<Holiday[]> {
  return apiRequest<Holiday[]>(`/holidays/upcoming?limit=${limit}`);
}

export async function getHolidayStats(): Promise<HolidayStats> {
  return apiRequest<HolidayStats>("/holidays/stats");
}

export async function getHolidayCalendar(year: number, month?: number): Promise<HolidayCalendarEvent[]> {
  const query = new URLSearchParams({ year: year.toString() });
  if (month) query.append("month", month.toString());
  return apiRequest<HolidayCalendarEvent[]>(`/holidays/calendar?${query.toString()}`);
}

export async function getHolidaySummaryReport(year: number): Promise<HolidaySummaryReport> {
  return apiRequest<HolidaySummaryReport>(`/holidays/reports/summary?year=${year}`);
}
