"use client";

import { useEffect, useState } from "react";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiRequest } from "@/lib/api";
import { AssetCategory } from "@/types/asset";
import {
  Boxes,
  Plus,
  Loader2,
  RefreshCw,
  Trash2,
  Laptop,
  Smartphone,
  CreditCard,
  Monitor,
} from "lucide-react";

export default function AdminAssetCategoriesPage() {
  const [categories, setCategories] = useState<AssetCategory[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    code: `CAT-${Math.floor(100 + Math.random() * 900)}`,
    name: "",
    description: "",
  });

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const data = await apiRequest<AssetCategory[]>("/assets/categories");
      setCategories(data);
    } catch (err) {
      console.error("Failed to load asset categories", err);
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
      await apiRequest<AssetCategory>("/assets/categories", {
        method: "POST",
        body: JSON.stringify(formData),
      });
      setIsCreateOpen(false);
      setFormData({
        code: `CAT-${Math.floor(100 + Math.random() * 900)}`,
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
      await apiRequest(`/assets/categories/${id}`, { method: "DELETE" });
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
                <Boxes className="h-6 w-6 text-purple-600" />
                Asset Categories Management
              </h1>
              <p className="text-sm text-gray-500">
                Organize hardware items into Laptops, Phones, ID Cards, Monitors, and Accessories.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={fetchCategories} disabled={loading}>
                <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
              <Button onClick={() => setIsCreateOpen(true)} className="bg-purple-600 hover:bg-purple-700 text-white">
                <Plus className="mr-2 h-4 w-4" />
                Add Asset Category
              </Button>
            </div>
          </div>

          {/* Categories Grid */}
          {loading ? (
            <div className="flex h-48 items-center justify-center rounded-xl bg-white shadow-sm">
              <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
            </div>
          ) : categories.length ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {categories.map((cat) => (
                <Card key={cat.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3 flex flex-row items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-purple-50 p-2.5 text-purple-600">
                        {cat.name.toLowerCase().includes("laptop") ? (
                          <Laptop className="h-5 w-5" />
                        ) : cat.name.toLowerCase().includes("phone") ? (
                          <Smartphone className="h-5 w-5" />
                        ) : cat.name.toLowerCase().includes("id") ? (
                          <CreditCard className="h-5 w-5" />
                        ) : (
                          <Monitor className="h-5 w-5" />
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
                      <span>Total Registered Assets</span>
                      <span className="font-bold text-gray-900">{cat._count?.assets || 0} item(s)</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center text-sm text-gray-500">
                No asset categories found. Click "Add Asset Category" to create one.
              </CardContent>
            </Card>
          )}

          {/* Add Category Modal */}
          {isCreateOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <Card className="w-full max-w-md bg-white shadow-xl">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Boxes className="h-5 w-5 text-purple-600" />
                    Add Asset Category
                  </CardTitle>
                  <CardDescription>Group inventory hardware by equipment type</CardDescription>
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
                        placeholder="e.g. Monitors & Displays"
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
                        placeholder="Description of hardware items included in this category..."
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      />
                    </div>

                    <div className="flex justify-end gap-2 pt-4 border-t">
                      <Button variant="outline" type="button" onClick={() => setIsCreateOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={submitting} className="bg-purple-600 text-white">
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
