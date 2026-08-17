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
import { TrainingAnalytics, TrainingProgram, AdminTrainingStats } from "@/types/training";
import {
  GraduationCap,
  BookOpen,
  Award,
  CheckCircle2,
  Users,
  TrendingUp,
  FileText,
  FileSpreadsheet,
  Printer,
  Loader2,
  RefreshCw,
  ArrowRight,
  Sparkles,
  Clock,
  UserCheck,
} from "lucide-react";

export default function AdminTrainingPage() {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<TrainingAnalytics | null>(null);
  const [stats, setStats] = useState<AdminTrainingStats | null>(null);
  const [programs, setPrograms] = useState<TrainingProgram[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [analyticsData, statsData, programsData] = await Promise.all([
        apiRequest<TrainingAnalytics>("/training/analytics/dashboard"),
        apiRequest<AdminTrainingStats>("/training/stats"),
        apiRequest<TrainingProgram[]>("/training/programs"),
      ]);
      setAnalytics(analyticsData);
      setStats(statsData);
      setPrograms(Array.isArray(programsData) ? programsData : []);
    } catch (err) {
      console.error("Failed to load training analytics", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleExport = (type: "pdf" | "excel" | "print") => {
    if (!analytics || !programs) return;

    const rows = programs.map((p) => ({
      employeeId: p.code,
      name: p.title,
      department: p.category || "General",
      date: `${new Date(p.startDate).toLocaleDateString()} - ${new Date(p.endDate).toLocaleDateString()}`,
      morningIn: p.trainerName || "-",
      lunchOut: p.location || "-",
      lunchReturn: `${p._count?.enrollments || 0} / ${p.capacity}`,
      finalOut: p.status,
      status: p.status,
      workedHours: `${p.capacity} Max Seats`,
    }));

    const exportOpts = {
      reportTitle: "Corporate Training Programs & Certification Report",
      dateRangeLabel: `As of ${new Date().toLocaleDateString()}`,
      generatedBy: user?.name || "System Admin",
      rows,
      summary: {
        totalEmployees: analytics.totalPrograms,
        present: analytics.activeSessions,
        late: analytics.completedPrograms,
        absent: analytics.certificatesIssued,
        halfDay: 0,
        lunchMissing: 0,
        attendancePercentage: analytics.completionRate,
      },
    };

    if (type === "pdf") exportToPdf(exportOpts);
    else if (type === "excel") exportToExcel(exportOpts);
    else if (type === "print") printReport(exportOpts);
  };

  return (
    <ProtectedRoute requiredRole="ADMIN">
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <GraduationCap className="h-7 w-7 text-purple-600 dark:text-purple-400" />
                Training & Approval Workflow Dashboard
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Manage employee skill courses, process enrollment application requests, and track certifications.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" size="sm" onClick={fetchData} disabled={loading} className="dark:bg-slate-900 dark:border-slate-800">
                <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleExport("pdf")} disabled={!analytics} className="dark:bg-slate-900 dark:border-slate-800">
                <FileText className="mr-2 h-4 w-4 text-red-600" />
                PDF
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleExport("excel")} disabled={!analytics} className="dark:bg-slate-900 dark:border-slate-800">
                <FileSpreadsheet className="mr-2 h-4 w-4 text-green-600" />
                Excel
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleExport("print")} disabled={!analytics} className="dark:bg-slate-900 dark:border-slate-800">
                <Printer className="mr-2 h-4 w-4 text-slate-600" />
                Print
              </Button>
            </div>
          </div>

          {/* Quick Actions & Navigation Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Link href="/admin/training/programs">
              <Card className="hover:border-purple-500 hover:shadow-md transition-all cursor-pointer dark:bg-slate-900/80 dark:border-slate-800">
                <CardContent className="flex items-center justify-between p-6">
                  <div className="flex items-center gap-4">
                    <div className="rounded-xl bg-purple-500/10 p-3 text-purple-600 dark:text-purple-400">
                      <BookOpen className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 dark:text-slate-100">Course Catalog</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Manage courses, study links & capacity</p>
                    </div>
                  </div>
                  <ArrowRight className="h-5 w-5 text-slate-400" />
                </CardContent>
              </Card>
            </Link>

            <Link href="/admin/training/enrollments">
              <Card className="hover:border-amber-500 hover:shadow-md transition-all cursor-pointer dark:bg-slate-900/80 dark:border-slate-800 border-l-4 border-l-amber-500">
                <CardContent className="flex items-center justify-between p-6">
                  <div className="flex items-center gap-4">
                    <div className="rounded-xl bg-amber-500/10 p-3 text-amber-600 dark:text-amber-400">
                      <Clock className="h-6 w-6 animate-pulse" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 dark:text-slate-100">Approval Queue</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {stats?.pendingRequests || 0} Pending applications to review
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="h-5 w-5 text-slate-400" />
                </CardContent>
              </Card>
            </Link>

            <Card className="bg-gradient-to-br from-purple-900 to-indigo-900 text-white shadow-md">
              <CardContent className="flex items-center justify-between p-6">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-purple-200">Completion Rate</span>
                  <div className="mt-2 text-3xl font-bold">
                    {analytics?.completionRate || 0}%
                  </div>
                  <p className="text-xs text-purple-200">
                    {analytics?.completedEnrollments || 0} of {analytics?.totalEnrollments || 0} enrolled completed
                  </p>
                </div>
                <Award className="h-8 w-8 text-purple-300" />
              </CardContent>
            </Card>
          </div>

          {/* Metric Cards */}
          {loading ? (
            <div className="flex h-32 items-center justify-center rounded-xl bg-slate-900/50 border dark:border-slate-800">
              <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <Card className="dark:bg-slate-900/80 dark:border-slate-800">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">Total Trainings</span>
                    <BookOpen className="h-5 w-5 text-purple-600" />
                  </div>
                  <div className="mt-2 text-3xl font-bold text-slate-900 dark:text-slate-100">{stats?.totalTrainings || 0}</div>
                  <p className="mt-1 text-xs text-slate-500">Created courses & workshops</p>
                </CardContent>
              </Card>

              <Card className="dark:bg-slate-900/80 dark:border-slate-800">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">Open Programs</span>
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="mt-2 text-3xl font-bold text-slate-900 dark:text-slate-100">{stats?.openTrainings || 0}</div>
                  <p className="mt-1 text-xs text-blue-600 font-medium">Accepting applications</p>
                </CardContent>
              </Card>

              <Card className="dark:bg-slate-900/80 dark:border-slate-800 border-l-4 border-l-amber-500">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase text-amber-600 dark:text-amber-400 font-bold">Pending Requests</span>
                    <Clock className="h-5 w-5 text-amber-500 animate-pulse" />
                  </div>
                  <div className="mt-2 text-3xl font-bold text-amber-600 dark:text-amber-400">{stats?.pendingRequests || 0}</div>
                  <p className="mt-1 text-xs text-amber-600 font-medium">Awaiting Admin decision</p>
                </CardContent>
              </Card>

              <Card className="dark:bg-slate-900/80 dark:border-slate-800">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">Approved Enrolled</span>
                    <UserCheck className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div className="mt-2 text-3xl font-bold text-slate-900 dark:text-slate-100">{stats?.approvedParticipants || 0}</div>
                  <p className="mt-1 text-xs text-emerald-600 font-medium">Approved participants</p>
                </CardContent>
              </Card>

              <Card className="dark:bg-slate-900/80 dark:border-slate-800">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">Completed</span>
                    <Award className="h-5 w-5 text-amber-500" />
                  </div>
                  <div className="mt-2 text-3xl font-bold text-slate-900 dark:text-slate-100">{stats?.completedTrainings || 0}</div>
                  <p className="mt-1 text-xs text-amber-600 font-medium">Verified certifications</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Category Distribution */}
          {analytics && (
            <Card className="dark:bg-slate-900/80 dark:border-slate-800">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2 text-slate-900 dark:text-slate-100">
                  <Sparkles className="h-5 w-5 text-purple-600" />
                  Training Domain Breakdown
                </CardTitle>
                <CardDescription>Program distribution across skill categories</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  {analytics.categoryBreakdown.map((cat) => (
                    <div key={cat.category} className="rounded-xl bg-slate-50 dark:bg-slate-950 p-4 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">{cat.category}</p>
                        <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-100">{cat.count}</p>
                      </div>
                      <BookOpen className="h-6 w-6 text-purple-500" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Training Catalog Table */}
          <Card className="dark:bg-slate-900/80 dark:border-slate-800">
            <CardHeader>
              <CardTitle className="text-base flex items-center justify-between text-slate-900 dark:text-slate-100">
                <span className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-purple-600" />
                  Corporate Training Catalog & Status
                </span>
                <Link href="/admin/training/programs" className="text-xs font-medium text-purple-600 dark:text-purple-400 hover:underline">
                  View Full Catalog
                </Link>
              </CardTitle>
              <CardDescription>Scheduled training courses for employee professional development</CardDescription>
            </CardHeader>
            <CardContent>
              {programs.length ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      <tr>
                        <th className="px-6 py-3">Course Code & Title</th>
                        <th className="px-6 py-3">Category</th>
                        <th className="px-6 py-3">Trainer</th>
                        <th className="px-6 py-3">Schedule Dates</th>
                        <th className="px-6 py-3">Capacity</th>
                        <th className="px-6 py-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                      {programs.slice(0, 5).map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                          <td className="px-6 py-4">
                            <div>
                              <p className="font-semibold text-slate-900 dark:text-slate-100">{item.title}</p>
                              <p className="text-xs text-slate-500 font-mono">{item.code}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-slate-700 dark:text-slate-300">{item.category || "General"}</td>
                          <td className="px-6 py-4 text-xs text-slate-600 dark:text-slate-400">{item.trainerName || "TBD"}</td>
                          <td className="px-6 py-4 text-xs text-slate-600 dark:text-slate-400">
                            {new Date(item.startDate).toLocaleDateString()} - {new Date(item.endDate).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 font-semibold text-slate-900 dark:text-slate-100">
                            {item._count?.enrollments || 0} / {item.capacity}
                          </td>
                          <td className="px-6 py-4">
                            <Badge
                              className={
                                item.status === "OPEN"
                                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                                  : item.status === "COMPLETED"
                                  ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20"
                                  : "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20"
                              }
                            >
                              {item.status}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-center py-6 text-sm text-slate-500 dark:text-slate-400">No training programs scheduled yet.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
