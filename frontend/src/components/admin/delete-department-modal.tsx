"use client";

import { useState } from "react";
import { Department } from "@/types/department";
import { apiRequest } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { AlertTriangle, Trash2, X } from "lucide-react";

interface DeleteDepartmentModalProps {
  isOpen: boolean;
  department: Department | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function DeleteDepartmentModal({
  isOpen,
  department,
  onClose,
  onSuccess,
}: DeleteDepartmentModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !department) return null;

  const hasMembers = department.memberCount > 0;
  const hasSubDepartments = department.subDepartmentCount > 0;
  const cannotDelete = hasMembers || hasSubDepartments;

  const handleDelete = async () => {
    if (cannotDelete) return;

    setLoading(true);
    setError(null);

    try {
      await apiRequest(`/departments/${department.id}`, { method: "DELETE" });
      toast({
        title: "Department deleted",
        description: `Department "${department.name}" (${department.code}) was removed successfully.`,
        variant: "success",
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to delete department");
      toast({
        title: "Delete failed",
        description: err.message || "Failed to delete department",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <div className="flex items-center gap-2 text-red-600 font-bold text-lg">
            <Trash2 className="h-5 w-5" />
            Delete Department
          </div>
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

        <div className="mt-4 space-y-3">
          <p className="text-sm text-gray-600">
            Are you sure you want to delete department{" "}
            <span className="font-semibold text-gray-900">
              {department.name} ({department.code})
            </span>
            ?
          </p>

          {cannotDelete && (
            <div className="rounded-lg bg-amber-50 border border-amber-200 p-3.5 text-xs text-amber-800 space-y-1">
              <div className="flex items-center gap-1.5 font-semibold text-amber-900">
                <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
                Deletion Blocked
              </div>
              {hasMembers && (
                <p>• Department has {department.memberCount} assigned employee(s). Reassign them first.</p>
              )}
              {hasSubDepartments && (
                <p>• Department has {department.subDepartmentCount} sub-department(s). Reassign or delete sub-departments first.</p>
              )}
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-3 border-t border-gray-100 pt-4">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={loading || cannotDelete}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {loading ? "Deleting..." : "Confirm Delete"}
          </Button>
        </div>
      </div>
    </div>
  );
}
