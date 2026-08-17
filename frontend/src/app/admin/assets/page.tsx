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
import { AssetAnalytics, Asset } from "@/types/asset";
import {
  Laptop,
  Smartphone,
  CreditCard,
  Monitor,
  CheckCircle2,
  AlertTriangle,
  FileText,
  FileSpreadsheet,
  Printer,
  Loader2,
  RefreshCw,
  ArrowRight,
  Boxes,
  ShieldAlert,
} from "lucide-react";

export default function AdminAssetsPage() {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<AssetAnalytics | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [analyticsData, assetsData] = await Promise.all([
        apiRequest<AssetAnalytics>("/assets/analytics/dashboard"),
        apiRequest<Asset[]>("/assets"),
      ]);
      setAnalytics(analyticsData);
      setAssets(assetsData);
    } catch (err) {
      console.error("Failed to load asset analytics", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleExport = (type: "pdf" | "excel" | "print") => {
    if (!analytics || !assets) return;

    const rows = assets.map((a) => ({
      employeeId: a.assetTag,
      name: a.name,
      department: a.category?.name || "General",
      date: a.assignedDate ? new Date(a.assignedDate).toLocaleDateString() : "-",
      morningIn: a.brand || "-",
      lunchOut: a.model || "-",
      lunchReturn: a.serialNumber || "-",
      finalOut: a.assignedTo?.name || "Unassigned",
      status: a.status,
      workedHours: a.purchaseCost ? `${Number(a.purchaseCost).toLocaleString()} ETB` : "-",
    }));

    const exportOpts = {
      reportTitle: "Corporate Asset Inventory Report",
      dateRangeLabel: `As of ${new Date().toLocaleDateString()}`,
      generatedBy: user?.name || "System Admin",
      rows,
      summary: {
        totalEmployees: analytics.totalAssets,
        present: analytics.assignedAssets,
        late: analytics.availableAssets,
        absent: analytics.maintenanceAssets + analytics.lostAssets,
        halfDay: 0,
        lunchMissing: 0,
        attendancePercentage: analytics.assignmentPercentage,
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
                <Laptop className="h-6 w-6 text-blue-600" />
                Asset Management Dashboard
              </h1>
              <p className="text-sm text-gray-500">
                Track laptops, mobile phones, ID badges, monitors, inventory valuation, and employee assignments.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
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
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Link href="/admin/assets/inventory">
              <Card className="hover:border-blue-500 hover:shadow-md transition-all cursor-pointer">
                <CardContent className="flex items-center justify-between p-6">
                  <div className="flex items-center gap-4">
                    <div className="rounded-lg bg-blue-50 p-3 text-blue-600">
                      <Laptop className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Asset Inventory</h3>
                      <p className="text-xs text-gray-500">Manage, assign, and return assets</p>
                    </div>
                  </div>
                  <ArrowRight className="h-5 w-5 text-gray-400" />
                </CardContent>
              </Card>
            </Link>

            <Link href="/admin/assets/categories">
              <Card className="hover:border-blue-500 hover:shadow-md transition-all cursor-pointer">
                <CardContent className="flex items-center justify-between p-6">
                  <div className="flex items-center gap-4">
                    <div className="rounded-lg bg-purple-50 p-3 text-purple-600">
                      <Boxes className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Asset Categories</h3>
                      <p className="text-xs text-gray-500">Laptops, Phones, ID Cards, Monitors</p>
                    </div>
                  </div>
                  <ArrowRight className="h-5 w-5 text-gray-400" />
                </CardContent>
              </Card>
            </Link>

            <Card className="bg-gradient-to-br from-blue-900 to-indigo-800 text-white shadow-md">
              <CardContent className="flex items-center justify-between p-6">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-blue-200">Total Asset Valuation</span>
                  <div className="mt-2 text-2xl font-bold">
                    {analytics?.totalValuation.toLocaleString() || 0} ETB
                  </div>
                  <p className="text-xs text-blue-200">Recorded corporate purchase value</p>
                </div>
                <CreditCard className="h-8 w-8 text-blue-300" />
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
                    <span className="text-sm font-medium text-gray-500">Total Inventory Items</span>
                    <Boxes className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="mt-2 text-3xl font-bold text-gray-900">{analytics?.totalAssets || 0}</div>
                  <p className="mt-1 text-xs text-gray-500">Registered hardware & credentials</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-500">Assigned Assets</span>
                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div className="mt-2 text-3xl font-bold text-gray-900">{analytics?.assignedAssets || 0}</div>
                  <p className="mt-1 text-xs text-emerald-600 font-medium">
                    {analytics?.assignmentPercentage || 0}% currently in active use
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-500">Available in Stock</span>
                    <Laptop className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div className="mt-2 text-3xl font-bold text-gray-900">{analytics?.availableAssets || 0}</div>
                  <p className="mt-1 text-xs text-gray-500">Ready for employee deployment</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-500">Maintenance / Lost</span>
                    <ShieldAlert className="h-5 w-5 text-amber-500" />
                  </div>
                  <div className="mt-2 text-3xl font-bold text-gray-900">
                    {(analytics?.maintenanceAssets || 0) + (analytics?.lostAssets || 0)}
                  </div>
                  <p className="mt-1 text-xs text-amber-600 font-medium">
                    {analytics?.maintenanceAssets || 0} maintenance, {analytics?.lostAssets || 0} lost/damaged
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Category Breakdown Cards */}
          {analytics && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Boxes className="h-5 w-5 text-blue-600" />
                  Asset Category Distribution
                </CardTitle>
                <CardDescription>Inventory breakdown across equipment types</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  {analytics.categoryBreakdown.map((cat) => (
                    <div key={cat.categoryId} className="rounded-lg bg-gray-50 p-4 border flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold text-gray-600 uppercase">{cat.categoryName}</p>
                        <p className="mt-1 text-2xl font-bold text-gray-900">{cat.count}</p>
                      </div>
                      {cat.categoryName.toLowerCase().includes("laptop") ? (
                        <Laptop className="h-6 w-6 text-blue-600" />
                      ) : cat.categoryName.toLowerCase().includes("phone") ? (
                        <Smartphone className="h-6 w-6 text-emerald-600" />
                      ) : cat.categoryName.toLowerCase().includes("id") ? (
                        <CreditCard className="h-6 w-6 text-purple-600" />
                      ) : (
                        <Monitor className="h-6 w-6 text-indigo-600" />
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recently Assigned Assets Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-blue-600" />
                  Recently Assigned Corporate Assets
                </span>
                <Link href="/admin/assets/inventory" className="text-xs font-medium text-blue-600 hover:underline">
                  Manage All Assets
                </Link>
              </CardTitle>
              <CardDescription>Company laptops, phones, ID cards, and monitors issued to employees</CardDescription>
            </CardHeader>
            <CardContent>
              {assets.filter((a) => a.status === "ASSIGNED").length ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 border-b text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      <tr>
                        <th className="px-6 py-3">Asset Tag & Name</th>
                        <th className="px-6 py-3">Category</th>
                        <th className="px-6 py-3">Brand & Model</th>
                        <th className="px-6 py-3">Assigned Employee</th>
                        <th className="px-6 py-3">Assignment Date</th>
                        <th className="px-6 py-3">Condition</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {assets
                        .filter((a) => a.status === "ASSIGNED")
                        .slice(0, 5)
                        .map((item) => (
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
                            <td className="px-6 py-4">
                              <div>
                                <p className="font-semibold text-gray-900">{item.assignedTo?.name}</p>
                                <p className="text-xs text-gray-500">{item.assignedTo?.employeeId}</p>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-xs text-gray-600">
                              {item.assignedDate ? new Date(item.assignedDate).toLocaleDateString() : "-"}
                            </td>
                            <td className="px-6 py-4">
                              <Badge className="bg-emerald-100 text-emerald-800">
                                {item.condition}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-center py-6 text-sm text-gray-500">No assigned assets recorded yet.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
