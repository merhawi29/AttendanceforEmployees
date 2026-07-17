"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { ReportsAnalytics } from "@/components/admin/reports-analytics";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/auth-context";
import { Attendance, DashboardStats } from "@/types";
import { apiRequest } from "@/lib/api";
import { getStatusColor, formatStatusLabel } from "@/lib/utils";
import {
  ReportType,
  REPORT_TYPE_LABELS,
  getDateRangeForReportType,
  buildAttendanceQuery,
  getTrendDateRange,
  getMonthlyDateRange,
  filterReportData,
  computeReportSummary,
  attendanceToRow,
  buildAnalytics,
  extractDepartments,
  extractEmployees,
} from "@/lib/report-utils";
import { exportToPdf, exportToExcel, printReport } from "@/lib/report-export";
import {
  Loader2,
  Search,
  RefreshCw,
  FileText,
  FileSpreadsheet,
  Printer,
  Calendar,
  Users,
  Building2,
  Clock,
  UserX,
  BarChart3,
  Filter,
  XCircle,
} from "lucide-react";

const REPORT_TYPES: { type: ReportType; icon: typeof Calendar; description: string }[] = [
  { type: "daily", icon: Calendar, description: "Today's attendance" },
  { type: "weekly", icon: BarChart3, description: "This week's summary" },
  { type: "monthly", icon: Calendar, description: "Current month overview" },
  { type: "custom", icon: Filter, description: "Pick your own dates" },
  { type: "employee", icon: Users, description: "Individual employee records" },
  { type: "department", icon: Building2, description: "Group by department" },
  { type: "late", icon: Clock, description: "Late arrival records" },
  { type: "absent", icon: UserX, description: "Absence records" },
];

function ReportsContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();

  const [reportType, setReportType] = useState<ReportType>(
    (searchParams.get("type") as ReportType) || "daily"
  );
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [trendAttendances, setTrendAttendances] = useState<Attendance[]>([]);
  const [monthlyAttendances, setMonthlyAttendances] = useState<Attendance[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDept, setSelectedDept] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [selectedEmployee, setSelectedEmployee] = useState("ALL");

  const dateRange = useMemo(
    () => getDateRangeForReportType(reportType, customStart, customEnd),
    [reportType, customStart, customEnd]
  );

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const query = buildAttendanceQuery(dateRange);
      const trendRange = getTrendDateRange();
      const monthRange = getMonthlyDateRange();

      const [statsData, attendanceData, trendData, monthData] = await Promise.all([
        apiRequest<DashboardStats>("/attendance/stats"),
        apiRequest<Attendance[]>(`/attendance/all${query}`),
        apiRequest<Attendance[]>(`/attendance/all${buildAttendanceQuery(trendRange)}`),
        apiRequest<Attendance[]>(`/attendance/all${buildAttendanceQuery(monthRange)}`),
      ]);

      setStats(statsData);
      setAttendances(attendanceData);
      setTrendAttendances(trendData);
      setMonthlyAttendances(monthData);
    } catch {
      setError("Failed to load report data");
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    setCustomStart(today);
    setCustomEnd(today);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (reportType === "late") setSelectedStatus("LATE");
    else if (reportType === "absent") setSelectedStatus("ABSENT");
    else if (selectedStatus === "LATE" || selectedStatus === "ABSENT") setSelectedStatus("ALL");
  }, [reportType]);

  const departments = useMemo(() => extractDepartments(attendances), [attendances]);
  const employees = useMemo(() => extractEmployees(attendances), [attendances]);

  const filtered = useMemo(
    () =>
      filterReportData(attendances, {
        search: searchQuery,
        department: selectedDept,
        status: selectedStatus,
        employeeId: selectedEmployee,
        reportType,
      }),
    [attendances, searchQuery, selectedDept, selectedStatus, selectedEmployee, reportType]
  );

  const summary = useMemo(
    () => computeReportSummary(filtered, stats?.totalEmployees || filtered.length),
    [filtered, stats]
  );

  const analytics = useMemo(
    () => buildAnalytics(monthlyAttendances, trendAttendances),
    [monthlyAttendances, trendAttendances]
  );

  const exportOptions = useMemo(
    () => ({
      reportTitle: REPORT_TYPE_LABELS[reportType],
      dateRangeLabel: dateRange.label,
      generatedBy: user?.name || "Admin",
      rows: filtered.map(attendanceToRow),
      summary,
    }),
    [reportType, dateRange, user, filtered, summary]
  );

  const handleExportPdf = async () => {
    setExporting(true);
    try {
      exportToPdf(exportOptions);
    } finally {
      setExporting(false);
    }
  };

  const handleExportExcel = async () => {
    setExporting(true);
    try {
      exportToExcel(exportOptions);
    } finally {
      setExporting(false);
    }
  };

  const handlePrint = () => {
    printReport(exportOptions);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Reports</h2>
          <p className="text-gray-500">Generate, filter, and export attendance reports</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
          <Button variant="outline" size="sm" onClick={handlePrint} disabled={exporting}>
            <Printer className="h-4 w-4" />
            <span className="hidden sm:inline">Print</span>
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportExcel} disabled={exporting}>
            <FileSpreadsheet className="h-4 w-4" />
            <span className="hidden sm:inline">Excel</span>
          </Button>
          <Button size="sm" onClick={handleExportPdf} disabled={exporting}>
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Export PDF</span>
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
        {[
          { label: "Total Employees", value: summary.totalEmployees, color: "text-blue-600 bg-blue-50 border-blue-100" },
          { label: "Present", value: summary.present, color: "text-green-600 bg-green-50 border-green-100" },
          { label: "Late", value: summary.late, color: "text-orange-600 bg-orange-50 border-orange-100" },
          { label: "Absent", value: summary.absent, color: "text-red-600 bg-red-50 border-red-100" },
          { label: "Half Day", value: summary.halfDay, color: "text-yellow-600 bg-yellow-50 border-yellow-100" },
          { label: "Attendance %", value: `${summary.attendancePercentage}%`, color: "text-indigo-600 bg-indigo-50 border-indigo-100" },
        ].map((s) => (
          <Card key={s.label} className={`shadow-sm border ${s.color.split(" ").slice(2).join(" ")}`}>
            <CardContent className="p-3 text-center">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">{s.label}</p>
              <p className={`text-xl font-bold mt-1 ${s.color.split(" ")[0]}`}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Report Type Selection */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Report Type</CardTitle>
          <CardDescription>Select the report you want to generate</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 grid-cols-2 sm:grid-cols-4">
            {REPORT_TYPES.map(({ type, icon: Icon, description }) => (
              <button
                key={type}
                type="button"
                onClick={() => setReportType(type)}
                className={`flex flex-col items-start gap-1 rounded-lg border p-3 text-left transition-all ${
                  reportType === type
                    ? "border-blue-500 bg-blue-50 ring-1 ring-blue-500"
                    : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Icon className={`h-4 w-4 ${reportType === type ? "text-blue-600" : "text-gray-400"}`} />
                  <span className={`text-xs font-semibold ${reportType === type ? "text-blue-700" : "text-gray-700"}`}>
                    {REPORT_TYPE_LABELS[type].replace(" Report", "")}
                  </span>
                </div>
                <span className="text-[10px] text-gray-400 leading-tight">{description}</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card className="shadow-sm border-gray-200">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-blue-600" />
            <CardTitle className="text-base">Filters</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex-1 min-w-[180px] relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search employee or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-white"
              />
            </div>

            <select
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value)}
              className="h-9 rounded-lg border border-gray-300 bg-white px-3 text-sm shadow-sm focus:border-blue-500 focus:outline-none min-w-[160px]"
            >
              <option value="ALL">All Employees</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>{emp.name}</option>
              ))}
            </select>

            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="h-9 rounded-lg border border-gray-300 bg-white px-3 text-sm shadow-sm focus:border-blue-500 focus:outline-none min-w-[160px]"
            >
              <option value="ALL">All Departments</option>
              {departments.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              disabled={reportType === "late" || reportType === "absent"}
              className="h-9 rounded-lg border border-gray-300 bg-white px-3 text-sm shadow-sm focus:border-blue-500 focus:outline-none min-w-[140px] disabled:opacity-50"
            >
              <option value="ALL">All Statuses</option>
              <option value="PRESENT">Present</option>
              <option value="LATE">Late</option>
              <option value="ABSENT">Absent</option>
              <option value="HALF_DAY">Half Day</option>
              <option value="LUNCH_MISSING">Lunch Missing</option>
            </select>
          </div>

          {/* Date Range */}
          <div className="flex flex-wrap items-center gap-3 pt-1 border-t border-gray-100">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Date Range:</span>
            {reportType === "custom" ? (
              <>
                <Input
                  type="date"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="w-auto h-9 bg-white"
                />
                <span className="text-gray-400 text-sm">to</span>
                <Input
                  type="date"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="w-auto h-9 bg-white"
                />
              </>
            ) : (
              <Badge className="text-blue-700 bg-blue-50 border border-blue-200">
                {dateRange.label} ({dateRange.startDate} — {dateRange.endDate})
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <XCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Analytics */}
      {!loading && <ReportsAnalytics analytics={analytics} />}

      {/* Data Table */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3 border-b border-gray-100">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <CardTitle>{REPORT_TYPE_LABELS[reportType]}</CardTitle>
              <CardDescription>
                {filtered.length} record{filtered.length !== 1 ? "s" : ""} found
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={handleExportPdf} disabled={exporting}>
                <FileText className="h-3.5 w-3.5" /> PDF
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportExcel} disabled={exporting}>
                <FileSpreadsheet className="h-3.5 w-3.5" /> Excel
              </Button>
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="h-3.5 w-3.5" /> Print
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="py-20 text-center text-sm text-gray-400">No matching records for the selected filters.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50/50 text-gray-500 uppercase tracking-wider text-xs font-semibold">
                    <th className="py-3.5 px-4">Employee</th>
                    <th className="py-3.5 px-4">Department</th>
                    <th className="py-3.5 px-4">Date</th>
                    <th className="py-3.5 px-4 hidden sm:table-cell">Morning In</th>
                    <th className="py-3.5 px-4 hidden md:table-cell">Lunch Out</th>
                    <th className="py-3.5 px-4 hidden md:table-cell">Lunch Return</th>
                    <th className="py-3.5 px-4 hidden sm:table-cell">Final Out</th>
                    <th className="py-3.5 px-4 hidden lg:table-cell">Hours</th>
                    <th className="py-3.5 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map((a) => (
                    <tr key={a.id} className="hover:bg-gray-50/30 transition-colors">
                      <td className="py-3.5 px-4">
                        <p className="font-semibold text-gray-900">{a.user?.name}</p>
                        <p className="text-xs text-gray-400">{a.user?.employeeId}</p>
                      </td>
                      <td className="py-3.5 px-4 text-gray-600">{a.user?.department || "—"}</td>
                      <td className="py-3.5 px-4 text-gray-600 text-xs">{a.ethiopianDateLabel || a.ethiopianDate}</td>
                      <td className="py-3.5 px-4 text-gray-600 hidden sm:table-cell">{a.morningIn ? new Date(a.morningIn).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true }) : "—"}</td>
                      <td className="py-3.5 px-4 text-gray-600 hidden md:table-cell">{a.lunchOut ? new Date(a.lunchOut).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true }) : "—"}</td>
                      <td className="py-3.5 px-4 text-gray-600 hidden md:table-cell">{a.lunchReturn ? new Date(a.lunchReturn).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true }) : "—"}</td>
                      <td className="py-3.5 px-4 text-gray-600 hidden sm:table-cell">{a.finalOut ? new Date(a.finalOut).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true }) : "—"}</td>
                      <td className="py-3.5 px-4 text-gray-700 font-semibold hidden lg:table-cell">
                        {attendanceToRow(a).workedHours}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider ${getStatusColor(a.status)}`}>
                          {formatStatusLabel(a.status)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function ReportsPage() {
  return (
    <ProtectedRoute requiredRole="ADMIN">
      <DashboardLayout>
        <Suspense
          fallback={
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          }
        >
          <ReportsContent />
        </Suspense>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
