"use client";

import { useState, useMemo } from "react";
import { HolidayCalendarEvent, HolidayType } from "@/types/holiday";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  PartyPopper,
  Sparkles,
  Info,
  Repeat,
  MapPin,
  Building2,
  Globe,
} from "lucide-react";

interface HolidayCalendarProps {
  events: HolidayCalendarEvent[];
  onSelectHoliday?: (holiday: HolidayCalendarEvent) => void;
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function getHolidayBadgeStyle(type: HolidayType) {
  switch (type) {
    case "PUBLIC":
      return {
        bg: "bg-red-50 text-red-700 border-red-200",
        pill: "bg-red-500 text-white",
        dot: "bg-red-500",
        label: "Public Holiday",
        icon: Globe,
      };
    case "COMPANY":
      return {
        bg: "bg-blue-50 text-blue-700 border-blue-200",
        pill: "bg-blue-600 text-white",
        dot: "bg-blue-600",
        label: "Company Holiday",
        icon: Building2,
      };
    case "REGIONAL":
      return {
        bg: "bg-amber-50 text-amber-800 border-amber-200",
        pill: "bg-amber-500 text-white",
        dot: "bg-amber-500",
        label: "Regional Holiday",
        icon: MapPin,
      };
    default:
      return {
        bg: "bg-gray-50 text-gray-700 border-gray-200",
        pill: "bg-gray-500 text-white",
        dot: "bg-gray-500",
        label: "Holiday",
        icon: PartyPopper,
      };
  }
}

export function HolidayCalendar({ events, onSelectHoliday }: HolidayCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedHoliday, setSelectedHoliday] = useState<HolidayCalendarEvent | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Navigation handlers
  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Calendar Grid Calculation
  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    const startingDayOfWeek = firstDayOfMonth.getDay();
    const totalDays = lastDayOfMonth.getDate();

    const days: Array<{
      date: Date;
      dayNumber: number;
      isCurrentMonth: boolean;
      isToday: boolean;
      dateKey: string;
      holidays: HolidayCalendarEvent[];
    }> = [];

