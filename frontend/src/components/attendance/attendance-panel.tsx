"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Attendance, AttendanceSchedule, PunchType, StepSchedule, AttendanceStatus, AttendanceSettings } from "@/types";
import { apiRequest, ApiError } from "@/lib/api";
import { formatTime, getStatusColor, formatStatusLabel } from "@/lib/utils";
import { formatToAmPm } from "@/lib/time-format";
import { getDeviceId, getDeviceInfo } from "@/lib/device";
import {
  LogIn,
  LogOut,
  Utensils,
  Undo2,
  AlertCircle,
  Clock,
  CalendarDays,
} from "lucide-react";

interface AttendancePanelProps {
  attendance: Attendance | null;
  schedule: AttendanceSchedule;
  onUpdate: () => void;
  settings?: AttendanceSettings;
}

interface SystemSettings extends AttendanceSettings {}

const DEFAULT_SETTINGS: SystemSettings = {
  morningCheckInStart: "07:30",
  morningCheckInEnd: "08:45",
  lunchStartTime: "12:30",
  lunchReturnDeadline: "14:30",
  workEndTime: "17:30",
  gracePeriodMinutes: 15,
};

function settingsMatch(a: SystemSettings, b: SystemSettings): boolean {
  return (
    a.morningCheckInStart === b.morningCheckInStart &&
    a.morningCheckInEnd === b.morningCheckInEnd &&
    a.lunchStartTime === b.lunchStartTime &&
    a.lunchReturnDeadline === b.lunchReturnDeadline &&
    a.workEndTime === b.workEndTime &&
    a.gracePeriodMinutes === b.gracePeriodMinutes
  );
}

const STEP_CONFIG: Record<
  PunchType,
  { title: string; icon: React.ElementType; buttonLabel: string; field: keyof Attendance }
> = {
  MORNING_IN: {
    title: "Morning Arrival",
    icon: LogIn,
    buttonLabel: "Check In",
    field: "morningIn",
  },
  LUNCH_OUT: {
    title: "Lunch Break",
    icon: Utensils,
    buttonLabel: "Lunch Out",
    field: "lunchOut",
  },
  LUNCH_RETURN: {
    title: "Return From Lunch",
    icon: Undo2,
    buttonLabel: "Return",
    field: "lunchReturn",
  },
  FINAL_OUT: {
    title: "Work End",
    icon: LogOut,
    buttonLabel: "Check Out",
    field: "finalOut",
  },
};

const STEP_ORDER: PunchType[] = ["MORNING_IN", "LUNCH_OUT", "LUNCH_RETURN", "FINAL_OUT"];

