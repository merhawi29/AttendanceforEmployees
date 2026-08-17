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
import { AtsAnalytics } from "@/types/ats";
import {
  UserPlus,
  Briefcase,
  Users,
  CalendarCheck,
  CheckCircle2,
  TrendingUp,
  FileText,
  FileSpreadsheet,
  Printer,
  Loader2,
  RefreshCw,
  ArrowRight,
  Filter,
} from "lucide-react";

export default function AdminAtsPage() {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<AtsAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const data = await apiRequest<AtsAnalytics>("/ats/analytics");
      setAnalytics(data);
    } catch (err) {
      console.error("Failed to load ATS analytics", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const handleExport = (type: "pdf" | "excel" | "print") => {
    if (!analytics) return;

    const rows = analytics.recentApplications.map((app) => ({
      employeeId: app.id.slice(-6).toUpperCase(),
      name: app.applicantName,
      department: app.jobPosting?.department || "General",
      date: new Date(app.appliedDate).toLocaleDateString(),
      morningIn: app.email,
      lunchOut: app.phone || "-",
      lunchReturn: app.jobPosting?.title || "Position",
      finalOut: app.currentCompany || "-",
      status: app.status,
      workedHours: `${app.experienceYears || 0} yrs exp`,
    }));

    const exportOpts = {
      reportTitle: "Recruitment & ATS Analytics Report",
      dateRangeLabel: `As of ${new Date().toLocaleDateString()}`,
      generatedBy: user?.name || "System Admin",
      rows,
      summary: {
        totalEmployees: analytics.totalApplications,
        present: analytics.hiredCount,
        late: analytics.scheduledInterviews,
        absent: analytics.totalJobs - analytics.openJobs,
        halfDay: 0,
        lunchMissing: 0,
        attendancePercentage: analytics.conversionRate,
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
                <UserPlus className="h-6 w-6 text-blue-600" />
                Recruitment & ATS Dashboard
              </h1>
              <p className="text-sm text-gray-500">
                Track job requisitions, candidate pipelines, interview schedules, and hiring conversions.
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

          {/* Quick Actions & Module Navigation */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Link href="/admin/ats/jobs">
              <Card className="hover:border-blue-500 hover:shadow-md transition-all cursor-pointer">
                <CardContent className="flex items-center justify-between p-6">
                  <div className="flex items-center gap-4">
                    <div className="rounded-lg bg-blue-50 p-3 text-blue-600">
                      <Briefcase className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Job Postings</h3>
                      <p className="text-xs text-gray-500">Manage open positions & descriptions</p>
                    </div>
                  </div>
                  <ArrowRight className="h-5 w-5 text-gray-400" />
                </CardContent>
              </Card>
            </Link>

            <Link href="/admin/ats/applications">
              <Card className="hover:border-blue-500 hover:shadow-md transition-all cursor-pointer">
                <CardContent className="flex items-center justify-between p-6">
                  <div className="flex items-center gap-4">
                    <div className="rounded-lg bg-emerald-50 p-3 text-emerald-600">
                      <Users className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Candidate Pipeline</h3>
                      <p className="text-xs text-gray-500">Kanban stage progression & ratings</p>
                    </div>
                  </div>
                  <ArrowRight className="h-5 w-5 text-gray-400" />
                </CardContent>
              </Card>
            </Link>

            <Link href="/admin/ats/interviews">
              <Card className="hover:border-blue-500 hover:shadow-md transition-all cursor-pointer">
                <CardContent className="flex items-center justify-between p-6">
                  <div className="flex items-center gap-4">
                    <div className="rounded-lg bg-purple-50 p-3 text-purple-600">
                      <CalendarCheck className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Interview Schedules</h3>
                      <p className="text-xs text-gray-500">Schedule meetings & record scores</p>
                    </div>
                  </div>
                  <ArrowRight className="h-5 w-5 text-gray-400" />
                </CardContent>
              </Card>
            </Link>
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
                    <span className="text-sm font-medium text-gray-500">Active Open Jobs</span>
                    <Briefcase className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="mt-2 text-3xl font-bold text-gray-900">{analytics?.openJobs || 0}</div>
                  <p className="mt-1 text-xs text-gray-500">Out of {analytics?.totalJobs || 0} total job requisitions</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-500">Total Applicants</span>
                    <Users className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div className="mt-2 text-3xl font-bold text-gray-900">{analytics?.totalApplications || 0}</div>
                  <p className="mt-1 text-xs text-emerald-600 font-medium">Candidate resumes received</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-500">Hired Candidates</span>
                    <CheckCircle2 className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div className="mt-2 text-3xl font-bold text-gray-900">{analytics?.hiredCount || 0}</div>
                  <p className="mt-1 text-xs text-gray-500">
                    {analytics?.conversionRate || 0}% recruitment conversion rate
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-500">Scheduled Interviews</span>
                    <CalendarCheck className="h-5 w-5 text-purple-600" />
                  </div>
                  <div className="mt-2 text-3xl font-bold text-gray-900">{analytics?.scheduledInterviews || 0}</div>
                  <p className="mt-1 text-xs text-purple-600 font-medium">Upcoming technical & HR sessions</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Recruitment Funnel Breakdown */}
          {analytics && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Filter className="h-5 w-5 text-blue-600" />
                  Candidate Pipeline Funnel Stages
                </CardTitle>
                <CardDescription>Number of candidates at each stage of recruitment</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-6">
                  <div className="rounded-lg bg-gray-50 p-4 text-center border">
                    <p className="text-xs font-semibold text-gray-600 uppercase">Applied</p>
                    <p className="mt-1 text-2xl font-bold text-gray-900">{analytics.stageDistribution.APPLIED}</p>
                  </div>
                  <div className="rounded-lg bg-blue-50 p-4 text-center border border-blue-100">
                    <p className="text-xs font-semibold text-blue-700 uppercase">Screened</p>
                    <p className="mt-1 text-2xl font-bold text-blue-900">{analytics.stageDistribution.SCREENED}</p>
                  </div>
                  <div className="rounded-lg bg-purple-50 p-4 text-center border border-purple-100">
                    <p className="text-xs font-semibold text-purple-700 uppercase">Interview</p>
                    <p className="mt-1 text-2xl font-bold text-purple-900">{analytics.stageDistribution.INTERVIEW_SCHEDULED}</p>
                  </div>
                  <div className="rounded-lg bg-amber-50 p-4 text-center border border-amber-100">
                    <p className="text-xs font-semibold text-amber-700 uppercase">Offer</p>
                    <p className="mt-1 text-2xl font-bold text-amber-900">{analytics.stageDistribution.OFFER_EXTENDED}</p>
                  </div>
                  <div className="rounded-lg bg-emerald-50 p-4 text-center border border-emerald-100">
                    <p className="text-xs font-semibold text-emerald-700 uppercase">Hired</p>
                    <p className="mt-1 text-2xl font-bold text-emerald-900">{analytics.stageDistribution.HIRED}</p>
                  </div>
                  <div className="rounded-lg bg-red-50 p-4 text-center border border-red-100">
                    <p className="text-xs font-semibold text-red-700 uppercase">Rejected</p>
                    <p className="mt-1 text-2xl font-bold text-red-900">{analytics.stageDistribution.REJECTED}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recent Applications Feed */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                  Recent Candidate Applications
                </span>
                <Link href="/admin/ats/applications" className="text-xs font-medium text-blue-600 hover:underline">
                  View All Candidates
                </Link>
              </CardTitle>
              <CardDescription>Latest candidate resumes submitted</CardDescription>
            </CardHeader>
            <CardContent>
              {analytics?.recentApplications.length ? (
                <div className="space-y-4">
                  {analytics.recentApplications.map((app) => (
                    <div key={app.id} className="flex items-center justify-between rounded-lg border border-gray-100 p-4 hover:bg-gray-50 transition-colors">
                      <div>
                        <p className="font-semibold text-gray-900">{app.applicantName}</p>
                        <p className="text-xs text-gray-500">
                          {app.email} · {app.jobPosting?.title || "Position"}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge className={
                          app.status === "HIRED" ? "bg-emerald-100 text-emerald-800" :
                          app.status === "INTERVIEW_SCHEDULED" ? "bg-purple-100 text-purple-800" :
                          app.status === "REJECTED" ? "bg-red-100 text-red-800" : "bg-blue-100 text-blue-800"
                        }>
                          {app.status.replace("_", " ")}
                        </Badge>
                        <p className="mt-1 text-[11px] text-gray-400">Applied {new Date(app.appliedDate).toLocaleDateString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center py-6 text-sm text-gray-500">No applications recorded yet.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
