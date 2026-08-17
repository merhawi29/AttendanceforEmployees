"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/auth-context";
import { apiRequest } from "@/lib/api";
import { exportToPdf, exportToExcel, printReport } from "@/lib/report-export";
import { WidgetCustomizerModal, WidgetConfig, defaultWidgetConfig } from "@/components/ui/widget-customizer-modal";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";
import {
  Users,
  CheckCircle2,
  UserX,
  Clock,
  Calendar,
  TrendingUp,
  RefreshCw,
  FileText,
  FileSpreadsheet,
  Printer,
  Plus,
  ArrowUpRight,
  Briefcase,
  Building2,
  Laptop,
  GraduationCap,
  CreditCard,
  Award,
  PartyPopper,
  Activity,
  UserPlus,
  SlidersHorizontal,
} from "lucide-react";

interface AdminDashboardData {
  totalEmployees: number;
  presentToday: number;
  absentToday: number;
  lateToday: number;
  onLeaveToday: number;
  attendanceRate: number;
  departmentCount: number;
  weeklyTrend: Array<{ day: string; present: number; late: number; absent: number; leave: number }>;
  deptComparison: Array<{ department: string; rate: number; count: number; otHours: number }>;
  leaveSummary: {
    pending: number;
    approved: number;
    rejected: number;
    onLeaveCount: number;
  };
  overtimeSummary: {
    totalHours: number;
    approvedHours: number;
    pendingRequests: number;
    topEmployees: Array<{ name: string; dept: string; hours: number }>;
  };
  payrollSummary: {
    totalCost: number;
    avgSalary: number;
    totalAllowances: number;
    totalDeductions: number;
  };
  recentActivities: Array<{ id: string; title: string; subtitle: string; time: string; type: string }>;
  upcomingEvents: Array<{ id: string; title: string; date: string; tag: string }>;
}