export function calculateLocalSteps(
  attendance: Attendance | null,
  now: Date,
  settings: SystemSettings
): Record<PunchType, StepSchedule> {
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const parseToMinutes = (timeStr: string) => {
    const [h, m] = timeStr.split(":");
    return parseInt(h, 10) * 60 + parseInt(m, 10);
  };

  const morningStart = parseToMinutes(settings.morningCheckInStart);
  const morningEnd = parseToMinutes(settings.morningCheckInEnd);
  const lunchStart = parseToMinutes(settings.lunchStartTime);
  const lunchReturnDeadline = parseToMinutes(settings.lunchReturnDeadline);
  const finalOutStart = parseToMinutes(settings.workEndTime);

  const hasMorningIn = !!attendance?.morningIn;
  const hasLunchOut = !!attendance?.lunchOut;
  const hasLunchReturn = !!attendance?.lunchReturn;
  const hasFinalOut = !!attendance?.finalOut;

  const steps: Record<PunchType, StepSchedule> = {
    MORNING_IN: { recorded: hasMorningIn, enabled: false, message: "" },
    LUNCH_OUT: { recorded: hasLunchOut, enabled: false, message: "" },
    LUNCH_RETURN: { recorded: hasLunchReturn, enabled: false, message: "" },
    FINAL_OUT: { recorded: hasFinalOut, enabled: false, message: "" },
  };

  // Morning In
  if (hasMorningIn) {
    steps.MORNING_IN.message = "Morning check-in recorded";
  } else if (currentMinutes < morningStart) {
    steps.MORNING_IN.message = `Check-in available from ${formatToAmPm(settings.morningCheckInStart)}`;
  } else if (currentMinutes <= morningEnd) {
    steps.MORNING_IN.enabled = true;
    steps.MORNING_IN.message = `Check in now (${formatToAmPm(settings.morningCheckInStart)} - ${formatToAmPm(settings.morningCheckInEnd)})`;
  } else {
    steps.MORNING_IN.enabled = false;
    steps.MORNING_IN.message = `Morning attendance is closed. Lunch Break starts at ${formatToAmPm(settings.lunchStartTime)}`;
  }

  // Lunch Out (independent - no morning check-in required)
  if (hasLunchOut) {
    steps.LUNCH_OUT.message = "Lunch out recorded";
  } else if (currentMinutes < lunchStart) {
    steps.LUNCH_OUT.message = `Lunch out available after ${formatToAmPm(settings.lunchStartTime)}`;
  } else {
    steps.LUNCH_OUT.enabled = true;
    steps.LUNCH_OUT.message = "Record lunch break";
  }

  // Lunch Return (depends on Lunch Out only)
  if (!hasLunchOut) {
    steps.LUNCH_RETURN.message = "Record lunch out first";
  } else if (hasLunchReturn) {
    steps.LUNCH_RETURN.message = "Lunch return recorded";
  } else {
    steps.LUNCH_RETURN.enabled = true;
    if (currentMinutes <= lunchReturnDeadline) {
      steps.LUNCH_RETURN.message = `Return before ${formatToAmPm(settings.lunchReturnDeadline)}`;
    } else if (currentMinutes <= lunchReturnDeadline + settings.gracePeriodMinutes) {
      steps.LUNCH_RETURN.message = "Lunch return (grace period)";
    } else {
      steps.LUNCH_RETURN.message = "Lunch return (marked late)";
    }
  }

  // Final Out (independent - no lunch return required)
  if (hasFinalOut) {
    steps.FINAL_OUT.message = "Final checkout recorded";
  } else if (currentMinutes < finalOutStart) {
    steps.FINAL_OUT.message = `Checkout available after ${formatToAmPm(settings.workEndTime)}`;
  } else {
    steps.FINAL_OUT.enabled = true;
    steps.FINAL_OUT.message = "Record end of workday";
  }

  return steps;
}

