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
  exportGenericPdf,
  exportGenericExcel,
  printGenericReport,
} from "@/lib/advanced-report-export";
import {
  fetchLeaveAnalytics,
  fetchOvertimeAnalytics,
  fetchPayrollAnalytics,
  fetchDepartmentAnalytics,
  fetchExecutiveDashboard,
  fetchEmployeePerformanceAnalytics,
  LeaveAnalyticsData,
  OvertimeAnalyticsData,
  PayrollAnalyticsData,
  DepartmentKpiData,
  ExecutiveDashboardData,
  EmployeePerformanceData,
} from "@/lib/reports-api";
import { SimpleBarChart, TrendLineChart } from "@/components/admin/reports/report-charts";
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
  Briefcase,
  DollarSign,
  TrendingUp,
  Award,
  PieChart,
  CheckCircle2,
  Clock3,
} from "lucide-react";

type MainCategoryTab =
  | "attendance"
  | "leave"
  | "overtime"
  | "payroll"
  | "department"
  | "executive"
  | "employee-performance";

const ATTENDANCE_TYPES: { type: ReportType; icon: typeof Calendar; description: string }[] = [
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

  const [activeTab, setActiveTab] = useState<MainCategoryTab>("attendance");
  const [reportType, setReportType] = useState<ReportType>(
    (searchParams.get("type") as ReportType) || "daily"
  );

  // Attendance state
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [trendAttendances, setTrendAttendances] = useState<Attendance[]>([]);
  const [monthlyAttendances, setMonthlyAttendances] = useState<Attendance[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);

  // Analytics states
  const [leaveData, setLeaveData] = useState<LeaveAnalyticsData | null>(null);
  const [otData, setOtData] = useState<OvertimeAnalyticsData | null>(null);
  const [payrollData, setPayrollData] = useState<PayrollAnalyticsData | null>(null);
  const [deptData, setDeptData] = useState<DepartmentKpiData | null>(null);
  const [execData, setExecData] = useState<ExecutiveDashboardData | null>(null);
  const [perfData, setPerfData] = useState<EmployeePerformanceData | null>(null);

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

  const fetchTabContent = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (activeTab === "attendance") {
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
      } else if (activeTab === "leave") {
        const res = await fetchLeaveAnalytics({
          startDate: customStart,
          endDate: customEnd,
          departmentId: selectedDept,
          status: selectedStatus,
        });
        setLeaveData(res);
      } else if (activeTab === "overtime") {
        const res = await fetchOvertimeAnalytics({
          startDate: customStart,
          endDate: customEnd,
          departmentId: selectedDept,
          status: selectedStatus,
        });
        setOtData(res);
      } else if (activeTab === "payroll") {
        const res = await fetchPayrollAnalytics({
          departmentId: selectedDept,
          status: selectedStatus,
        });
        setPayrollData(res);
      } else if (activeTab === "department") {
        const res = await fetchDepartmentAnalytics();
        setDeptData(res);
      } else if (activeTab === "executive") {
        const res = await fetchExecutiveDashboard();
        setExecData(res);
      } else if (activeTab === "employee-performance") {
        const res = await fetchEmployeePerformanceAnalytics({
          departmentId: selectedDept,
          employeeId: selectedEmployee,
        });
        setPerfData(res);
      }
    } catch {
      setError("Failed to load report analytics");
    } finally {
      setLoading(false);
    }
  }, [activeTab, dateRange, customStart, customEnd, selectedDept, selectedStatus, selectedEmployee]);

  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    setCustomStart(today);
    setCustomEnd(today);
  }, []);

  useEffect(() => {
    fetchTabContent();
  }, [fetchTabContent]);

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

  // Dynamic Export Handler
  const handleExport = (type: "pdf" | "excel" | "print") => {
    setExporting(true);
    try {
      if (activeTab === "attendance") {
        const opts = {
          reportTitle: REPORT_TYPE_LABELS[reportType],
          dateRangeLabel: dateRange.label,
          generatedBy: user?.name || "Admin",
          rows: filtered.map(attendanceToRow),
          summary,
        };
        if (type === "pdf") exportToPdf(opts);
        else if (type === "excel") exportToExcel(opts);
        else printReport(opts);
      } else if (activeTab === "leave" && leaveData) {
        const headers = ["Employee", "Department", "Leave Type", "Start Date", "End Date", "Days", "Status"];
        const rows = leaveData.records.map((r: any) => [
          r.user?.name || "—",
          r.user?.departmentRef?.name || r.user?.department || "—",
          r.leaveType?.name || "—",
          new Date(r.startDate).toLocaleDateString(),
          new Date(r.endDate).toLocaleDateString(),
          r.totalDays,
          r.status,
        ]);
        if (type === "pdf") exportGenericPdf("Leave Analytics Report", headers, rows);
        else if (type === "excel") exportGenericExcel("Leave Analytics Report", headers, rows);
        else printGenericReport("Leave Analytics Report", headers, rows);
      } else if (activeTab === "overtime" && otData) {
        const headers = ["Employee", "Department", "Date", "Hours", "Multiplier", "Category", "Status"];
        const rows = otData.records.map((r: any) => [
          r.user?.name || "—",
          r.user?.departmentRef?.name || r.user?.department || "—",
          new Date(r.date).toLocaleDateString(),
          r.totalHours,
          `${r.multiplierRate}x`,
          r.category,
          r.status,
        ]);
        if (type === "pdf") exportGenericPdf("Overtime Analytics Report", headers, rows);
        else if (type === "excel") exportGenericExcel("Overtime Analytics Report", headers, rows);
        else printGenericReport("Overtime Analytics Report", headers, rows);
      } else if (activeTab === "payroll" && payrollData) {
        const headers = ["Employee", "Department", "Month/Year", "Basic Salary", "Allowances", "Deductions", "Net Salary", "Status"];
        const rows = payrollData.records.map((r: any) => [
          r.user?.name || "—",
          r.user?.departmentRef?.name || r.user?.department || "—",
          `${r.month}/${r.year}`,
          r.basicSalary,
          r.totalAllowances,
          r.totalDeductions,
          r.netSalary,
          r.status,
        ]);
        if (type === "pdf") exportGenericPdf("Payroll Analytics Report", headers, rows);
        else if (type === "excel") exportGenericExcel("Payroll Analytics Report", headers, rows);
        else printGenericReport("Payroll Analytics Report", headers, rows);
      } else if (activeTab === "department" && deptData) {
        const headers = ["Department Code", "Department Name", "Employee Count", "Attendance Rate", "Leave Days", "OT Hours", "Payroll Cost"];
        const rows = deptData.departments.map((d) => [
          d.code,
          d.name,
          d.employeeCount,
          `${d.attendanceRate}%`,
          d.leaveDaysUsed,
          d.otHours,
          `$${d.payrollCost.toLocaleString()}`,
        ]);
        if (type === "pdf") exportGenericPdf("Department KPI Dashboard Report", headers, rows);
        else if (type === "excel") exportGenericExcel("Department KPI Dashboard Report", headers, rows);
        else printGenericReport("Department KPI Dashboard Report", headers, rows);
      } else if (activeTab === "employee-performance" && perfData) {
        const headers = ["Employee ID", "Name", "Department", "Position", "Attendance %", "Late Count", "Absent Count", "Leave Days", "OT Hours"];
        const rows = perfData.all.map((p) => [
          p.employeeId,
          p.name,
          p.department,
          p.position,
          `${p.attendancePercentage}%`,
          p.lateCount,
          p.absentCount,
          p.leaveDays,
          p.otHours,
        ]);
        if (type === "pdf") exportGenericPdf("Employee Performance Report", headers, rows);
        else if (type === "excel") exportGenericExcel("Employee Performance Report", headers, rows);
        else printGenericReport("Employee Performance Report", headers, rows);
      }
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-gray-200 pb-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Executive Reports & BI Analytics</h2>
          <p className="text-gray-500 text-sm">Comprehensive Business Intelligence dashboard across Attendance, Leave, Overtime, Payroll, & KPIs</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchTabContent} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleExport("print")} disabled={exporting}>
            <Printer className="h-4 w-4" />
            <span className="hidden sm:inline">Print</span>
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleExport("excel")} disabled={exporting}>
            <FileSpreadsheet className="h-4 w-4" />
            <span className="hidden sm:inline">Excel</span>
          </Button>
          <Button size="sm" onClick={() => handleExport("pdf")} disabled={exporting}>
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Export PDF</span>
          </Button>
        </div>
      </div>

      {/* Main Tab Navigation */}
      <div className="flex flex-wrap items-center gap-2 border-b border-gray-200 pb-2">
        {[
          { id: "attendance", label: "Attendance Reports", icon: Calendar },
          { id: "leave", label: "Leave Analytics", icon: Briefcase },
          { id: "overtime", label: "Overtime Analytics", icon: Clock3 },
          { id: "payroll", label: "Payroll Analytics", icon: DollarSign },
          { id: "department", label: "Department KPIs", icon: Building2 },
          { id: "executive", label: "Executive Summary", icon: TrendingUp },
          { id: "employee-performance", label: "Employee Performance", icon: Award },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as MainCategoryTab)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg font-semibold text-xs transition-all ${
                isActive
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <XCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* ----------------- 1. ATTENDANCE TAB ----------------- */}
      {activeTab === "attendance" && (
        <div className="space-y-6">
          {/* Attendance Stats Cards */}
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

          {/* Sub Report Selection */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Attendance Report Type</CardTitle>
              <CardDescription>Select report filter view</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2 grid-cols-2 sm:grid-cols-4">
                {ATTENDANCE_TYPES.map(({ type, icon: Icon, description }) => (
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

          {/* Analytics Visuals */}
          {!loading && <ReportsAnalytics analytics={analytics} />}

          {/* Table */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3 border-b border-gray-100">
              <CardTitle>{REPORT_TYPE_LABELS[reportType]}</CardTitle>
              <CardDescription>{filtered.length} record(s) found</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex justify-center py-20">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead>
                      <tr className="border-b border-gray-200 bg-gray-50/50 text-gray-500 uppercase tracking-wider text-xs font-semibold">
                        <th className="py-3.5 px-4">Employee</th>
                        <th className="py-3.5 px-4">Department</th>
                        <th className="py-3.5 px-4">Date</th>
                        <th className="py-3.5 px-4 hidden sm:table-cell">Morning In</th>
                        <th className="py-3.5 px-4 hidden sm:table-cell">Final Out</th>
                        <th className="py-3.5 px-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filtered.map((a) => (
                        <tr key={a.id} className="hover:bg-gray-50/30">
                          <td className="py-3.5 px-4 font-semibold text-gray-900">{a.user?.name}</td>
                          <td className="py-3.5 px-4 text-gray-600">{a.user?.department || "—"}</td>
                          <td className="py-3.5 px-4 text-gray-600 text-xs">{a.ethiopianDateLabel || a.ethiopianDate}</td>
                          <td className="py-3.5 px-4 text-gray-600 hidden sm:table-cell">{a.morningIn ? new Date(a.morningIn).toLocaleTimeString() : "—"}</td>
                          <td className="py-3.5 px-4 text-gray-600 hidden sm:table-cell">{a.finalOut ? new Date(a.finalOut).toLocaleTimeString() : "—"}</td>
                          <td className="py-3.5 px-4">
                            <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${getStatusColor(a.status)}`}>
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
      )}

      {/* ----------------- 2. LEAVE ANALYTICS TAB ----------------- */}
      {activeTab === "leave" && (
        <div className="space-y-6">
          {/* Leave Summary Cards */}
          <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
            <Card className="shadow-sm border border-blue-100 bg-blue-50">
              <CardContent className="p-3 text-center">
                <p className="text-[10px] font-semibold uppercase text-gray-500">Total Requests</p>
                <p className="text-xl font-bold mt-1 text-blue-700">{leaveData?.summary.totalRequests || 0}</p>
              </CardContent>
            </Card>
            <Card className="shadow-sm border border-green-100 bg-green-50">
              <CardContent className="p-3 text-center">
                <p className="text-[10px] font-semibold uppercase text-gray-500">Approved</p>
                <p className="text-xl font-bold mt-1 text-green-700">{leaveData?.summary.approvedRequests || 0}</p>
              </CardContent>
            </Card>
            <Card className="shadow-sm border border-yellow-100 bg-yellow-50">
              <CardContent className="p-3 text-center">
                <p className="text-[10px] font-semibold uppercase text-gray-500">Pending</p>
                <p className="text-xl font-bold mt-1 text-yellow-700">{leaveData?.summary.pendingRequests || 0}</p>
              </CardContent>
            </Card>
            <Card className="shadow-sm border border-red-100 bg-red-50">
              <CardContent className="p-3 text-center">
                <p className="text-[10px] font-semibold uppercase text-gray-500">Rejected</p>
                <p className="text-xl font-bold mt-1 text-red-700">{leaveData?.summary.rejectedRequests || 0}</p>
              </CardContent>
            </Card>
            <Card className="shadow-sm border border-purple-100 bg-purple-50">
              <CardContent className="p-3 text-center">
                <p className="text-[10px] font-semibold uppercase text-gray-500">Total Leave Days</p>
                <p className="text-xl font-bold mt-1 text-purple-700">{leaveData?.summary.totalDaysUsed || 0}</p>
              </CardContent>
            </Card>
            <Card className="shadow-sm border border-indigo-100 bg-indigo-50">
              <CardContent className="p-3 text-center">
                <p className="text-[10px] font-semibold uppercase text-gray-500">Currently On Leave</p>
                <p className="text-xl font-bold mt-1 text-indigo-700">{leaveData?.summary.currentlyOnLeave || 0}</p>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid gap-4 md:grid-cols-2">
            <SimpleBarChart
              title="Leave Days by Department"
              description="Total approved leave days aggregated by department"
              items={(leaveData?.leaveByDepartment || []).map((d) => ({
                label: d.department,
                value: d.days,
                color: "bg-purple-600",
              }))}
              unit="days"
            />
            <SimpleBarChart
              title="Leave Requests by Type"
              description="Breakdown of leave categories"
              items={(leaveData?.leaveByType || []).map((t) => ({
                label: t.typeName,
                value: t.count,
                color: "bg-blue-600",
              }))}
              unit="requests"
            />
          </div>

          {/* Top Leave Employees Table */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3 border-b border-gray-100">
              <CardTitle className="text-base font-bold">Top Employees Utilizing Leave</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="border-b bg-gray-50 text-gray-500 uppercase text-xs font-semibold">
                      <th className="py-3 px-4">Employee ID</th>
                      <th className="py-3 px-4">Name</th>
                      <th className="py-3 px-4">Department</th>
                      <th className="py-3 px-4">Requests</th>
                      <th className="py-3 px-4">Total Leave Days</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {(leaveData?.topEmployees || []).map((emp) => (
                      <tr key={emp.employeeId} className="hover:bg-gray-50/50">
                        <td className="py-3 px-4 font-mono text-xs text-gray-500">{emp.employeeId}</td>
                        <td className="py-3 px-4 font-semibold text-gray-900">{emp.name}</td>
                        <td className="py-3 px-4 text-gray-600">{emp.department}</td>
                        <td className="py-3 px-4 text-gray-700">{emp.requests}</td>
                        <td className="py-3 px-4 font-bold text-purple-600">{emp.totalDays} days</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ----------------- 3. OVERTIME ANALYTICS TAB ----------------- */}
      {activeTab === "overtime" && (
        <div className="space-y-6">
          {/* Overtime Cards */}
          <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
            <Card className="shadow-sm border border-blue-100 bg-blue-50">
              <CardContent className="p-3 text-center">
                <p className="text-[10px] font-semibold uppercase text-gray-500">Total OT Hours</p>
                <p className="text-xl font-bold mt-1 text-blue-700">{otData?.summary.totalHours || 0} hrs</p>
              </CardContent>
            </Card>
            <Card className="shadow-sm border border-green-100 bg-green-50">
              <CardContent className="p-3 text-center">
                <p className="text-[10px] font-semibold uppercase text-gray-500">Approved OT Hours</p>
                <p className="text-xl font-bold mt-1 text-green-700">{otData?.summary.approvedHours || 0} hrs</p>
              </CardContent>
            </Card>
            <Card className="shadow-sm border border-orange-100 bg-orange-50">
              <CardContent className="p-3 text-center">
                <p className="text-[10px] font-semibold uppercase text-gray-500">Payroll Weighted Hours</p>
                <p className="text-xl font-bold mt-1 text-orange-700">{otData?.summary.payrollWeightedHours || 0} hrs</p>
              </CardContent>
            </Card>
            <Card className="shadow-sm border border-indigo-100 bg-indigo-50">
              <CardContent className="p-3 text-center">
                <p className="text-[10px] font-semibold uppercase text-gray-500">Avg OT / Employee</p>
                <p className="text-xl font-bold mt-1 text-indigo-700">{otData?.summary.avgOtPerEmployee || 0} hrs</p>
              </CardContent>
            </Card>
            <Card className="shadow-sm border border-yellow-100 bg-yellow-50">
              <CardContent className="p-3 text-center">
                <p className="text-[10px] font-semibold uppercase text-gray-500">Pending Requests</p>
                <p className="text-xl font-bold mt-1 text-yellow-700">{otData?.summary.pendingRequestsCount || 0}</p>
              </CardContent>
            </Card>
            <Card className="shadow-sm border border-red-100 bg-red-50">
              <CardContent className="p-3 text-center">
                <p className="text-[10px] font-semibold uppercase text-gray-500">Rejected Requests</p>
                <p className="text-xl font-bold mt-1 text-red-700">{otData?.summary.rejectedRequestsCount || 0}</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <SimpleBarChart
              title="Overtime Hours by Department"
              description="Approved overtime hours per department"
              items={(otData?.otByDepartment || []).map((d) => ({
                label: d.department,
                value: d.approvedHours,
                color: "bg-orange-500",
              }))}
              unit="hrs"
            />
            <SimpleBarChart
              title="Top Overtime Performers"
              description="Employees with highest approved OT hours"
              items={(otData?.topEmployees || []).map((e) => ({
                label: e.name,
                value: e.approvedHours,
                color: "bg-blue-600",
              }))}
              unit="hrs"
            />
          </div>
        </div>
      )}

      {/* ----------------- 4. PAYROLL ANALYTICS TAB ----------------- */}
      {activeTab === "payroll" && (
        <div className="space-y-6">
          <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
            <Card className="shadow-sm border border-blue-100 bg-blue-50">
              <CardContent className="p-3 text-center">
                <p className="text-[10px] font-semibold uppercase text-gray-500">Total Payroll Cost</p>
                <p className="text-xl font-bold mt-1 text-blue-700">${payrollData?.summary.totalPayrollCost?.toLocaleString() || 0}</p>
              </CardContent>
            </Card>
            <Card className="shadow-sm border border-green-100 bg-green-50">
              <CardContent className="p-3 text-center">
                <p className="text-[10px] font-semibold uppercase text-gray-500">Total Net Salary</p>
                <p className="text-xl font-bold mt-1 text-green-700">${payrollData?.summary.totalNetSalary?.toLocaleString() || 0}</p>
              </CardContent>
            </Card>
            <Card className="shadow-sm border border-red-100 bg-red-50">
              <CardContent className="p-3 text-center">
                <p className="text-[10px] font-semibold uppercase text-gray-500">Total Deductions</p>
                <p className="text-xl font-bold mt-1 text-red-700">${payrollData?.summary.totalDeductions?.toLocaleString() || 0}</p>
              </CardContent>
            </Card>
            <Card className="shadow-sm border border-yellow-100 bg-yellow-50">
              <CardContent className="p-3 text-center">
                <p className="text-[10px] font-semibold uppercase text-gray-500">Total Bonuses</p>
                <p className="text-xl font-bold mt-1 text-yellow-700">${payrollData?.summary.totalBonuses?.toLocaleString() || 0}</p>
              </CardContent>
            </Card>
            <Card className="shadow-sm border border-indigo-100 bg-indigo-50">
              <CardContent className="p-3 text-center">
                <p className="text-[10px] font-semibold uppercase text-gray-500">Avg Employee Salary</p>
                <p className="text-xl font-bold mt-1 text-indigo-700">${payrollData?.summary.avgEmployeeSalary?.toLocaleString() || 0}</p>
              </CardContent>
            </Card>
            <Card className="shadow-sm border border-purple-100 bg-purple-50">
              <CardContent className="p-3 text-center">
                <p className="text-[10px] font-semibold uppercase text-gray-500">Records Processed</p>
                <p className="text-xl font-bold mt-1 text-purple-700">{payrollData?.summary.recordCount || 0}</p>
              </CardContent>
            </Card>
          </div>

          <SimpleBarChart
            title="Payroll Cost by Department"
            description="Gross salary expenses grouped by department"
            items={(payrollData?.departmentSummary || []).map((d) => ({
              label: d.department,
              value: d.totalGross,
              color: "bg-emerald-600",
            }))}
            unit="$"
          />
        </div>
      )}

      {/* ----------------- 5. DEPARTMENT KPIS TAB ----------------- */}
      {activeTab === "department" && (
        <div className="space-y-6">
          {/* Department Rankings */}
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-3">
            <Card className="shadow-sm border border-amber-200 bg-amber-50/50">
              <CardContent className="p-4 flex items-center gap-3">
                <Award className="h-8 w-8 text-amber-500 shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase">Best Performing Dept</p>
                  <p className="text-lg font-bold text-gray-900">{deptData?.rankings.bestPerforming?.name || "N/A"}</p>
                  <p className="text-xs text-amber-700 font-semibold">{deptData?.rankings.bestPerforming?.attendanceRate || 0}% Attendance Rate</p>
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-sm border border-blue-200 bg-blue-50/50">
              <CardContent className="p-4 flex items-center gap-3">
                <Building2 className="h-8 w-8 text-blue-500 shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase">Highest Overtime Dept</p>
                  <p className="text-lg font-bold text-gray-900">{deptData?.rankings.highestOvertime?.name || "N/A"}</p>
                  <p className="text-xs text-blue-700 font-semibold">{deptData?.rankings.highestOvertime?.otHours || 0} OT Hours</p>
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-sm border border-emerald-200 bg-emerald-50/50">
              <CardContent className="p-4 flex items-center gap-3">
                <DollarSign className="h-8 w-8 text-emerald-500 shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase">Highest Payroll Dept</p>
                  <p className="text-lg font-bold text-gray-900">{deptData?.rankings.highestPayroll?.name || "N/A"}</p>
                  <p className="text-xs text-emerald-700 font-semibold">${deptData?.rankings.highestPayroll?.payrollCost?.toLocaleString() || 0}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Department KPI Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {(deptData?.departments || []).map((d) => (
              <Card key={d.id} className="shadow-sm border border-gray-200">
                <CardHeader className="pb-2 border-b border-gray-100">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-base font-bold text-gray-900">{d.name}</CardTitle>
                    <Badge variant="secondary" className="font-mono text-xs">{d.code}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-4 space-y-3">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Employee Count</span>
                    <span className="font-bold text-gray-900">{d.employeeCount}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Attendance Rate</span>
                    <span className="font-bold text-blue-600">{d.attendanceRate}%</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Leave Days Used</span>
                    <span className="font-bold text-purple-600">{d.leaveDaysUsed} days</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Overtime Hours</span>
                    <span className="font-bold text-orange-600">{d.otHours} hrs</span>
                  </div>
                  <div className="flex justify-between text-xs border-t pt-2">
                    <span className="text-gray-500">Total Payroll Cost</span>
                    <span className="font-bold text-emerald-600">${d.payrollCost.toLocaleString()}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ----------------- 6. EXECUTIVE DASHBOARD TAB ----------------- */}
      {activeTab === "executive" && (
        <div className="space-y-6">
          <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
            <Card className="shadow-sm border border-blue-100 bg-blue-50">
              <CardContent className="p-3 text-center">
                <p className="text-[10px] font-semibold uppercase text-gray-500">Total Workforce</p>
                <p className="text-xl font-bold mt-1 text-blue-700">{execData?.cards.totalEmployees || 0}</p>
              </CardContent>
            </Card>
            <Card className="shadow-sm border border-green-100 bg-green-50">
              <CardContent className="p-3 text-center">
                <p className="text-[10px] font-semibold uppercase text-gray-500">Present Today</p>
                <p className="text-xl font-bold mt-1 text-green-700">{execData?.cards.presentToday || 0}</p>
              </CardContent>
            </Card>
            <Card className="shadow-sm border border-purple-100 bg-purple-50">
              <CardContent className="p-3 text-center">
                <p className="text-[10px] font-semibold uppercase text-gray-500">On Leave Today</p>
                <p className="text-xl font-bold mt-1 text-purple-700">{execData?.cards.onLeaveToday || 0}</p>
              </CardContent>
            </Card>
            <Card className="shadow-sm border border-orange-100 bg-orange-50">
              <CardContent className="p-3 text-center">
                <p className="text-[10px] font-semibold uppercase text-gray-500">Monthly OT Hours</p>
                <p className="text-xl font-bold mt-1 text-orange-700">{execData?.cards.totalOvertimeHoursMonth || 0} hrs</p>
              </CardContent>
            </Card>
            <Card className="shadow-sm border border-emerald-100 bg-emerald-50">
              <CardContent className="p-3 text-center">
                <p className="text-[10px] font-semibold uppercase text-gray-500">Monthly Payroll Cost</p>
                <p className="text-xl font-bold mt-1 text-emerald-700">${execData?.cards.totalPayrollCostMonth?.toLocaleString() || 0}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* ----------------- 7. EMPLOYEE PERFORMANCE TAB ----------------- */}
      {activeTab === "employee-performance" && (
        <div className="space-y-6">
          <Card className="shadow-sm">
            <CardHeader className="pb-3 border-b border-gray-100">
              <CardTitle className="text-base font-bold">Top Performing Employees</CardTitle>
              <CardDescription>Ranked by highest attendance rate and punctuality</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="border-b bg-gray-50 text-gray-500 uppercase text-xs font-semibold">
                      <th className="py-3 px-4">Employee ID</th>
                      <th className="py-3 px-4">Name</th>
                      <th className="py-3 px-4">Department</th>
                      <th className="py-3 px-4">Position</th>
                      <th className="py-3 px-4">Attendance %</th>
                      <th className="py-3 px-4">Late Count</th>
                      <th className="py-3 px-4">OT Hours</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {(perfData?.topPerforming || []).map((p) => (
                      <tr key={p.id} className="hover:bg-gray-50/50">
                        <td className="py-3 px-4 font-mono text-xs text-gray-500">{p.employeeId}</td>
                        <td className="py-3 px-4 font-semibold text-gray-900">{p.name}</td>
                        <td className="py-3 px-4 text-gray-600">{p.department}</td>
                        <td className="py-3 px-4 text-gray-600">{p.position}</td>
                        <td className="py-3 px-4 font-bold text-blue-600">{p.attendancePercentage}%</td>
                        <td className="py-3 px-4 text-gray-700">{p.lateCount}</td>
                        <td className="py-3 px-4 text-orange-600 font-semibold">{p.otHours} hrs</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
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
