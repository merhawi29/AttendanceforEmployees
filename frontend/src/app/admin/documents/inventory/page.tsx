"use client";

import { useEffect, useState } from "react";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/api";
import { Document, DocumentCategory, DocumentType, DocumentStatus } from "@/types/document";
import {
  FileText,
  Plus,
  Search,
  Loader2,
  RefreshCw,
  Trash2,
  ExternalLink,
  Download,
  ShieldAlert,
} from "lucide-react";

interface EmployeeSimple {
  id: string;
  name: string;
  employeeId: string;
}

export default function AdminDocumentsInventoryPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [categories, setCategories] = useState<DocumentCategory[]>([]);
  const [employees, setEmployees] = useState<EmployeeSimple[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState<string>("ALL");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");

  // Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    documentNo: `DOC-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
    title: "",
    categoryId: "",
    type: "PERSONAL" as DocumentType,
    fileUrl: "https://example.com/docs/sample_document.pdf",
    fileType: "application/pdf",
    fileSize: 1048576,
    ownerId: "",
    issueDate: new Date().toISOString().slice(0, 10),
    expiryDate: "",
    notes: "",
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [docRes, catRes, empRes] = await Promise.all([
        apiRequest<Document[]>("/documents"),
        apiRequest<DocumentCategory[]>("/documents/categories"),
        apiRequest<any>("/employees"),
      ]);
      setDocuments(Array.isArray(docRes) ? docRes : []);
      setCategories(Array.isArray(catRes) ? catRes : []);
      setEmployees(Array.isArray(empRes) ? empRes : empRes?.employees || []);
      if (catRes.length && !formData.categoryId) {
        setFormData((prev) => ({ ...prev, categoryId: catRes[0].id }));
      }
    } catch (err) {
      console.error("Failed to load documents repository", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.documentNo || !formData.title || !formData.categoryId || !formData.fileUrl) return;

    setSubmitting(true);
    try {
      await apiRequest<Document>("/documents", {
        method: "POST",
        body: JSON.stringify({
          ...formData,
          ownerId: formData.type === "PERSONAL" ? formData.ownerId || undefined : undefined,
        }),
      });
      setIsCreateOpen(false);
      setFormData({
        documentNo: `DOC-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
        title: "",
        categoryId: categories[0]?.id || "",
        type: "PERSONAL",
        fileUrl: "https://example.com/docs/sample_document.pdf",
        fileType: "application/pdf",
        fileSize: 1048576,
        ownerId: "",
        issueDate: new Date().toISOString().slice(0, 10),
        expiryDate: "",
        notes: "",
      });
      fetchData();
    } catch (err) {
      console.error("Failed to upload document", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteDocument = async (id: string) => {
    if (!confirm("Are you sure you want to delete this document from the repository?")) return;
    try {
      await apiRequest(`/documents/${id}`, { method: "DELETE" });
      fetchData();
    } catch (err) {
      console.error("Failed to delete document", err);
    }
  };

  const filteredDocuments = documents.filter((d) => {
    const matchesSearch =
      d.title.toLowerCase().includes(search.toLowerCase()) ||
      d.documentNo.toLowerCase().includes(search.toLowerCase()) ||
      (d.owner && d.owner.name.toLowerCase().includes(search.toLowerCase()));
    const matchesType = selectedType === "ALL" || d.type === selectedType;
    const matchesCategory = selectedCategory === "ALL" || d.categoryId === selectedCategory;
    return matchesSearch && matchesType && matchesCategory;
  });

  return (
    <ProtectedRoute requiredRole="ADMIN">
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <FileText className="h-6 w-6 text-indigo-600" />
                Document Repository & Vault
              </h1>
              <p className="text-sm text-gray-500">
                Store, categorize, and track employee personal documents and company policies.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
                <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
              <Button onClick={() => setIsCreateOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                <Plus className="mr-2 h-4 w-4" />
                Upload New Document
              </Button>
            </div>
          </div>

          {/* Filters & Search */}
          <Card>
            <CardContent className="p-4 flex flex-col sm:flex-row gap-4 justify-between items-center">
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search document title, no, owner..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>

              <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                <select
                  className="rounded-md border border-gray-300 p-2 text-xs"
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                >
                  <option value="ALL">All Types</option>
                  <option value="PERSONAL">Personal Vault Documents</option>
                  <option value="COMPANY_POLICY">Company Policies</option>
                </select>

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
              </div>
            </CardContent>
          </Card>

          {/* Documents Table */}
          <Card>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex h-48 items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
                </div>
              ) : filteredDocuments.length ? (
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
                        <th className="px-6 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredDocuments.map((item) => (
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
                            {item.owner ? (
                              <div>
                                <p className="font-semibold text-gray-900">{item.owner.name}</p>
                                <p className="text-gray-500">{item.owner.employeeId}</p>
                              </div>
                            ) : (
                              <span className="text-indigo-600 font-medium">Company Wide Policy</span>
                            )}
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
                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-2">
                              <a
                                href={item.fileUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center justify-center h-8 px-2 text-xs border rounded-md hover:bg-gray-50 text-indigo-600 font-medium"
                              >
                                <ExternalLink className="mr-1 h-3.5 w-3.5" /> View
                              </a>

                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteDocument(item.id)}
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
                  No documents match the selected filter.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Upload Document Modal */}
          {isCreateOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <Card className="w-full max-w-xl bg-white shadow-xl max-h-[90vh] overflow-y-auto">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="h-5 w-5 text-indigo-600" />
                    Upload / Register New Document
                  </CardTitle>
                  <CardDescription>Add a personal employee file or general company policy</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleCreateDocument} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Document No *</label>
                        <Input
                          value={formData.documentNo}
                          onChange={(e) => setFormData({ ...formData, documentNo: e.target.value })}
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
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Document Title *</label>
                      <Input
                        placeholder="e.g. Employee Handbook 2026 / Passport Copy"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Document Type *</label>
                        <select
                          className="w-full rounded-md border border-gray-300 p-2 text-sm"
                          value={formData.type}
                          onChange={(e) => setFormData({ ...formData, type: e.target.value as DocumentType })}
                        >
                          <option value="PERSONAL">Personal Employee Document</option>
                          <option value="COMPANY_POLICY">Company Wide Policy Document</option>
                        </select>
                      </div>

                      {formData.type === "PERSONAL" && (
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1">Owner Employee</label>
                          <select
                            className="w-full rounded-md border border-gray-300 p-2 text-sm"
                            value={formData.ownerId}
                            onChange={(e) => setFormData({ ...formData, ownerId: e.target.value })}
                          >
                            <option value="">-- Choose Employee --</option>
                            {Array.isArray(employees) && employees.map((emp) => (
                              <option key={emp.id} value={emp.id}>
                                {emp.name} ({emp.employeeId})
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">File Storage URL *</label>
                      <Input
                        placeholder="https://example.com/docs/file.pdf"
                        value={formData.fileUrl}
                        onChange={(e) => setFormData({ ...formData, fileUrl: e.target.value })}
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Issue Date</label>
                        <Input
                          type="date"
                          value={formData.issueDate}
                          onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Expiration Date (Optional)</label>
                        <Input
                          type="date"
                          value={formData.expiryDate}
                          onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Notes / Description</label>
                      <textarea
                        className="w-full rounded-md border border-gray-300 p-2 text-sm"
                        rows={2}
                        placeholder="Additional details or renewal instructions..."
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      />
                    </div>

                    <div className="flex justify-end gap-2 pt-4 border-t">
                      <Button variant="outline" type="button" onClick={() => setIsCreateOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={submitting} className="bg-indigo-600 text-white">
                        {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Document"}
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
