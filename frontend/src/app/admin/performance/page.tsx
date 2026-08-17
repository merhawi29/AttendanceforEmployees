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
import { PerformanceAnalytics } from "@/types/performance";
import {
  Award,
  Target,
  TrendingUp,
  Users,
  CheckCircle2,
  FileText,
  FileSpreadsheet,
  Printer,
  Loader2,
  RefreshCw,
  Sparkles,
  ArrowRight,
  BarChart3,
  Building2,
} from "lucide-react";

export default function AdminPerformancePage() {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<PerformanceAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const data = await apiRequest<PerformanceAnalytics>("/performance/analytics");
      setAnalytics(data);
    } catch (err) {
      console.error("Failed to load performance analytics", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const handleExport = (type: "pdf" | "excel" | "print") => {
    if (!analytics) return;

    const rows = analytics.topPerformers.map((p) => ({
      employeeId: p.employee?.employeeId || "N/A",
      name: p.employee?.name || "Unknown",
      department: p.employee?.department || "General",
      date: new Date(p.reviewDate).toLocaleDateString(),
      morningIn: "-",
      lunchOut: "-",
      lunchReturn: "-",
      finalOut: "-",
      status: p.rating,
      workedHours: `${p.overallScore}/100`,
    }));

    const exportOpts = {
      reportTitle: "Performance & Evaluation Analytics Report",
      dateRangeLabel: `As of ${new Date().toLocaleDateString()}`,
      generatedBy: user?.name || "System Admin",
      rows,
      summary: {
        totalEmployees: analytics.totalReviews,
        present: analytics.topPerformers.length,
        late: analytics.completedGoals,
        absent: analytics.totalGoals - analytics.completedGoals,
        halfDay: 0,
        lunchMissing: 0,
        attendancePercentage: analytics.goalCompletionRate,
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
              <h1 className="text-2xl font-bold text-gray-900">Performance Management</h1>
              <p className="text-sm text-gray-500">
                Track KPI goals, performance evaluations, employee ratings, and promotion insights.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" size="sm" onClick={fetchAnalytics} disabled={loading}>
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
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Link href="/admin/performance/reviews">
              <Card className="hover:border-blue-500 hover:shadow-md transition-all cursor-pointer">
                <CardContent className="flex items-center justify-between p-6">
                  <div className="flex items-center gap-4">
                    <div className="rounded-lg bg-blue-50 p-3 text-blue-600">
                      <Award className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Performance Reviews</h3>
                      <p className="text-xs text-gray-500">Evaluate employee scores & ratings</p>
                    </div>
                  </div>
                  <ArrowRight className="h-5 w-5 text-gray-400" />
                </CardContent>
              </Card>
            </Link>

            <Link href="/admin/performance/goals">
              <Card className="hover:border-blue-500 hover:shadow-md transition-all cursor-pointer">
                <CardContent className="flex items-center justify-between p-6">
                  <div className="flex items-center gap-4">
                    <div className="rounded-lg bg-emerald-50 p-3 text-emerald-600">
                      <Target className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Goal Management</h3>
                      <p className="text-xs text-gray-500">Assign & track KPI goals</p>
                    </div>
                  </div>
                  <ArrowRight className="h-5 w-5 text-gray-400" />
                </CardContent>
              </Card>
            </Link>

            <Card className="bg-gradient-to-br from-indigo-900 to-blue-800 text-white shadow-md">
              <CardContent className="flex items-center justify-between p-6">
                <div>
                  <div className="flex items-center gap-2 text-indigo-200">
                    <Sparkles className="h-4 w-4" />
                    <span className="text-xs font-semibold uppercase tracking-wider">Promotion Pipeline</span>
                  </div>
                  <div className="mt-2 text-2xl font-bold">{analytics?.promotionRecommendations || 0}</div>
                  <p className="text-xs text-indigo-200">Recommended for promotion/salary review</p>
                </div>
                <Award className="h-8 w-8 text-amber-400" />
              </CardContent>
            </Card>
          </div>

          {/* Metric Cards */}
          {loading ? (
            <div className="flex h-32 items-center justify-center rounded-xl bg-white shadow-sm">
              <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-500">Total Reviews</span>
                    <Award className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="mt-2 text-3xl font-bold text-gray-900">{analytics?.totalReviews || 0}</div>
                  <p className="mt-1 text-xs text-gray-500">Completed employee evaluations</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-500">Average Company Score</span>
                    <TrendingUp className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div className="mt-2 text-3xl font-bold text-gray-900">{analytics?.avgScore || 0} / 100</div>
                  <p className="mt-1 text-xs text-emerald-600 font-medium">Overall evaluation benchmark</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-500">Goal Completion Rate</span>
                    <CheckCircle2 className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div className="mt-2 text-3xl font-bold text-gray-900">{analytics?.goalCompletionRate || 0}%</div>
                  <p className="mt-1 text-xs text-gray-500">
                    {analytics?.completedGoals || 0} of {analytics?.totalGoals || 0} goals finished
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-500">Top Performers</span>
                    <Sparkles className="h-5 w-5 text-amber-500" />
                  </div>
                  <div className="mt-2 text-3xl font-bold text-gray-900">
                    {analytics?.ratingDistribution.OUTSTANDING || 0}
                  </div>
                  <p className="mt-1 text-xs text-amber-600 font-medium">Outstanding rated employees</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Rating Distribution Breakdown */}
          {analytics && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-blue-600" />
                  Performance Rating Distribution
                </CardTitle>
                <CardDescription>Breakdown of scores across evaluation tiers</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
                  <div className="rounded-lg bg-emerald-50 p-4 text-center border border-emerald-100">
                    <p className="text-xs font-semibold text-emerald-700 uppercase">Outstanding (90-100)</p>
                    <p className="mt-1 text-2xl font-bold text-emerald-900">{analytics.ratingDistribution.OUTSTANDING}</p>
                  </div>
                  <div className="rounded-lg bg-blue-50 p-4 text-center border border-blue-100">
                    <p className="text-xs font-semibold text-blue-700 uppercase">Very Good (80-89)</p>
                    <p className="mt-1 text-2xl font-bold text-blue-900">{analytics.ratingDistribution.VERY_GOOD}</p>
                  </div>
                  <div className="rounded-lg bg-amber-50 p-4 text-center border border-amber-100">
                    <p className="text-xs font-semibold text-amber-700 uppercase">Good (70-79)</p>
                    <p className="mt-1 text-2xl font-bold text-amber-900">{analytics.ratingDistribution.GOOD}</p>
                  </div>
                  <div className="rounded-lg bg-orange-50 p-4 text-center border border-orange-100">
                    <p className="text-xs font-semibold text-orange-700 uppercase">Fair (60-69)</p>
                    <p className="mt-1 text-2xl font-bold text-orange-900">{analytics.ratingDistribution.FAIR}</p>
                  </div>
                  <div className="rounded-lg bg-red-50 p-4 text-center border border-red-100">
                    <p className="text-xs font-semibold text-red-700 uppercase">Poor (&lt;60)</p>
                    <p className="mt-1 text-2xl font-bold text-red-900">{analytics.ratingDistribution.POOR}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Department Rankings & Top Performers */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Top Performers Leaderboard */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Award className="h-5 w-5 text-amber-500" />
                    Top Performing Employees
                  </span>
                  <Link href="/admin/performance/reviews" className="text-xs font-medium text-blue-600 hover:underline">
                    View All
                  </Link>
                </CardTitle>
                <CardDescription>Highest scoring team members across all reviews</CardDescription>
              </CardHeader>
              <CardContent>
                {analytics?.topPerformers.length ? (
                  <div className="space-y-4">
                    {analytics.topPerformers.map((item, idx) => (
                      <div key={item.id} className="flex items-center justify-between rounded-lg border border-gray-100 p-3 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
                            #{idx + 1}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{item.employee?.name}</p>
                            <p className="text-xs text-gray-500">
                              {item.employee?.employeeId} · {item.employee?.department || "General"}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge className={
                            item.rating === "OUTSTANDING" ? "bg-emerald-100 text-emerald-800" :
                            item.rating === "VERY_GOOD" ? "bg-blue-100 text-blue-800" : "bg-amber-100 text-amber-800"
                          }>
                            Score: {item.overallScore}
                          </Badge>
                          <p className="mt-1 text-[11px] text-gray-400">{item.rating.replace("_", " ")}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center py-6 text-sm text-gray-500">No review data recorded yet.</p>
                )}
              </CardContent>
            </Card>

            {/* Department Rankings */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-indigo-600" />
                  Department Performance Rankings
                </CardTitle>
                <CardDescription>Average performance scores by department</CardDescription>
              </CardHeader>
              <CardContent>
                {analytics?.departmentRankings.length ? (
                  <div className="space-y-4">
                    {analytics.departmentRankings.map((dept) => (
                      <div key={dept.department} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium text-gray-800">{dept.department}</span>
                          <span className="font-bold text-gray-900">{dept.avgScore} / 100</span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
                          <div
                            className="h-full bg-blue-600 rounded-full transition-all"
                            style={{ width: `${Math.min(100, Math.max(0, dept.avgScore))}%` }}
                          />
                        </div>
                        <p className="text-[11px] text-gray-400">{dept.employeeCount} reviewed employee(s)</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center py-6 text-sm text-gray-500">No department score data available.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
