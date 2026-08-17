"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { MobileLayout } from "@/components/layout/mobile-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/auth-context";
import { apiRequest } from "@/lib/api";
import {
  Clock,
  Calendar,
  Laptop,
  FolderKanban,
  GraduationCap,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  ChevronRight,
  Sparkles,
} from "lucide-react";

interface AttendanceStatus {
  status: "MORNING_IN" | "LUNCH_OUT" | "LUNCH_RETURN" | "FINAL_OUT";
  workedHours: number;
  todayRecord?: {
    morningIn?: string;
    lunchOut?: string;
    lunchReturn?: string;
    finalOut?: string;
  };
}

export default function MobileAppHomePage() {
  const { user } = useAuth();
  const [attStatus, setAttStatus] = useState<AttendanceStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [punching, setPunching] = useState(false);

  const fetchMobileHome = async () => {
    setLoading(true);
    try {
      const data = await apiRequest<AttendanceStatus>("/attendance/today");
      setAttStatus(data);
    } catch (e) {
      console.error("Failed to load attendance status", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMobileHome();
  }, []);

  const handlePunch = async (action: "MORNING_IN" | "LUNCH_OUT" | "LUNCH_RETURN" | "FINAL_OUT") => {
    setPunching(true);
    try {
      await apiRequest("/attendance/check", {
        method: "POST",
        body: JSON.stringify({ status: action }),
      });
      fetchMobileHome();
    } catch (err) {
      console.error("Failed to punch attendance", err);
    } finally {
      setPunching(false);
    }
  };

  return (
    <ProtectedRoute requiredRole="EMPLOYEE">
      <MobileLayout>
        <div className="space-y-4">
          {/* User Welcome Card */}
          <div className="rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-700 p-4 text-white shadow-lg flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-blue-200 uppercase tracking-wider">Welcome back</p>
              <h2 className="text-lg font-bold">{user?.name}</h2>
              <p className="text-xs text-blue-100 mt-0.5">{user?.department || "Corporate Team"} · {user?.employeeId}</p>
            </div>
            <div className="h-11 w-11 rounded-full bg-white/20 border border-white/30 flex items-center justify-center font-bold text-base text-white">
              {user?.name?.slice(0, 2).toUpperCase() || "EP"}
            </div>
          </div>

          {/* Quick Clock-In / Clock-Out Card */}
          <Card className="border-0 shadow-md bg-white rounded-2xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-gray-900 to-gray-800 text-white p-4 pb-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase text-gray-300 flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-blue-400" /> Today's Attendance
                </span>
                <Badge className="bg-blue-500 text-white text-[10px]">
                  {attStatus?.status.replace("_", " ") || "NOT STARTED"}
                </Badge>
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <p className="text-2xl font-extrabold">{attStatus?.workedHours || 0} hrs</p>
                <p className="text-xs text-gray-300">Worked Today</p>
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-xl bg-gray-50 p-2.5 border">
                  <span className="text-gray-400 block text-[10px]">Morning Punch:</span>
                  <span className="font-semibold text-gray-900">
                    {attStatus?.todayRecord?.morningIn ? new Date(attStatus.todayRecord.morningIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "--:--"}
                  </span>
                </div>
                <div className="rounded-xl bg-gray-50 p-2.5 border">
                  <span className="text-gray-400 block text-[10px]">Final Clock Out:</span>
                  <span className="font-semibold text-gray-900">
                    {attStatus?.todayRecord?.finalOut ? new Date(attStatus.todayRecord.finalOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "--:--"}
                  </span>
                </div>
              </div>

              {/* Punch Button Action */}
              {!attStatus?.todayRecord?.morningIn ? (
                <Button
                  onClick={() => handlePunch("MORNING_IN")}
                  disabled={punching}
                  className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md"
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" /> Clock In (Morning Punch)
                </Button>
              ) : !attStatus?.todayRecord?.lunchOut ? (
                <Button
                  onClick={() => handlePunch("LUNCH_OUT")}
                  disabled={punching}
                  className="w-full h-11 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-md"
                >
                  Clock Out for Lunch
                </Button>
              ) : !attStatus?.todayRecord?.lunchReturn ? (
                <Button
                  onClick={() => handlePunch("LUNCH_RETURN")}
                  disabled={punching}
                  className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md"
                >
                  Return from Lunch
                </Button>
              ) : !attStatus?.todayRecord?.finalOut ? (
                <Button
                  onClick={() => handlePunch("FINAL_OUT")}
                  disabled={punching}
                  className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md"
                >
                  Final Clock Out
                </Button>
              ) : (
                <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-2.5 text-center text-xs font-semibold text-emerald-800 flex items-center justify-center gap-1.5">
                  <ShieldCheck className="h-4 w-4" /> Attendance Completed for Today
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Shortcuts Grid */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase text-gray-500 tracking-wider">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-3">
              <Link href="/employee/mobile-app/leave">
                <Card className="border-0 shadow-sm hover:shadow-md transition-shadow bg-white rounded-2xl cursor-pointer">
                  <CardContent className="p-3.5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="rounded-xl bg-purple-50 p-2.5 text-purple-600">
                        <Calendar className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-bold text-xs text-gray-900">Request Leave</p>
                        <p className="text-[10px] text-gray-500">Apply for time off</p>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  </CardContent>
                </Card>
              </Link>

              <Link href="/employee/mobile-app/vault">
                <Card className="border-0 shadow-sm hover:shadow-md transition-shadow bg-white rounded-2xl cursor-pointer">
                  <CardContent className="p-3.5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="rounded-xl bg-emerald-50 p-2.5 text-emerald-600">
                        <Laptop className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-bold text-xs text-gray-900">My Assets</p>
                        <p className="text-[10px] text-gray-500">Issued equipment</p>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  </CardContent>
                </Card>
              </Link>

              <Link href="/employee/mobile-app/vault">
                <Card className="border-0 shadow-sm hover:shadow-md transition-shadow bg-white rounded-2xl cursor-pointer">
                  <CardContent className="p-3.5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="rounded-xl bg-indigo-50 p-2.5 text-indigo-600">
                        <FolderKanban className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-bold text-xs text-gray-900">Doc Vault</p>
                        <p className="text-[10px] text-gray-500">Contracts & ID</p>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  </CardContent>
                </Card>
              </Link>

              <Link href="/employee/mobile-app/profile">
                <Card className="border-0 shadow-sm hover:shadow-md transition-shadow bg-white rounded-2xl cursor-pointer">
                  <CardContent className="p-3.5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="rounded-xl bg-amber-50 p-2.5 text-amber-600">
                        <CreditCard className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-bold text-xs text-gray-900">My Payslip</p>
                        <p className="text-[10px] text-gray-500">Salary breakdown</p>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  </CardContent>
                </Card>
              </Link>
            </div>
          </div>
        </div>
      </MobileLayout>
    </ProtectedRoute>
  );
}
