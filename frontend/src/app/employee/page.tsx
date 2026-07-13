"use client";

import { useEffect, useState, useCallback } from "react";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { AttendancePanel, AttendanceHistoryTable } from "@/components/attendance/attendance-panel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Attendance, AttendanceSchedule, TodayAttendanceResponse, DeviceStatus, AttendanceSettings } from "@/types";
import { apiRequest } from "@/lib/api";
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

function EmployeeDashboard() {
  const { user } = useAuth();
  const [today, setToday] = useState<Attendance | null>(null);
  const [schedule, setSchedule] = useState<AttendanceSchedule>(EMPTY_SCHEDULE);
  const [settings, setSettings] = useState<AttendanceSettings | null>(null);
  const [history, setHistory] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [deviceStatus, setDeviceStatus] = useState<DeviceStatus | null>(null);
  const [registering, setRegistering] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [todayData, historyData, devStatus, settingsData] = await Promise.all([
        apiRequest<TodayAttendanceResponse>("/attendance/today"),
        apiRequest<Attendance[]>("/attendance/history"),
        apiRequest<DeviceStatus>("/devices/status").catch(() => null),
        apiRequest<AttendanceSettings>("/attendance/settings").catch(() => null),
      ]);
      setToday(todayData.attendance);
      setSchedule(todayData.schedule);
      setSettings(settingsData || todayData.settings || null);
      setHistory(historyData);
      setDeviceStatus(devStatus);
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
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header Row */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white font-bold text-lg">
              {user?.name?.charAt(0)?.toUpperCase() || "U"}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Welcome, {user?.name}</h2>
              <p className="flex items-center gap-2 text-sm text-gray-500">
                <Building2 className="h-3.5 w-3.5" />
                {user?.department || "No Department"} · {user?.employeeId}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4 text-sm">
        </div>
      </div>

      {/* Device Status Banner */}
      {deviceStatus && !deviceStatus.isApproved && (
        <Card className={`border ${deviceStatus.hasDevice ? "border-yellow-200 bg-yellow-50/50" : "border-blue-200 bg-blue-50/50"} shadow-none`}>
          <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
            <div className="flex items-center gap-3">
              {deviceStatus.isApproved ? (
                <ShieldCheck className="h-5 w-5 text-green-600" />
              ) : deviceStatus.hasDevice ? (
                <ShieldAlert className="h-5 w-5 text-yellow-600" />
              ) : (
                <Shield className="h-5 w-5 text-blue-600" />
              )}
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  {deviceStatus.isApproved
                    ? "Device approved — you can check in"
                    : deviceStatus.hasDevice
                      ? "Device pending admin approval"
                      : "No device registered"}
                </p>
                <p className="text-xs text-gray-500">
                  {deviceStatus.isApproved
                    ? "Your device is trusted for attendance"
                    : deviceStatus.hasDevice
                      ? "An admin needs to approve your device before you can check in"
                      : "Register this device to enable attendance check-in"}
                </p>
              </div>
            </div>
            {!deviceStatus.isApproved && (
              <Button
                size="sm"
                onClick={handleRegisterDevice}
                disabled={registering}
              >
                <Smartphone className="h-4 w-4" />
                {registering ? "Registering..." : deviceStatus.hasDevice ? "Re-register" : "Register Device"}
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      <AttendancePanel
        key={settings ? `${settings.lunchStartTime}-${settings.lunchReturnDeadline}-${settings.workEndTime}` : "loading"}
        attendance={today}
        schedule={schedule}
        onUpdate={fetchData}
        settings={settings || undefined}
      />

      {/* Stats Row */}
      {(today?.morningIn || today?.status) && (
        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="bg-green-50/50 border-green-100">
            <CardContent className="p-4 flex items-center gap-3">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-xs font-semibold text-green-700 uppercase tracking-wider">Status</p>
                <p className="text-lg font-bold text-green-900">{today?.status === "PRESENT" ? "Present" : today?.status === "LATE" ? "Late" : today?.status || "Pending"}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-blue-50/50 border-blue-100">
            <CardContent className="p-4 flex items-center gap-3">
              <Clock className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-xs font-semibold text-blue-700 uppercase tracking-wider">Morning In</p>
                <p className="text-lg font-bold text-blue-900">{today?.morningIn ? new Date(today.morningIn).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true }) : "—"}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-purple-50/50 border-purple-100">
            <CardContent className="p-4 flex items-center gap-3">
              <Smartphone className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-xs font-semibold text-purple-700 uppercase tracking-wider">Devices</p>
                <p className="text-lg font-bold text-purple-900">
                  {deviceStatus?.isApproved ? "Approved" : deviceStatus?.hasDevice ? "Pending" : "None"}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Attendance</CardTitle>
          <Link href="/employee/profile" className="text-sm text-blue-600 hover:underline font-medium">View Profile</Link>
        </CardHeader>
        <CardContent>
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