    // Previous month padding
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const prevDate = new Date(year, month - 1, prevMonthLastDay - i);
      const dateKey = prevDate.toISOString().split("T")[0];
      days.push({
        date: prevDate,
        dayNumber: prevMonthLastDay - i,
        isCurrentMonth: false,
        isToday: false,
        dateKey,
        holidays: [],
      });
    }

    // Current month days
    const todayStr = new Date().toISOString().split("T")[0];
    for (let day = 1; day <= totalDays; day++) {
      const date = new Date(year, month, day);
      const dateKey = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      
      const dayHolidays = events.filter((h) => {
        if (!h.calendarDate) return false;
        // Compare YYYY-MM-DD
        const hDate = new Date(h.calendarDate);
        return (
          hDate.getFullYear() === year &&
          hDate.getMonth() === month &&
          hDate.getDate() === day
        );
      });

      days.push({
        date,
        dayNumber: day,
        isCurrentMonth: true,
        isToday: dateKey === todayStr,
        dateKey,
        holidays: dayHolidays,
      });
    }

    // Next month padding to complete 42 cells (6 rows)
    const remainingCells = 42 - days.length;
    for (let day = 1; day <= remainingCells; day++) {
      const nextDate = new Date(year, month + 1, day);
      const dateKey = nextDate.toISOString().split("T")[0];
      days.push({
        date: nextDate,
        dayNumber: day,
        isCurrentMonth: false,
        isToday: false,
        dateKey,
        holidays: [],
      });
    }

    return days;
  }, [year, month, events]);

  // Upcoming holidays in current view
  const upcomingInMonth = useMemo(() => {
    return events
      .filter((h) => {
        if (!h.calendarDate) return false;
        const d = new Date(h.calendarDate);
        return d.getFullYear() === year && d.getMonth() === month;
      })
      .sort((a, b) => new Date(a.calendarDate!).getTime() - new Date(b.calendarDate!).getTime());
  }, [year, month, events]);

  const handleHolidayClick = (h: HolidayCalendarEvent) => {
    setSelectedHoliday(h);
    if (onSelectHoliday) onSelectHoliday(h);
  };

  return (
    <div className="space-y-6">
      {/* Calendar Header Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-blue-50 text-blue-600">
            <CalendarIcon className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">
              {MONTH_NAMES[month]} {year}
            </h3>
            <p className="text-xs text-gray-500">
              {upcomingInMonth.length} holiday{upcomingInMonth.length === 1 ? "" : "s"} scheduled this month
            </p>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs font-semibold text-gray-600">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-red-500"></span>
            <span>Public</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-blue-600"></span>
            <span>Company</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500"></span>
            <span>Regional</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleToday}>
            Today
          </Button>
          <div className="flex items-center rounded-lg border border-gray-200 bg-gray-50">
            <Button variant="ghost" size="icon" onClick={handlePrevMonth} className="h-8 w-8">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleNextMonth} className="h-8 w-8">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Main Grid View */}
        <Card className="lg:col-span-3 shadow-sm border-gray-200">
          <CardContent className="p-4">
            {/* Days of Week Header */}
            <div className="grid grid-cols-7 mb-2 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">
              {DAYS_OF_WEEK.map((day) => (
                <div key={day} className="py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Grid Cells */}
            <div className="grid grid-cols-7 gap-1.5">
              {calendarDays.map((cell, idx) => {
                const hasHoliday = cell.holidays.length > 0;
                return (
                  <div
                    key={`${cell.dateKey}-${idx}`}
                    className={`min-h-[90px] rounded-lg border p-1.5 transition-all flex flex-col justify-between ${
                      !cell.isCurrentMonth
                        ? "bg-gray-50/50 border-gray-100 text-gray-300"
                        : cell.isToday
                        ? "border-blue-500 bg-blue-50/30 font-bold"
                        : hasHoliday
                        ? "bg-amber-50/20 border-amber-200"
                        : "bg-white border-gray-100 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-xs font-semibold rounded-full h-6 w-6 flex items-center justify-center ${
                          cell.isToday
                            ? "bg-blue-600 text-white shadow-sm"
                            : cell.isCurrentMonth
                            ? "text-gray-700"
                            : "text-gray-300"
                        }`}
                      >
                        {cell.dayNumber}
                      </span>
                      {hasHoliday && (
                        <Sparkles className="h-3.5 w-3.5 text-amber-500 animate-pulse" />
                      )}
                    </div>

                    {/* Holiday Pill / Cards inside cell */}
                    <div className="space-y-1 mt-1 flex-1 overflow-y-auto">
                      {cell.holidays.map((h) => {
                        const style = getHolidayBadgeStyle(h.holidayType);
                        return (
                          <button
                            key={h.id}
                            type="button"
                            onClick={() => handleHolidayClick(h)}
                            className={`w-full text-left p-1 rounded text-[11px] font-semibold border truncate block transition-all shadow-2xs hover:scale-[1.02] ${style.bg}`}
                            title={`${h.name} (${style.label})`}
                          >
                            <span className="flex items-center gap-1">
                              <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${style.dot}`} />
                              <span className="truncate">{h.name}</span>
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Sidebar: Upcoming Holidays This Month */}
        <Card className="shadow-sm border-gray-200">
          <CardHeader className="pb-3 border-b border-gray-100">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <PartyPopper className="h-4 w-4 text-blue-600" />
              This Month&apos;s Holidays
            </CardTitle>
            <CardDescription className="text-xs">
              {MONTH_NAMES[month]} {year}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            {upcomingInMonth.length === 0 ? (
              <div className="py-8 text-center text-sm text-gray-400 space-y-2">
                <Info className="h-8 w-8 mx-auto text-gray-300" />
                <p>No holidays recorded for this month.</p>
              </div>
            ) : (
              upcomingInMonth.map((h) => {
                const style = getHolidayBadgeStyle(h.holidayType);
                const Icon = style.icon;
                const d = new Date(h.calendarDate!);
                return (
                  <div
                    key={h.id}
                    onClick={() => handleHolidayClick(h)}
                    className="p-3 rounded-lg border border-gray-100 hover:border-blue-200 bg-white hover:bg-blue-50/30 transition-all cursor-pointer space-y-2 shadow-2xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-semibold text-sm text-gray-900 leading-snug">{h.name}</h4>
                      <Badge className={`text-[10px] px-1.5 py-0.5 border ${style.bg}`}>
                        {h.holidayType}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-500 font-medium">
                      <span className="flex items-center gap-1 text-gray-700 font-semibold">
                        <CalendarIcon className="h-3.5 w-3.5 text-blue-600" />
                        {d.toLocaleDateString("en-US", { month: "short", day: "numeric", weekday: "short" })}
                      </span>
                      {h.isRecurring && (
                        <span className="flex items-center gap-1 text-purple-600 font-medium" title="Annual Recurring">
                          <Repeat className="h-3 w-3" /> Yearly
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>

      {/* Selected Holiday Detail Modal */}
      {selectedHoliday && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden border border-gray-100">
            <div className="p-6 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-amber-100 text-amber-700">
                    <PartyPopper className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">{selectedHoliday.name}</h3>
                    <p className="text-xs text-gray-500 font-medium">
                      {new Date(selectedHoliday.calendarDate || selectedHoliday.holidayDate).toLocaleDateString("en-US", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3 border-t border-b border-gray-100 py-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 font-medium">Holiday Type</span>
                  <Badge className={getHolidayBadgeStyle(selectedHoliday.holidayType).bg}>
                    {getHolidayBadgeStyle(selectedHoliday.holidayType).label}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-500 font-medium">Annual Recurring</span>
                  <span className="font-semibold text-gray-900 flex items-center gap-1">
                    {selectedHoliday.isRecurring ? (
                      <>
                        <Repeat className="h-4 w-4 text-purple-600" /> Yes (Repeats yearly)
                      </>
                    ) : (
                      "No (One-time)"
                    )}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-500 font-medium">Status</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${selectedHoliday.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                    {selectedHoliday.isActive ? "Active" : "Inactive"}
                  </span>
                </div>

                {selectedHoliday.description && (
                  <div className="pt-2">
                    <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Description</span>
                    <p className="text-xs text-gray-600 bg-gray-50 p-2.5 rounded-lg mt-1 border border-gray-100">
                      {selectedHoliday.description}
                    </p>
                  </div>
                )}
              </div>
            </div>
            <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 flex justify-end">
              <Button variant="outline" size="sm" onClick={() => setSelectedHoliday(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
