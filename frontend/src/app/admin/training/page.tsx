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
import { TrainingAnalytics, TrainingProgram } from "@/types/training";
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
} from "lucide-react";

export default function AdminTrainingPage() {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<TrainingAnalytics | null>(null);
  const [programs, setPrograms] = useState<TrainingProgram[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [analyticsData, programsData] = await Promise.all([
        apiRequest<TrainingAnalytics>("/training/analytics/dashboard"),
        apiRequest<TrainingProgram[]>("/training/programs"),
      ]);
      setAnalytics(analyticsData);
      setPrograms(programsData);
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
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <GraduationCap className="h-6 w-6 text-purple-600" />
                Training & Development Dashboard
              </h1>
              <p className="text-sm text-gray-500">
                Manage employee skill courses, workshops, enrollment schedules, and certification tracking.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
                <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleExport("pdf")} disabled={!analytics}>
                <FileText className="mr-2 h-4 w-4 text-red-600" />
                PDF
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleExport("excel")} disabled={!analytics}>
                <FileSpreadsheet className="mr-2 h-4 w-4 text-green-600" />
                Excel
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleExport("print")} disabled={!analytics}>
                <Printer className="mr-2 h-4 w-4 text-gray-600" />
                Print
              </Button>
            </div>
          </div>

          {/* Quick Actions & Navigation */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Link href="/admin/training/programs">
              <Card className="hover:border-purple-500 hover:shadow-md transition-all cursor-pointer">
                <CardContent className="flex items-center justify-between p-6">
                  <div className="flex items-center gap-4">
                    <div className="rounded-lg bg-purple-50 p-3 text-purple-600">
                      <BookOpen className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Course Catalog</h3>
                      <p className="text-xs text-gray-500">Manage training programs & schedules</p>
                    </div>
                  </div>
                  <ArrowRight className="h-5 w-5 text-gray-400" />
                </CardContent>
              </Card>
            </Link>

            <Link href="/admin/training/enrollments">
              <Card className="hover:border-purple-500 hover:shadow-md transition-all cursor-pointer">
                <CardContent className="flex items-center justify-between p-6">
                  <div className="flex items-center gap-4">
                    <div className="rounded-lg bg-blue-50 p-3 text-blue-600">
                      <Users className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Employee Enrollments</h3>
                      <p className="text-xs text-gray-500">Enroll candidates & update scores</p>
                    </div>
                  </div>
                  <ArrowRight className="h-5 w-5 text-gray-400" />
                </CardContent>
              </Card>
            </Link>

            <Card className="bg-gradient-to-br from-purple-900 to-indigo-800 text-white shadow-md">
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
            <div className="flex h-32 items-center justify-center rounded-xl bg-white shadow-sm">
              <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-500">Total Courses</span>
                    <BookOpen className="h-5 w-5 text-purple-600" />
                  </div>
                  <div className="mt-2 text-3xl font-bold text-gray-900">{analytics?.totalPrograms || 0}</div>
                  <p className="mt-1 text-xs text-gray-500">Created training courses & workshops</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-500">Active Sessions</span>
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="mt-2 text-3xl font-bold text-gray-900">{analytics?.activeSessions || 0}</div>
                  <p className="mt-1 text-xs text-blue-600 font-medium">Upcoming & in-progress sessions</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-500">Total Enrollments</span>
                    <Users className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div className="mt-2 text-3xl font-bold text-gray-900">{analytics?.totalEnrollments || 0}</div>
                  <p className="mt-1 text-xs text-emerald-600 font-medium">Enrolled employee participants</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-500">Certificates Issued</span>
                    <Award className="h-5 w-5 text-amber-500" />
                  </div>
                  <div className="mt-2 text-3xl font-bold text-gray-900">{analytics?.certificatesIssued || 0}</div>
                  <p className="mt-1 text-xs text-amber-600 font-medium">Verified training certifications</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Category Distribution */}
          {analytics && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-purple-600" />
                  Training Domain Breakdown
                </CardTitle>
                <CardDescription>Program distribution across skill categories</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  {analytics.categoryBreakdown.map((cat) => (
                    <div key={cat.category} className="rounded-lg bg-gray-50 p-4 border flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold text-gray-600 uppercase">{cat.category}</p>
                        <p className="mt-1 text-2xl font-bold text-gray-900">{cat.count}</p>
                      </div>
                      <BookOpen className="h-6 w-6 text-purple-500" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Training Catalog Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-purple-600" />
                  Corporate Training Catalog & Schedules
                </span>
                <Link href="/admin/training/programs" className="text-xs font-medium text-purple-600 hover:underline">
                  View Full Catalog
                </Link>
              </CardTitle>
              <CardDescription>Scheduled training courses for employee professional development</CardDescription>
            </CardHeader>
            <CardContent>
              {programs.length ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 border-b text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      <tr>
                        <th className="px-6 py-3">Course Code & Title</th>
                        <th className="px-6 py-3">Category</th>
                        <th className="px-6 py-3">Trainer</th>
                        <th className="px-6 py-3">Schedule Dates</th>
                        <th className="px-6 py-3">Capacity</th>
                        <th className="px-6 py-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {programs.slice(0, 5).map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div>
                              <p className="font-semibold text-gray-900">{item.title}</p>
                              <p className="text-xs text-gray-500 font-mono">{item.code}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-gray-700">{item.category || "General"}</td>
                          <td className="px-6 py-4 text-xs text-gray-600">{item.trainerName || "TBD"}</td>
                          <td className="px-6 py-4 text-xs text-gray-600">
                            {new Date(item.startDate).toLocaleDateString()} - {new Date(item.endDate).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 font-semibold text-gray-900">
                            {item._count?.enrollments || 0} / {item.capacity}
                          </td>
                          <td className="px-6 py-4">
                            <Badge
                              className={
                                item.status === "COMPLETED"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : item.status === "IN_PROGRESS"
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-purple-100 text-purple-800"
                              }
                            >
                              {item.status.replace("_", " ")}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-center py-6 text-sm text-gray-500">No training programs scheduled yet.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
