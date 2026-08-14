"use client";

import { useState, useEffect, useRef } from "react";
import { Department, DepartmentFormData, DepartmentTreeItem } from "@/types/department";
import { Employee } from "@/types/employee";
import { apiRequest } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, Search, Check, UserCheck } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface DepartmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  department?: Department | null;
}

export function DepartmentModal({
  isOpen,
  onClose,
  onSuccess,
  department,
}: DepartmentModalProps) {
  const isEditing = !!department;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [parentDepartments, setParentDepartments] = useState<DepartmentTreeItem[]>([]);

  // Searchable Department Head Dropdown State
  const [headSearch, setHeadSearch] = useState("");
  const [isHeadDropdownOpen, setIsHeadDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState<DepartmentFormData>({
    code: "",
    name: "",
    description: "",
    managerId: "",
    parentDepartmentId: "",
    costCenterCode: "",
    isActive: true,
  });

  useEffect(() => {
    if (isOpen) {
      fetchOptions();
      if (department) {
        setFormData({
          code: department.code || "",
          name: department.name || "",
          description: department.description || "",
          managerId: department.managerId || "",
          parentDepartmentId: department.parentDepartmentId || "",
          costCenterCode: department.costCenterCode || "",
          isActive: department.isActive ?? true,
        });
      } else {
        setFormData({
          code: "",
          name: "",
          description: "",
          managerId: "",
          parentDepartmentId: "",
          costCenterCode: "",
          isActive: true,
        });
      }
      setHeadSearch("");
      setIsHeadDropdownOpen(false);
      setError(null);
    }
  }, [isOpen, department]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsHeadDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchOptions = async () => {
    try {
      const [empsRes, deptsRes] = await Promise.all([
        apiRequest<{ employees: Employee[] }>("/employees?limit=100&isActive=true").catch(() => ({ employees: [] })),
        apiRequest<DepartmentTreeItem[]>("/departments/tree").catch(() => []),
      ]);
      setEmployees((empsRes.employees || []).filter((e) => e.isActive));
      setParentDepartments((deptsRes || []).filter((d) => !department || d.id !== department.id));
    } catch {
      // Ignore non-critical load failure
    }
  };

  const selectedHeadEmployee = employees.find((e) => e.id === formData.managerId);

  const filteredEmployees = employees.filter((emp) => {
    if (!headSearch.trim()) return true;
    const term = headSearch.toLowerCase().trim();
    return (
      emp.name.toLowerCase().includes(term) ||
      emp.employeeId.toLowerCase().includes(term) ||
      emp.email.toLowerCase().includes(term)
    );
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const payload = {
        ...formData,
        code: formData.code.trim().toUpperCase(),
        name: formData.name.trim(),
        description: formData.description?.trim() || null,
        managerId: formData.managerId || null,
        parentDepartmentId: formData.parentDepartmentId || null,
        costCenterCode: formData.costCenterCode?.trim() || null,
      };

      if (isEditing && department) {
        await apiRequest(`/departments/${department.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        toast({
          title: "Department updated",
          description: `Department "${payload.name}" (${payload.code}) was updated successfully.`,
          variant: "success",
        });
      } else {
        await apiRequest("/departments", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        toast({
          title: "Department created",
          description: `Department "${payload.name}" (${payload.code}) was created successfully.`,
          variant: "success",
        });
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to save department");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <h2 className="text-lg font-bold text-gray-900">
            {isEditing ? "Edit Department" : "Create New Department"}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="code">
                Code <span className="text-red-500">*</span>
              </Label>
              <Input
                id="code"
                placeholder="e.g. HR, ENG"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="name">
                Department Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                placeholder="e.g. Human Resources"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                disabled={loading}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              rows={2}
              className="w-full rounded-md border border-gray-300 p-2 text-sm focus:border-blue-500 focus:outline-none"
              placeholder="Brief description of department scope..."
              value={formData.description || ""}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              disabled={loading}
            />
          </div>

          {/* Searchable Department Head Dropdown */}
          <div className="space-y-1.5" ref={dropdownRef}>
            <Label>Department Head (Manager)</Label>
            <div className="relative">
              <div
                className="flex items-center justify-between rounded-md border border-gray-300 p-2 text-sm bg-white cursor-pointer hover:border-blue-400 focus:outline-none"
                onClick={() => setIsHeadDropdownOpen(!isHeadDropdownOpen)}
              >
                {selectedHeadEmployee ? (
                  <div className="flex items-center gap-2">
                    <UserCheck className="h-4 w-4 text-blue-600" />
                    <div>
                      <span className="font-semibold text-gray-900">{selectedHeadEmployee.name}</span>
                      <span className="ml-1.5 text-xs text-gray-500 font-mono">
                        ({selectedHeadEmployee.employeeId})
                      </span>
                    </div>
                  </div>
                ) : (
                  <span className="text-gray-400 italic">No Head Assigned</span>
                )}

                {formData.managerId && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFormData({ ...formData, managerId: "" });
                    }}
                    className="p-1 text-gray-400 hover:text-gray-600"
                    title="Clear Department Head"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* Searchable Menu Popup */}
              {isHeadDropdownOpen && (
                <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-56 overflow-y-auto rounded-md border border-gray-200 bg-white p-2 shadow-lg space-y-1">
                  <div className="relative mb-2">
                    <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-gray-400" />
                    <input
                      type="text"
                      className="w-full rounded-md border border-gray-200 pl-8 pr-3 py-1.5 text-xs focus:border-blue-500 focus:outline-none"
                      placeholder="Search employee by name, ID, or email..."
                      value={headSearch}
                      onChange={(e) => setHeadSearch(e.target.value)}
                      autoFocus
                    />
                  </div>

                  <div
                    className={`flex items-center justify-between rounded px-2.5 py-1.5 text-xs cursor-pointer ${
                      !formData.managerId ? "bg-blue-50 text-blue-700 font-medium" : "hover:bg-gray-50 text-gray-700"
                    }`}
                    onClick={() => {
                      setFormData({ ...formData, managerId: "" });
                      setIsHeadDropdownOpen(false);
                    }}
                  >
                    <span className="italic">No Head Assigned</span>
                    {!formData.managerId && <Check className="h-3.5 w-3.5 text-blue-600" />}
                  </div>

                  {filteredEmployees.length === 0 ? (
                    <p className="px-2 py-3 text-center text-xs text-gray-400">No active employees match search</p>
                  ) : (
                    filteredEmployees.map((emp) => {
                      const isSelected = formData.managerId === emp.id;
                      return (
                        <div
                          key={emp.id}
                          className={`flex items-center justify-between rounded px-2.5 py-2 text-xs cursor-pointer transition-colors ${
                            isSelected ? "bg-blue-50 text-blue-700 font-semibold" : "hover:bg-gray-50 text-gray-800"
                          }`}
                          onClick={() => {
                            setFormData({ ...formData, managerId: emp.id });
                            setIsHeadDropdownOpen(false);
                          }}
                        >
                          <div>
                            <p className="font-medium text-gray-900">{emp.name}</p>
                            <p className="text-[11px] text-gray-400 font-mono">
                              ID: {emp.employeeId} | {emp.departmentRef?.name || emp.department || "Unassigned"}
                            </p>
                          </div>
                          {isSelected && <Check className="h-4 w-4 text-blue-600" />}
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="parentDepartmentId">Parent Department</Label>
              <select
                id="parentDepartmentId"
                className="w-full rounded-md border border-gray-300 p-2 text-sm focus:border-blue-500 focus:outline-none"
                value={formData.parentDepartmentId || ""}
                onChange={(e) => setFormData({ ...formData, parentDepartmentId: e.target.value })}
                disabled={loading}
              >
                <option value="">None (Top-Level)</option>
                {parentDepartments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.code})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="costCenterCode">Cost Center Code</Label>
              <Input
                id="costCenterCode"
                placeholder="e.g. CC-1001"
                value={formData.costCenterCode || ""}
                onChange={(e) => setFormData({ ...formData, costCenterCode: e.target.value })}
                disabled={loading}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="isActive"
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              disabled={loading}
            />
            <Label htmlFor="isActive" className="cursor-pointer text-xs font-medium text-gray-700">
              Department Active
            </Label>
          </div>

          <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : isEditing ? "Update Department" : "Create Department"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
