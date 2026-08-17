"use client";

import { useEffect, useState } from "react";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/api";
import { Document, DocumentCategory } from "@/types/document";
import {
  FolderKanban,
  FileText,
  Building2,
  ExternalLink,
  Plus,
  Loader2,
  RefreshCw,
  ShieldAlert,
  Calendar,
  User,
} from "lucide-react";

export default function EmployeeDocumentsPage() {
  const [myDocuments, setMyDocuments] = useState<Document[]>([]);
  const [policies, setPolicies] = useState<Document[]>([]);
  const [categories, setCategories] = useState<DocumentCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"PERSONAL" | "POLICIES">("PERSONAL");

  // Upload Modal State
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploadData, setUploadData] = useState({
    documentNo: `DOC-EMP-${Math.floor(100 + Math.random() * 900)}`,
    title: "",
    categoryId: "",
    fileUrl: "https://example.com/docs/my_personal_file.pdf",
    issueDate: new Date().toISOString().slice(0, 10),
    expiryDate: "",
    notes: "",
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [myDocsRes, polRes, catRes] = await Promise.all([
        apiRequest<Document[]>("/documents/my-documents"),
        apiRequest<Document[]>("/documents/policies"),
        apiRequest<DocumentCategory[]>("/documents/categories"),
      ]);
      setMyDocuments(myDocsRes);
      setPolicies(polRes);
      setCategories(catRes);
      if (catRes.length && !uploadData.categoryId) {
        setUploadData((prev) => ({ ...prev, categoryId: catRes[0].id }));
      }
    } catch (err) {
      console.error("Failed to load employee documents", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUploadPersonalDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadData.title || !uploadData.categoryId || !uploadData.fileUrl) return;

    setSubmitting(true);
    try {
      await apiRequest<Document>("/documents", {
        method: "POST",
        body: JSON.stringify({
          ...uploadData,
          type: "PERSONAL",
        }),
      });
      setIsUploadOpen(false);
      setUploadData({
        documentNo: `DOC-EMP-${Math.floor(100 + Math.random() * 900)}`,
        title: "",
        categoryId: categories[0]?.id || "",
        fileUrl: "https://example.com/docs/my_personal_file.pdf",
        issueDate: new Date().toISOString().slice(0, 10),
        expiryDate: "",
        notes: "",
      });
      fetchData();
    } catch (err) {
      console.error("Failed to upload document to personal vault", err);
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
                <FolderKanban className="h-6 w-6 text-indigo-600" />
                My Document Vault & Company Policies
              </h1>
              <p className="text-sm text-gray-500">
                Access your contracts, certificates, and personal files, or browse corporate policy handbooks.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
                <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
              {activeTab === "PERSONAL" && (
                <Button onClick={() => setIsUploadOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                  <Plus className="mr-2 h-4 w-4" />
                  Upload Personal Doc
                </Button>
              )}
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab("PERSONAL")}
              className={`py-3 px-6 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === "PERSONAL"
                  ? "border-indigo-600 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <User className="h-4 w-4" />
              My Personal Documents ({myDocuments.length})
            </button>
            <button
              onClick={() => setActiveTab("POLICIES")}
              className={`py-3 px-6 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === "POLICIES"
                  ? "border-indigo-600 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <Building2 className="h-4 w-4" />
              Company Policies & Guidelines ({policies.length})
            </button>
          </div>

          {/* Tab 1: Personal Documents */}
          {activeTab === "PERSONAL" && (
            <div>
              {loading ? (
                <div className="flex h-48 items-center justify-center rounded-xl bg-white shadow-sm">
                  <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
                </div>
              ) : myDocuments.length ? (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {myDocuments.map((doc) => (
                    <Card key={doc.id} className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3 flex flex-row items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="rounded-lg bg-indigo-50 p-3 text-indigo-600">
                            <FileText className="h-6 w-6" />
                          </div>
                          <div>
                            <CardTitle className="text-base">{doc.title}</CardTitle>
                            <CardDescription className="text-xs font-mono text-gray-500">
                              {doc.documentNo}
                            </CardDescription>
                          </div>
                        </div>
                        <Badge
                          className={
                            doc.status === "ACTIVE"
                              ? "bg-emerald-100 text-emerald-800"
                              : doc.status === "EXPIRING_SOON"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-red-100 text-red-800"
                          }
                        >
                          {doc.status.replace("_", " ")}
                        </Badge>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="rounded-lg bg-gray-50 p-3 space-y-1 text-xs">
                          <div className="flex justify-between">
                            <span className="text-gray-500">Category:</span>
                            <span className="font-semibold text-gray-900">{doc.category?.name}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Issue Date:</span>
                            <span className="font-semibold text-gray-900">
                              {doc.issueDate ? new Date(doc.issueDate).toLocaleDateString() : "-"}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Expiration Date:</span>
                            <span className="font-semibold text-gray-900">
                              {doc.expiryDate ? new Date(doc.expiryDate).toLocaleDateString() : "No Expiry"}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t text-xs">
                          <a
                            href={doc.fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center text-indigo-600 font-semibold hover:underline"
                          >
                            <ExternalLink className="mr-1 h-3.5 w-3.5" /> View / Download File
                          </a>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="py-12 text-center text-sm text-gray-500">
                    No personal vault documents uploaded yet. Click "Upload Personal Doc" to add your contract or passport.
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Tab 2: Company Policies */}
          {activeTab === "POLICIES" && (
            <div>
              {loading ? (
                <div className="flex h-48 items-center justify-center rounded-xl bg-white shadow-sm">
                  <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
                </div>
              ) : policies.length ? (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {policies.map((pol) => (
                    <Card key={pol.id} className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3 flex flex-row items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="rounded-lg bg-blue-50 p-3 text-blue-600">
                            <Building2 className="h-6 w-6" />
                          </div>
                          <div>
                            <CardTitle className="text-base">{pol.title}</CardTitle>
                            <CardDescription className="text-xs font-mono text-gray-500">
                              {pol.documentNo}
                            </CardDescription>
                          </div>
                        </div>
                        <Badge className="bg-indigo-100 text-indigo-800">
                          {pol.category?.name || "Corporate Policy"}
                        </Badge>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {pol.notes && <p className="text-xs text-gray-600">{pol.notes}</p>}
                        <div className="flex items-center justify-between pt-2 border-t text-xs">
                          <span className="text-gray-500">
                            Published: {pol.issueDate ? new Date(pol.issueDate).toLocaleDateString() : ""}
                          </span>
                          <a
                            href={pol.fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center text-indigo-600 font-semibold hover:underline"
                          >
                            <ExternalLink className="mr-1 h-3.5 w-3.5" /> Read Policy Document
                          </a>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="py-12 text-center text-sm text-gray-500">
                    No general company policies published yet.
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Upload Personal Doc Modal */}
          {isUploadOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <Card className="w-full max-w-lg bg-white shadow-xl">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="h-5 w-5 text-indigo-600" />
                    Upload Personal Document to Vault
                  </CardTitle>
                  <CardDescription>Upload passport, degree certificate, or tax ID copy</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleUploadPersonalDoc} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Document Category *</label>
                      <select
                        className="w-full rounded-md border border-gray-300 p-2 text-sm"
                        value={uploadData.categoryId}
                        onChange={(e) => setUploadData({ ...uploadData, categoryId: e.target.value })}
                        required
                      >
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Document Title *</label>
                      <Input
                        placeholder="e.g. Passport Copy 2026 / University Transcript"
                        value={uploadData.title}
                        onChange={(e) => setUploadData({ ...uploadData, title: e.target.value })}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">File Storage URL *</label>
                      <Input
                        placeholder="https://example.com/docs/my_file.pdf"
                        value={uploadData.fileUrl}
                        onChange={(e) => setUploadData({ ...uploadData, fileUrl: e.target.value })}
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Issue Date</label>
                        <Input
                          type="date"
                          value={uploadData.issueDate}
                          onChange={(e) => setUploadData({ ...uploadData, issueDate: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Expiration Date (Optional)</label>
                        <Input
                          type="date"
                          value={uploadData.expiryDate}
                          onChange={(e) => setUploadData({ ...uploadData, expiryDate: e.target.value })}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Notes</label>
                      <Input
                        placeholder="Additional remarks..."
                        value={uploadData.notes}
                        onChange={(e) => setUploadData({ ...uploadData, notes: e.target.value })}
                      />
                    </div>

                    <div className="flex justify-end gap-2 pt-4 border-t">
                      <Button variant="outline" type="button" onClick={() => setIsUploadOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={submitting} className="bg-indigo-600 text-white">
                        {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Upload to Vault"}
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
