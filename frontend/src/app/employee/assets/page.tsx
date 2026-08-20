"use client";

import { useEffect, useState } from "react";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { apiRequest } from "@/lib/api";
import { Asset, AssetReturnRequest, AssetCondition } from "@/types/asset";
import {
  Laptop,
  Smartphone,
  CreditCard,
  Monitor,
  Loader2,
  RefreshCw,
  Calendar,
  ShieldCheck,
  RotateCcw,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
} from "lucide-react";

export default function EmployeeAssetsPage() {
  const [myAssets, setMyAssets] = useState<Asset[]>([]);
  const [returnRequests, setReturnRequests] = useState<AssetReturnRequest[]>([]);
  const [loading, setLoading] = useState(true);

  // Return Request Modal State
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [returnCondition, setReturnCondition] = useState<AssetCondition>("GOOD");
  const [employeeComment, setEmployeeComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [assetsData, requestsData] = await Promise.all([
        apiRequest<Asset[]>("/assets/my-assets"),
        apiRequest<AssetReturnRequest[]>("/assets/return-requests/my"),
      ]);
      setMyAssets(Array.isArray(assetsData) ? assetsData : []);
      setReturnRequests(Array.isArray(requestsData) ? requestsData : []);
    } catch (err) {
      console.error("Failed to load employee assigned assets or return requests", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenReturnModal = (asset: Asset) => {
    setSelectedAsset(asset);
    setReturnCondition(asset.condition || "GOOD");
    setEmployeeComment("");
  };

  const handleSubmitReturnRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAsset) return;

    // Find active assignment
    const activeAssignment = selectedAsset.assignments?.find(
      (a) => a.status === "ACTIVE" || a.status === "RETURN_PENDING"
    );

    if (!activeAssignment) {
      alert("No active assignment record found for this asset.");
      return;
    }

    setSubmitting(true);
    try {
      await apiRequest("/assets/return-requests", {
        method: "POST",
        body: JSON.stringify({
          assignmentId: activeAssignment.id,
          returnCondition,
          employeeComment,
        }),
      });
      setSelectedAsset(null);
      setEmployeeComment("");
      fetchData();
    } catch (err: any) {
      console.error("Failed to submit return request", err);
      alert(err.message || "Failed to submit return request.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ProtectedRoute requiredRole="EMPLOYEE">
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Laptop className="h-6 w-6 text-blue-600" />
                My Assigned Corporate Assets
              </h1>
              <p className="text-sm text-gray-500">
                View company laptops, mobile phones, ID badges, and monitors issued to you. Request asset returns when offboarding or replacing hardware.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
                <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </div>
          </div>

          {/* Asset List Grid */}
          {loading ? (
            <div className="flex h-48 items-center justify-center rounded-xl bg-white shadow-sm">
              <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
            </div>
          ) : myAssets.length ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {myAssets.map((asset) => {
                const activeAssignment = asset.assignments?.find(
                  (a) => a.status === "ACTIVE" || a.status === "RETURN_PENDING"
                );
                const isPendingReturn = activeAssignment?.status === "RETURN_PENDING";

                return (
                  <Card key={asset.id} className="hover:shadow-md transition-shadow flex flex-col justify-between">
                    <CardHeader className="pb-3 flex flex-row items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-blue-50 p-3 text-blue-600">
                          {asset.category?.name.toLowerCase().includes("laptop") ? (
                            <Laptop className="h-6 w-6" />
                          ) : asset.category?.name.toLowerCase().includes("phone") ? (
                            <Smartphone className="h-6 w-6" />
                          ) : asset.category?.name.toLowerCase().includes("id") ? (
                            <CreditCard className="h-6 w-6" />
                          ) : (
                            <Monitor className="h-6 w-6" />
                          )}
                        </div>
                        <div>
                          <CardTitle className="text-base">{asset.name}</CardTitle>
                          <CardDescription className="text-xs font-mono text-gray-500">
                            {asset.assetTag}
                          </CardDescription>
                        </div>
                      </div>

                      <Badge className={isPendingReturn ? "bg-amber-100 text-amber-800 border border-amber-300" : "bg-emerald-100 text-emerald-800"}>
                        {isPendingReturn ? "Return Pending" : asset.condition}
                      </Badge>
                    </CardHeader>

                    <CardContent className="space-y-3 flex-1 flex flex-col justify-between">
                      <div className="space-y-2">
                        <div className="rounded-lg bg-gray-50 p-3 space-y-1 text-xs">
                          <div className="flex justify-between">
                            <span className="text-gray-500">Category:</span>
                            <span className="font-semibold text-gray-900">{asset.category?.name}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Brand / Model:</span>
                            <span className="font-semibold text-gray-900">
                              {asset.brand || "N/A"} {asset.model ? `(${asset.model})` : ""}
                            </span>
                          </div>
                          {asset.serialNumber && (
                            <div className="flex justify-between font-mono">
                              <span className="text-gray-500">Serial No:</span>
                              <span className="font-semibold text-gray-900">{asset.serialNumber}</span>
                            </div>
                          )}
                        </div>

                        {/* Status Notice Banner */}
                        {isPendingReturn ? (
                          <div className="rounded-md bg-amber-50 p-2.5 text-xs text-amber-800 border border-amber-200 font-medium flex items-center gap-2">
                            <Clock className="h-4 w-4 shrink-0 text-amber-600" />
                            <span>Return Pending — Waiting for Admin Verification</span>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5 text-gray-400" />
                              Issued: {asset.assignedDate ? new Date(asset.assignedDate).toLocaleDateString() : "Assigned"}
                            </span>
                            <span className="flex items-center gap-1 text-emerald-600 font-medium">
                              <ShieldCheck className="h-3.5 w-3.5" />
                              Active Asset
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Request Return Action Button */}
                      <div className="pt-3 border-t flex justify-end">
                        <Button
                          variant={isPendingReturn ? "outline" : "default"}
                          size="sm"
                          disabled={isPendingReturn}
                          onClick={() => handleOpenReturnModal(asset)}
                          className={isPendingReturn ? "text-amber-700 bg-amber-50 border-amber-200 text-xs" : "bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold"}
                          title={isPendingReturn ? "A return request for this asset is already pending admin verification." : "Request to return this asset"}
                        >
                          <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                          {isPendingReturn ? "Return Pending" : "Request Return"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center text-sm text-gray-500">
                You do not have any assigned corporate assets registered at this time.
              </CardContent>
            </Card>
          )}

          {/* Asset Return Requests History Section */}
          <Card>
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-base flex items-center gap-2">
                <RotateCcw className="h-5 w-5 text-blue-600" />
                Asset Return Requests & Verification History
              </CardTitle>
              <CardDescription>Track status and admin notes for your corporate asset return submissions</CardDescription>
            </CardHeader>
            <CardContent className="p-4">
              {returnRequests.length ? (
                <div className="space-y-3">
                  {returnRequests.map((req) => (
                    <div key={req.id} className="rounded-xl border p-4 bg-slate-50 text-xs space-y-2">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-2">
                        <div>
                          <span className="font-bold text-sm text-slate-900">{req.asset?.name || "Asset Item"}</span>
                          <span className="ml-2 font-mono text-slate-500">({req.asset?.assetTag})</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-slate-500 text-[11px]">Requested: {new Date(req.requestedAt).toLocaleString()}</span>
                          <Badge className={
                            req.status === "APPROVED" ? "bg-emerald-100 text-emerald-800" :
                            req.status === "REJECTED" ? "bg-rose-100 text-rose-800" :
                            "bg-amber-100 text-amber-800 border border-amber-300"
                          }>
                            {req.status === "PENDING" ? "PENDING VERIFICATION" : req.status}
                          </Badge>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-700">
                        <div>
                          <span className="font-semibold text-slate-600">Stated Return Condition:</span> {req.returnCondition}
                        </div>
                        {req.employeeComment && (
                          <div>
                            <span className="font-semibold text-slate-600">Your Reason/Comment:</span> {req.employeeComment}
                          </div>
                        )}
                      </div>

                      {/* Rejected Notice Box */}
                      {req.status === "REJECTED" && (
                        <div className="rounded-lg bg-rose-50 border border-rose-200 p-3 text-rose-900 space-y-1">
                          <div className="flex items-center gap-1.5 font-bold text-xs">
                            <XCircle className="h-4 w-4 text-rose-600" />
                            <span>Return Rejected</span>
                          </div>
                          <p className="text-xs">
                            <strong>Admin Reason:</strong> {req.rejectedReason || "No reason specified."}
                          </p>
                          {req.adminComment && (
                            <p className="text-[11px] text-rose-700">
                              <strong>Admin Comment:</strong> {req.adminComment}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Approved Notice Box */}
                      {req.status === "APPROVED" && (
                        <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-2.5 text-emerald-900 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                            <span className="font-semibold">Asset return physically verified and approved by Admin ({req.approvedBy?.name || "Asset Officer"}).</span>
                          </div>
                          {req.approvedAt && (
                            <span className="text-[11px] text-emerald-700">Returned Date: {new Date(req.approvedAt).toLocaleDateString()}</span>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-xs text-gray-500 py-6">No return requests submitted yet.</p>
              )}
            </CardContent>
          </Card>

          {/* Request Asset Return Modal */}
          {selectedAsset && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <Card className="w-full max-w-md bg-white shadow-xl">
                <CardHeader className="border-b pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <RotateCcw className="h-5 w-5 text-blue-600" />
                        Request Asset Return
                      </CardTitle>
                      <CardDescription>Submit return request for physical admin verification</CardDescription>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setSelectedAsset(null)}>✕</Button>
                  </div>
                </CardHeader>
                <CardContent className="p-5">
                  <form onSubmit={handleSubmitReturnRequest} className="space-y-4">
                    <div className="rounded-lg bg-slate-50 p-3 space-y-1 text-xs border">
                      <p className="font-bold text-slate-900 text-sm">{selectedAsset.name}</p>
                      <div className="flex justify-between text-slate-600">
                        <span>Asset Code: <strong className="font-mono text-slate-800">{selectedAsset.assetTag}</strong></span>
                        <span>Serial No: <strong className="font-mono text-slate-800">{selectedAsset.serialNumber || "N/A"}</strong></span>
                      </div>
                      <p className="text-slate-600">Current Issued Condition: <strong>{selectedAsset.condition}</strong></p>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Return Condition *</label>
                      <select
                        className="w-full rounded-md border border-gray-300 p-2 text-sm"
                        value={returnCondition}
                        onChange={(e) => setReturnCondition(e.target.value as AssetCondition)}
                        required
                      >
                        <option value="EXCELLENT">Excellent</option>
                        <option value="GOOD">Good</option>
                        <option value="FAIR">Fair</option>
                        <option value="DAMAGED">Damaged</option>
                        <option value="LOST">Lost</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Employee Comment / Reason *</label>
                      <textarea
                        className="w-full rounded-md border border-gray-300 p-2.5 text-sm"
                        rows={3}
                        placeholder="e.g. I am leaving the company and I am returning this laptop."
                        value={employeeComment}
                        onChange={(e) => setEmployeeComment(e.target.value)}
                        required
                      />
                    </div>

                    <div className="rounded-md bg-blue-50 p-3 text-xs text-blue-800 border border-blue-200">
                      <strong>Important Notice:</strong> Please physically bring the asset to the Admin/Asset Officer for physical verification. Your assignment will remain pending until Admin approval.
                    </div>

                    <div className="flex justify-end gap-2 pt-3 border-t">
                      <Button variant="outline" type="button" onClick={() => setSelectedAsset(null)} disabled={submitting}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={submitting} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold">
                        {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit Return Request"}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
