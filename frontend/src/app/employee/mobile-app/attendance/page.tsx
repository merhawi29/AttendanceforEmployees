"use client";

import { useEffect, useState } from "react";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { MobileLayout } from "@/components/layout/mobile-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/api";
import { Clock, ShieldCheck, Loader2, RefreshCw, Calendar } from "lucide-react";

interface AttendanceRecord {
  id: string;
  date: string;
  morningIn?: string | null;
  lunchOut?: string | null;
  lunchReturn?: string | null;
  finalOut?: string | null;
  workedHours?: number | null;
  status: string;
}

export default function MobileAttendancePage() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAttendance = async () => {
    setLoading(true);
    try {
      const data = await apiRequest<AttendanceRecord[]>("/attendance/history");
      setRecords(data);
    } catch (err) {
      console.error("Failed to load attendance logs", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, []);

  return (
    <ProtectedRoute requiredRole="EMPLOYEE">
      <MobileLayout>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-1.5">
                <Clock className="h-5 w-5 text-blue-600" /> Attendance History
              </h2>
              <p className="text-xs text-gray-500">Monthly check-in logs and worked hours</p>
            </div>
            <Button variant="outline" size="sm" onClick={fetchAttendance} disabled={loading} className="h-8 text-xs">
              <RefreshCw className={`mr-1 h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
            </Button>
          </div>

          {loading ? (
            <div className="flex h-40 items-center justify-center bg-white rounded-2xl shadow-xs">
              <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
            </div>
          ) : records.length ? (
            <div className="space-y-3">
              {records.map((item) => (
                <Card key={item.id} className="border-0 shadow-sm bg-white rounded-2xl">
                  <CardContent className="p-3.5 space-y-2">
                    <div className="flex justify-between items-center border-b pb-2">
                      <span className="font-bold text-xs text-gray-900 flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5 text-blue-600" />
                        {new Date(item.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                      </span>
                      <Badge className={
                        item.status === "PRESENT" ? "bg-emerald-100 text-emerald-800" :
                        item.status === "LATE" ? "bg-amber-100 text-amber-800" : "bg-red-100 text-red-800"
                      }>
                        {item.status}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-4 gap-1 text-[11px] text-gray-600 text-center bg-gray-50 p-2 rounded-xl">
                      <div>
                        <span className="text-[9px] text-gray-400 block">In</span>
                        <span className="font-bold text-gray-900">
                          {item.morningIn ? new Date(item.morningIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "--:--"}
                        </span>
                      </div>
                      <div>
                        <span className="text-[9px] text-gray-400 block">Lunch Out</span>
                        <span className="font-bold text-gray-900">
                          {item.lunchOut ? new Date(item.lunchOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "--:--"}
                        </span>
                      </div>
                      <div>
                        <span className="text-[9px] text-gray-400 block">Lunch In</span>
                        <span className="font-bold text-gray-900">
                          {item.lunchReturn ? new Date(item.lunchReturn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "--:--"}
                        </span>
                      </div>
                      <div>
                        <span className="text-[9px] text-gray-400 block">Out</span>
                        <span className="font-bold text-gray-900">
                          {item.finalOut ? new Date(item.finalOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "--:--"}
                        </span>
                      </div>
                    </div>

                    {item.workedHours !== undefined && item.workedHours !== null && (
                      <div className="flex justify-between items-center text-xs text-gray-500 pt-1">
                        <span>Total Worked:</span>
                        <span className="font-bold text-blue-700">{item.workedHours} hrs</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="border-0 shadow-sm bg-white rounded-2xl">
              <CardContent className="py-8 text-center text-xs text-gray-500">
                No attendance check-in records for this month.
              </CardContent>
            </Card>
          )}
        </div>
      </MobileLayout>
    </ProtectedRoute>
  );
}
