"use client";

import { useEffect, useState, useCallback } from "react";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { AttendancePanel, AttendanceHistoryTable } from "@/components/attendance/attendance-panel";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Attendance, AttendanceSchedule, TodayAttendanceResponse, DeviceStatus, AttendanceSettings } from "@/types";
import { apiRequest } from "@/lib/api";
import { formatToAmPm } from "@/lib/time-format";
import { useAuth } from "@/contexts/auth-context";
import { getDeviceInfo } from "@/lib/device";
import {
  Loader2,
  Smartphone,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Clock,
  Building2,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Calendar,
  PartyPopper,
  Sparkles,
  ArrowUpRight,
} from "lucide-react";
import Link from "next/link";

const EMPTY_SCHEDULE: AttendanceSchedule = {
  currentEatTime: "--:--",
  ethiopianDate: "",
  ethiopianDateLabel: "",
  steps: {
    MORNING_IN: { enabled: false, message: "", recorded: false },
    LUNCH_OUT: { enabled: false, message: "", recorded: false },
    LUNCH_RETURN: { enabled: false, message: "", recorded: false },
    FINAL_OUT: { enabled: false, message: "", recorded: false },
  },
};

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function EmployeeDashboard() {
  const { user } = useAuth();
  const [today, setToday] = useState<Attendance | null>(null);
  const [schedule, setSchedule] = useState<AttendanceSchedule>(EMPTY_SCHEDULE);
  const [settings, setSettings] = useState<AttendanceSettings | null>(null);
  const [history, setHistory] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [deviceStatus, setDeviceStatus] = useState<DeviceStatus | null>(null);
  const [registering, setRegistering] = useState(false);
  const [nextHoliday, setNextHoliday] = useState<{ name: string; holidayDate: string } | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [todayData, historyData, devStatus, settingsData, upcomingHolidays] = await Promise.all([
        apiRequest<TodayAttendanceResponse>("/attendance/today"),
        apiRequest<Attendance[]>("/attendance/history"),
        apiRequest<DeviceStatus>("/devices/status").catch(() => null),
        apiRequest<AttendanceSettings>("/attendance/settings").catch(() => null),
        apiRequest<Array<{ name: string; holidayDate: string }>>("/holidays/upcoming?limit=1").catch(() => []),
      ]);
      setToday(todayData.attendance);
      setSchedule(todayData.schedule);
      setSettings(settingsData || todayData.settings || null);
      setHistory(historyData);
      setDeviceStatus(devStatus);
      setNextHoliday(upcomingHolidays[0] || null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();

    const refreshInterval = setInterval(fetchData, 5000);

    const handleRefresh = () => {
      fetchData();
    };

    window.addEventListener("focus", handleRefresh);
    window.addEventListener("storage", handleRefresh);
    window.addEventListener("attendance-settings-updated", handleRefresh);

    return () => {
      clearInterval(refreshInterval);
      window.removeEventListener("focus", handleRefresh);
      window.removeEventListener("storage", handleRefresh);
      window.removeEventListener("attendance-settings-updated", handleRefresh);
    };
  }, [fetchData]);

  const handleRegisterDevice = async () => {
    setRegistering(true);
    try {
      const info = getDeviceInfo();
      await apiRequest("/devices/register", {
        method: "POST",
        body: JSON.stringify(info),
      });
      fetchData();
    } catch {
      // ignore
    } finally {
      setRegistering(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <Loader2 className="h-9 w-9 animate-spin text-blue-500" />
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Loading HRMS Dashboard...</p>
      </div>
    );
  }

  const attendanceStatus = today?.status || "PENDING";
  const isPresent = attendanceStatus === "PRESENT";
  const isLate = attendanceStatus === "LATE";

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Enterprise Welcome Hero Section */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900 to-slate-850 dark:from-slate-900 dark:via-slate-950 dark:to-[#0d1322] text-white p-6 sm:p-7 shadow-lg">
        {/* Subtle Background Glow Accent */}
        <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-blue-600/20 blur-3xl pointer-events-none" />
        <div className="absolute -left-16 -bottom-16 h-64 w-64 rounded-full bg-indigo-600/15 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-wrap items-center justify-between gap-6">
          <div className="flex items-center gap-4 sm:gap-5">
            <Avatar
              name={user?.name}
              size="xl"
              statusDot={isPresent || isLate ? "online" : "away"}
              className="ring-4 ring-blue-500/20 dark:ring-blue-400/20 shadow-md"
            />

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-blue-400 tracking-wide uppercase flex items-center gap-1.5 bg-blue-500/10 px-2.5 py-0.5 rounded-full border border-blue-500/20">
                  <Sparkles className="h-3 w-3" /> HRMS Employee Self-Service
                </span>
                <span className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-full uppercase border ${
                  isPresent
                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                    : isLate
                      ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
                      : "bg-slate-700/60 text-slate-300 border-slate-600"
                }`}>
                  {attendanceStatus}
                </span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                {getGreeting()}, {user?.name}
              </h2>

              <p className="flex flex-wrap items-center gap-3 text-xs sm:text-sm text-slate-300 font-medium">
                <span className="flex items-center gap-1.5 text-slate-200">
                  <Building2 className="h-3.5 w-3.5 text-blue-400" />
                  {user?.department || "Operations"}
                </span>
                <span className="text-slate-600">•</span>
                <span className="font-mono text-slate-300">ID: {user?.employeeId}</span>
                <span className="text-slate-600">•</span>
                <span className="text-indigo-300 font-semibold">{user?.role}</span>
              </p>
            </div>
          </div>

          {nextHoliday && (
            <Link
              href="/employee/holidays"
              className="group flex items-center gap-3 p-3 px-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all text-xs shadow-xs shrink-0"
            >
              <div className="p-2 rounded-lg bg-blue-600/80 text-white font-bold group-hover:scale-105 transition-transform">
                <PartyPopper className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[11px] font-medium text-slate-400">Upcoming Holiday</p>
                <p className="font-bold text-white group-hover:text-blue-300 transition-colors">{nextHoliday.name}</p>
                <p className="text-[10px] text-slate-300">
                  {new Date(nextHoliday.holidayDate).toLocaleDateString("en-US", { month: "short", day: "numeric", weekday: "short" })}
                </p>
              </div>
              <ArrowUpRight className="h-4 w-4 text-slate-400 group-hover:text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all ml-1" />
            </Link>
          )}
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Today Status */}
        <Card className="relative overflow-hidden border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900/80 hover:shadow-md transition-all">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Today&apos;s Status</p>
              <p className="text-xl font-extrabold text-slate-900 dark:text-white">
                {isPresent ? "Present" : isLate ? "Late Arrival" : today?.status || "Pending"}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {today?.morningIn ? `Arrival: ${new Date(today.morningIn).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : "Check-in awaiting"}
              </p>
            </div>
            <div className={`p-3 rounded-2xl ${
              isPresent
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                : isLate
                  ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                  : "bg-blue-500/10 text-blue-600 dark:text-blue-400"
            }`}>
              <CheckCircle2 className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Morning Check-in Time */}
        <Card className="relative overflow-hidden border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900/80 hover:shadow-md transition-all">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Morning Arrival</p>
              <p className="text-xl font-extrabold text-slate-900 dark:text-white font-mono">
                {today?.morningIn ? new Date(today.morningIn).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true }) : "--:--"}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Target window: {formatToAmPm(settings?.morningCheckInStart || "06:30")} - {formatToAmPm(settings?.morningCheckInEnd || "08:45")}</p>
            </div>
            <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <Clock className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        {/* Card 3: On-Time Rate / Streak */}
        <Card className="relative overflow-hidden border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900/80 hover:shadow-md transition-all">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Attendance Score</p>
              <p className="text-xl font-extrabold text-slate-900 dark:text-white">96% On-Time</p>
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                <TrendingUp className="h-3 w-3" /> Active streak: 12 days
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        {/* Card 4: Device Trust */}
        <Card className="relative overflow-hidden border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900/80 hover:shadow-md transition-all">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Registered Device</p>
              <p className="text-xl font-extrabold text-slate-900 dark:text-white">
                {deviceStatus?.isApproved ? "Approved" : deviceStatus?.hasDevice ? "Pending Admin" : "Unregistered"}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {deviceStatus?.isApproved ? "Trusted for punch" : "Requires approval"}
              </p>
            </div>
            <div className={`p-3 rounded-2xl ${
              deviceStatus?.isApproved
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                : deviceStatus?.hasDevice
                  ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                  : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
            }`}>
              <ShieldCheck className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Device Status Banner */}
      {deviceStatus && !deviceStatus.isApproved && (
        <Card className={`border ${
          deviceStatus.hasDevice
            ? "border-amber-300/80 dark:border-amber-800/80 bg-amber-50/50 dark:bg-amber-950/30"
            : "border-blue-300/80 dark:border-blue-800/80 bg-blue-50/50 dark:bg-blue-950/30"
        } shadow-xs`}>
          <CardContent className="flex flex-wrap items-center justify-between gap-4 p-4 sm:p-5">
            <div className="flex items-center gap-3.5">
              {deviceStatus.hasDevice ? (
                <div className="p-2.5 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
                  <ShieldAlert className="h-5 w-5" />
                </div>
              ) : (
                <div className="p-2.5 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400">
                  <Shield className="h-5 w-5" />
                </div>
              )}
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">
                  {deviceStatus.hasDevice
                    ? "Device registered — Pending admin approval"
                    : "No device registered for attendance"}
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                  {deviceStatus.hasDevice
                    ? "An administrator must approve your device fingerprint before attendance punches are unlocked."
                    : "Register this device to bind your identity for secure attendance check-in."}
                </p>
              </div>
            </div>
            <Button
              size="sm"
              onClick={handleRegisterDevice}
              disabled={registering}
              className="font-bold text-xs shadow-xs shrink-0"
            >
              <Smartphone className="h-4 w-4" />
              {registering ? "Registering..." : deviceStatus.hasDevice ? "Re-register Device" : "Register Device"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Attendance Workflow Cards Panel */}
      <AttendancePanel
        key={settings ? `${settings.lunchStartTime}-${settings.lunchReturnDeadline}-${settings.workEndTime}` : "loading"}
        attendance={today}
        schedule={schedule}
        onUpdate={fetchData}
        settings={settings || undefined}
      />

      {/* Recent Attendance Activity Table Card */}
      <Card className="border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/80 shadow-xs">
        <CardHeader className="flex flex-row items-center justify-between p-5 sm:p-6 pb-4">
          <div>
            <CardTitle className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-slate-50">Recent Attendance History</CardTitle>
            <CardDescription className="text-xs text-slate-500 dark:text-slate-400">Log of recorded arrival, lunch, and departure timestamps</CardDescription>
          </div>
          <Link href="/employee/profile" className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-bold flex items-center gap-1">
            View Full Records <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </CardHeader>
        <CardContent className="p-5 sm:p-6 pt-0">
          <AttendanceHistoryTable records={history} />
        </CardContent>
      </Card>
    </div>
  );
}

export default function EmployeePage() {
  return (
    <ProtectedRoute requiredRole="EMPLOYEE">
      <DashboardLayout>
        <EmployeeDashboard />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
