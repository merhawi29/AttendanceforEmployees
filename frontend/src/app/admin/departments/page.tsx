"use client";

import { useState, useEffect, useCallback } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiRequest } from "@/lib/api";
import { Department, DepartmentListResponse } from "@/types/department";
import { DepartmentModal } from "@/components/admin/department-modal";
import { DeleteDepartmentModal } from "@/components/admin/delete-department-modal";
import { Toaster } from "@/components/ui/toast";
import {
  Building2,
  Plus,
  Search,
  Users,
  Layers,
  Edit,
  Trash2,
  CheckCircle2,
  XCircle,
  RefreshCw,
  ArrowUpDown,
} from "lucide-react";

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination & Filter & Sorting State
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"name" | "code" | "createdAt" | "updatedAt">("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDept, setSelectedDept] = useState<Department | null>(null);
  const [deleteModalDept, setDeleteModalDept] = useState<Department | null>(null);

  const fetchDepartments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
        sortBy,
        sortOrder,
      });

      if (search.trim()) params.append("search", search.trim());
      if (statusFilter === "active") params.append("isActive", "true");
      if (statusFilter === "inactive") params.append("isActive", "false");

      const response = await apiRequest<DepartmentListResponse>(
        `/departments?${params.toString()}`
      );

      setDepartments(response.departments || []);
      setTotalPages(response.pagination?.totalPages || 1);
      setTotalItems(response.pagination?.total || 0);
    } catch (err: any) {
      setError(err.message || "Failed to fetch departments");
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, sortBy, sortOrder]);

  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  const handleCreate = () => {
    setSelectedDept(null);
    setIsModalOpen(true);
  };

  const handleEdit = (dept: Department) => {
    setSelectedDept(dept);
    setIsModalOpen(true);
  };

  const handleDeletePrompt = (dept: Department) => {
    setDeleteModalDept(dept);
  };

  const toggleSortOrder = () => {
    setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <Toaster />

        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Departments</h1>
            <p className="text-sm text-gray-500">
              Manage organization departments, cost centers, and hierarchy
            </p>
          </div>
          <Button onClick={handleCreate} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Department
          </Button>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-50 p-3 text-blue-600">
                <Building2 className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500">Total Departments</p>
                <p className="text-2xl font-bold text-gray-900">{totalItems}</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-green-50 p-3 text-green-600">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500">Assigned Employees</p>
                <p className="text-2xl font-bold text-gray-900">
                  {departments.reduce((acc, curr) => acc + (curr.memberCount || 0), 0)}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-purple-50 p-3 text-purple-600">
                <Layers className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500">Top-Level Divisions</p>
                <p className="text-2xl font-bold text-gray-900">
                  {departments.filter((d) => !d.parentDepartmentId).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters, Search & Sorting */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by code, name, or cost center..."
              className="pl-9"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Status Filter */}
            <select
              className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="all">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>

            {/* Sort By Field */}
            <select
              className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value as any);
                setPage(1);
              }}
            >
              <option value="name">Sort by Name</option>
              <option value="code">Sort by Code</option>
              <option value="createdAt">Sort by Date Created</option>
              <option value="updatedAt">Sort by Date Updated</option>
            </select>

            {/* Toggle Sort Direction */}
            <Button
              variant="outline"
              size="sm"
              onClick={toggleSortOrder}
              className="flex items-center gap-1.5 text-xs text-gray-700"
              title={`Sort ${sortOrder === "asc" ? "Ascending" : "Descending"}`}
            >
              <ArrowUpDown className="h-3.5 w-3.5" />
              {sortOrder.toUpperCase()}
            </Button>

            <Button variant="outline" size="icon" onClick={fetchDepartments} title="Refresh">
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          {error ? (
            <div className="p-8 text-center text-red-500">{error}</div>
          ) : loading && departments.length === 0 ? (
            <div className="p-8 text-center text-gray-500">Loading departments...</div>
          ) : departments.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <Building2 className="mx-auto h-12 w-12 text-gray-300" />
              <p className="mt-2 text-lg font-medium text-gray-900">No departments found</p>
              <p className="text-sm">Get started by creating your first department.</p>
              <Button onClick={handleCreate} className="mt-4">
                <Plus className="mr-2 h-4 w-4" /> Add Department
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-gray-50 text-xs uppercase text-gray-500 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 font-semibold">Code / Name</th>
                    <th className="px-6 py-3 font-semibold">Department Head</th>
                    <th className="px-6 py-3 font-semibold">Parent Dept</th>
                    <th className="px-6 py-3 font-semibold">Cost Center</th>
                    <th className="px-6 py-3 font-semibold">Members</th>
                    <th className="px-6 py-3 font-semibold">Status</th>
                    <th className="px-6 py-3 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {departments.map((dept) => (
                    <tr key={dept.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-xs font-bold text-blue-700">
                            {dept.code}
                          </span>
                          <div>
                            <p className="font-semibold text-gray-900">{dept.name}</p>
                            {dept.description && (
                              <p className="text-xs text-gray-400 line-clamp-1">
                                {dept.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        {dept.head ? (
                          <div>
                            <p className="font-medium text-gray-900">{dept.head.name}</p>
                            <p className="text-xs text-gray-400">{dept.head.employeeId}</p>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400 italic">Unassigned</span>
                        )}
                      </td>

                      <td className="px-6 py-4">
                        {dept.parentDepartment ? (
                          <span className="inline-flex items-center rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700">
                            {dept.parentDepartment.name}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">Top-Level</span>
                        )}
                      </td>

                      <td className="px-6 py-4 text-xs font-mono">
                        {dept.costCenterCode || <span className="text-gray-300">-</span>}
                      </td>

                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-700">
                          <Users className="h-3.5 w-3.5 text-gray-400" />
                          {dept.memberCount} staff
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        {dept.isActive ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700">
                            <CheckCircle2 className="h-3 w-3" /> Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-700">
                            <XCircle className="h-3 w-3" /> Inactive
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-gray-500 hover:text-blue-600"
                            onClick={() => handleEdit(dept)}
                            title="Edit"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-gray-500 hover:text-red-600"
                            onClick={() => handleDeletePrompt(dept)}
                            title="Delete"
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
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-gray-200 px-6 py-4">
              <p className="text-xs text-gray-500">
                Page {page} of {totalPages} ({totalItems} items)
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage(page + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Create / Edit Modal */}
        <DepartmentModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={fetchDepartments}
          department={selectedDept}
        />

        {/* Delete Confirmation Modal */}
        <DeleteDepartmentModal
          isOpen={!!deleteModalDept}
          department={deleteModalDept}
          onClose={() => setDeleteModalDept(null)}
          onSuccess={fetchDepartments}
        />
      </div>
    </DashboardLayout>
  );
}
