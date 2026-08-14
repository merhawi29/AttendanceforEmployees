"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiRequest } from "@/lib/api";
import { Toaster } from "@/components/ui/toast";
import { toast } from "@/hooks/use-toast";
import {
  OvertimeRequest,
  OvertimeCategory,
  OvertimeRequestsResponse,
} from "@/types/overtime";
import {
  Clock,
  Calendar,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Plus,
  RefreshCw,
  Ban,
  HelpCircle,
  Calculator,
  Zap,
} from "lucide-react";

export default function EmployeeOvertimePage() {
  const [requests, setRequests] = useState<OvertimeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [startTime, setStartTime] = useState("17:30");
  const [endTime, setEndTime] = useState("20:30");
  const [category, setCategory] = useState<OvertimeCategory>("NORMAL_DAY");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Auto-calculated total hours preview
  const calculatedHours = useMemo(() => {
    if (!startTime || !endTime) return 0;
    const [startH, startM] = startTime.split(":").map(Number);
    const [endH, endM] = endTime.split(":").map(Number);

    let startMins = startH * 60 + startM;
    let endMins = endH * 60 + endM;

    if (endMins <= startMins) {
      endMins += 24 * 60;
    }

    const diff = endMins - startMins;
    const hours = diff / 60;
    return Math.round(hours * 100) / 100;
  }, [startTime, endTime]);

  const getMultiplierLabel = (cat: OvertimeCategory) => {
    switch (cat) {
      case "NORMAL_DAY":
        return "1.5x (Standard Weekday)";
      case "WEEKEND":
        return "2.0x (Weekend)";
      case "PUBLIC_HOLIDAY":
        return "2.5x (Public Holiday)";
      case "NIGHT_SHIFT":
        return "1.75x (Night Shift)";
      default:
        return "1.5x";
    }
  };

  const fetchMyRequests = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
      });
      if (statusFilter !== "all") params.append("status", statusFilter);

      const res = await apiRequest<OvertimeRequestsResponse>(`/overtime/requests/my?${params.toString()}`);
      setRequests(res.requests || []);
      setTotalPages(res.pagination?.totalPages || 1);
    } catch (err: any) {
      toast({
        title: "Error Loading Overtime History",
        description: err.message || "Failed to fetch overtime requests",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    fetchMyRequests();
  }, [fetchMyRequests]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (calculatedHours <= 0) {
      toast({ title: "Invalid Duration", description: "Start time must be before end time", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      await apiRequest("/overtime/requests", {
        method: "POST",
        body: JSON.stringify({
          date,
          startTime,
          endTime,
          category,
          reason,
        }),
      });

      toast({
        title: "Request Submitted",
        description: `Overtime request for ${calculatedHours} hours submitted successfully.`,
        variant: "success",
      });

      setIsFormOpen(false);
      setReason("");
      fetchMyRequests();
    } catch (err: any) {
      toast({
        title: "Submission Failed",
        description: err.message || "Failed to submit overtime request",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async (id: string) => {
    try {
      await apiRequest(`/overtime/requests/${id}/cancel`, {
        method: "PUT",
      });

      toast({
        title: "Request Cancelled",
        description: "Your overtime request has been cancelled.",
        variant: "success",
      });

      fetchMyRequests();
    } catch (err: any) {
      toast({
        title: "Cancellation Failed",
        description: err.message || "Failed to cancel request",
        variant: "destructive",
      });
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
            <CheckCircle2 className="h-3.5 w-3.5" /> Manager Approved
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
    <ProtectedRoute requiredRole="EMPLOYEE">
      <DashboardLayout>
        <div className="space-y-6">
          <Toaster />

          {/* Header */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">My Overtime (OT)</h1>
              <p className="text-sm text-gray-500">
                Submit overtime requests, inspect status, and review calculated payroll hours
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={fetchMyRequests}>
                <RefreshCw className={`h-4 w-4 mr-1.5 ${loading ? "animate-spin" : ""}`} /> Refresh
              </Button>
              <Button onClick={() => setIsFormOpen(true)} className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white">
                <Plus className="h-4 w-4" /> Request Overtime
              </Button>
            </div>
          </div>

          {/* Request Submission Form Card / Modal */}
          {isFormOpen && (
            <Card className="border-blue-200 bg-blue-50/30 shadow-sm">
              <CardHeader className="border-b border-blue-100 pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-blue-600" />
                    <CardTitle className="text-lg font-bold text-gray-900">New Overtime Request</CardTitle>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setIsFormOpen(false)}>
                    Close
                  </Button>
                </div>
                <CardDescription>Enter overtime details for supervisor approval</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="date">Overtime Date *</Label>
                      <Input
                        id="date"
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        required
                        className="bg-white"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="start-time">Start Time *</Label>
                      <Input
                        id="start-time"
                        type="time"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        required
                        className="bg-white"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="end-time">End Time *</Label>
                      <Input
                        id="end-time"
                        type="time"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        required
                        className="bg-white"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="category">OT Rate Category *</Label>
                      <select
                        id="category"
                        className="w-full rounded-md border border-gray-300 bg-white p-2 text-sm focus:border-blue-500 focus:outline-none"
                        value={category}
                        onChange={(e) => setCategory(e.target.value as OvertimeCategory)}
                      >
                        <option value="NORMAL_DAY">Normal Day (1.5x)</option>
                        <option value="WEEKEND">Weekend (2.0x)</option>
                        <option value="PUBLIC_HOLIDAY">Public Holiday (2.5x)</option>
                        <option value="NIGHT_SHIFT">Night Shift (1.75x)</option>
                      </select>
                    </div>
                  </div>

                  {/* Auto Hour Calculation Indicator Box */}
                  <div className="flex flex-wrap items-center justify-between rounded-lg border border-blue-200 bg-white p-4 text-sm shadow-xs">
                    <div className="flex items-center gap-3">
                      <Calculator className="h-5 w-5 text-blue-600" />
                      <div>
                        <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Calculated Duration</span>
                        <p className="font-bold text-gray-900 text-base">{calculatedHours} Hours</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-xs font-semibold text-blue-700 bg-blue-50 px-3 py-1.5 rounded-full border border-blue-100">
                      <Zap className="h-3.5 w-3.5" />
                      Rate Multiplier: {getMultiplierLabel(category)}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="reason">Reason / Work Description *</Label>
                    <textarea
                      id="reason"
                      rows={2}
                      className="w-full rounded-md border border-gray-300 bg-white p-2 text-sm focus:border-blue-500 focus:outline-none"
                      placeholder="Specify project tasks or urgent work completed during overtime..."
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      required
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)} disabled={submitting}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={submitting} className="bg-blue-600 hover:bg-blue-700 text-white">
                      {submitting ? "Submitting..." : "Submit Overtime Request"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Filters Bar */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase text-gray-500 tracking-wider">Filter Status:</span>
              <select
                className="rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
              >
                <option value="all">All Statuses</option>
                <option value="PENDING">Pending Review</option>
                <option value="APPROVED_BY_MANAGER">Manager Approved</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>

            <div className="text-xs text-gray-500 font-medium">
              Showing page {page} of {totalPages}
            </div>
          </div>

          {/* Overtime History Table */}
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            {loading && requests.length === 0 ? (
              <div className="p-8 text-center text-gray-500">Loading overtime requests...</div>
            ) : requests.length === 0 ? (
              <div className="p-12 text-center text-gray-500">
                <Clock className="mx-auto h-12 w-12 text-gray-300" />
                <p className="mt-2 text-lg font-medium text-gray-900">No overtime history found</p>
                <p className="text-sm text-gray-400">Click "Request Overtime" above to submit a new OT claim.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-600">
                  <thead className="bg-gray-50 text-xs uppercase text-gray-500 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 font-semibold">Date</th>
                      <th className="px-6 py-3 font-semibold">Time Window</th>
                      <th className="px-6 py-3 font-semibold">Duration</th>
                      <th className="px-6 py-3 font-semibold">Rate Category</th>
                      <th className="px-6 py-3 font-semibold">Reason</th>
                      <th className="px-6 py-3 font-semibold">Status</th>
                      <th className="px-6 py-3 text-right font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {requests.map((req) => (
                      <tr key={req.id} className="hover:bg-gray-50/80 transition-colors">
                        <td className="px-6 py-4 font-semibold text-gray-900 flex items-center gap-1.5">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          {req.date}
                        </td>

                        <td className="px-6 py-4 font-medium text-gray-900">
                          {req.startTime} - {req.endTime}
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
                          {req.adminComment && (
                            <p className="text-xs text-emerald-600 italic mt-0.5">Admin: {req.adminComment}</p>
                          )}
                        </td>

                        <td className="px-6 py-4">{getStatusBadge(req.status)}</td>

                        <td className="px-6 py-4 text-right">
                          {(req.status === "PENDING" || req.status === "APPROVED_BY_MANAGER") ? (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600 border-red-200 hover:bg-red-50"
                              onClick={() => handleCancel(req.id)}
                            >
                              Cancel
                            </Button>
                          ) : (
                            <span className="text-xs text-gray-400 italic">No action</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-gray-200 pt-4">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <span className="text-xs font-medium text-gray-600">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
