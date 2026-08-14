"use client";

import { useState, useEffect, useCallback } from "react";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiRequest } from "@/lib/api";
import { Toaster } from "@/components/ui/toast";
import { toast } from "@/hooks/use-toast";
import { DepartmentTreeItem } from "@/types/department";
import {
  OvertimeRequest,
  OvertimeRequestsResponse,
  DepartmentOvertimeReportResponse,
  MonthlyOvertimeReportResponse,
  AdminOvertimeMetricsResponse,
} from "@/types/overtime";
import {
  Clock,
  Calendar,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Search,
  RefreshCw,
  X,
  Building2,
  FileText,
  UserCheck,
  Ban,
  TrendingUp,
  Zap,
  Award,
  Users,
  PieChart,
} from "lucide-react";

export default function AdminOvertimePage() {
  const [activeTab, setActiveTab] = useState<"approvals" | "all" | "department" | "monthly">("approvals");

  // Metrics State
  const [metrics, setMetrics] = useState<AdminOvertimeMetricsResponse | null>(null);

  // Data State
  const [requests, setRequests] = useState<OvertimeRequest[]>([]);
  const [departments, setDepartments] = useState<DepartmentTreeItem[]>([]);
  const [deptReport, setDeptReport] = useState<DepartmentOvertimeReportResponse | null>(null);
  const [monthlyReport, setMonthlyReport] = useState<MonthlyOvertimeReportResponse | null>(null);
  const [loading, setLoading] = useState(true);

  // Filter State
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Approval Modal State
  const [selectedRequest, setSelectedRequest] = useState<OvertimeRequest | null>(null);
  const [approvalAction, setApprovalAction] = useState<"APPROVE" | "REJECT">("APPROVE");
  const [approvalComment, setApprovalComment] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submittingApproval, setSubmittingApproval] = useState(false);

  const fetchMetrics = async () => {
    try {
      const res = await apiRequest<AdminOvertimeMetricsResponse>("/overtime/metrics");
      setMetrics(res);
    } catch {
      // Ignore metrics failure
    }
  };

  const fetchOvertimeData = useCallback(async () => {
    setLoading(true);
    try {
      const deptsRes = await apiRequest<DepartmentTreeItem[]>("/departments/tree").catch(() => []);
      setDepartments(deptsRes || []);

      if (activeTab === "approvals" || activeTab === "all") {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: "15",
        });

        if (activeTab === "approvals") {
          params.append("status", "PENDING");
        } else if (statusFilter !== "all") {
          params.append("status", statusFilter);
        }

        if (departmentFilter !== "all") params.append("departmentId", departmentFilter);
        if (search.trim()) params.append("search", search.trim());

        const res = await apiRequest<OvertimeRequestsResponse>(`/overtime/requests?${params.toString()}`);
        setRequests(res.requests || []);
        setTotalPages(res.pagination?.totalPages || 1);
      } else if (activeTab === "department") {
        const deptParam = departmentFilter !== "all" ? `?departmentId=${departmentFilter}` : "";
        const deptRes = await apiRequest<DepartmentOvertimeReportResponse>(`/overtime/reports/department${deptParam}`);
        setDeptReport(deptRes);
      } else if (activeTab === "monthly") {
        const monthRes = await apiRequest<MonthlyOvertimeReportResponse>(`/overtime/reports/monthly`);
        setMonthlyReport(monthRes);
      }
    } catch (err: any) {
      toast({
        title: "Error Loading Data",
        description: err.message || "Failed to load overtime records",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [activeTab, page, statusFilter, departmentFilter, search]);

  useEffect(() => {
    fetchMetrics();
    fetchOvertimeData();
  }, [fetchOvertimeData]);

  const handleOpenApprovalModal = (req: OvertimeRequest, action: "APPROVE" | "REJECT") => {
    setSelectedRequest(req);
    setApprovalAction(action);
    setApprovalComment("");
    setIsModalOpen(true);
  };

  const handleProcessApproval = async () => {
    if (!selectedRequest) return;
    setSubmittingApproval(true);
    try {
      await apiRequest(`/overtime/requests/${selectedRequest.id}/approve-admin`, {
        method: "PUT",
        body: JSON.stringify({
          action: approvalAction,
          comment: approvalComment.trim() || null,
        }),
      });

      toast({
        title: `Request ${approvalAction === "APPROVE" ? "Approved" : "Rejected"}`,
        description: `Overtime request for ${selectedRequest.user?.name} has been processed.`,
        variant: "success",
      });

      setIsModalOpen(false);
      fetchMetrics();
      fetchOvertimeData();
    } catch (err: any) {
      toast({
        title: "Action Failed",
        description: err.message || "Failed to process approval",
        variant: "destructive",
      });
    } finally {
      setSubmittingApproval(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "APPROVED":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
            <CheckCircle2 className="h-3.5 w-3.5" /> Approved
          </span>
        );
      case "APPROVED_BY_MANAGER":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
            <UserCheck className="h-3.5 w-3.5" /> Manager Approved
          </span>
        );
      case "PENDING":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
            <Clock className="h-3.5 w-3.5" /> Pending Review
          </span>
        );
      case "REJECTED":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-semibold text-rose-700">
            <XCircle className="h-3.5 w-3.5" /> Rejected
          </span>
        );
      case "CANCELLED":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-600">
            <Ban className="h-3.5 w-3.5" /> Cancelled
          </span>
        );
      default:
        return <span className="text-xs text-gray-500">{status}</span>;
    }
  };

  return (
    <ProtectedRoute requiredRole="ADMIN">
      <DashboardLayout>
        <div className="space-y-6">
          <Toaster />

          {/* Header */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Overtime (OT) Management Hub</h1>
              <p className="text-sm text-gray-500">
                Review OT claims, approve requests, monitor department aggregations, and inspect payroll metrics
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={() => { fetchMetrics(); fetchOvertimeData(); }}>
                <RefreshCw className={`h-4 w-4 mr-1.5 ${loading ? "animate-spin" : ""}`} /> Refresh Data
              </Button>
            </div>
          </div>

          {/* KPI Dashboard Metrics Cards */}
          {metrics && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Pending Approvals</span>
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                    <Clock className="h-4 w-4" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-gray-900">{metrics.pendingRequestsCount}</p>
                <p className="text-xs text-gray-500">Awaiting administrative decision</p>
              </div>

              <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Approved OT (Month)</span>
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                    <TrendingUp className="h-4 w-4" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-emerald-700">{metrics.totalApprovedHoursThisMonth} hrs</p>
                <p className="text-xs text-gray-500">Total verified OT hours</p>
              </div>

              <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Payroll Weighted OT</span>
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                    <Zap className="h-4 w-4" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-blue-700">{metrics.totalWeightedHoursThisMonth} hrs</p>
                <p className="text-xs text-gray-500">Rate-factored payroll hours</p>
              </div>

              <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Top OT Department</span>
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
                    <Award className="h-4 w-4" />
                  </div>
                </div>
                <p className="text-lg font-bold text-gray-900 truncate">{metrics.topDepartmentThisMonth}</p>
                <p className="text-xs text-gray-500">{metrics.topDepartmentHoursThisMonth} approved hours</p>
              </div>
            </div>
          )}

          {/* Navigation Tabs */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex gap-6 text-sm font-medium">
              <button
                onClick={() => { setActiveTab("approvals"); setPage(1); }}
                className={`border-b-2 py-3 px-1 transition-colors ${
                  activeTab === "approvals"
                    ? "border-blue-600 font-bold text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                Pending Approvals ({metrics?.pendingRequestsCount || 0})
              </button>
              <button
                onClick={() => { setActiveTab("all"); setPage(1); }}
                className={`border-b-2 py-3 px-1 transition-colors ${
                  activeTab === "all"
                    ? "border-blue-600 font-bold text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                All OT Requests History
              </button>
              <button
                onClick={() => setActiveTab("department")}
                className={`border-b-2 py-3 px-1 transition-colors ${
                  activeTab === "department"
                    ? "border-blue-600 font-bold text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                Department Reports
              </button>
              <button
                onClick={() => setActiveTab("monthly")}
                className={`border-b-2 py-3 px-1 transition-colors ${
                  activeTab === "monthly"
                    ? "border-blue-600 font-bold text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                Monthly Summary Reports
              </button>
            </nav>
          </div>

          {/* TAB 1 & 2: APPROVALS & HISTORY */}
          {(activeTab === "approvals" || activeTab === "all") && (
            <div className="space-y-4">
              {/* Filters Bar */}
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search employee name, ID, or work reason..."
                    className="pl-9"
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  />
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  {activeTab === "all" && (
                    <select
                      className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                      value={statusFilter}
                      onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                    >
                      <option value="all">All Statuses</option>
                      <option value="PENDING">Pending Review</option>
                      <option value="APPROVED_BY_MANAGER">Manager Approved</option>
                      <option value="APPROVED">Approved</option>
                      <option value="REJECTED">Rejected</option>
                      <option value="CANCELLED">Cancelled</option>
                    </select>
                  )}

                  <select
                    className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                    value={departmentFilter}
                    onChange={(e) => { setDepartmentFilter(e.target.value); setPage(1); }}
                  >
                    <option value="all">All Departments</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* OT Table */}
              <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                {loading && requests.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">Loading overtime claims...</div>
                ) : requests.length === 0 ? (
                  <div className="p-12 text-center text-gray-500">
                    <Clock className="mx-auto h-12 w-12 text-gray-300" />
                    <p className="mt-2 text-lg font-medium text-gray-900">
                      {activeTab === "approvals" ? "No pending overtime approvals" : "No overtime records found"}
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-600">
                      <thead className="bg-gray-50 text-xs uppercase text-gray-500 border-b border-gray-200">
                        <tr>
                          <th className="px-6 py-3 font-semibold">Employee</th>
                          <th className="px-6 py-3 font-semibold">Date & Time</th>
                          <th className="px-6 py-3 font-semibold">Duration</th>
                          <th className="px-6 py-3 font-semibold">Category (Rate)</th>
                          <th className="px-6 py-3 font-semibold">Reason</th>
                          <th className="px-6 py-3 font-semibold">Status</th>
                          <th className="px-6 py-3 text-right font-semibold">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {requests.map((req) => (
                          <tr key={req.id} className="hover:bg-gray-50/80 transition-colors">
                            <td className="px-6 py-4">
                              <div>
                                <p className="font-semibold text-gray-900">{req.user?.name}</p>
                                <p className="text-xs text-gray-400 font-mono">
                                  {req.user?.employeeId} · {req.user?.departmentRef?.name || req.user?.department || "Unassigned"}
                                </p>
                              </div>
                            </td>

                            <td className="px-6 py-4">
                              <p className="font-medium text-gray-900">{req.date}</p>
                              <p className="text-xs text-gray-500">{req.startTime} - {req.endTime}</p>
                            </td>

                            <td className="px-6 py-4">
                              <span className="font-bold text-gray-900">{req.totalHours} hrs</span>
                            </td>

                            <td className="px-6 py-4">
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-100">
                                {req.category.replace("_", " ")} ({req.multiplierRate}x)
                              </span>
                            </td>

                            <td className="px-6 py-4 max-w-xs">
                              <p className="text-xs text-gray-700 truncate" title={req.reason}>
                                {req.reason}
                              </p>
                            </td>

                            <td className="px-6 py-4">{getStatusBadge(req.status)}</td>

                            <td className="px-6 py-4 text-right">
                              {(req.status === "PENDING" || req.status === "APPROVED_BY_MANAGER") ? (
                                <div className="flex items-center justify-end gap-2">
                                  <Button
                                    size="sm"
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                                    onClick={() => handleOpenApprovalModal(req, "APPROVE")}
                                  >
                                    Approve
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-red-600 border-red-200 hover:bg-red-50"
                                    onClick={() => handleOpenApprovalModal(req, "REJECT")}
                                  >
                                    Reject
                                  </Button>
                                </div>
                              ) : (
                                <span className="text-xs text-gray-400 italic">Finalized</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: DEPARTMENT REPORTS */}
          {activeTab === "department" && deptReport && (
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
              <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                <div>
                  <h2 className="font-bold text-gray-900">Department Overtime Aggregation ({deptReport.year})</h2>
                  <p className="text-xs text-gray-500">Summary of total overtime claims, approved hours, and payroll weighted totals by department</p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-600">
                  <thead className="bg-gray-50 text-xs uppercase text-gray-500 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 font-semibold">Department</th>
                      <th className="px-6 py-3 font-semibold">Staff Count</th>
                      <th className="px-6 py-3 font-semibold">Total Claims</th>
                      <th className="px-6 py-3 font-semibold">Approved Hours</th>
                      <th className="px-6 py-3 font-semibold">Pending Hours</th>
                      <th className="px-6 py-3 font-semibold">Payroll Weighted Hours</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {deptReport.departments.map((d, idx) => (
                      <tr key={d.departmentId || `dept-${idx}`} className="hover:bg-gray-50/80">
                        <td className="px-6 py-4 font-semibold text-gray-900">{d.departmentName}</td>
                        <td className="px-6 py-4 font-medium text-gray-900">{d.employeeCount} staff</td>
                        <td className="px-6 py-4 font-semibold text-gray-900">{d.totalRequests} claims</td>
                        <td className="px-6 py-4 font-bold text-emerald-600">{d.approvedHours} hrs</td>
                        <td className="px-6 py-4 font-semibold text-amber-600">{d.pendingHours} hrs</td>
                        <td className="px-6 py-4 font-bold text-blue-700">{d.weightedPayrollHours} hrs</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: MONTHLY SUMMARY REPORTS */}
          {activeTab === "monthly" && monthlyReport && (
            <div className="space-y-6">
              {/* Monthly Overview Card */}
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Claims</p>
                  <p className="mt-2 text-2xl font-bold text-gray-900">{monthlyReport.summary.totalRequests}</p>
                </div>

                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                  <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Approved Claims</p>
                  <p className="mt-2 text-2xl font-bold text-emerald-700">{monthlyReport.summary.approvedRequests}</p>
                </div>

                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                  <p className="text-xs font-semibold text-amber-600 uppercase tracking-wider">Pending Claims</p>
                  <p className="mt-2 text-2xl font-bold text-amber-700">{monthlyReport.summary.pendingRequests}</p>
                </div>

                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                  <p className="text-xs font-semibold text-rose-600 uppercase tracking-wider">Rejected Claims</p>
                  <p className="mt-2 text-2xl font-bold text-rose-700">{monthlyReport.summary.rejectedRequests}</p>
                </div>

                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                  <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Approved OT Hours</p>
                  <p className="mt-2 text-2xl font-bold text-emerald-700">{monthlyReport.summary.totalApprovedHours} hrs</p>
                </div>

                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                  <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider">Weighted OT Hours</p>
                  <p className="mt-2 text-2xl font-bold text-blue-700">{monthlyReport.summary.totalWeightedHours} hrs</p>
                </div>
              </div>

              {/* Monthly Table */}
              <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                <div className="p-4 border-b border-gray-200">
                  <h2 className="font-bold text-gray-900">Monthly Overtime Claims Log</h2>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-gray-600">
                    <thead className="bg-gray-50 text-xs uppercase text-gray-500 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 font-semibold">Employee</th>
                        <th className="px-6 py-3 font-semibold">Date</th>
                        <th className="px-6 py-3 font-semibold">Hours</th>
                        <th className="px-6 py-3 font-semibold">Rate</th>
                        <th className="px-6 py-3 font-semibold">Weighted Payroll Hours</th>
                        <th className="px-6 py-3 font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {monthlyReport.requests.map((r) => (
                        <tr key={r.id} className="hover:bg-gray-50/80">
                          <td className="px-6 py-3">
                            <p className="font-semibold text-gray-900">{r.user?.name}</p>
                            <p className="text-xs text-gray-400 font-mono">{r.user?.employeeId}</p>
                          </td>
                          <td className="px-6 py-3 text-xs text-gray-900">{r.date} ({r.startTime}-{r.endTime})</td>
                          <td className="px-6 py-3 font-semibold text-gray-900">{r.totalHours} hrs</td>
                          <td className="px-6 py-3 text-xs font-semibold text-blue-700">{r.category} ({r.multiplierRate}x)</td>
                          <td className="px-6 py-3 font-bold text-blue-700">{Math.round(r.totalHours * r.multiplierRate * 100) / 100} hrs</td>
                          <td className="px-6 py-3">{getStatusBadge(r.status)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Approval Dialog Modal */}
          {isModalOpen && selectedRequest && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl space-y-4">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <h2 className="text-lg font-bold text-gray-900">
                    {approvalAction === "APPROVE" ? "Approve Overtime Claim" : "Reject Overtime Claim"}
                  </h2>
                  <button onClick={() => setIsModalOpen(false)} className="rounded-lg p-1 text-gray-400 hover:bg-gray-100">
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="rounded-lg bg-gray-50 p-3 text-xs space-y-1 text-gray-700">
                  <p><strong>Employee:</strong> {selectedRequest.user?.name} ({selectedRequest.user?.employeeId})</p>
                  <p><strong>Date & Window:</strong> {selectedRequest.date} ({selectedRequest.startTime} - {selectedRequest.endTime})</p>
                  <p><strong>Calculated Hours:</strong> {selectedRequest.totalHours} hrs ({selectedRequest.category} {selectedRequest.multiplierRate}x)</p>
                  <p><strong>Reason:</strong> {selectedRequest.reason}</p>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="admin-comment">Approver Note / Comment (Optional)</Label>
                  <textarea
                    id="admin-comment"
                    rows={2}
                    className="w-full rounded-md border border-gray-300 p-2 text-sm focus:border-blue-500 focus:outline-none"
                    placeholder="Note for employee..."
                    value={approvalComment}
                    onChange={(e) => setApprovalComment(e.target.value)}
                    disabled={submittingApproval}
                  />
                </div>

                <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} disabled={submittingApproval}>
                    Cancel
                  </Button>
                  <Button
                    className={approvalAction === "APPROVE" ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "bg-red-600 hover:bg-red-700 text-white"}
                    onClick={handleProcessApproval}
                    disabled={submittingApproval}
                  >
                    {submittingApproval ? "Processing..." : approvalAction === "APPROVE" ? "Confirm Approval" : "Confirm Rejection"}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
