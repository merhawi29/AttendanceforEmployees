"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PayslipCard } from "@/components/payroll/payslip-card";
import { payrollApi } from "@/lib/payroll-api";
import { PayrollRecord, PayrollStatus } from "@/types/payroll";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Edit, CheckCircle2, DollarSign, X } from "lucide-react";

export default function AdminPayrollDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { toast } = useToast();

  const [record, setRecord] = useState<PayrollRecord | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Edit modal
  const [isEditOpen, setIsEditOpen] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [formData, setFormData] = useState({
    basicSalary: 0,
    housingAllowance: 0,
    transportAllowance: 0,
    otherAllowance: 0,
    bonus: 0,
    deduction: 0,
    remarks: "",
    status: "DRAFT" as PayrollStatus,
  });

  const fetchRecord = async () => {
    setLoading(true);
    try {
      const data = await payrollApi.getPayrollById(id);
      setRecord(data);
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to load payroll record.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecord();
  }, [id]);

  const handleOpenEdit = () => {
    if (!record) return;
    setFormData({
      basicSalary: Number(record.basicSalary),
      housingAllowance: Number(record.housingAllowance),
      transportAllowance: Number(record.transportAllowance),
      otherAllowance: Number(record.otherAllowance),
      bonus: Number(record.bonus),
      deduction: Number(record.deduction),
      remarks: record.remarks || "",
      status: record.status,
    });
    setIsEditOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await payrollApi.updatePayrollRecord(id, {
        basicSalary: Number(formData.basicSalary),
        housingAllowance: Number(formData.housingAllowance),
        transportAllowance: Number(formData.transportAllowance),
        otherAllowance: Number(formData.otherAllowance),
        bonus: Number(formData.bonus),
        deduction: Number(formData.deduction),
        remarks: formData.remarks.trim() || null,
        status: formData.status,
      });

      setRecord(updated);
      toast({ title: "Updated", description: "Payroll record updated successfully." });
      setIsEditOpen(false);
    } catch (err: any) {
      toast({
        title: "Update Failed",
        description: err.message || "Failed to update record.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleQuickStatusChange = async (newStatus: PayrollStatus) => {
    try {
      const updated = await payrollApi.updatePayrollRecord(id, { status: newStatus });
      setRecord(updated);
      toast({ title: "Status Changed", description: `Payroll marked as ${newStatus}` });
    } catch (err: any) {
      toast({
        title: "Failed",
        description: err.message || "Failed to change status.",
        variant: "destructive",
      });
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Navigation & Controls */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between print:hidden">
          <Link href="/admin/payroll">
            <Button variant="ghost" size="sm" className="gap-2 text-gray-600">
              <ArrowLeft className="h-4 w-4" /> Back to Dashboard
            </Button>
          </Link>
          {record && (
            <div className="flex flex-wrap items-center gap-3">
              {record.status !== "PAID" && (
                <Button variant="outline" size="sm" onClick={handleOpenEdit} className="gap-2">
                  <Edit className="h-4 w-4" /> Edit Record
                </Button>
              )}
              {record.status === "DRAFT" && (
                <Button
                  size="sm"
                  onClick={() => handleQuickStatusChange("PROCESSED")}
                  className="gap-2 bg-blue-600 hover:bg-blue-700"
                >
                  <CheckCircle2 className="h-4 w-4" /> Process Payroll
                </Button>
              )}
              {record.status === "PROCESSED" && (
                <Button
                  size="sm"
                  onClick={() => handleQuickStatusChange("PAID")}
                  className="gap-2 bg-green-600 hover:bg-green-700"
                >
                  <DollarSign className="h-4 w-4" /> Mark as Paid
                </Button>
              )}
            </div>
          )}
        </div>

        {loading ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center text-gray-400">
            Loading payslip details...
          </div>
        ) : !record ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center text-gray-400">
            Payroll record not found.
          </div>
        ) : (
          <PayslipCard payroll={record} showActions={true} />
        )}

        {/* Edit Modal Overlay */}
        {isEditOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
            <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <h3 className="text-lg font-bold text-gray-900">Edit Payroll Record</h3>
                <button
                  onClick={() => setIsEditOpen(false)}
                  className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSaveEdit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-700">Basic Salary</label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.basicSalary}
                      onChange={(e) => setFormData({ ...formData, basicSalary: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-700">Housing Allowance</label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.housingAllowance}
                      onChange={(e) => setFormData({ ...formData, housingAllowance: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-700">Transport</label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.transportAllowance}
                      onChange={(e) => setFormData({ ...formData, transportAllowance: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-700">Other Allowance</label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.otherAllowance}
                      onChange={(e) => setFormData({ ...formData, otherAllowance: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-700">Bonus</label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.bonus}
                      onChange={(e) => setFormData({ ...formData, bonus: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-700">Deduction</label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.deduction}
                      onChange={(e) => setFormData({ ...formData, deduction: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-700">Payroll Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as PayrollStatus })}
                      className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="DRAFT">Draft</option>
                      <option value="PROCESSED">Processed</option>
                      <option value="PAID">Paid</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-700">Remarks / Notes</label>
                  <Input
                    type="text"
                    placeholder="Optional notes..."
                    value={formData.remarks}
                    onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                  />
                </div>

                <div className="pt-2 flex justify-end gap-3">
                  <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={saving} className="bg-blue-600 hover:bg-blue-700">
                    {saving ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
