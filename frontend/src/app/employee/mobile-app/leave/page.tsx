"use client";

import { useEffect, useState } from "react";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { MobileLayout } from "@/components/layout/mobile-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/api";
import { Calendar, Plus, Loader2, RefreshCw } from "lucide-react";

interface LeaveBalance {
  id: string;
  leaveType: { name: string; code: string };
  allocatedDays: number;
  usedDays: number;
  remainingDays: number;
}

interface LeaveRequest {
  id: string;
  leaveType: { name: string };
  startDate: string;
  endDate: string;
  daysRequested: number;
  status: string;
  reason?: string;
}

export default function MobileLeavePage() {
  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [isApplyOpen, setIsApplyOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    leaveTypeId: "",
    startDate: new Date().toISOString().slice(0, 10),
    endDate: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
    reason: "",
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [balRes, reqRes] = await Promise.all([
        apiRequest<LeaveBalance[]>("/leave/balances/my"),
        apiRequest<LeaveRequest[]>("/leave/my-requests"),
      ]);
      setBalances(balRes);
      setRequests(reqRes);
      if (balRes.length && !formData.leaveTypeId) {
        setFormData((prev) => ({ ...prev, leaveTypeId: balRes[0].leaveType.code }));
      }
    } catch (err) {
      console.error("Failed to load mobile leave data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleApplyLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.startDate || !formData.endDate) return;

    setSubmitting(true);
    try {
      await apiRequest("/leave/request", {
        method: "POST",
        body: JSON.stringify(formData),
      });
      setIsApplyOpen(false);
      fetchData();
    } catch (err) {
      console.error("Failed to submit leave request", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ProtectedRoute requiredRole="EMPLOYEE">
      <MobileLayout>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-1.5">
                <Calendar className="h-5 w-5 text-purple-600" /> Leave Portal
              </h2>
              <p className="text-xs text-gray-500">Track leave balances & apply for time off</p>
            </div>
            <Button onClick={() => setIsApplyOpen(true)} className="h-8 bg-purple-600 hover:bg-purple-700 text-white text-xs px-3">
              <Plus className="mr-1 h-3.5 w-3.5" /> Apply Leave
            </Button>
          </div>

          {/* Leave Balances Horizontal Scroll Cards */}
          <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-none">
            {balances.map((b) => (
              <div key={b.id} className="min-w-[130px] rounded-2xl bg-gradient-to-br from-purple-700 to-indigo-800 p-3 text-white shadow-sm flex-shrink-0">
                <p className="text-[10px] uppercase font-semibold text-purple-200">{b.leaveType.name}</p>
                <p className="text-xl font-bold mt-1">{b.remainingDays} days</p>
                <p className="text-[9px] text-purple-200 mt-0.5">Used: {b.usedDays} / {b.allocatedDays}</p>
              </div>
            ))}
          </div>

          {/* Leave Requests List */}
          <Card className="border-0 shadow-sm bg-white rounded-2xl">
            <CardHeader className="p-3.5 pb-2">
              <CardTitle className="text-xs font-bold text-gray-900">My Leave Requests</CardTitle>
            </CardHeader>
            <CardContent className="p-3.5 pt-0">
              {loading ? (
                <div className="flex h-32 items-center justify-center">
                  <Loader2 className="h-5 w-5 animate-spin text-purple-600" />
                </div>
              ) : requests.length ? (
                <div className="space-y-2.5">
                  {requests.map((r) => (
                    <div key={r.id} className="rounded-xl border p-2.5 text-xs space-y-1 bg-gray-50">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-gray-900">{r.leaveType.name}</span>
                        <Badge className={
                          r.status === "APPROVED" ? "bg-emerald-100 text-emerald-800" :
                          r.status === "REJECTED" ? "bg-red-100 text-red-800" : "bg-amber-100 text-amber-800"
                        }>
                          {r.status}
                        </Badge>
                      </div>
                      <p className="text-gray-500 text-[11px]">
                        {new Date(r.startDate).toLocaleDateString()} - {new Date(r.endDate).toLocaleDateString()} ({r.daysRequested} days)
                      </p>
                      {r.reason && <p className="text-[10px] text-gray-600 italic">"{r.reason}"</p>}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center py-6 text-xs text-gray-500">No leave requests submitted yet.</p>
              )}
            </CardContent>
          </Card>

          {/* Apply Leave Modal */}
          {isApplyOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <Card className="w-full max-w-sm bg-white shadow-xl rounded-2xl">
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-sm font-bold flex items-center gap-1.5">
                    <Calendar className="h-4 w-4 text-purple-600" /> Apply Time Off
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-2">
                  <form onSubmit={handleApplyLeave} className="space-y-3 text-xs">
                    <div>
                      <label className="block font-semibold text-gray-700 mb-1">Leave Type</label>
                      <select
                        className="w-full rounded-lg border p-2 text-xs"
                        value={formData.leaveTypeId}
                        onChange={(e) => setFormData({ ...formData, leaveTypeId: e.target.value })}
                      >
                        {balances.map((b) => (
                          <option key={b.id} value={b.leaveType.code}>
                            {b.leaveType.name} ({b.remainingDays} days left)
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block font-semibold text-gray-700 mb-1">Start Date</label>
                        <Input
                          type="date"
                          value={formData.startDate}
                          onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-gray-700 mb-1">End Date</label>
                        <Input
                          type="date"
                          value={formData.endDate}
                          onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-semibold text-gray-700 mb-1">Reason</label>
                      <textarea
                        className="w-full rounded-lg border p-2 text-xs"
                        rows={2}
                        placeholder="Reason for leave request..."
                        value={formData.reason}
                        onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                      />
                    </div>

                    <div className="flex justify-end gap-2 pt-2 border-t">
                      <Button variant="outline" type="button" size="sm" onClick={() => setIsApplyOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={submitting} size="sm" className="bg-purple-600 text-white">
                        {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Submit"}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </MobileLayout>
    </ProtectedRoute>
  );
}
