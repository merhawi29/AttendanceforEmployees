"use client";

import { useEffect, useState, useCallback } from "react";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { HolidayCalendar, getHolidayBadgeStyle } from "@/components/holidays/holiday-calendar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Holiday, HolidayCalendarEvent, HolidayStats } from "@/types/holiday";
import { getHolidayCalendar, getHolidayStats, getUpcomingHolidays } from "@/lib/holiday-api";
import {
  Loader2,
  Calendar,
  PartyPopper,
  CalendarDays,
  Sparkles,
  Repeat,
  Info,
} from "lucide-react";

function EmployeeHolidaysPageContent() {
  const [stats, setStats] = useState<HolidayStats | null>(null);
  const [upcoming, setUpcoming] = useState<Holiday[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<HolidayCalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const currentYear = new Date().getFullYear();

  const fetchData = useCallback(async () => {
    try {
      const [statsData, upcomingData, calendarData] = await Promise.all([
        getHolidayStats(),
        getUpcomingHolidays(6),
        getHolidayCalendar(currentYear),
      ]);

      setStats(statsData);
      setUpcoming(upcomingData);
      setCalendarEvents(calendarData);
    } finally {
      setLoading(false);
    }
  }, [currentYear]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2.5">
            <PartyPopper className="h-7 w-7 text-blue-600" />
            Company Holidays Calendar
          </h2>
          <p className="text-gray-500 text-sm">
            View upcoming public, company, and regional holidays
          </p>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-3 rounded-xl bg-blue-600 text-white">
              <PartyPopper className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-blue-700 uppercase tracking-wider">Next Holiday</p>
              <p className="text-lg font-bold text-blue-950 truncate max-w-[180px]">
                {stats?.nextHoliday?.name || "None Scheduled"}
              </p>
              {stats?.nextHoliday && (
                <p className="text-xs text-blue-700 font-semibold">
                  {new Date(stats.nextHoliday.holidayDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 border-emerald-200">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-3 rounded-xl bg-emerald-600 text-white">
              <CalendarDays className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">Holidays This Month</p>
              <p className="text-2xl font-bold text-emerald-950">{stats?.holidaysThisMonth || 0}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100/50 border-purple-200">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-3 rounded-xl bg-purple-600 text-white">
              <Calendar className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-purple-800 uppercase tracking-wider">Total Annual Holidays</p>
              <p className="text-2xl font-bold text-purple-950">{stats?.totalHolidays || 0}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Holidays Showcase */}
      <Card className="shadow-2xs border-gray-200">
        <CardHeader className="pb-3 border-b border-gray-100 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-500 animate-pulse" /> Upcoming Holidays
            </CardTitle>
            <CardDescription>Scheduled upcoming holiday breaks</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          {upcoming.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">No upcoming holidays scheduled.</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {upcoming.map((h) => {
                const style = getHolidayBadgeStyle(h.holidayType);
                const d = new Date(h.holidayDate);
                return (
                  <div
                    key={h.id}
                    className="p-4 rounded-xl border border-gray-200 bg-white hover:shadow-md transition-all space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-bold text-gray-900 text-base leading-tight">{h.name}</h4>
                      <Badge className={`text-[10px] px-2 py-0.5 border ${style.bg}`}>
                        {style.label}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between text-xs text-gray-600 font-semibold pt-1 border-t border-gray-100">
                      <span className="flex items-center gap-1.5 text-blue-600">
                        <Calendar className="h-4 w-4" />
                        {d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
                      </span>
                      {h.isRecurring && (
                        <span className="flex items-center gap-1 text-purple-600 font-medium">
                          <Repeat className="h-3 w-3" /> Yearly
                        </span>
                      )}
                    </div>

                    {h.description && (
                      <p className="text-xs text-gray-500 line-clamp-2 bg-gray-50 p-2 rounded-lg">
                        {h.description}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Interactive Monthly Calendar View */}
      <HolidayCalendar events={calendarEvents} />
    </div>
  );
}

export default function EmployeeHolidaysPage() {
  return (
    <ProtectedRoute requiredRole="EMPLOYEE">
      <DashboardLayout>
        <EmployeeHolidaysPageContent />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
