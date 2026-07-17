"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ReportAnalytics } from "@/lib/report-utils";
import {
  TrendingUp,
  Calendar,
  Building2,
  LogIn,
  LogOut,
  AlertTriangle,
} from "lucide-react";

interface ReportsAnalyticsProps {
  analytics: ReportAnalytics;
}

function MiniBarChart({
  data,
  maxHeight = 80,
}: {
  data: { label: string; present: number; late: number; absent: number }[];
  maxHeight?: number;
}) {
  const maxVal = Math.max(...data.map((d) => d.present + d.late + d.absent), 1);

  return (
    <div className="flex items-end justify-between gap-1 h-28 pt-2">
      {data.map((d) => {
        const total = d.present + d.late + d.absent;
        const height = (total / maxVal) * maxHeight;
        const presentH = total > 0 ? (d.present / total) * height : 0;
        const lateH = total > 0 ? (d.late / total) * height : 0;
        const absentH = total > 0 ? (d.absent / total) * height : 0;

        return (
          <div key={d.label} className="flex flex-1 flex-col items-center gap-1 min-w-0">
            <div className="flex flex-col justify-end w-full max-w-[32px] mx-auto" style={{ height: maxHeight }}>
              <div className="flex flex-col justify-end w-full rounded-t overflow-hidden">
                {absentH > 0 && (
                  <div className="bg-red-400 w-full" style={{ height: absentH }} title={`Absent: ${d.absent}`} />
                )}
                {lateH > 0 && (
                  <div className="bg-orange-400 w-full" style={{ height: lateH }} title={`Late: ${d.late}`} />
                )}
                {presentH > 0 && (
                  <div className="bg-green-500 w-full" style={{ height: presentH }} title={`Present: ${d.present}`} />
                )}
              </div>
            </div>
            <span className="text-[9px] text-gray-400 truncate w-full text-center">{d.label}</span>
          </div>
        );
      })}
    </div>
  );
}

export function ReportsAnalytics({ analytics }: ReportsAnalyticsProps) {
  const monthlySample = analytics.monthlyDays.filter((_, i) => i % Math.max(1, Math.floor(analytics.monthlyDays.length / 15)) === 0 || i === analytics.monthlyDays.length - 1);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Analytics Overview</h3>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {/* Attendance Trend - Last 7 Days */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              <CardTitle className="text-sm font-medium">Attendance Trend (Last 7 Days)</CardTitle>
            </div>
            <CardDescription className="text-xs">Daily present, late, and absent counts</CardDescription>
          </CardHeader>
          <CardContent>
            <MiniBarChart data={analytics.trend} />
            <div className="flex items-center justify-center gap-4 mt-3 text-[10px] text-gray-500">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-green-500" /> Present</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-orange-400" /> Late</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-red-400" /> Absent</span>
            </div>
          </CardContent>
        </Card>

        {/* Monthly Attendance */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-blue-600" />
              <CardTitle className="text-sm font-medium">Monthly Attendance</CardTitle>
            </div>
            <CardDescription className="text-xs">Daily attendance for the current month</CardDescription>
          </CardHeader>
          <CardContent>
            <MiniBarChart data={monthlySample} maxHeight={70} />
          </CardContent>
        </Card>

        {/* Department Comparison */}
        <Card className="shadow-sm sm:col-span-2 xl:col-span-1">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-blue-600" />
              <CardTitle className="text-sm font-medium">Department Comparison</CardTitle>
            </div>
            <CardDescription className="text-xs">Attendance rate by department</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {analytics.departments.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">No department data</p>
            ) : (
              analytics.departments.slice(0, 6).map((dept) => (
                <div key={dept.department}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-medium text-gray-700 truncate">{dept.department}</span>
                    <span className="text-gray-500 shrink-0 ml-2">{dept.percentage}%</span>
                  </div>
                  <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-blue-600 h-full rounded-full transition-all"
                      style={{ width: `${dept.percentage}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Average Check-in Time */}
        <Card className="shadow-sm bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="rounded-lg bg-blue-100 p-2.5">
              <LogIn className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs font-semibold text-blue-700 uppercase tracking-wider">Avg Check-in Time</p>
              <p className="text-xl font-bold text-blue-900">{analytics.avgCheckIn}</p>
            </div>
          </CardContent>
        </Card>

        {/* Average Checkout Time */}
        <Card className="shadow-sm bg-gradient-to-br from-green-50 to-green-100/50 border-green-200">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="rounded-lg bg-green-100 p-2.5">
              <LogOut className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs font-semibold text-green-700 uppercase tracking-wider">Avg Checkout Time</p>
              <p className="text-xl font-bold text-green-900">{analytics.avgCheckOut}</p>
            </div>
          </CardContent>
        </Card>

        {/* Top 10 Late Employees */}
        <Card className="shadow-sm sm:col-span-2 xl:col-span-1">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <CardTitle className="text-sm font-medium">Top 10 Late Employees</CardTitle>
            </div>
            <CardDescription className="text-xs">Most frequent late arrivals in period</CardDescription>
          </CardHeader>
          <CardContent>
            {analytics.topLateEmployees.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">No late records found</p>
            ) : (
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {analytics.topLateEmployees.map((emp, i) => (
                  <div key={emp.employeeId} className="flex items-center justify-between text-sm py-1.5 border-b border-gray-50 last:border-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-orange-100 text-[10px] font-bold text-orange-700">
                        {i + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 truncate">{emp.name}</p>
                        <p className="text-[10px] text-gray-400">{emp.department}</p>
                      </div>
                    </div>
                    <span className="shrink-0 rounded-full bg-orange-50 px-2 py-0.5 text-xs font-semibold text-orange-700">
                      {emp.lateCount}x
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
