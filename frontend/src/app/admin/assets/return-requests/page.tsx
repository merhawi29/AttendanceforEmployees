"use client";

import { useEffect, useState } from "react";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { apiRequest } from "@/lib/api";
import { AssetReturnRequest, AssetCondition, AssetReturnRequestStatus } from "@/types/asset";
import {
  RotateCcw,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  RefreshCw,
  Search,
  Laptop,
  UserCheck,
  AlertTriangle,
  FileText,
} from "lucide-react";

export default function AdminAssetReturnRequestsPage() {
  const [requests, setRequests] = useState<AssetReturnRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("PENDING");

  // Review Modal State
  const [reviewRequest, setReviewRequest] = useState<AssetReturnRequest | null>(null);
  const [verifiedCondition, setVerifiedCondition] = useState<AssetCondition>("GOOD");
  const [adminComment, setAdminComment] = useState("");
  const [rejectedReason, setRejectedReason] = useState("");
  const [processing, setProcessing] = useState(false);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const data = await apiRequest<AssetReturnRequest[]>("/assets/return-requests");
      setRequests(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load return requests", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleOpenReviewModal = (req: AssetReturnRequest) => {
    setReviewRequest(req);
    setVerifiedCondition(req.returnCondition || "GOOD");
    setAdminComment("");
    setRejectedReason("");
  };

  const handleApprove = async () => {
    if (!reviewRequest) return;
    setProcessing(true);
    try {
      await apiRequest(`/assets/return-requests/${reviewRequest.id}/approve`, {
        method: "POST",
        body: JSON.stringify({
          verifiedCondition,
          adminComment,
        }),
      });
      setReviewRequest(null);
      fetchRequests();
    } catch (err: any) {
      console.error("Failed to approve return request", err);
      alert(err.message || "Failed to approve return request.");
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!reviewRequest) return;
    if (!rejectedReason || !rejectedReason.trim()) {
      alert("Rejection reason is mandatory when rejecting a return request.");
      return;
    }

    setProcessing(true);
    try {
      await apiRequest(`/assets/return-requests/${reviewRequest.id}/reject`, {
        method: "POST",
        body: JSON.stringify({
          rejectedReason: rejectedReason.trim(),
          adminComment,
        }),
      });
      setReviewRequest(null);
      fetchRequests();
    } catch (err: any) {
      console.error("Failed to reject return request", err);
      alert(err.message || "Failed to reject return request.");
    } finally {
      setProcessing(false);
    }
  };

  const pendingCount = requests.filter((r) => r.status === "PENDING").length;

  const filteredRequests = requests.filter((r) => {
    const matchesSearch =
      (r.asset?.name && r.asset.name.toLowerCase().includes(search.toLowerCase())) ||
      (r.asset?.assetTag && r.asset.assetTag.toLowerCase().includes(search.toLowerCase())) ||
      (r.requestedBy?.name && r.requestedBy.name.toLowerCase().includes(search.toLowerCase())) ||
      (r.requestedBy?.employeeId && r.requestedBy.employeeId.toLowerCase().includes(search.toLowerCase()));
    const matchesStatus = selectedStatus === "ALL" || r.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <ProtectedRoute requiredRole="ADMIN">
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <RotateCcw className="h-6 w-6 text-blue-600" />
                Asset Return Requests & Physical Verification
              </h1>
              <p className="text-sm text-gray-500">
                Inspect returned hardware/assets physically and process employee return approvals or rejections.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={fetchRequests} disabled={loading}>
                <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </div>
          </div>

          {/* Pending Banner */}
          {pendingCount > 0 && (
            <div className="flex items-center justify-between gap-4 rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-900 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-amber-500/20 p-2 text-amber-700">
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold">Pending Return Verification Required</h3>
                  <p className="text-xs text-amber-800">
                    There {pendingCount === 1 ? "is 1 asset return request" : `are ${pendingCount} asset return requests`} awaiting physical inspection and admin review.
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                onClick={() => setSelectedStatus("PENDING")}
                className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shrink-0"
              >
                View Pending ({pendingCount})
              </Button>
            </div>
          )}

          {/* Filters & Search */}
          <Card>
            <CardContent className="p-4 flex flex-col sm:flex-row gap-4 justify-between items-center">
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search employee, asset code..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>

              <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                {["PENDING", "APPROVED", "REJECTED", "ALL"].map((st) => (
                  <Button
                    key={st}
                    variant={selectedStatus === st ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedStatus(st)}
                    className="text-xs relative"
                  >
                    {st === "PENDING" ? "Pending Verification" : st}
                    {st === "PENDING" && pendingCount > 0 && (
                      <span className="ml-1.5 rounded-full bg-amber-500 text-white text-[10px] px-1.5 py-0.2 font-bold">
                        {pendingCount}
                      </span>
                    )}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Requests Table */}
          <Card>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex h-48 items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                </div>
              ) : filteredRequests.length ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 border-b text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      <tr>
                        <th className="px-6 py-3">Employee Details</th>
                        <th className="px-6 py-3">Asset Item & Tag</th>
                        <th className="px-6 py-3">Serial No</th>
                        <th className="px-6 py-3">Stated Condition</th>
                        <th className="px-6 py-3">Requested Date</th>
                        <th className="px-6 py-3">Status</th>
                        <th className="px-6 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredRequests.map((req) => (
                        <tr key={req.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div>
                              <p className="font-semibold text-gray-900">{req.requestedBy?.name || "Employee"}</p>
                              <p className="text-xs text-gray-500 font-mono">{req.requestedBy?.employeeId} · {req.requestedBy?.department || "General"}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div>
                              <p className="font-semibold text-gray-900">{req.asset?.name}</p>
                              <p className="text-xs text-gray-500 font-mono">{req.asset?.assetTag} ({req.asset?.category?.name})</p>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-xs font-mono text-gray-600">
                            {req.asset?.serialNumber || "-"}
                          </td>
                          <td className="px-6 py-4">
                            <Badge className="bg-slate-100 text-slate-800">
                              {req.returnCondition}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 text-xs text-gray-600">
                            {new Date(req.requestedAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4">
                            <Badge
                              className={
                                req.status === "APPROVED"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : req.status === "REJECTED"
                                  ? "bg-rose-100 text-rose-800"
                                  : "bg-amber-100 text-amber-800 border border-amber-300"
                              }
                            >
                              {req.status === "PENDING" ? "PENDING" : req.status}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 text-right">
                            {req.status === "PENDING" ? (
                              <Button
                                size="sm"
                                onClick={() => handleOpenReviewModal(req)}
                                className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold"
                              >
                                Review Request
                              </Button>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleOpenReviewModal(req)}
                                className="text-xs text-slate-600"
                              >
                                View Details
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-12 text-center text-sm text-gray-500">
                  No return requests match the selected filter.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Admin Physical Verification Modal */}
          {reviewRequest && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <Card className="w-full max-w-xl bg-white shadow-xl max-h-[90vh] overflow-y-auto">
                <CardHeader className="border-b pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <RotateCcw className="h-5 w-5 text-amber-600" />
                        Admin Physical Asset Verification
                      </CardTitle>
                      <CardDescription>Physically inspect asset and approve or reject return</CardDescription>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setReviewRequest(null)}>✕</Button>
                  </div>
                </CardHeader>
                <CardContent className="p-5 space-y-4">
                  {/* Employee & Asset Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="rounded-lg bg-slate-50 p-3 border space-y-1">
                      <p className="font-bold text-slate-700 uppercase border-b pb-1">Employee Details</p>
                      <p className="font-semibold text-slate-900 text-sm">{reviewRequest.requestedBy?.name}</p>
                      <p className="text-slate-600">ID: <strong className="font-mono">{reviewRequest.requestedBy?.employeeId}</strong></p>
                      <p className="text-slate-600">Department: {reviewRequest.requestedBy?.department || "General"}</p>
                      {reviewRequest.requestedBy?.position?.title && (
                        <p className="text-slate-600">Position: {reviewRequest.requestedBy.position.title}</p>
                      )}
                    </div>

                    <div className="rounded-lg bg-slate-50 p-3 border space-y-1">
                      <p className="font-bold text-slate-700 uppercase border-b pb-1">Asset Details</p>
                      <p className="font-semibold text-slate-900 text-sm">{reviewRequest.asset?.name}</p>
                      <p className="text-slate-600">Asset Tag: <strong className="font-mono">{reviewRequest.asset?.assetTag}</strong></p>
                      <p className="text-slate-600">Category: {reviewRequest.asset?.category?.name}</p>
                      {reviewRequest.asset?.serialNumber && (
                        <p className="text-slate-600">Serial No: <strong className="font-mono">{reviewRequest.asset.serialNumber}</strong></p>
                      )}
                    </div>
                  </div>

                  {/* Employee Submission Info */}
                  <div className="rounded-lg bg-amber-50/70 border border-amber-200 p-3 text-xs space-y-1">
                    <p className="font-bold text-amber-900 uppercase">Employee Stated Return Details</p>
                    <div className="flex justify-between text-amber-800">
                      <span>Requested Date: {new Date(reviewRequest.requestedAt).toLocaleString()}</span>
                      <span>Stated Condition: <strong>{reviewRequest.returnCondition}</strong></span>
                    </div>
                    {reviewRequest.employeeComment && (
                      <p className="text-amber-900 pt-1 font-sans bg-white p-2 rounded border border-amber-200">
                        <strong>Comment:</strong> {reviewRequest.employeeComment}
                      </p>
                    )}
                  </div>

                  {/* Review / Processed Information (If already processed) */}
                  {reviewRequest.status !== "PENDING" && (
                    <div className="rounded-lg bg-slate-100 p-3 text-xs space-y-1">
                      <p className="font-bold text-slate-800 uppercase">Processing Status: {reviewRequest.status}</p>
                      {reviewRequest.status === "APPROVED" && (
                        <p className="text-emerald-800">Approved by <strong>{reviewRequest.approvedBy?.name}</strong> on {new Date(reviewRequest.approvedAt!).toLocaleString()}</p>
                      )}
                      {reviewRequest.status === "REJECTED" && (
                        <div className="text-rose-800 space-y-1">
                          <p>Rejected by <strong>{reviewRequest.rejectedBy?.name}</strong> on {new Date(reviewRequest.rejectedAt!).toLocaleString()}</p>
                          <p className="bg-rose-50 p-2 rounded border border-rose-200"><strong>Reason:</strong> {reviewRequest.rejectedReason}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Admin Verification Form (Only for PENDING requests) */}
                  {reviewRequest.status === "PENDING" && (
                    <div className="space-y-4 pt-2 border-t">
                      <h4 className="text-xs font-bold text-slate-800 uppercase">Admin Physical Inspection & Actions</h4>

                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Physically Verified Condition *</label>
                        <select
                          className="w-full rounded-md border border-gray-300 p-2 text-sm"
                          value={verifiedCondition}
                          onChange={(e) => setVerifiedCondition(e.target.value as AssetCondition)}
                        >
                          <option value="EXCELLENT">Excellent</option>
                          <option value="GOOD">Good</option>
                          <option value="FAIR">Fair</option>
                          <option value="DAMAGED">Damaged / Needs Maintenance</option>
                          <option value="LOST">Lost</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          Rejection Reason (Required if clicking "Reject Return")
                        </label>
                        <textarea
                          className="w-full rounded-md border border-gray-300 p-2.5 text-sm"
                          rows={2}
                          placeholder="e.g. Laptop charger is missing. Please return the charger and resubmit."
                          value={rejectedReason}
                          onChange={(e) => setRejectedReason(e.target.value)}
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          Admin Inspection Notes / Accessories Checklist (Optional)
                        </label>
                        <Input
                          placeholder="e.g. Inspected serial no SN-891042, charger and cable received in good order."
                          value={adminComment}
                          onChange={(e) => setAdminComment(e.target.value)}
                        />
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-3 border-t">
                        <Button variant="outline" type="button" onClick={() => setReviewRequest(null)} disabled={processing}>
                          Cancel
                        </Button>
                        <Button
                          type="button"
                          disabled={processing}
                          onClick={handleReject}
                          className="bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs"
                        >
                          {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : "Reject Return"}
                        </Button>
                        <Button
                          type="button"
                          disabled={processing}
                          onClick={handleApprove}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs"
                        >
                          {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : "Approve Return"}
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
