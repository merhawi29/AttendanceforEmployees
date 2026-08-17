"use client";

import { useEffect, useState } from "react";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/api";
import { Asset, AssetCategory, AssetStatus, AssetCondition } from "@/types/asset";
import {
  Laptop,
  Plus,
  Search,
  Loader2,
  RefreshCw,
  Trash2,
  UserCheck,
  RotateCcw,
  CheckCircle2,
} from "lucide-react";

interface EmployeeSimple {
  id: string;
  name: string;
  employeeId: string;
  department?: string | null;
}

export default function AdminAssetsInventoryPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [categories, setCategories] = useState<AssetCategory[]>([]);
  const [employees, setEmployees] = useState<EmployeeSimple[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");

  // Modals State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [assignAssetItem, setAssignAssetItem] = useState<Asset | null>(null);
  const [returnAssetItem, setReturnAssetItem] = useState<Asset | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Create Form State
  const [formData, setFormData] = useState({
    assetTag: `AST-EQP-${Math.floor(100 + Math.random() * 900)}`,
    name: "",
    categoryId: "",
    brand: "",
    model: "",
    serialNumber: "",
    purchaseDate: new Date().toISOString().slice(0, 10),
    purchaseCost: 25000,
    condition: "EXCELLENT" as AssetCondition,
    notes: "",
  });

  // Assign Form State
  const [assignData, setAssignData] = useState({
    employeeId: "",
    conditionOnAssign: "EXCELLENT" as AssetCondition,
    notes: "",
  });

  // Return Form State
  const [returnData, setReturnData] = useState({
    conditionOnReturn: "GOOD" as AssetCondition,
    targetStatus: "AVAILABLE" as AssetStatus,
    notes: "",
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [assetRes, catRes, empRes] = await Promise.all([
        apiRequest<Asset[]>("/assets"),
        apiRequest<AssetCategory[]>("/assets/categories"),
        apiRequest<any>("/employees"),
      ]);
      setAssets(Array.isArray(assetRes) ? assetRes : []);
      setCategories(Array.isArray(catRes) ? catRes : []);
      setEmployees(Array.isArray(empRes) ? empRes : empRes?.employees || []);
      if (catRes.length && !formData.categoryId) {
        setFormData((prev) => ({ ...prev, categoryId: catRes[0].id }));
      }
    } catch (err) {
      console.error("Failed to load inventory data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.assetTag || !formData.name || !formData.categoryId) return;

    setSubmitting(true);
    try {
      await apiRequest<Asset>("/assets", {
        method: "POST",
        body: JSON.stringify(formData),
      });
      setIsCreateOpen(false);
      setFormData({
        assetTag: `AST-EQP-${Math.floor(100 + Math.random() * 900)}`,
        name: "",
        categoryId: categories[0]?.id || "",
        brand: "",
        model: "",
        serialNumber: "",
        purchaseDate: new Date().toISOString().slice(0, 10),
        purchaseCost: 25000,
        condition: "EXCELLENT",
        notes: "",
      });
      fetchData();
    } catch (err) {
      console.error("Failed to register asset", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAssignAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignAssetItem || !assignData.employeeId) return;

    setSubmitting(true);
    try {
      await apiRequest("/assets/assign", {
        method: "POST",
        body: JSON.stringify({
          assetId: assignAssetItem.id,
          employeeId: assignData.employeeId,
          conditionOnAssign: assignData.conditionOnAssign,
          notes: assignData.notes,
        }),
      });
      setAssignAssetItem(null);
      fetchData();
    } catch (err) {
      console.error("Failed to assign asset", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReturnAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!returnAssetItem) return;

    setSubmitting(true);
    try {
      await apiRequest(`/assets/${returnAssetItem.id}/return`, {
        method: "POST",
        body: JSON.stringify(returnData),
      });
      setReturnAssetItem(null);
      fetchData();
    } catch (err) {
      console.error("Failed to return asset", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteAsset = async (id: string) => {
    if (!confirm("Are you sure you want to delete this asset from inventory?")) return;
    try {
      await apiRequest(`/assets/${id}`, { method: "DELETE" });
      fetchData();
    } catch (err) {
      console.error("Failed to delete asset", err);
    }
  };

  const filteredAssets = assets.filter((a) => {
    const matchesSearch =
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.assetTag.toLowerCase().includes(search.toLowerCase()) ||
      (a.serialNumber && a.serialNumber.toLowerCase().includes(search.toLowerCase())) ||
      (a.assignedTo && a.assignedTo.name.toLowerCase().includes(search.toLowerCase()));
    const matchesCategory = selectedCategory === "ALL" || a.categoryId === selectedCategory;
    const matchesStatus = selectedStatus === "ALL" || a.status === selectedStatus;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  return (
    <ProtectedRoute requiredRole="ADMIN">
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Laptop className="h-6 w-6 text-blue-600" />
                Asset Inventory & Assignments
              </h1>
              <p className="text-sm text-gray-500">
                Register corporate laptops, phones, ID cards, monitors, and manage employee issuance.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
                <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
              <Button onClick={() => setIsCreateOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white">
                <Plus className="mr-2 h-4 w-4" />
                New Asset Item
              </Button>
            </div>
          </div>

          {/* Filters & Search */}
          <Card>
            <CardContent className="p-4 flex flex-col sm:flex-row gap-4 justify-between items-center">
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search asset tag, name, serial..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>

              <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                <select
                  className="rounded-md border border-gray-300 p-2 text-xs"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  <option value="ALL">All Categories</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>

                <select
                  className="rounded-md border border-gray-300 p-2 text-xs"
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                >
                  <option value="ALL">All Statuses</option>
                  <option value="AVAILABLE">Available</option>
                  <option value="ASSIGNED">Assigned</option>
                  <option value="UNDER_MAINTENANCE">Under Maintenance</option>
                  <option value="LOST">Lost / Damaged</option>
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Inventory Table */}
          <Card>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex h-48 items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                </div>
              ) : filteredAssets.length ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 border-b text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      <tr>
                        <th className="px-6 py-3">Asset Tag & Name</th>
                        <th className="px-6 py-3">Category</th>
                        <th className="px-6 py-3">Brand / Model</th>
                        <th className="px-6 py-3">Serial Number</th>
                        <th className="px-6 py-3">Status</th>
                        <th className="px-6 py-3">Assigned To</th>
                        <th className="px-6 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredAssets.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div>
                              <p className="font-semibold text-gray-900">{item.name}</p>
                              <p className="text-xs text-gray-500 font-mono">{item.assetTag}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-gray-700">{item.category?.name}</td>
                          <td className="px-6 py-4 text-xs text-gray-600">
                            {item.brand || "N/A"} {item.model ? `(${item.model})` : ""}
                          </td>
                          <td className="px-6 py-4 text-xs font-mono text-gray-600">
                            {item.serialNumber || "-"}
                          </td>
                          <td className="px-6 py-4">
                            <Badge
                              className={
                                item.status === "ASSIGNED"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : item.status === "AVAILABLE"
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-amber-100 text-amber-800"
                              }
                            >
                              {item.status.replace("_", " ")}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 text-xs">
                            {item.assignedTo ? (
                              <div>
                                <p className="font-semibold text-gray-900">{item.assignedTo.name}</p>
                                <p className="text-gray-500">{item.assignedTo.employeeId}</p>
                              </div>
                            ) : (
                              <span className="text-gray-400 italic">Unassigned</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-2">
                              {item.status === "ASSIGNED" ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setReturnAssetItem(item)}
                                  className="h-8 text-xs text-amber-700 hover:bg-amber-50"
                                >
                                  <RotateCcw className="mr-1 h-3.5 w-3.5" /> Return
                                </Button>
                              ) : (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setAssignAssetItem(item)}
                                  className="h-8 text-xs text-emerald-700 hover:bg-emerald-50"
                                >
                                  <UserCheck className="mr-1 h-3.5 w-3.5" /> Assign
                                </Button>
                              )}

                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteAsset(item.id)}
                                className="h-8 w-8 p-0 text-red-600 hover:text-red-800"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-12 text-center text-sm text-gray-500">
                  No asset items match the selected filter.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Register Asset Modal */}
          {isCreateOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <Card className="w-full max-w-xl bg-white shadow-xl max-h-[90vh] overflow-y-auto">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Laptop className="h-5 w-5 text-blue-600" />
                    Register New Asset Item
                  </CardTitle>
                  <CardDescription>Add a new company laptop, phone, ID card, or monitor</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleCreateAsset} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Asset Tag *</label>
                        <Input
                          value={formData.assetTag}
                          onChange={(e) => setFormData({ ...formData, assetTag: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Category *</label>
                        <select
                          className="w-full rounded-md border border-gray-300 p-2 text-sm"
                          value={formData.categoryId}
                          onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                          required
                        >
                          {categories.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Asset Item Name *</label>
                      <Input
                        placeholder="e.g. MacBook Pro 16 M2 Max"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Brand</label>
                        <Input
                          placeholder="e.g. Apple / Dell"
                          value={formData.brand}
                          onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Model</label>
                        <Input
                          placeholder="e.g. Latitude 5430"
                          value={formData.model}
                          onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Serial Number</label>
                        <Input
                          placeholder="e.g. SN-891042"
                          value={formData.serialNumber}
                          onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Purchase Date</label>
                        <Input
                          type="date"
                          value={formData.purchaseDate}
                          onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Purchase Cost (ETB)</label>
                        <Input
                          type="number"
                          value={formData.purchaseCost}
                          onChange={(e) => setFormData({ ...formData, purchaseCost: Number(e.target.value) })}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Initial Condition</label>
                      <select
                        className="w-full rounded-md border border-gray-300 p-2 text-sm"
                        value={formData.condition}
                        onChange={(e) => setFormData({ ...formData, condition: e.target.value as AssetCondition })}
                      >
                        <option value="NEW">New</option>
                        <option value="EXCELLENT">Excellent</option>
                        <option value="GOOD">Good</option>
                        <option value="FAIR">Fair</option>
                      </select>
                    </div>

                    <div className="flex justify-end gap-2 pt-4 border-t">
                      <Button variant="outline" type="button" onClick={() => setIsCreateOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={submitting} className="bg-blue-600 text-white">
                        {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Asset"}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Assign Asset Modal */}
          {assignAssetItem && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <Card className="w-full max-w-md bg-white shadow-xl">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <UserCheck className="h-5 w-5 text-emerald-600" />
                    Assign Asset to Employee
                  </CardTitle>
                  <CardDescription>
                    Issuing: {assignAssetItem.name} ({assignAssetItem.assetTag})
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleAssignAsset} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Select Employee *</label>
                      <select
                        className="w-full rounded-md border border-gray-300 p-2 text-sm"
                        value={assignData.employeeId}
                        onChange={(e) => setAssignData({ ...assignData, employeeId: e.target.value })}
                        required
                      >
                        <option value="">-- Choose Employee --</option>
                        {Array.isArray(employees) && employees.map((emp) => (
                          <option key={emp.id} value={emp.id}>
                            {emp.name} ({emp.employeeId}) - {emp.department || "General"}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Condition on Issuance</label>
                      <select
                        className="w-full rounded-md border border-gray-300 p-2 text-sm"
                        value={assignData.conditionOnAssign}
                        onChange={(e) => setAssignData({ ...assignData, conditionOnAssign: e.target.value as AssetCondition })}
                      >
                        <option value="NEW">New</option>
                        <option value="EXCELLENT">Excellent</option>
                        <option value="GOOD">Good</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Assignment Notes</label>
                      <Input
                        placeholder="e.g. Issued during onboarding, accessories included"
                        value={assignData.notes}
                        onChange={(e) => setAssignData({ ...assignData, notes: e.target.value })}
                      />
                    </div>

                    <div className="flex justify-end gap-2 pt-4 border-t">
                      <Button variant="outline" type="button" onClick={() => setAssignAssetItem(null)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={submitting} className="bg-emerald-600 text-white">
                        {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm Assignment"}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Return Asset Modal */}
          {returnAssetItem && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <Card className="w-full max-w-md bg-white shadow-xl">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <RotateCcw className="h-5 w-5 text-amber-600" />
                    Return Asset to Inventory
                  </CardTitle>
                  <CardDescription>
                    Returning: {returnAssetItem.name} (Assigned to {returnAssetItem.assignedTo?.name})
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleReturnAsset} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Condition on Return</label>
                      <select
                        className="w-full rounded-md border border-gray-300 p-2 text-sm"
                        value={returnData.conditionOnReturn}
                        onChange={(e) => setReturnData({ ...returnData, conditionOnReturn: e.target.value as AssetCondition })}
                      >
                        <option value="EXCELLENT">Excellent</option>
                        <option value="GOOD">Good</option>
                        <option value="FAIR">Fair</option>
                        <option value="DAMAGED">Damaged / Needs Repair</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Target Inventory Status</label>
                      <select
                        className="w-full rounded-md border border-gray-300 p-2 text-sm"
                        value={returnData.targetStatus}
                        onChange={(e) => setReturnData({ ...returnData, targetStatus: e.target.value as AssetStatus })}
                      >
                        <option value="AVAILABLE">Available for redeployment</option>
                        <option value="UNDER_MAINTENANCE">Under Repair / Maintenance</option>
                        <option value="LOST">Lost / Damaged Write-off</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Return Notes</label>
                      <Input
                        placeholder="e.g. Returned upon resignation, charger included"
                        value={returnData.notes}
                        onChange={(e) => setReturnData({ ...returnData, notes: e.target.value })}
                      />
                    </div>

                    <div className="flex justify-end gap-2 pt-4 border-t">
                      <Button variant="outline" type="button" onClick={() => setReturnAssetItem(null)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={submitting} className="bg-amber-600 text-white">
                        {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Process Return"}
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
