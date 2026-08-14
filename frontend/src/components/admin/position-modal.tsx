"use client";

import { useState, useEffect } from "react";
import { Position, CreatePositionInput } from "@/types/position";
import { DepartmentTreeItem } from "@/types/department";
import { apiRequest } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface PositionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  position?: Position | null;
}

const JOB_LEVEL_OPTIONS = [
  "Junior",
  "Mid",
  "Senior",
  "Lead",
  "Manager",
  "Director",
  "Executive",
];

export function PositionModal({
  isOpen,
  onClose,
  onSuccess,
  position,
}: PositionModalProps) {
  const isEditing = !!position;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [departments, setDepartments] = useState<DepartmentTreeItem[]>([]);

  const [formData, setFormData] = useState<CreatePositionInput>({
    code: "",
    title: "",
    departmentId: "",
    description: "",
    jobLevel: "",
    minSalary: undefined,
    maxSalary: undefined,
    isActive: true,
  });

  useEffect(() => {
    if (isOpen) {
      fetchDepartments();
      if (position) {
        setFormData({
          code: position.code || "",
          title: position.title || "",
          departmentId: position.departmentId || "",
          description: position.description || "",
          jobLevel: position.jobLevel || "",
          minSalary: position.minSalary ?? undefined,
          maxSalary: position.maxSalary ?? undefined,
          isActive: position.isActive ?? true,
        });
      } else {
        setFormData({
          code: "",
          title: "",
          departmentId: "",
          description: "",
          jobLevel: "",
          minSalary: undefined,
          maxSalary: undefined,
          isActive: true,
        });
      }
      setError(null);
    }
  }, [isOpen, position]);

  const fetchDepartments = async () => {
    try {
      const deptsRes = await apiRequest<DepartmentTreeItem[]>("/departments/tree").catch(() => []);
      setDepartments(deptsRes || []);
      if (!position && deptsRes && deptsRes.length > 0 && !formData.departmentId) {
        setFormData((prev) => ({ ...prev, departmentId: deptsRes[0].id }));
      }
    } catch {
      // Ignore
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!formData.departmentId) {
        throw new Error("Department selection is required");
      }

      if (
        formData.minSalary !== undefined &&
        formData.minSalary !== null &&
        formData.maxSalary !== undefined &&
        formData.maxSalary !== null &&
        formData.maxSalary < formData.minSalary
      ) {
        throw new Error("Maximum salary must be greater than or equal to minimum salary");
      }

      const payload = {
        code: formData.code.trim().toUpperCase(),
        title: formData.title.trim(),
        departmentId: formData.departmentId,
        description: formData.description?.trim() || null,
        jobLevel: formData.jobLevel || null,
        minSalary: formData.minSalary !== undefined && formData.minSalary !== null && !isNaN(Number(formData.minSalary)) ? Number(formData.minSalary) : null,
        maxSalary: formData.maxSalary !== undefined && formData.maxSalary !== null && !isNaN(Number(formData.maxSalary)) ? Number(formData.maxSalary) : null,
        isActive: formData.isActive ?? true,
      };

      if (isEditing && position) {
        await apiRequest(`/positions/${position.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        toast({
          title: "Position updated",
          description: `Position "${payload.title}" (${payload.code}) was updated successfully.`,
          variant: "success",
        });
      } else {
        await apiRequest("/positions", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        toast({
          title: "Position created",
          description: `Position "${payload.title}" (${payload.code}) was created successfully.`,
          variant: "success",
        });
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to save position");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <h2 className="text-lg font-bold text-gray-900">
            {isEditing ? "Edit Position" : "Create New Position"}
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
                placeholder="e.g. POS-ENG-01"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="title">
                Position Title <span className="text-red-500">*</span>
              </Label>
              <Input
                id="title"
                placeholder="e.g. Senior Software Engineer"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                disabled={loading}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="departmentId">
                Department <span className="text-red-500">*</span>
              </Label>
              <select
                id="departmentId"
                className="w-full rounded-md border border-gray-300 p-2 text-sm focus:border-blue-500 focus:outline-none"
                value={formData.departmentId}
                onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                required
                disabled={loading}
              >
                <option value="">Select Department</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.code})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="jobLevel">Career / Job Level</Label>
              <select
                id="jobLevel"
                className="w-full rounded-md border border-gray-300 p-2 text-sm focus:border-blue-500 focus:outline-none"
                value={formData.jobLevel || ""}
                onChange={(e) => setFormData({ ...formData, jobLevel: e.target.value })}
                disabled={loading}
              >
                <option value="">Select Level</option>
                {JOB_LEVEL_OPTIONS.map((level) => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              rows={2}
              className="w-full rounded-md border border-gray-300 p-2 text-sm focus:border-blue-500 focus:outline-none"
              placeholder="Brief description of position responsibilities..."
              value={formData.description || ""}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              disabled={loading}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="minSalary">Min Salary</Label>
              <Input
                id="minSalary"
                type="number"
                step="0.01"
                placeholder="e.g. 15000"
                value={formData.minSalary ?? ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    minSalary: e.target.value !== "" ? parseFloat(e.target.value) : undefined,
                  })
                }
                disabled={loading}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="maxSalary">Max Salary</Label>
              <Input
                id="maxSalary"
                type="number"
                step="0.01"
                placeholder="e.g. 25000"
                value={formData.maxSalary ?? ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    maxSalary: e.target.value !== "" ? parseFloat(e.target.value) : undefined,
                  })
                }
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
            <Label htmlFor="isActive" className="cursor-pointer">
              Position Active
            </Label>
          </div>

          <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : isEditing ? "Update Position" : "Create Position"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