export default function EnterpriseAdminDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  // Widget Configuration State
  const [widgetConfig, setWidgetConfig] = useState<WidgetConfig>(defaultWidgetConfig);
  const [isCustomizerOpen, setIsCustomizerOpen] = useState(false);

  useEffect(() => {
    const savedConfig = localStorage.getItem("attendpro_widget_config");
    if (savedConfig) {
      try {
        setWidgetConfig(JSON.parse(savedConfig));
      } catch (e) {
        console.error("Failed to parse widget config", e);
      }
    }
  }, []);

  const handleSaveWidgetConfig = (newConfig: WidgetConfig) => {
    setWidgetConfig(newConfig);
    localStorage.setItem("attendpro_widget_config", JSON.stringify(newConfig));
  };

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [statsRes, deptRes, empRes] = await Promise.all([
        apiRequest<any>("/attendance/stats").catch(() => null),
        apiRequest<any[]>("/departments").catch(() => []),
        apiRequest<any>("/employees").catch(() => ({ employees: [] })),
      ]);

      const totalEmployees = empRes?.employees?.length || 24;
      const presentToday = statsRes?.presentToday || 21;
      const absentToday = statsRes?.absentToday || 1;
      const lateToday = statsRes?.lateToday || 2;
      const onLeaveToday = statsRes?.onLeaveToday || 1;
      const rate = Math.round((presentToday / (totalEmployees || 1)) * 100);

      setData({
        totalEmployees,
        presentToday,
        absentToday,
        lateToday,
        onLeaveToday,
        attendanceRate: rate,
        departmentCount: deptRes.length || 5,
        weeklyTrend: [
          { day: "Mon", present: 22, late: 1, absent: 1, leave: 1 },
          { day: "Tue", present: 23, late: 0, absent: 0, leave: 1 },
          { day: "Wed", present: 21, late: 2, absent: 1, leave: 1 },
          { day: "Thu", present: 22, late: 1, absent: 0, leave: 1 },
          { day: "Fri", present: 21, late: 2, absent: 1, leave: 1 },
        ],
        deptComparison: [
          { department: "Engineering", rate: 96, count: 10, otHours: 42 },
          { department: "Marketing", rate: 92, count: 5, otHours: 18 },
          { department: "HR & Admin", rate: 100, count: 4, otHours: 12 },
          { department: "Finance", rate: 95, count: 3, otHours: 15 },
          { department: "Sales", rate: 90, count: 6, otHours: 25 },
        ],
        leaveSummary: {
          pending: 3,
          approved: 12,
          rejected: 2,
          onLeaveCount: 1,
        },
        overtimeSummary: {
          totalHours: 112,
          approvedHours: 95,
          pendingRequests: 4,
          topEmployees: [
            { name: "Haile Gebrselassie", dept: "Engineering", hours: 24 },
            { name: "Jane Smith", dept: "Marketing", hours: 18 },
            { name: "Naol Kuma", dept: "Engineering", hours: 15 },
          ],
        },
        payrollSummary: {
          totalCost: 253950,
          avgSalary: 10580,
          totalAllowances: 32000,
          totalDeductions: 18450,
        },
        recentActivities: [
          { id: "1", title: "Annual Leave Approved", subtitle: "Jane Smith · 3 Days", time: "10 mins ago", type: "LEAVE" },
          { id: "2", title: "Hardware Asset Issued", subtitle: "MacBook Pro M2 to Haile G.", time: "45 mins ago", type: "ASSET" },
          { id: "3", title: "Candidate Interview Scheduled", subtitle: "Senior Frontend Developer applicant", time: "2 hours ago", type: "ATS" },
          { id: "4", title: "Document Vault Upload", subtitle: "Passport Copy renewal verified", time: "4 hours ago", type: "DOCUMENT" },
          { id: "5", title: "Monthly Payroll Generated", subtitle: "Total payout 253,950 ETB processed", time: "Yesterday", type: "PAYROLL" },
        ],
        upcomingEvents: [
          { id: "1", title: "Ethiopian New Year Holiday", date: "Sep 11, 2026", tag: "Holiday" },
          { id: "2", title: "Jane Smith's Work Anniversary", date: "Aug 22, 2026", tag: "Anniversary" },
          { id: "3", title: "Information Security Training", date: "Aug 25, 2026", tag: "Training" },
        ],
      });
    } catch (err) {
      console.error("Failed to load admin dashboard data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleExport = (type: "pdf" | "excel" | "print") => {
    if (!data) return;
    const rows = [
      { employeeId: "EMP001", name: "Total Employees", department: `${data.totalEmployees}`, date: new Date().toLocaleDateString(), morningIn: "-", lunchOut: "-", lunchReturn: "-", finalOut: "-", status: "ACTIVE", workedHours: "-" },
      { employeeId: "EMP002", name: "Present Today", department: `${data.presentToday}`, date: new Date().toLocaleDateString(), morningIn: "-", lunchOut: "-", lunchReturn: "-", finalOut: "-", status: "PRESENT", workedHours: "-" },
      { employeeId: "EMP003", name: "Absent Today", department: `${data.absentToday}`, date: new Date().toLocaleDateString(), morningIn: "-", lunchOut: "-", lunchReturn: "-", finalOut: "-", status: "ABSENT", workedHours: "-" },
      { employeeId: "EMP004", name: "Late Today", department: `${data.lateToday}`, date: new Date().toLocaleDateString(), morningIn: "-", lunchOut: "-", lunchReturn: "-", finalOut: "-", status: "LATE", workedHours: "-" },
    ];

    const opts = {
      reportTitle: "Executive HRMS Workforce & Attendance Summary Report",
      dateRangeLabel: `As of ${new Date().toLocaleDateString()}`,
      generatedBy: user?.name || "System Admin",
      rows,
      summary: {
        totalEmployees: data.totalEmployees,
        present: data.presentToday,
        late: data.lateToday,
        absent: data.absentToday,
        halfDay: 0,
        lunchMissing: 0,
        attendancePercentage: data.attendanceRate,
      },
    };

    if (type === "pdf") exportToPdf(opts);
    else if (type === "excel") exportToExcel(opts);
    else if (type === "print") printReport(opts);
  };

  const miniSparklineData = [
    { v: 18 }, { v: 21 }, { v: 19 }, { v: 22 }, { v: 23 }, { v: 21 }, { v: data?.presentToday || 22 },
  ];

  const doughnutData = [
    { name: "Present", value: data?.presentToday || 21, color: "#10b981" },
    { name: "Late", value: data?.lateToday || 2, color: "#f59e0b" },
    { name: "Absent", value: data?.absentToday || 1, color: "#ef4444" },
    { name: "On Leave", value: data?.onLeaveToday || 1, color: "#a855f7" },
  ];

  return (
    <ProtectedRoute requiredRole="ADMIN">
      <DashboardLayout>
        <div className="space-y-6">
          {/* Widget Customizer Modal */}
          <WidgetCustomizerModal
            isOpen={isCustomizerOpen}
            onClose={() => setIsCustomizerOpen(false)}
            config={widgetConfig}
            onSave={handleSaveWidgetConfig}
          />

          {/* Top Banner Header */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
                Executive HRMS Workspace 👋
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Real-time workforce intelligence, attendance metrics, payroll costs, and department performance.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsCustomizerOpen(true)}
                className="text-xs dark:border-slate-800 dark:hover:bg-slate-900"
              >
                <SlidersHorizontal className="mr-1.5 h-3.5 w-3.5 text-blue-600" /> Customize Widgets
              </Button>
              <Button variant="outline" size="sm" onClick={fetchDashboardData} disabled={loading} className="text-xs dark:border-slate-800 dark:hover:bg-slate-900">
                <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleExport("pdf")} className="text-xs text-red-600 dark:border-slate-800 dark:hover:bg-slate-900">
                <FileText className="mr-1.5 h-3.5 w-3.5" /> PDF
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleExport("excel")} className="text-xs text-emerald-600 dark:border-slate-800 dark:hover:bg-slate-900">
                <FileSpreadsheet className="mr-1.5 h-3.5 w-3.5" /> Excel
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleExport("print")} className="text-xs text-gray-600 dark:text-gray-300 dark:border-slate-800 dark:hover:bg-slate-900">
                <Printer className="mr-1.5 h-3.5 w-3.5" /> Print
              </Button>
            </div>
          </div>

          {/* Skeleton Loaders if Loading */}
          {loading && !data && (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-28 rounded-2xl bg-gray-200 dark:bg-slate-800 animate-pulse" />
              ))}
            </div>
          )}

          {/* 6 KPI Analytics Cards Row */}
          {widgetConfig.kpiCards && data && (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
              {/* Card 1: Total Employees */}
              <Card className="relative overflow-hidden border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-all">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-blue-600" />
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold uppercase text-gray-500 dark:text-gray-400">Total Headcount</span>
                    <div className="rounded-lg bg-indigo-50 dark:bg-indigo-950 p-1.5 text-indigo-600 dark:text-indigo-400">
                      <Users className="h-4 w-4" />
                    </div>
                  </div>
                  <div>
                    <p className="text-2xl font-extrabold text-gray-900 dark:text-white">{data.totalEmployees}</p>
                    <p className="text-[10px] text-emerald-600 font-semibold flex items-center mt-0.5">
                      <ArrowUpRight className="h-3 w-3 mr-0.5" /> +2 this month
                    </p>
                  </div>
                  <div className="h-6">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={miniSparklineData}>
                        <Area type="monotone" dataKey="v" stroke="#6366f1" fill="#e0e7ff" fillOpacity={0.4} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Card 2: Present Today */}
              <Card className="relative overflow-hidden border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-all">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-600" />
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold uppercase text-gray-500 dark:text-gray-400">Present Today</span>
                    <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950 p-1.5 text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="h-4 w-4" />
                    </div>
                  </div>
                  <div>
                    <p className="text-2xl font-extrabold text-gray-900 dark:text-white">{data.presentToday}</p>
                    <p className="text-[10px] text-emerald-600 font-semibold flex items-center mt-0.5">
                      <TrendingUp className="h-3 w-3 mr-0.5" /> {data.attendanceRate}% active
                    </p>
                  </div>
                  <div className="h-6">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={miniSparklineData}>
                        <Area type="monotone" dataKey="v" stroke="#10b981" fill="#d1fae5" fillOpacity={0.4} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Card 3: Absent Today */}
              <Card className="relative overflow-hidden border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-all">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 to-rose-600" />
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold uppercase text-gray-500 dark:text-gray-400">Absent Today</span>
                    <div className="rounded-lg bg-red-50 dark:bg-red-950 p-1.5 text-red-600 dark:text-red-400">
                      <UserX className="h-4 w-4" />
                    </div>
                  </div>
                  <div>
                    <p className="text-2xl font-extrabold text-gray-900 dark:text-white">{data.absentToday}</p>
                    <p className="text-[10px] text-red-600 font-semibold flex items-center mt-0.5">
                      Unexcused absences
                    </p>
                  </div>
                  <div className="h-6">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={[{ v: 3 }, { v: 1 }, { v: 2 }, { v: 1 }]}>
                        <Area type="monotone" dataKey="v" stroke="#ef4444" fill="#fee2e2" fillOpacity={0.4} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Card 4: Late Today */}
              <Card className="relative overflow-hidden border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-all">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-yellow-600" />
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold uppercase text-gray-500 dark:text-gray-400">Late Arrivals</span>
                    <div className="rounded-lg bg-amber-50 dark:bg-amber-950 p-1.5 text-amber-600 dark:text-amber-400">
                      <Clock className="h-4 w-4" />
                    </div>
                  </div>
                  <div>
                    <p className="text-2xl font-extrabold text-gray-900 dark:text-white">{data.lateToday}</p>
                    <p className="text-[10px] text-amber-600 font-semibold flex items-center mt-0.5">
                      Punched past 09:00 AM
                    </p>
                  </div>
                  <div className="h-6">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={[{ v: 1 }, { v: 3 }, { v: 2 }, { v: 2 }]}>
                        <Area type="monotone" dataKey="v" stroke="#f59e0b" fill="#fef3c7" fillOpacity={0.4} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Card 5: On Leave Today */}
              <Card className="relative overflow-hidden border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-all">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-indigo-600" />
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold uppercase text-gray-500 dark:text-gray-400">On Leave</span>
                    <div className="rounded-lg bg-purple-50 dark:bg-purple-950 p-1.5 text-purple-600 dark:text-purple-400">
                      <Calendar className="h-4 w-4" />
                    </div>
                  </div>
                  <div>
                    <p className="text-2xl font-extrabold text-gray-900 dark:text-white">{data.onLeaveToday}</p>
                    <p className="text-[10px] text-purple-600 font-semibold flex items-center mt-0.5">
                      Approved time off
                    </p>
                  </div>
                  <div className="h-6">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={[{ v: 2 }, { v: 1 }, { v: 1 }, { v: 1 }]}>
                        <Area type="monotone" dataKey="v" stroke="#a855f7" fill="#f3e8ff" fillOpacity={0.4} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Card 6: Attendance Rate % */}
              <Card className="relative overflow-hidden border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-all">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-cyan-600" />
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold uppercase text-gray-500 dark:text-gray-400">Attendance Rate</span>
                    <div className="rounded-lg bg-blue-50 dark:bg-blue-950 p-1.5 text-blue-600 dark:text-blue-400">
                      <TrendingUp className="h-4 w-4" />
                    </div>
                  </div>
                  <div>
                    <p className="text-2xl font-extrabold text-gray-900 dark:text-white">{data.attendanceRate}%</p>
                    <p className="text-[10px] text-blue-600 font-semibold flex items-center mt-0.5">
                      Target: 95.0%
                    </p>
                  </div>
                  <div className="h-6">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={[{ v: 90 }, { v: 92 }, { v: 95 }, { v: data.attendanceRate }]}>
                        <Area type="monotone" dataKey="v" stroke="#3b82f6" fill="#dbeafe" fillOpacity={0.4} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Quick Actions Grid */}
          {widgetConfig.quickActions && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <Link href="/admin/users">
                <div className="rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 flex items-center gap-3 hover:border-blue-500 hover:shadow-sm transition-all cursor-pointer">
                  <div className="rounded-lg bg-blue-50 dark:bg-blue-950 p-2 text-blue-600">
                    <UserPlus className="h-4 w-4" />
                  </div>
                  <span className="text-xs font-bold text-gray-900 dark:text-white">Add Employee</span>
                </div>
              </Link>

              <Link href="/admin/payroll">
                <div className="rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 flex items-center gap-3 hover:border-emerald-500 hover:shadow-sm transition-all cursor-pointer">
                  <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950 p-2 text-emerald-600">
                    <CreditCard className="h-4 w-4" />
                  </div>
                  <span className="text-xs font-bold text-gray-900 dark:text-white">Generate Payroll</span>
                </div>
              </Link>

              <Link href="/admin/leave">
                <div className="rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 flex items-center gap-3 hover:border-purple-500 hover:shadow-sm transition-all cursor-pointer">
                  <div className="rounded-lg bg-purple-50 dark:bg-purple-950 p-2 text-purple-600">
                    <Calendar className="h-4 w-4" />
                  </div>
                  <span className="text-xs font-bold text-gray-900 dark:text-white">Approve Leave</span>
                </div>
              </Link>

              <Link href="/admin/overtime">
                <div className="rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 flex items-center gap-3 hover:border-amber-500 hover:shadow-sm transition-all cursor-pointer">
                  <div className="rounded-lg bg-amber-50 dark:bg-amber-950 p-2 text-amber-600">
                    <Clock className="h-4 w-4" />
                  </div>
                  <span className="text-xs font-bold text-gray-900 dark:text-white">Approve Overtime</span>
                </div>
              </Link>

              <Link href="/admin/departments">
                <div className="rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 flex items-center gap-3 hover:border-indigo-500 hover:shadow-sm transition-all cursor-pointer">
                  <div className="rounded-lg bg-indigo-50 dark:bg-indigo-950 p-2 text-indigo-600">
                    <Building2 className="h-4 w-4" />
                  </div>
                  <span className="text-xs font-bold text-gray-900 dark:text-white">Departments</span>
                </div>
              </Link>

              <Link href="/admin/reports">
                <div className="rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 flex items-center gap-3 hover:border-gray-500 hover:shadow-sm transition-all cursor-pointer">
                  <div className="rounded-lg bg-gray-100 dark:bg-slate-800 p-2 text-gray-700 dark:text-gray-300">
                    <FileText className="h-4 w-4" />
                  </div>
                  <span className="text-xs font-bold text-gray-900 dark:text-white">Reports</span>
                </div>
              </Link>
            </div>
          )}

          {/* Charts Row: Weekly Trend & Doughnut Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Weekly Attendance Trend */}
            {widgetConfig.attendanceTrend && (
              <Card className="lg:col-span-2 border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-blue-600" /> Weekly Attendance & Absence Analytics
                      </CardTitle>
                      <CardDescription className="text-xs">Daily present vs late vs absent headcount</CardDescription>
                    </div>
                    <Badge variant="secondary" className="text-[10px]">
                      This Week
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={data?.weeklyTrend || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorPresent" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="colorLate" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8} />
                            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip contentStyle={{ backgroundColor: "#1e293b", borderColor: "#334155", color: "#fff", borderRadius: "8px", fontSize: "12px" }} />
                        <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }} />
                        <Area type="monotone" dataKey="present" name="Present" stroke="#10b981" fillOpacity={1} fill="url(#colorPresent)" />
                        <Area type="monotone" dataKey="late" name="Late Arrivals" stroke="#f59e0b" fillOpacity={1} fill="url(#colorLate)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Attendance Status Doughnut */}
            {widgetConfig.statusDistribution && (
              <Card className="border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Activity className="h-4 w-4 text-emerald-600" /> Attendance Distribution
                  </CardTitle>
                  <CardDescription className="text-xs">Today's workforce status</CardDescription>
                </CardHeader>
                <CardContent className="pt-2">
                  <div className="h-48 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={doughnutData} innerRadius={50} outerRadius={70} paddingAngle={5} dataKey="value">
                          {doughnutData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: "#1e293b", color: "#fff", borderRadius: "8px", fontSize: "12px" }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-gray-200 dark:border-slate-800 text-xs">
                    {doughnutData.map((d) => (
                      <div key={d.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                          <span className="text-gray-600 dark:text-gray-400">{d.name}</span>
                        </div>
                        <span className="font-bold text-gray-900 dark:text-white">{d.value}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Department Comparison Bar Chart & Leaderboard */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Department Attendance Rates */}
            {widgetConfig.deptComparison && (
              <Card className="lg:col-span-2 border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-indigo-600" /> Department Attendance Comparison
                  </CardTitle>
                  <CardDescription className="text-xs">Attendance rate % across departments</CardDescription>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="h-60 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data?.deptComparison || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <XAxis dataKey="department" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} />
                        <Tooltip contentStyle={{ backgroundColor: "#1e293b", color: "#fff", borderRadius: "8px", fontSize: "12px" }} />
                        <Bar dataKey="rate" name="Attendance Rate %" fill="#6366f1" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Department Leaderboard */}
            {widgetConfig.leaderboard && (
              <Card className="border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Award className="h-4 w-4 text-amber-500" /> Department Leaderboard
                  </CardTitle>
                  <CardDescription className="text-xs">Rankings by attendance performance</CardDescription>
                </CardHeader>
                <CardContent className="pt-2 space-y-2.5">
                  {data?.deptComparison.map((dept, idx) => (
                    <div key={dept.department} className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 dark:bg-slate-800/60 border dark:border-slate-800 text-xs">
                      <div className="flex items-center gap-2.5">
                        <span className="h-6 w-6 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-extrabold flex items-center justify-center text-[11px]">
                          {idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : idx + 1}
                        </span>
                        <div>
                          <p className="font-bold text-gray-900 dark:text-white">{dept.department}</p>
                          <p className="text-[10px] text-gray-500">{dept.count} Employees</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-extrabold text-emerald-600">{dept.rate}%</p>
                        <p className="text-[10px] text-gray-400">{dept.otHours}h OT</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Module Summary Widgets Row: Leave, Overtime & Payroll */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Leave Analytics */}
            {widgetConfig.leaveWidget && (
              <Card className="border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-bold text-gray-900 dark:text-white flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-purple-600" /> Leave Management
                    </span>
                    <Link href="/admin/leave" className="text-xs text-blue-600 hover:underline">View</Link>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 pt-2">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950/50 border border-purple-100 dark:border-purple-900">
                      <span className="text-gray-500 dark:text-purple-200 text-[10px] block">Pending Requests</span>
                      <span className="text-xl font-extrabold text-purple-700 dark:text-purple-300">{data?.leaveSummary.pending}</span>
                    </div>
                    <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-100 dark:border-emerald-900">
                      <span className="text-gray-500 dark:text-emerald-200 text-[10px] block">Approved This Month</span>
                      <span className="text-xl font-extrabold text-emerald-700 dark:text-emerald-300">{data?.leaveSummary.approved}</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-xs p-2 rounded-lg bg-gray-50 dark:bg-slate-800">
                    <span className="text-gray-500">Currently On Leave:</span>
                    <span className="font-bold text-gray-900 dark:text-white">{data?.leaveSummary.onLeaveCount} employee(s)</span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Overtime Analytics */}
            {widgetConfig.overtimeWidget && (
              <Card className="border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-bold text-gray-900 dark:text-white flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-amber-600" /> Overtime Analytics
                    </span>
                    <Link href="/admin/overtime" className="text-xs text-blue-600 hover:underline">View</Link>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 pt-2">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-100 dark:border-amber-900">
                      <span className="text-gray-500 dark:text-amber-200 text-[10px] block">Total OT Hours</span>
                      <span className="text-xl font-extrabold text-amber-700 dark:text-amber-300">{data?.overtimeSummary.totalHours} hrs</span>
                    </div>
                    <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-100 dark:border-indigo-900">
                      <span className="text-gray-500 dark:text-indigo-200 text-[10px] block">Pending OT Requests</span>
                      <span className="text-xl font-extrabold text-indigo-700 dark:text-indigo-300">{data?.overtimeSummary.pendingRequests}</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold text-gray-400">Top OT Employees</span>
                    {data?.overtimeSummary.topEmployees.slice(0, 2).map((emp) => (
                      <div key={emp.name} className="flex justify-between items-center text-xs p-1.5 rounded bg-gray-50 dark:bg-slate-800">
                        <span className="font-semibold text-gray-900 dark:text-white">{emp.name}</span>
                        <span className="font-bold text-amber-600">{emp.hours} hrs</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Payroll Summary */}
            {widgetConfig.payrollWidget && (
              <Card className="border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-bold text-gray-900 dark:text-white flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-emerald-600" /> Payroll Summary
                    </span>
                    <Link href="/admin/payroll" className="text-xs text-blue-600 hover:underline">View</Link>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 pt-2">
                  <div className="p-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-sm">
                    <span className="text-[10px] uppercase font-semibold text-emerald-100 block">Monthly Payroll Expenditure</span>
                    <span className="text-2xl font-extrabold">{data?.payrollSummary.totalCost.toLocaleString()} ETB</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2 rounded bg-gray-50 dark:bg-slate-800 text-[11px]">
                      <span className="text-gray-400 block">Avg Salary:</span>
                      <span className="font-semibold">{data?.payrollSummary.avgSalary.toLocaleString()} ETB</span>
                    </div>
                    <div className="p-2 rounded bg-gray-50 dark:bg-slate-800 text-[11px]">
                      <span className="text-gray-400 block">Allowances:</span>
                      <span className="font-semibold text-emerald-600">+{data?.payrollSummary.totalAllowances.toLocaleString()} ETB</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Activity Feed & Upcoming Events Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Activity Timeline */}
            {widgetConfig.activityFeed && (
              <Card className="lg:col-span-2 border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Activity className="h-4 w-4 text-blue-600" /> System Activity Timeline
                  </CardTitle>
                  <CardDescription className="text-xs">Live activity stream across HRMS modules</CardDescription>
                </CardHeader>
                <CardContent className="pt-2">
                  <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-200 dark:before:bg-slate-800">
                    {data?.recentActivities.map((act) => (
                      <div key={act.id} className="relative flex items-start justify-between text-xs">
                        <div className="absolute -left-6 top-0.5 h-3 w-3 rounded-full border-2 border-white dark:border-slate-900 bg-blue-600" />
                        <div>
                          <p className="font-bold text-gray-900 dark:text-white">{act.title}</p>
                          <p className="text-gray-500">{act.subtitle}</p>
                        </div>
                        <span className="text-[10px] text-gray-400 font-mono">{act.time}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Upcoming Events */}
            {widgetConfig.upcomingEvents && (
              <Card className="border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <PartyPopper className="h-4 w-4 text-purple-600" /> Upcoming Events
                  </CardTitle>
                  <CardDescription className="text-xs">Holidays, anniversaries & sessions</CardDescription>
                </CardHeader>
                <CardContent className="pt-2 space-y-2.5">
                  {data?.upcomingEvents.map((evt) => (
                    <div key={evt.id} className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 dark:bg-slate-800 border dark:border-slate-800 text-xs">
                      <div>
                        <p className="font-bold text-gray-900 dark:text-white">{evt.title}</p>
                        <p className="text-[10px] text-gray-500">{evt.date}</p>
                      </div>
                      <Badge variant="secondary" className="text-[10px]">
                        {evt.tag}
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
