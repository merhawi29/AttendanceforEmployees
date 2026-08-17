"use client";

import { useEffect, useState } from "react";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiRequest } from "@/lib/api";
import { DocumentCategory } from "@/types/document";
import {
  Boxes,
  Plus,
  Loader2,
  RefreshCw,
  Trash2,
  FileText,
  Building2,
  Award,
  CreditCard,
} from "lucide-react";

export default function AdminDocumentCategoriesPage() {
  const [categories, setCategories] = useState<DocumentCategory[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    code: `CAT-DOC-${Math.floor(100 + Math.random() * 900)}`,
    name: "",
    description: "",
  });

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const data = await apiRequest<DocumentCategory[]>("/documents/categories");
      setCategories(data);
    } catch (err) {
      console.error("Failed to load document categories", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.code) return;

    setSubmitting(true);
    try {
      await apiRequest<DocumentCategory>("/documents/categories", {
        method: "POST",
        body: JSON.stringify(formData),
      });
      setIsCreateOpen(false);
      setFormData({
        code: `CAT-DOC-${Math.floor(100 + Math.random() * 900)}`,
        name: "",
        description: "",
      });
      fetchCategories();
    } catch (err) {
      console.error("Failed to create category", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm("Are you sure you want to delete this category?")) return;
    try {
      await apiRequest(`/documents/categories/${id}`, { method: "DELETE" });
      fetchCategories();
    } catch (err) {
      console.error("Failed to delete category", err);
    }
  };

  return (
    <ProtectedRoute requiredRole="ADMIN">
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Boxes className="h-6 w-6 text-indigo-600" />
                Document Categories Management
              </h1>
              <p className="text-sm text-gray-500">
                Organize company policies and employee vault items into structured categories.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={fetchCategories} disabled={loading}>
                <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
              <Button onClick={() => setIsCreateOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                <Plus className="mr-2 h-4 w-4" />
                Add Category
              </Button>
            </div>
          </div>

          {/* Categories Grid */}
          {loading ? (
            <div className="flex h-48 items-center justify-center rounded-xl bg-white shadow-sm">
              <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
            </div>
          ) : categories.length ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {categories.map((cat) => (
                <Card key={cat.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3 flex flex-row items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-indigo-50 p-2.5 text-indigo-600">
                        {cat.name.toLowerCase().includes("policy") ? (
                          <Building2 className="h-5 w-5" />
                        ) : cat.name.toLowerCase().includes("cert") ? (
                          <Award className="h-5 w-5" />
                        ) : cat.name.toLowerCase().includes("id") ? (
                          <CreditCard className="h-5 w-5" />
                        ) : (
                          <FileText className="h-5 w-5" />
                        )}
                      </div>
                      <div>
                        <CardTitle className="text-base">{cat.name}</CardTitle>
                        <CardDescription className="text-xs font-mono">{cat.code}</CardDescription>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteCategory(cat.id)}
                      className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {cat.description && <p className="text-xs text-gray-600">{cat.description}</p>}
                    <div className="pt-2 border-t flex justify-between items-center text-xs text-gray-500">
                      <span>Stored Documents</span>
                      <span className="font-bold text-gray-900">{cat._count?.documents || 0} file(s)</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center text-sm text-gray-500">
                No document categories found. Click "Add Category" to create one.
              </CardContent>
            </Card>
          )}

          {/* Add Category Modal */}
          {isCreateOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <Card className="w-full max-w-md bg-white shadow-xl">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Boxes className="h-5 w-5 text-indigo-600" />
                    Add Document Category
                  </CardTitle>
                  <CardDescription>Group stored files by document type</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleCreateCategory} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Category Code *</label>
                      <Input
                        value={formData.code}
                        onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Category Name *</label>
                      <Input
                        placeholder="e.g. Tax Forms & Payroll Records"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Description</label>
                      <textarea
                        className="w-full rounded-md border border-gray-300 p-2 text-sm"
                        rows={3}
                        placeholder="Description of files stored in this category..."
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      />
                    </div>

                    <div className="flex justify-end gap-2 pt-4 border-t">
                      <Button variant="outline" type="button" onClick={() => setIsCreateOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={submitting} className="bg-indigo-600 text-white">
                        {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Category"}
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
