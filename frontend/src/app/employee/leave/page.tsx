"use client";

import { useState, useEffect, useCallback } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiRequest } from "@/lib/api";
import {
  LeaveBalance,
  LeaveRequest,
  LeaveType,
  LeaveRequestsResponse,
  CreateLeaveRequestInput,
} from "@/types/leave";
import { Toaster } from "@/components/ui/toast";
import { toast } from "@/hooks/use-toast";
import {
  Calendar as CalendarIcon,
  Plus,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  X,
  FileText,
  Palmtree,
  Stethoscope,
  Ban,
  Heart,
} from "lucide-react";

export default function EmployeeLeavePage() {
  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Request Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const [formData, setFormData] = useState<CreateLeaveRequestInput>({
    leaveTypeId: "",
    startDate: new Date().toISOString().split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
    reason: "",
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [balRes, typesRes, reqsRes] = await Promise.all([
        apiRequest<LeaveBalance[]>("/leave/balances/my"),
        apiRequest<LeaveType[]>("/leave/types"),
        apiRequest<LeaveRequestsResponse>("/leave/requests/my?limit=50"),
      ]);

      setBalances(balRes || []);
      setLeaveTypes((typesRes || []).filter((t) => t.isActive));
      setRequests(reqsRes.requests || []);
      if ((typesRes || []).length > 0) {
        setFormData((prev) => ({ ...prev, leaveTypeId: prev.leaveTypeId || typesRes[0].id }));
      }
    } catch (err: any) {
      setError(err.message || "Failed to load leave data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const calculateDaysPreview = () => {
    if (!formData.startDate || !formData.endDate) return 0;
    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    if (start > end) return 0;
    let count = 0;
    const cur = new Date(start);
    while (cur <= end) {
      const day = cur.getDay();
      if (day !== 0 && day !== 6) count++;
      cur.setDate(cur.getDate() + 1);
    }
    return count > 0 ? count : 1;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setModalError(null);

    try {
      await apiRequest("/leave/requests", {
        method: "POST",
        body: JSON.stringify(formData),
      });

      toast({
        title: "Leave Request Submitted",
        description: "Your leave request has been submitted for approval.",
        variant: "success",
      });

      setIsModalOpen(false);
      setFormData({
        leaveTypeId: leaveTypes[0]?.id || "",
        startDate: new Date().toISOString().split("T")[0],
        endDate: new Date().toISOString().split("T")[0],
        reason: "",
      });
      fetchData();
    } catch (err: any) {
      setModalError(err.message || "Failed to submit leave request");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelRequest = async (requestId: string) => {
    try {
      await apiRequest(`/leave/requests/${requestId}/cancel`, { method: "PUT" });
      toast({
        title: "Request Cancelled",
        description: "Your leave request has been cancelled.",
        variant: "success",
      });
      fetchData();
    } catch (err: any) {
      toast({
        title: "Action Failed",
        description: err.message || "Failed to cancel request",
        variant: "destructive",
      });
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
            <Clock className="h-3 w-3" /> Manager Approved (Awaiting Admin)
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

  const getLeaveIcon = (code: string) => {
    switch (code) {
      case "ANNUAL":
        return <Palmtree className="h-5 w-5 text-emerald-600" />;
      case "SICK":
        return <Stethoscope className="h-5 w-5 text-rose-600" />;
      case "MATERNITY":
      case "PATERNITY":
        return <Heart className="h-5 w-5 text-pink-600" />;
      default:
        return <CalendarIcon className="h-5 w-5 text-blue-600" />;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <Toaster />

        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Leave Management</h1>
            <p className="text-sm text-gray-500">
              Track your leave balances, submit new requests, and review request history
            </p>
          </div>
          <Button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Request Leave
          </Button>
        </div>

        {/* Leave Balances Grid */}
        <div>
          <h2 className="text-base font-semibold text-gray-900 mb-3">Leave Allocations & Balances</h2>
          {loading ? (
            <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-gray-500">
              Loading leave balances...
            </div>
          ) : balances.length === 0 ? (
            <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-gray-500">
              No leave balances initialized yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {balances.map((b) => (
                <div key={b.id} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="rounded-lg bg-gray-50 p-2.5">
                        {getLeaveIcon(b.leaveTypeCode)}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-gray-900">{b.leaveTypeName}</h3>
                        <p className="text-xs text-gray-400 uppercase">{b.leaveTypeCode}</p>
                      </div>
                    </div>
                    {b.isPaid ? (
                      <span className="rounded bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                        Paid
                      </span>
                    ) : (
                      <span className="rounded bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                        Unpaid
                      </span>
                    )}
                  </div>

                  <div className="pt-1">
                    <div className="flex items-baseline justify-between">
                      <span className="text-2xl font-extrabold text-gray-900">{b.remainingDays}</span>
                      <span className="text-xs text-gray-500">days available</span>
                    </div>

                    <div className="mt-2 grid grid-cols-3 gap-1 border-t border-gray-100 pt-2 text-[11px] text-gray-500">
                      <div>
                        <p className="text-gray-400">Allocated</p>
                        <p className="font-semibold text-gray-700">{b.allocatedDays}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Used</p>
                        <p className="font-semibold text-gray-700">{b.usedDays}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Pending</p>
                        <p className="font-semibold text-amber-600">{b.pendingDays}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Request History Table */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
            <h2 className="text-base font-bold text-gray-900">My Leave Request History</h2>
            <Button variant="outline" size="sm" onClick={fetchData}>
              <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`} /> Refresh
            </Button>
          </div>

          {error ? (
            <div className="p-8 text-center text-red-500">{error}</div>
          ) : requests.length === 0 ? (
            <div className="p-12 text-center text-gray-500 space-y-3">
              <CalendarIcon className="mx-auto h-12 w-12 text-gray-300" />
              <p className="text-base font-medium text-gray-900">No leave requests found</p>
              <p className="text-xs">Submit your first leave request when planning time off.</p>
              <Button onClick={() => setIsModalOpen(true)}>
                <Plus className="mr-1.5 h-4 w-4" /> Submit Request
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-gray-50 text-xs uppercase text-gray-500 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 font-semibold">Leave Type</th>
                    <th className="px-6 py-3 font-semibold">Dates & Duration</th>
                    <th className="px-6 py-3 font-semibold">Reason</th>
                    <th className="px-6 py-3 font-semibold">Status</th>
                    <th className="px-6 py-3 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {requests.map((req) => (
                    <tr key={req.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="px-6 py-4 font-semibold text-gray-900">
                        {req.leaveType?.name || "Leave"}
                      </td>

                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-gray-900">
                            {req.startDate} to {req.endDate}
                          </p>
                          <p className="text-xs text-gray-500">{req.totalDays} working day(s)</p>
                        </div>
                      </td>

                      <td className="px-6 py-4 max-w-xs">
                        <p className="text-xs text-gray-700 truncate" title={req.reason}>
                          {req.reason}
                        </p>
                        {req.adminComment && (
                          <p className="text-[11px] text-red-600 mt-1 italic">
                            Admin Note: {req.adminComment}
                          </p>
                        )}
                        {req.managerComment && (
                          <p className="text-[11px] text-blue-600 mt-1 italic">
                            Manager Note: {req.managerComment}
                          </p>
                        )}
                      </td>

                      <td className="px-6 py-4">{getStatusBadge(req.status)}</td>

                      <td className="px-6 py-4 text-right">
                        {(req.status === "PENDING" || req.status === "APPROVED_BY_MANAGER") && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs text-red-600 hover:bg-red-50 hover:text-red-700"
                            onClick={() => handleCancelRequest(req.id)}
                          >
                            Cancel Request
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Submit Leave Request Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <h2 className="text-lg font-bold text-gray-900">Submit Leave Request</h2>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {modalError && (
                <div className="rounded-md bg-red-50 p-3 text-sm text-red-700 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {modalError}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="leaveTypeId">
                    Leave Type <span className="text-red-500">*</span>
                  </Label>
                  <select
                    id="leaveTypeId"
                    className="w-full rounded-md border border-gray-300 p-2 text-sm focus:border-blue-500 focus:outline-none"
                    value={formData.leaveTypeId}
                    onChange={(e) => setFormData({ ...formData, leaveTypeId: e.target.value })}
                    required
                    disabled={submitting}
                  >
                    {leaveTypes.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.isPaid ? "Paid" : "Unpaid"})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="startDate">
                      Start Date <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      required
                      disabled={submitting}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="endDate">
                      End Date <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      required
                      disabled={submitting}
                    />
                  </div>
                </div>

                <div className="rounded-lg bg-blue-50 p-3 text-xs text-blue-800 font-medium">
                  Estimated Working Days: <strong>{calculateDaysPreview()} day(s)</strong>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="reason">
                    Reason for Leave <span className="text-red-500">*</span>
                  </Label>
                  <textarea
                    id="reason"
                    rows={3}
                    className="w-full rounded-md border border-gray-300 p-2 text-sm focus:border-blue-500 focus:outline-none"
                    placeholder="Provide details regarding your leave request..."
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    required
                    disabled={submitting}
                  />
                </div>

                <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} disabled={submitting}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={submitting}>
                    {submitting ? "Submitting..." : "Submit Request"}
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
