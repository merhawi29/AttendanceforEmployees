"use client";

import { useState } from "react";
import { Employee } from "@/types/employee";
import { apiRequest } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { AlertTriangle, X } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface DeleteEmployeeModalProps {
  isOpen: boolean;
  employee: Employee | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function DeleteEmployeeModal({
  isOpen,
  employee,
  onClose,
  onSuccess,
}: DeleteEmployeeModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !employee) return null;

  const handleDelete = async () => {
    setLoading(true);
    setError(null);

    try {
      await apiRequest(`/employees/${employee.id}`, { method: "DELETE" });
      toast({
        title: "Employee deleted",
        description: `Employee "${employee.name}" (${employee.employeeId}) was deleted successfully.`,
        variant: "success",
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to delete employee");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <div className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            <h2 className="text-lg font-bold">Delete Employee</h2>
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
            Are you sure you want to remove or deactivate{" "}
            <span className="font-semibold text-gray-900">
              "{employee.name}" ({employee.employeeId})
            </span>
            ?
          </p>
          <div className="rounded-lg bg-amber-50 p-3 text-xs text-amber-800">
            <strong>Attendance Preservation:</strong> If this employee has existing attendance records, their account will be safely deactivated to preserve historical attendance and audit logs.
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3 border-t border-gray-100 pt-4">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            type="button"
            className="bg-red-600 hover:bg-red-700 text-white"
            onClick={handleDelete}
            disabled={loading}
          >
            {loading ? "Processing..." : "Deactivate / Delete"}
          </Button>
        </div>
      </div>
    </div>
  );
}
