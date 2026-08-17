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
import { DocumentAnalytics, Document } from "@/types/document";
import {
  FolderKanban,
  FileText,
  ShieldAlert,
  Boxes,
  FileSpreadsheet,
  Printer,
  Loader2,
  RefreshCw,
  ArrowRight,
  FileCheck,
  Building2,
  User,
} from "lucide-react";

export default function AdminDocumentsPage() {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<DocumentAnalytics | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [analyticsData, docsData] = await Promise.all([
        apiRequest<DocumentAnalytics>("/documents/analytics/dashboard"),
        apiRequest<Document[]>("/documents"),
      ]);
      setAnalytics(analyticsData);
      setDocuments(docsData);
    } catch (err) {
      console.error("Failed to load document analytics", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleExport = (type: "pdf" | "excel" | "print") => {
    if (!analytics || !documents) return;

    const rows = documents.map((d) => ({
      employeeId: d.documentNo,
      name: d.title,
      department: d.category?.name || "General",
      date: d.issueDate ? new Date(d.issueDate).toLocaleDateString() : "-",
      morningIn: d.type.replace("_", " "),
      lunchOut: d.owner?.name || "Company Policy",
      lunchReturn: d.fileType || "PDF",
      finalOut: d.expiryDate ? new Date(d.expiryDate).toLocaleDateString() : "No Expiry",
      status: d.status,
      workedHours: d.fileSize ? `${Math.round(d.fileSize / 1024)} KB` : "-",
    }));

    const exportOpts = {
      reportTitle: "Corporate Document Vault & Policy Inventory Report",
      dateRangeLabel: `As of ${new Date().toLocaleDateString()}`,
      generatedBy: user?.name || "System Admin",
      rows,
      summary: {
        totalEmployees: analytics.totalDocuments,
        present: analytics.companyPoliciesCount,
        late: analytics.personalDocumentsCount,
        absent: analytics.expiringSoonCount + analytics.expiredCount,
        halfDay: 0,
        lunchMissing: 0,
        attendancePercentage: 100,
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
                <FolderKanban className="h-6 w-6 text-indigo-600" />
                Document Management & Vault Dashboard
              </h1>
              <p className="text-sm text-gray-500">
                Centralized document repository for company handbooks, employee contracts, passports, and expiration alerts.
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
            <Link href="/admin/documents/inventory">
              <Card className="hover:border-indigo-500 hover:shadow-md transition-all cursor-pointer">
                <CardContent className="flex items-center justify-between p-6">
                  <div className="flex items-center gap-4">
                    <div className="rounded-lg bg-indigo-50 p-3 text-indigo-600">
                      <FileCheck className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Document Repository</h3>
                      <p className="text-xs text-gray-500">Upload & manage contracts & vaults</p>
                    </div>
                  </div>
                  <ArrowRight className="h-5 w-5 text-gray-400" />
                </CardContent>
              </Card>
            </Link>

            <Link href="/admin/documents/categories">
              <Card className="hover:border-indigo-500 hover:shadow-md transition-all cursor-pointer">
                <CardContent className="flex items-center justify-between p-6">
                  <div className="flex items-center gap-4">
                    <div className="rounded-lg bg-purple-50 p-3 text-purple-600">
                      <Boxes className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Document Categories</h3>
                      <p className="text-xs text-gray-500">Contracts, Passports, Policies, Certificates</p>
                    </div>
                  </div>
                  <ArrowRight className="h-5 w-5 text-gray-400" />
                </CardContent>
              </Card>
            </Link>

            <Card className="bg-gradient-to-br from-indigo-900 to-blue-800 text-white shadow-md">
              <CardContent className="flex items-center justify-between p-6">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-indigo-200">Company Policies</span>
                  <div className="mt-2 text-3xl font-bold">
                    {analytics?.companyPoliciesCount || 0}
                  </div>
                  <p className="text-xs text-indigo-200">Active corporate handbooks & guidelines</p>
                </div>
                <Building2 className="h-8 w-8 text-indigo-300" />
              </CardContent>
            </Card>
          </div>

          {/* Metric Cards */}
          {loading ? (
            <div className="flex h-32 items-center justify-center rounded-xl bg-white shadow-sm">
              <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-500">Total Documents</span>
                    <FileText className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div className="mt-2 text-3xl font-bold text-gray-900">{analytics?.totalDocuments || 0}</div>
                  <p className="mt-1 text-xs text-gray-500">Stored corporate & employee files</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-500">Personal Vault Documents</span>
                    <User className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="mt-2 text-3xl font-bold text-gray-900">{analytics?.personalDocumentsCount || 0}</div>
                  <p className="mt-1 text-xs text-blue-600 font-medium">Employee contracts, IDs & certificates</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-500">Expiring in 30 Days</span>
                    <ShieldAlert className="h-5 w-5 text-amber-500" />
                  </div>
                  <div className="mt-2 text-3xl font-bold text-gray-900">{analytics?.expiringSoonCount || 0}</div>
                  <p className="mt-1 text-xs text-amber-600 font-medium">Requires renewal attention</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-500">Expired Files</span>
                    <ShieldAlert className="h-5 w-5 text-red-500" />
                  </div>
                  <div className="mt-2 text-3xl font-bold text-gray-900">{analytics?.expiredCount || 0}</div>
                  <p className="mt-1 text-xs text-red-600 font-medium">Past expiration date</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Category Breakdown Cards */}
          {analytics && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Boxes className="h-5 w-5 text-indigo-600" />
                  Document Category Distribution
                </CardTitle>
                <CardDescription>File distribution across document categories</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  {analytics.categoryBreakdown.map((cat) => (
                    <div key={cat.categoryId} className="rounded-lg bg-gray-50 p-4 border flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold text-gray-600 uppercase">{cat.categoryName}</p>
                        <p className="mt-1 text-2xl font-bold text-gray-900">{cat.count}</p>
                      </div>
                      <FileText className="h-6 w-6 text-indigo-500" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recent Documents Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-indigo-600" />
                  Recent Documents & Files Repository
                </span>
                <Link href="/admin/documents/inventory" className="text-xs font-medium text-indigo-600 hover:underline">
                  View Full Repository
                </Link>
              </CardTitle>
              <CardDescription>Latest corporate policies and employee vault documents</CardDescription>
            </CardHeader>
            <CardContent>
              {documents.length ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 border-b text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      <tr>
                        <th className="px-6 py-3">Doc No & Title</th>
                        <th className="px-6 py-3">Type</th>
                        <th className="px-6 py-3">Category</th>
                        <th className="px-6 py-3">Owner / Scope</th>
                        <th className="px-6 py-3">Expiry Date</th>
                        <th className="px-6 py-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {documents.slice(0, 5).map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div>
                              <p className="font-semibold text-gray-900">{item.title}</p>
                              <p className="text-xs text-gray-500 font-mono">{item.documentNo}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <Badge variant="secondary" className="text-xs">
                              {item.type.replace("_", " ")}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 text-gray-700">{item.category?.name}</td>
                          <td className="px-6 py-4 text-xs text-gray-600">
                            {item.owner ? item.owner.name : "Company Wide"}
                          </td>
                          <td className="px-6 py-4 text-xs text-gray-600">
                            {item.expiryDate ? new Date(item.expiryDate).toLocaleDateString() : "No Expiry"}
                          </td>
                          <td className="px-6 py-4">
                            <Badge
                              className={
                                item.status === "ACTIVE"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : item.status === "EXPIRING_SOON"
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-red-100 text-red-800"
                              }
                            >
                              {item.status.replace("_", " ")}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-center py-6 text-sm text-gray-500">No documents stored in repository yet.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