function getStepBadge(
  punch: PunchType,
  attendance: Attendance | null,
  currentMinutes: number,
  settings: SystemSettings
): { label: string; color: string } {
  const parseToMinutes = (timeStr: string) => {
    const [h, m] = timeStr.split(":");
    return parseInt(h, 10) * 60 + parseInt(m, 10);
  };

  const morningEnd = parseToMinutes(settings.morningCheckInEnd);
  const lunchReturnDeadline = parseToMinutes(settings.lunchReturnDeadline);

  switch (punch) {
    case "MORNING_IN": {
      if (attendance?.morningIn) {
        const morningDate = new Date(attendance.morningIn);
        const mins = morningDate.getHours() * 60 + morningDate.getMinutes();
        if (mins > morningEnd) {
          return { label: "Late", color: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60" };
        }
        return { label: "Present", color: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60" };
      }
      if (currentMinutes > morningEnd) {
        return { label: "Absent", color: "bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60" };
      }
      return { label: "Waiting", color: "bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60" };
    }
    case "LUNCH_OUT": {
      if (attendance?.lunchOut) {
        return { label: "Completed", color: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60" };
      }
      return { label: "Waiting", color: "bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60" };
    }
    case "LUNCH_RETURN": {
      if (attendance?.lunchReturn) {
        const returnDate = new Date(attendance.lunchReturn);
        const mins = returnDate.getHours() * 60 + returnDate.getMinutes();
        if (mins > lunchReturnDeadline) {
          return { label: "Late", color: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60" };
        }
        return { label: "Completed", color: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60" };
      }
      if (!attendance?.lunchOut) {
        return { label: "Locked", color: "bg-slate-500/10 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-800/60" };
      }
      if (currentMinutes > lunchReturnDeadline) {
        return { label: "Late", color: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60" };
      }
      return { label: "Waiting", color: "bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60" };
    }
    case "FINAL_OUT": {
      if (attendance?.finalOut) {
        return { label: "Completed", color: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60" };
      }
      return { label: "Waiting", color: "bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60" };
    }
  }
}

function PunchCard({
  punch,
  attendance,
  schedule,
  onUpdate,
  loading,
  setLoading,
  setError,
  settings,
  currentMinutes,
  onMorningWindowClosed,
}: {
  punch: PunchType;
  attendance: Attendance | null;
  schedule: AttendanceSchedule;
  onUpdate: () => void;
  loading: boolean;
  setLoading: (value: boolean) => void;
  setError: (value: string | null) => void;
  settings: SystemSettings;
  currentMinutes: number;
  onMorningWindowClosed?: () => void;
}) {
  const config = STEP_CONFIG[punch];
  const step = schedule.steps[punch];
  const Icon = config.icon;
  const recordedAt = attendance?.[config.field] as string | null;

  const handleAction = async () => {
    if (punch === "MORNING_IN" && !step.enabled) {
      onMorningWindowClosed?.();
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const devInfo = getDeviceInfo();
      await apiRequest("/attendance/check", {
        method: "POST",
        body: JSON.stringify({ punch }),
        headers: {
          "x-device-id": devInfo.deviceId,
          "x-device-fingerprint": devInfo.fingerprint,
        },
      });
      onUpdate();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to record attendance");
    } finally {
      setLoading(false);
    }
  };

  const badge = getStepBadge(punch, attendance, currentMinutes, settings);

  let subtitle = "";
  if (punch === "MORNING_IN") {
    subtitle = `Check-in window: ${formatToAmPm(settings.morningCheckInStart)} - ${formatToAmPm(settings.morningCheckInEnd)}`;
  } else if (punch === "LUNCH_OUT") {
    subtitle = `Available after: ${formatToAmPm(settings.lunchStartTime)}`;
  } else if (punch === "LUNCH_RETURN") {
    subtitle = `Return deadline: ${formatToAmPm(settings.lunchReturnDeadline)}`;
  } else if (punch === "FINAL_OUT") {
    subtitle = `Workday ends: ${formatToAmPm(settings.workEndTime)}`;
  }

  const isRecorded = !!recordedAt;

  return (
    <Card className={`relative overflow-hidden border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${
      isRecorded
        ? "border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/20 dark:bg-emerald-950/10"
        : step.enabled
          ? "border-blue-300 dark:border-blue-700/80 bg-blue-50/30 dark:bg-blue-950/20 shadow-xs"
          : "border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900/80"
    }`}>
      {/* Top Accent Indicator Strip */}
      <div className={`h-1 w-full ${
        isRecorded
          ? "bg-emerald-500"
          : step.enabled
            ? "bg-blue-600 animate-pulse"
            : "bg-slate-200 dark:bg-slate-800"
      }`} />

      <CardHeader className="p-4 sm:p-5 pb-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl transition-colors ${
              isRecorded
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                : step.enabled
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-400"
            }`}>
              <Icon className="h-4 w-4 shrink-0" />
            </div>
            <div>
              <CardTitle className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">{config.title}</CardTitle>
              <CardDescription className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">{subtitle}</CardDescription>
            </div>
          </div>
          <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider ${badge.color}`}>
            {badge.label}
          </span>
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-5 pt-0 space-y-3">
        <div className="flex items-center justify-between rounded-xl bg-slate-50 dark:bg-slate-850/60 p-3 border border-slate-100 dark:border-slate-800/80">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Recorded Time</span>
          <span className={`font-mono text-sm sm:text-base font-extrabold ${recordedAt ? "text-slate-900 dark:text-white" : "text-slate-400 dark:text-slate-400"}`}>
            {formatTime(recordedAt)}
          </span>
        </div>

        {!step.recorded && (
          <p className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-400 font-medium bg-slate-100/70 dark:bg-slate-800/50 p-2.5 rounded-lg border border-slate-200/50 dark:border-slate-700/50 flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0" />
            {step.message}
          </p>
        )}

        <Button
          variant={step.enabled ? "default" : isRecorded ? "secondary" : "outline"}
          size="sm"
          className={`w-full font-bold text-xs h-9 transition-all ${
            step.enabled ? "bg-blue-600 hover:bg-blue-500 text-white shadow-xs" : ""
          }`}
          disabled={(punch !== "MORNING_IN" && !step.enabled) || loading}
          onClick={handleAction}
        >
          <Icon className="h-3.5 w-3.5" />
          {config.buttonLabel}
        </Button>
      </CardContent>
    </Card>
  );
}

export function AttendancePanel({ attendance, schedule, onUpdate, settings: settingsProp }: AttendancePanelProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [showClosedToast, setShowClosedToast] = useState(false);
  const [settings, setSettings] = useState<SystemSettings>(settingsProp || DEFAULT_SETTINGS);
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  useEffect(() => {
    if (settingsProp && !settingsLoaded) {
      setSettings(settingsProp);
    }
  }, [settingsProp, settingsLoaded]);

  useEffect(() => {
    setCurrentTime(new Date());
    const clockInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    async function fetchSettings() {
      try {
        const data = await apiRequest<SystemSettings>("/attendance/settings", {
          cache: "no-store",
        });
        setSettings((current) => (settingsMatch(current, data) ? current : data));
        setSettingsLoaded(true);
      } catch (err) {
        console.error("Failed to load settings in panel", err);
      }
    }

    fetchSettings();
    const settingsInterval = setInterval(fetchSettings, 3000);

    const handleRefresh = () => {
      fetchSettings();
    };

    window.addEventListener("focus", handleRefresh);
    window.addEventListener("storage", handleRefresh);
    window.addEventListener("attendance-settings-updated", handleRefresh);

    return () => {
      clearInterval(clockInterval);
      clearInterval(settingsInterval);
      window.removeEventListener("focus", handleRefresh);
      window.removeEventListener("storage", handleRefresh);
      window.removeEventListener("attendance-settings-updated", handleRefresh);
    };
  }, []);

  useEffect(() => {
    if (!showClosedToast) return;
    const timer = setTimeout(() => setShowClosedToast(false), 5000);
    return () => clearTimeout(timer);
  }, [showClosedToast]);

  const clockTime = currentTime
    ? currentTime.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      })
    : "--:--:--";

  const clockDate = currentTime
    ? `${currentTime.getFullYear()}-${String(currentTime.getMonth() + 1).padStart(2, "0")}-${String(currentTime.getDate()).padStart(2, "0")}`
    : "";

  const steps = currentTime ? calculateLocalSteps(attendance, currentTime, settings) : null;
  const localSchedule: AttendanceSchedule = steps
    ? { ...schedule, steps }
    : schedule;

  const currentMinutes = currentTime 
    ? (currentTime.getHours() * 60 + currentTime.getMinutes()) 
    : 0;

  // Overall attendance status
  const overallStatus: AttendanceStatus = attendance?.status || "PENDING";

  return (
    <div className="space-y-5">
      {/* Time & Daily Status Bar */}
      <Card className="border border-blue-200/80 dark:border-slate-800 bg-gradient-to-r from-blue-500/10 via-indigo-500/5 to-transparent dark:from-blue-950/40 dark:via-indigo-950/20 dark:to-slate-900/80 backdrop-blur-md shadow-xs">
        <CardContent className="flex flex-wrap items-center justify-between gap-4 p-4 text-xs sm:text-sm">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-semibold">
              <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400 animate-pulse" />
              <span>
                Local Time: <strong className="font-mono text-sm sm:text-base text-slate-900 dark:text-white ml-1">{clockTime}</strong>
              </span>
            </div>
            <div className="hidden sm:flex items-center gap-2 text-slate-600 dark:text-slate-400 border-l border-slate-200 dark:border-slate-800 pl-4 font-medium">
              <CalendarDays className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <span>{clockDate || schedule.ethiopianDateLabel}</span>
            </div>
          </div>
          {overallStatus && (
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Today&apos;s Status:</span>
              <span className={`rounded-full px-3 py-0.5 text-xs font-bold uppercase tracking-wider ${getStatusColor(overallStatus)}`}>
                {formatStatusLabel(overallStatus)}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {error && (
        <div className="flex items-center gap-2.5 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/40 p-4 text-xs sm:text-sm text-rose-700 dark:text-rose-300 font-semibold">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400" />
          {error}
        </div>
      )}

      {showClosedToast && (
        <div
          className="fixed top-4 right-4 z-50 flex items-center gap-2 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950 p-4 text-xs sm:text-sm text-amber-800 dark:text-amber-200 font-semibold shadow-xl"
          style={{
            animation: "toastSlideIn 0.3s ease-out, toastSlideOut 0.3s ease-in 4.7s forwards",
          }}
        >
          <AlertCircle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
          Morning attendance is closed. Lunch Break starts at {formatToAmPm(settings.lunchStartTime)}
        </div>
      )}

      {/* Responsive Workflow Step Cards Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STEP_ORDER.map((punch) => (
          <PunchCard
            key={punch}
            punch={punch}
            attendance={attendance}
            schedule={localSchedule}
            onUpdate={onUpdate}
            loading={loading}
            setLoading={setLoading}
            setError={setError}
            settings={settings}
            currentMinutes={currentMinutes}
            onMorningWindowClosed={() => setShowClosedToast(true)}
          />
        ))}
      </div>

      {attendance?.ipAddress && (
        <p className="text-[11px] text-slate-400 dark:text-slate-500 font-mono text-right">
          Recorded IP: {attendance.ipAddress}
        </p>
      )}
    </div>
  );
}

export function AttendanceHistoryTable({ records }: { records: Attendance[] }) {
  if (records.length === 0) {
    return (
      <div className="py-12 text-center space-y-2">
        <CalendarDays className="h-10 w-10 text-slate-300 dark:text-slate-600 mx-auto" />
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">No attendance records found yet.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200/70 dark:border-slate-800/80">
      <table className="w-full text-left text-xs sm:text-sm">
        <thead>
          <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-850/80 text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[11px] font-bold">
            <th className="py-3 px-4">Date</th>
            <th className="py-3 px-4">Morning In</th>
            <th className="py-3 px-4">Lunch Out</th>
            <th className="py-3 px-4">Lunch Return</th>
            <th className="py-3 px-4">Final Out</th>
            <th className="py-3 px-4">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 bg-white dark:bg-slate-900/40">
          {records.map((record) => {
            const recordStatus = record.status || "PENDING";
            return (
              <tr key={record.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors">
                <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-slate-100">
                  {record.ethiopianDateLabel || record.ethiopianDate}
                </td>
                <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 font-mono">{formatTime(record.morningIn)}</td>
                <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 font-mono">{formatTime(record.lunchOut)}</td>
                <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 font-mono">{formatTime(record.lunchReturn)}</td>
                <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 font-mono">{formatTime(record.finalOut)}</td>
                <td className="py-3.5 px-4">
                  <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider ${getStatusColor(recordStatus)}`}>
                    {formatStatusLabel(recordStatus)}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
