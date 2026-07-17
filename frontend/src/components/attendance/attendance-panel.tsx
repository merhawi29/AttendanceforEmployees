"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Attendance, AttendanceSchedule, PunchType, StepSchedule, AttendanceStatus, AttendanceSettings } from "@/types";
import { apiRequest, ApiError } from "@/lib/api";
import { formatTime, getStatusColor, formatStatusLabel } from "@/lib/utils";
import { formatToAmPm } from "@/lib/time-format";
import { getDeviceId } from "@/lib/device";
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
          return { label: "Late", color: "bg-orange-100 text-orange-800 border border-orange-200" };
        }
        return { label: "Present", color: "bg-green-100 text-green-800 border border-green-200" };
      }
      if (currentMinutes > morningEnd) {
        return { label: "Absent", color: "bg-red-100 text-red-800 border border-red-200" };
      }
      return { label: "Waiting", color: "bg-blue-100 text-blue-800 border border-blue-200" };
    }
    case "LUNCH_OUT": {
      if (attendance?.lunchOut) {
        return { label: "Completed", color: "bg-green-100 text-green-800 border border-green-200" };
      }
      return { label: "Waiting", color: "bg-blue-100 text-blue-800 border border-blue-200" };
    }
    case "LUNCH_RETURN": {
      if (attendance?.lunchReturn) {
        const returnDate = new Date(attendance.lunchReturn);
        const mins = returnDate.getHours() * 60 + returnDate.getMinutes();
        if (mins > lunchReturnDeadline) {
          return { label: "Late", color: "bg-orange-100 text-orange-800 border border-orange-200" };
        }
        return { label: "Completed", color: "bg-green-100 text-green-800 border border-green-200" };
      }
      if (!attendance?.lunchOut) {
        return { label: "Locked", color: "bg-gray-100 text-gray-500 border border-gray-200" };
      }
      if (currentMinutes > lunchReturnDeadline) {
        return { label: "Late", color: "bg-orange-100 text-orange-800 border border-orange-200" };
      }
      return { label: "Waiting", color: "bg-blue-100 text-blue-800 border border-blue-200" };
    }
    case "FINAL_OUT": {
      if (attendance?.finalOut) {
        return { label: "Completed", color: "bg-green-100 text-green-800 border border-green-200" };
      }
      return { label: "Waiting", color: "bg-blue-100 text-blue-800 border border-blue-200" };
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
}) {
  const config = STEP_CONFIG[punch];
  const step = schedule.steps[punch];
  const Icon = config.icon;
  const recordedAt = attendance?.[config.field] as string | null;

  const handleAction = async () => {
    setLoading(true);
    setError(null);
    try {
      await apiRequest("/attendance/check", {
        method: "POST",
        body: JSON.stringify({ punch }),
        headers: { "x-device-id": getDeviceId() },
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
    subtitle = `Allowed Time: ${formatToAmPm(settings.morningCheckInStart)} - ${formatToAmPm(settings.morningCheckInEnd)}`;
  } else if (punch === "LUNCH_OUT") {
    subtitle = `Available After: ${formatToAmPm(settings.lunchStartTime)}`;
  } else if (punch === "LUNCH_RETURN") {
    subtitle = `Deadline: ${formatToAmPm(settings.lunchReturnDeadline)}`;
  } else if (punch === "FINAL_OUT") {
    subtitle = `Checkout Opens: ${formatToAmPm(settings.workEndTime)}`;
  }

  return (
    <Card className="shadow-sm hover:shadow transition-shadow">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon className="h-5 w-5 text-blue-600" />
            <CardTitle>{config.title}</CardTitle>
          </div>
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider ${badge.color}`}>
            {badge.label}
          </span>
        </div>
        <CardDescription>{subtitle}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm">
          <p className="text-gray-500">Your Recorded Time</p>
          <p className="font-bold text-lg text-gray-900">{formatTime(recordedAt)}</p>
        </div>

        {!step.recorded && (
          <p className="text-xs text-gray-600 font-medium bg-gray-50 p-2.5 rounded-lg border border-gray-100">{step.message}</p>
        )}

        <Button
          variant={punch === "MORNING_IN" ? "success" : "outline"}
          className="w-full font-medium"
          disabled={!step.enabled || loading}
          onClick={handleAction}
        >
          <Icon className="h-4 w-4" />
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
  const closedToastShownRef = useRef(false);
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
    if (!currentTime || closedToastShownRef.current) return;
    const currentMins = currentTime.getHours() * 60 + currentTime.getMinutes();
    const parseToMinutes = (timeStr: string) => {
      const [h, m] = timeStr.split(":");
      return parseInt(h, 10) * 60 + parseInt(m, 10);
    };
    const morningEnd = parseToMinutes(settings.morningCheckInEnd);
    if (currentMins > morningEnd && !attendance?.morningIn) {
      closedToastShownRef.current = true;
      setShowClosedToast(true);
      const timer = setTimeout(() => setShowClosedToast(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [currentTime, settings.morningCheckInEnd, attendance?.morningIn]);

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
  let overallStatus: AttendanceStatus = attendance?.status || "PENDING";

  return (
    <div className="space-y-4">
      <Card className="border-blue-100 bg-blue-50/50 shadow-none">
        <CardContent className="flex flex-wrap items-center justify-between gap-4 p-4 text-sm">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-gray-700">
              <Clock className="h-4 w-4 text-blue-600 animate-pulse" />
              <span>
                Local time: <strong>{clockTime}</strong>
              </span>
            </div>
            <div className="flex items-center gap-2 text-gray-700 border-l border-gray-200 pl-4">
              <CalendarDays className="h-4 w-4 text-blue-600" />
              <span>{clockDate || schedule.ethiopianDateLabel}</span>
            </div>
          </div>
          {overallStatus && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Today&apos;s Status:</span>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider ${getStatusColor(overallStatus)}`}>
                {formatStatusLabel(overallStatus)}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {showClosedToast && (
        <div
          className="fixed top-4 right-4 z-50 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700 shadow-lg"
          style={{
            animation: "toastSlideIn 0.3s ease-out, toastSlideOut 0.3s ease-in 4.7s forwards",
          }}
        >
          <AlertCircle className="h-4 w-4 shrink-0" />
          Morning attendance is closed. Lunch Break at {formatToAmPm(settings.lunchStartTime)}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
          />
        ))}
      </div>

      {attendance?.ipAddress && (
        <p className="text-xs text-gray-400">Recorded from IP: {attendance.ipAddress}</p>
      )}
    </div>
  );
}

export function AttendanceHistoryTable({ records }: { records: Attendance[] }) {
  if (records.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-gray-500">No attendance records found.</p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 text-left text-gray-500 uppercase tracking-wider text-xs">
            <th className="pb-3 pr-4 font-semibold">Date</th>
            <th className="pb-3 pr-4 font-semibold">Morning In</th>
            <th className="pb-3 pr-4 font-semibold">Lunch Out</th>
            <th className="pb-3 pr-4 font-semibold">Lunch Return</th>
            <th className="pb-3 pr-4 font-semibold">Final Out</th>
            <th className="pb-3 font-semibold">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {records.map((record) => {
            const recordStatus = record.status || "PENDING";
            return (
              <tr key={record.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="py-3.5 pr-4 font-semibold text-gray-900">
                  {record.ethiopianDateLabel || record.ethiopianDate}
                </td>
                <td className="py-3.5 pr-4 text-gray-600">{formatTime(record.morningIn)}</td>
                <td className="py-3.5 pr-4 text-gray-600">{formatTime(record.lunchOut)}</td>
                <td className="py-3.5 pr-4 text-gray-600">{formatTime(record.lunchReturn)}</td>
                <td className="py-3.5 pr-4 text-gray-600">{formatTime(record.finalOut)}</td>
                <td className="py-3.5">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider ${getStatusColor(recordStatus)}`}>
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
