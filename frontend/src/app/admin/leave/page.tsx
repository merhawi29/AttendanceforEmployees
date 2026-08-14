"use client";

import { useState, useEffect, useCallback } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiRequest } from "@/lib/api";
import {
  LeaveRequest,
  LeaveType,
  LeaveRequestsResponse,
  LeaveReportResponse,
  DepartmentLeaveReportResponse,
} from "@/types/leave";
import { DepartmentTreeItem } from "@/types/department";
import { Toaster } from "@/components/ui/toast";
import { toast } from "@/hooks/use-toast";
import {
  Calendar as CalendarIcon,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  RefreshCw,
  Plus,
  Edit,
  X,
  Building2,
  FileText,
  UserCheck,
  Check,
  Palmtree,
  Stethoscope,
  Heart,
  Ban,
  Users,
  PieChart,
} from "lucide-react";

export default function AdminLeavePage() {
  const [activeTab, setActiveTab] = useState<"approvals" | "all" | "types" | "balances" | "reports">("approvals");

  // Data state
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [departments, setDepartments] = useState<DepartmentTreeItem[]>([]);
  const [reports, setReports] = useState<LeaveReportResponse | null>(null);
  const [deptReports, setDeptReports] = useState<DepartmentLeaveReportResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters State
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const [leaveTypeFilter, setLeaveTypeFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Modal / Approval State
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);
  const [approvalAction, setApprovalAction] = useState<"APPROVE" | "REJECT">("APPROVE");
  const [approvalComment, setApprovalComment] = useState("");
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [processingApproval, setProcessingApproval] = useState(false);

  // Leave Type Modal State
  const [isTypeModalOpen, setIsTypeModalOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<LeaveType | null>(null);
  const [typeForm, setTypeForm] = useState({
    code: "",
    name: "",
    description: "",
    defaultDaysPerYear: 20,
    isPaid: true,
    requiresApproval: true,
    isActive: true,
  });
  const [submittingType, setSubmittingType] = useState(false);

  const fetchLeaveData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [typesRes, deptsRes] = await Promise.all([
        apiRequest<LeaveType[]>("/leave/types?includeInactive=true"),
        apiRequest<DepartmentTreeItem[]>("/departments/tree").catch(() => []),
      ]);

      setLeaveTypes(typesRes || []);
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
        if (leaveTypeFilter !== "all") params.append("leaveTypeId", leaveTypeFilter);
        if (search.trim()) params.append("search", search.trim());

        const reqsRes = await apiRequest<LeaveRequestsResponse>(`/leave/requests?${params.toString()}`);
        setRequests(reqsRes.requests || []);
        setTotalPages(reqsRes.pagination?.totalPages || 1);
      } else if (activeTab === "balances") {
        const deptParam = departmentFilter !== "all" ? `&departmentId=${departmentFilter}` : "";
        const repRes = await apiRequest<LeaveReportResponse>(`/leave/reports?year=${new Date().getFullYear()}${deptParam}`);
        setReports(repRes);
      } else if (activeTab === "reports") {
        const deptParam = departmentFilter !== "all" ? `&departmentId=${departmentFilter}` : "";
        const deptRepRes = await apiRequest<DepartmentLeaveReportResponse>(`/leave/reports/departments?year=${new Date().getFullYear()}${deptParam}`);
        setDeptReports(deptRepRes);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load leave data");
    } finally {
      setLoading(false);
    }
  }, [activeTab, page, statusFilter, departmentFilter, leaveTypeFilter, search]);

  useEffect(() => {
    fetchLeaveData();
  }, [fetchLeaveData]);

  const handleOpenApprovalModal = (req: LeaveRequest, action: "APPROVE" | "REJECT") => {
    setSelectedRequest(req);
    setApprovalAction(action);
    setApprovalComment("");
    setIsApprovalModalOpen(true);
  };

  const handleProcessApproval = async () => {
    if (!selectedRequest) return;
    setProcessingApproval(true);
    try {
      await apiRequest(`/leave/requests/${selectedRequest.id}/approve-admin`, {
        method: "PUT",
        body: JSON.stringify({
          action: approvalAction,
          comment: approvalComment.trim() || null,
        }),
      });

      toast({
        title: `Request ${approvalAction === "APPROVE" ? "Approved" : "Rejected"}`,
        description: `Leave request for ${selectedRequest.user?.name} has been processed.`,
        variant: "success",
      });

      setIsApprovalModalOpen(false);
      fetchLeaveData();
    } catch (err: any) {
      toast({
        title: "Action Failed",
        description: err.message || "Failed to process approval",
        variant: "destructive",
      });
    } finally {
      setProcessingApproval(false);
    }
  };

  const handleOpenTypeModal = (lt?: LeaveType) => {
    if (lt) {
      setSelectedType(lt);
      setTypeForm({
        code: lt.code,
        name: lt.name,
        description: lt.description || "",
        defaultDaysPerYear: lt.defaultDaysPerYear,
        isPaid: lt.isPaid,
        requiresApproval: lt.requiresApproval,
        isActive: lt.isActive,
      });
    } else {
      setSelectedType(null);
      setTypeForm({
        code: "",
        name: "",
        description: "",
        defaultDaysPerYear: 20,
        isPaid: true,
        requiresApproval: true,
        isActive: true,
      });
    }
    setIsTypeModalOpen(true);
  };

  const handleSaveType = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingType(true);
    try {
      if (selectedType) {
        await apiRequest(`/leave/types/${selectedType.id}`, {
          method: "PUT",
          body: JSON.stringify(typeForm),
        });
        toast({ title: "Leave Type Updated", variant: "success" });
      } else {
        await apiRequest("/leave/types", {
          method: "POST",
          body: JSON.stringify(typeForm),
        });
        toast({ title: "Leave Type Created", variant: "success" });
      }
      setIsTypeModalOpen(false);
      fetchLeaveData();
    } catch (err: any) {
      toast({ title: "Failed to Save", description: err.message, variant: "destructive" });
    } finally {
      setSubmittingType(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "APPROVED":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-semibold text-green-700">
            <CheckCircle2 className="h-3 w-3" /> Approved
          </span>
        );
      case "APPROVED_BY_MANAGER":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
            <UserCheck className="h-3 w-3" /> Manager Approved
          </span>
        );
      case "PENDING":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
            <Clock className="h-3 w-3" /> Pending Review
          </span>
        );
      case "REJECTED":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-700">
            <XCircle className="h-3 w-3" /> Rejected
          </span>
        );
      case "CANCELLED":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-600">
            <Ban className="h-3 w-3" /> Cancelled
          </span>
        );
      default:
        return <span className="text-xs text-gray-500">{status}</span>;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <Toaster />

        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Leave Management Hub</h1>
            <p className="text-sm text-gray-500">
              Approve requests, manage quotas, inspect leave balances, and review department reports
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={fetchLeaveData}>
              <RefreshCw className={`h-4 w-4 mr-1.5 ${loading ? "animate-spin" : ""}`} /> Refresh
            </Button>
            {activeTab === "types" && (
              <Button onClick={() => handleOpenTypeModal()} className="flex items-center gap-1.5">
                <Plus className="h-4 w-4" /> Add Leave Type
              </Button>
            )}
          </div>
        </div>

        {/* Tabs Navigation */}
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
              Pending Approvals
            </button>
            <button
              onClick={() => { setActiveTab("all"); setPage(1); }}
              className={`border-b-2 py-3 px-1 transition-colors ${
                activeTab === "all"
                  ? "border-blue-600 font-bold text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              All Requests History
            </button>
            <button
              onClick={() => setActiveTab("types")}
              className={`border-b-2 py-3 px-1 transition-colors ${
                activeTab === "types"
                  ? "border-blue-600 font-bold text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Leave Types & Quotas
            </button>
            <button
              onClick={() => setActiveTab("balances")}
              className={`border-b-2 py-3 px-1 transition-colors ${
                activeTab === "balances"
                  ? "border-blue-600 font-bold text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Staff Leave Balances
            </button>
            <button
              onClick={() => setActiveTab("reports")}
              className={`border-b-2 py-3 px-1 transition-colors ${
                activeTab === "reports"
                  ? "border-blue-600 font-bold text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Department Reports
            </button>
          </nav>
        </div>

        {/* TAB 1: PENDING APPROVALS */}
        {(activeTab === "approvals" || activeTab === "all") && (
          <div className="space-y-4">
            {/* Filters Bar */}
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by employee name, ID, or reason..."
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

                <select
                  className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  value={leaveTypeFilter}
                  onChange={(e) => { setLeaveTypeFilter(e.target.value); setPage(1); }}
                >
                  <option value="all">All Leave Types</option>
                  {leaveTypes.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Requests Table */}
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
              {loading && requests.length === 0 ? (
                <div className="p-8 text-center text-gray-500">Loading leave requests...</div>
              ) : requests.length === 0 ? (
                <div className="p-12 text-center text-gray-500">
                  <CalendarIcon className="mx-auto h-12 w-12 text-gray-300" />
                  <p className="mt-2 text-lg font-medium text-gray-900">
                    {activeTab === "approvals" ? "No pending leave approvals" : "No leave requests found"}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-gray-600">
                    <thead className="bg-gray-50 text-xs uppercase text-gray-500 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 font-semibold">Employee</th>
                        <th className="px-6 py-3 font-semibold">Leave Type</th>
                        <th className="px-6 py-3 font-semibold">Dates & Days</th>
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
                                {req.user?.employeeId} · {req.user?.departmentRef?.name || req.user?.department || "N/A"}
                              </p>
                            </div>
                          </td>

                          <td className="px-6 py-4 font-medium text-gray-900">
                            {req.leaveType?.name}
                          </td>

                          <td className="px-6 py-4">
                            <div>
                              <p className="font-medium text-gray-900">{req.startDate} to {req.endDate}</p>
                              <p className="text-xs text-gray-500">{req.totalDays} day(s)</p>
                            </div>
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
                              <span className="text-xs text-gray-400 italic">Completed</span>
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

        {/* TAB 3: LEAVE TYPES & QUOTAS */}
        {activeTab === "types" && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {leaveTypes.map((lt) => (
              <div key={lt.id} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-gray-900">{lt.name}</h3>
                    <span className="font-mono text-xs text-gray-400">{lt.code}</span>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => handleOpenTypeModal(lt)}>
                    <Edit className="h-4 w-4 text-gray-500" />
                  </Button>
                </div>

                <p className="text-xs text-gray-600 line-clamp-2">{lt.description || "No description."}</p>

                <div className="border-t border-gray-100 pt-3 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-gray-500">Default Allocation:</span>
                    <p className="font-bold text-gray-900">{lt.defaultDaysPerYear} days / yr</p>
                  </div>
                  <div className="space-x-1">
                    <span className={`px-2 py-0.5 rounded font-semibold ${lt.isPaid ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
                      {lt.isPaid ? "Paid" : "Unpaid"}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB 4: LEAVE BALANCES */}
        {activeTab === "balances" && reports && (
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="font-bold text-gray-900">
                Staff Leave Balances & Allocation ({reports.year})
              </h2>
              <div className="flex items-center gap-4 text-xs font-semibold">
                <span className="text-gray-600">Total Allocated: {reports.summary.totalAllocated} days</span>
                <span className="text-emerald-600">Total Used: {reports.summary.totalUsed} days</span>
                <span className="text-amber-600">Total Pending: {reports.summary.totalPending} days</span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-gray-50 text-xs uppercase text-gray-500 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 font-semibold">Employee</th>
                    <th className="px-6 py-3 font-semibold">Department</th>
                    <th className="px-6 py-3 font-semibold">Leave Type</th>
                    <th className="px-6 py-3 font-semibold">Allocated</th>
                    <th className="px-6 py-3 font-semibold">Used</th>
                    <th className="px-6 py-3 font-semibold">Pending</th>
                    <th className="px-6 py-3 font-semibold">Remaining</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {reports.userBalances.map((b, idx) => (
                    <tr key={`${b.userId}-${b.leaveTypeId}-${idx}`} className="hover:bg-gray-50/80">
                      <td className="px-6 py-3">
                        <p className="font-semibold text-gray-900">{b.userName}</p>
                        <p className="text-xs text-gray-400 font-mono">{b.employeeId}</p>
                      </td>
                      <td className="px-6 py-3 text-xs text-gray-700">{b.department || "Unassigned"}</td>
                      <td className="px-6 py-3 font-medium text-gray-900">{b.leaveTypeName}</td>
                      <td className="px-6 py-3 font-semibold text-gray-900">{b.allocatedDays}</td>
                      <td className="px-6 py-3 font-semibold text-emerald-600">{b.usedDays}</td>
                      <td className="px-6 py-3 font-semibold text-amber-600">{b.pendingDays}</td>
                      <td className="px-6 py-3 font-bold text-blue-700">{b.remainingDays}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 5: DEPARTMENT REPORTS */}
        {activeTab === "reports" && deptReports && (
          <div className="space-y-6">
            {/* Department Summary Cards */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
              <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Departments</p>
                <p className="mt-2 text-2xl font-bold text-gray-900">{deptReports.summary.totalDepartments}</p>
              </div>

              <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Staff</p>
                <p className="mt-2 text-2xl font-bold text-gray-900">{deptReports.summary.totalEmployees}</p>
              </div>

              <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Allocated Days</p>
                <p className="mt-2 text-2xl font-bold text-gray-900">{deptReports.summary.totalAllocated}</p>
              </div>

              <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Used Days</p>
                <p className="mt-2 text-2xl font-bold text-emerald-700">{deptReports.summary.totalUsed}</p>
              </div>

              <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <p className="text-xs font-semibold text-amber-600 uppercase tracking-wider">Pending Days</p>
                <p className="mt-2 text-2xl font-bold text-amber-700">{deptReports.summary.totalPending}</p>
              </div>

              <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider">Remaining Days</p>
                <p className="mt-2 text-2xl font-bold text-blue-700">{deptReports.summary.totalRemaining}</p>
              </div>
            </div>

            {/* Department Aggregation Table */}
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
              <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                <div>
                  <h2 className="font-bold text-gray-900">Department Leave Aggregation ({deptReports.year})</h2>
                  <p className="text-xs text-gray-500">Summary of leave metrics aggregated by department</p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-600">
                  <thead className="bg-gray-50 text-xs uppercase text-gray-500 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 font-semibold">Department Name</th>
                      <th className="px-6 py-3 font-semibold">Staff Count</th>
                      <th className="px-6 py-3 font-semibold">Total Allocated</th>
                      <th className="px-6 py-3 font-semibold">Total Used</th>
                      <th className="px-6 py-3 font-semibold">Total Pending</th>
                      <th className="px-6 py-3 font-semibold">Total Remaining</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {deptReports.departments.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                          No department leave data found for this period.
                        </td>
                      </tr>
                    ) : (
                      deptReports.departments.map((d, idx) => (
                        <tr key={d.departmentId || `dept-${idx}`} className="hover:bg-gray-50/80">
                          <td className="px-6 py-4">
                            <p className="font-semibold text-gray-900">{d.departmentName}</p>
                            {d.departmentCode && (
                              <p className="text-xs text-gray-400 font-mono">{d.departmentCode}</p>
                            )}
                          </td>
                          <td className="px-6 py-4 font-medium text-gray-900">{d.employeeCount} employee(s)</td>
                          <td className="px-6 py-4 font-semibold text-gray-900">{d.totalAllocated} days</td>
                          <td className="px-6 py-4 font-semibold text-emerald-600">{d.totalUsed} days</td>
                          <td className="px-6 py-4 font-semibold text-amber-600">{d.totalPending} days</td>
                          <td className="px-6 py-4 font-bold text-blue-700">{d.totalRemaining} days</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Approval Dialog Modal */}
        {isApprovalModalOpen && selectedRequest && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <h2 className="text-lg font-bold text-gray-900">
                  {approvalAction === "APPROVE" ? "Approve Leave Request" : "Reject Leave Request"}
                </h2>
                <button onClick={() => setIsApprovalModalOpen(false)} className="rounded-lg p-1 text-gray-400 hover:bg-gray-100">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="rounded-lg bg-gray-50 p-3 text-xs space-y-1 text-gray-700">
                <p><strong>Employee:</strong> {selectedRequest.user?.name} ({selectedRequest.user?.employeeId})</p>
                <p><strong>Leave Type:</strong> {selectedRequest.leaveType?.name}</p>
                <p><strong>Dates:</strong> {selectedRequest.startDate} to {selectedRequest.endDate} ({selectedRequest.totalDays} days)</p>
                <p><strong>Reason:</strong> {selectedRequest.reason}</p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="comment">Approver Note / Comment (Optional)</Label>
                <textarea
                  id="comment"
                  rows={2}
                  className="w-full rounded-md border border-gray-300 p-2 text-sm focus:border-blue-500 focus:outline-none"
                  placeholder="Provide note for applicant..."
                  value={approvalComment}
                  onChange={(e) => setApprovalComment(e.target.value)}
                  disabled={processingApproval}
                />
              </div>

              <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsApprovalModalOpen(false)} disabled={processingApproval}>
                  Cancel
                </Button>
                <Button
                  className={approvalAction === "APPROVE" ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "bg-red-600 hover:bg-red-700 text-white"}
                  onClick={handleProcessApproval}
                  disabled={processingApproval}
                >
                  {processingApproval ? "Processing..." : approvalAction === "APPROVE" ? "Confirm Approval" : "Confirm Rejection"}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Leave Type Modal */}
        {isTypeModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <h2 className="text-lg font-bold text-gray-900">
                  {selectedType ? "Edit Leave Type" : "Create New Leave Type"}
                </h2>
                <button onClick={() => setIsTypeModalOpen(false)} className="rounded-lg p-1 text-gray-400 hover:bg-gray-100">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSaveType} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="code">Code *</Label>
                    <Input
                      id="code"
                      placeholder="e.g. ANNUAL"
                      value={typeForm.code}
                      onChange={(e) => setTypeForm({ ...typeForm, code: e.target.value })}
                      required
                      disabled={submittingType}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="name">Name *</Label>
                    <Input
                      id="name"
                      placeholder="e.g. Annual Vacation"
                      value={typeForm.name}
                      onChange={(e) => setTypeForm({ ...typeForm, name: e.target.value })}
                      required
                      disabled={submittingType}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    placeholder="Brief description..."
                    value={typeForm.description}
                    onChange={(e) => setTypeForm({ ...typeForm, description: e.target.value })}
                    disabled={submittingType}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="defaultDaysPerYear">Default Days Per Year *</Label>
                  <Input
                    id="defaultDaysPerYear"
                    type="number"
                    value={typeForm.defaultDaysPerYear}
                    onChange={(e) => setTypeForm({ ...typeForm, defaultDaysPerYear: parseFloat(e.target.value) || 0 })}
                    required
                    disabled={submittingType}
                  />
                </div>

                <div className="flex items-center gap-4 pt-2">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-medium">
                    <input
                      type="checkbox"
                      checked={typeForm.isPaid}
                      onChange={(e) => setTypeForm({ ...typeForm, isPaid: e.target.checked })}
                    />
                    Paid Leave
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-medium">
                    <input
                      type="checkbox"
                      checked={typeForm.isActive}
                      onChange={(e) => setTypeForm({ ...typeForm, isActive: e.target.checked })}
                    />
                    Active
                  </label>
                </div>

                <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsTypeModalOpen(false)} disabled={submittingType}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={submittingType}>
                    {submittingType ? "Saving..." : "Save Leave Type"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
