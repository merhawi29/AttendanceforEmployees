"use client";

import { useEffect, useState, useCallback } from "react";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { AttendancePanel, AttendanceHistoryTable } from "@/components/attendance/attendance-panel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Attendance, AttendanceSchedule, TodayAttendanceResponse } from "@/types";
import { apiRequest } from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError } from "@/lib/api";

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
  const [history, setHistory] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateStr, setDateStr] = useState("");

  const fetchData = useCallback(async () => {
    try {
      const [todayData, historyData] = await Promise.all([
        apiRequest<TodayAttendanceResponse>("/attendance/today"),
        apiRequest<Attendance[]>("/attendance/history"),
      ]);
      setToday(todayData.attendance);
      setSchedule(todayData.schedule);
      setHistory(historyData);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setDateStr(
      new Date().toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    );
  }, []);

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
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Welcome, {user?.name}</h2>
        <p className="text-gray-500">{dateStr}</p>
      </div>

      <AttendancePanel attendance={today} schedule={schedule} onUpdate={fetchData} />

      <Card>
        <CardHeader>
          <CardTitle>Recent History</CardTitle>
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
