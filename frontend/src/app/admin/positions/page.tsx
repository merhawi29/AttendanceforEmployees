"use client";

import { useState, useEffect, useCallback } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiRequest } from "@/lib/api";
import { Position, PositionListResponse } from "@/types/position";
import { DepartmentTreeItem } from "@/types/department";
import { PositionModal } from "@/components/admin/position-modal";
import { DeletePositionModal } from "@/components/admin/delete-position-modal";
import { Toaster } from "@/components/ui/toast";
import {
  Briefcase,
  Plus,
  Search,
  Building2,
  Layers,
  Edit,
  Trash2,
  CheckCircle2,
  XCircle,
  RefreshCw,
  ArrowUpDown,
  DollarSign,
} from "lucide-react";

export default function PositionsPage() {
  const [positions, setPositions] = useState<Position[]>([]);
  const [departments, setDepartments] = useState<DepartmentTreeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination & Filter & Sorting State
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const [jobLevelFilter, setJobLevelFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"title" | "code" | "jobLevel" | "createdAt" | "updatedAt">("title");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPos, setSelectedPos] = useState<Position | null>(null);
  const [deleteModalPos, setDeleteModalPos] = useState<Position | null>(null);

  const fetchDepartments = async () => {
    try {
      const deptsRes = await apiRequest<DepartmentTreeItem[]>("/departments/tree").catch(() => []);
      setDepartments(deptsRes || []);
    } catch {
      // Ignore
    }
  };

  const fetchPositions = useCallback(async () => {
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
      if (departmentFilter !== "all") params.append("departmentId", departmentFilter);
      if (jobLevelFilter !== "all") params.append("jobLevel", jobLevelFilter);

      const response = await apiRequest<PositionListResponse>(
        `/positions?${params.toString()}`
      );

      setPositions(response.positions || []);
      setTotalPages(response.pagination?.totalPages || 1);
      setTotalItems(response.pagination?.total || 0);
    } catch (err: any) {
      setError(err.message || "Failed to fetch positions");
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, departmentFilter, jobLevelFilter, sortBy, sortOrder]);

  useEffect(() => {
    fetchDepartments();
  }, []);

  useEffect(() => {
    fetchPositions();
  }, [fetchPositions]);

  const handleCreate = () => {
    setSelectedPos(null);
    setIsModalOpen(true);
  };

  const handleEdit = (pos: Position) => {
    setSelectedPos(pos);
    setIsModalOpen(true);
  };

  const handleDeletePrompt = (pos: Position) => {
    setDeleteModalPos(pos);
  };

  const toggleSortOrder = () => {
    setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
  };

  const formatSalaryRange = (min?: number | null, max?: number | null) => {
    if (min !== null && min !== undefined && max !== null && max !== undefined) {
      return `$${min.toLocaleString()} - $${max.toLocaleString()}`;
    }
    if (min !== null && min !== undefined) {
      return `From $${min.toLocaleString()}`;
    }
    if (max !== null && max !== undefined) {
      return `Up to $${max.toLocaleString()}`;
    }
    return "-";
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <Toaster />

        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Positions</h1>
            <p className="text-sm text-gray-500">
              Manage job titles, career levels, salary scales, and department assignments
            </p>
          </div>
          <Button onClick={handleCreate} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Position
          </Button>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-50 p-3 text-blue-600">
                <Briefcase className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500">Total Positions</p>
                <p className="text-2xl font-bold text-gray-900">{totalItems}</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-green-50 p-3 text-green-600">
                <Building2 className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500">Active Departments</p>
                <p className="text-2xl font-bold text-gray-900">{departments.length}</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-purple-50 p-3 text-purple-600">
                <Layers className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500">Career Levels</p>
                <p className="text-2xl font-bold text-gray-900">
                  {new Set(positions.map((p) => p.jobLevel).filter(Boolean)).size}
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
              placeholder="Search by code, title, or career level..."
              className="pl-9"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Department Filter */}
            <select
              className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              value={departmentFilter}
              onChange={(e) => {
                setDepartmentFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="all">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>

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
              <option value="title">Sort by Title</option>
              <option value="code">Sort by Code</option>
              <option value="jobLevel">Sort by Level</option>
              <option value="createdAt">Sort by Date Created</option>
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

            <Button variant="outline" size="icon" onClick={fetchPositions} title="Refresh">
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          {error ? (
            <div className="p-8 text-center text-red-500">{error}</div>
          ) : loading && positions.length === 0 ? (
            <div className="p-8 text-center text-gray-500">Loading positions...</div>
          ) : positions.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <Briefcase className="mx-auto h-12 w-12 text-gray-300" />
              <p className="mt-2 text-lg font-medium text-gray-900">No positions found</p>
              <p className="text-sm">Get started by creating your first position.</p>
              <Button onClick={handleCreate} className="mt-4">
                <Plus className="mr-2 h-4 w-4" /> Add Position
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-gray-50 text-xs uppercase text-gray-500 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 font-semibold">Code / Title</th>
                    <th className="px-6 py-3 font-semibold">Department</th>
                    <th className="px-6 py-3 font-semibold">Career Level</th>
                    <th className="px-6 py-3 font-semibold">Salary Range</th>
                    <th className="px-6 py-3 font-semibold">Status</th>
                    <th className="px-6 py-3 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {positions.map((pos) => (
                    <tr key={pos.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-xs font-bold text-blue-700">
                            {pos.code}
                          </span>
                          <div>
                            <p className="font-semibold text-gray-900">{pos.title}</p>
                            {pos.description && (
                              <p className="text-xs text-gray-400 line-clamp-1">
                                {pos.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        {pos.department ? (
                          <span className="inline-flex items-center gap-1 rounded-md bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
                            <Building2 className="h-3 w-3 text-gray-500" />
                            {pos.department.name}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">Unassigned</span>
                        )}
                      </td>

                      <td className="px-6 py-4">
                        {pos.jobLevel ? (
                          <span className="inline-flex items-center rounded-full bg-purple-50 px-2.5 py-0.5 text-xs font-medium text-purple-700">
                            {pos.jobLevel}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </td>

                      <td className="px-6 py-4 text-xs font-mono">
                        <span className="inline-flex items-center gap-1 text-gray-700">
                          <DollarSign className="h-3.5 w-3.5 text-gray-400" />
                          {formatSalaryRange(pos.minSalary, pos.maxSalary)}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        {pos.isActive ? (
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
                            onClick={() => handleEdit(pos)}
                            title="Edit"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-gray-500 hover:text-red-600"
                            onClick={() => handleDeletePrompt(pos)}
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
        <PositionModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={fetchPositions}
          position={selectedPos}
        />

        {/* Delete Confirmation Modal */}
        <DeletePositionModal
          isOpen={!!deleteModalPos}
          position={deleteModalPos}
          onClose={() => setDeleteModalPos(null)}
          onSuccess={fetchPositions}
        />
      </div>
    </DashboardLayout>
  );
}
