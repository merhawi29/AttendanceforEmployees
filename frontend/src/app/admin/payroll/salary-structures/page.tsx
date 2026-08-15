"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { payrollApi } from "@/lib/payroll-api";
import { EmployeeSalaryStructureItem } from "@/types/payroll";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Settings2, Search, Edit3, X } from "lucide-react";

export default function SalaryStructuresPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState<boolean>(true);
  const [items, setItems] = useState<EmployeeSalaryStructureItem[]>([]);
  const [search, setSearch] = useState<string>("");
  const [page, setPage] = useState<number>(1);
  const [pagination, setPagination] = useState<any>({ page: 1, totalPages: 1, total: 0 });

  // Modal edit state
  const [selectedItem, setSelectedItem] = useState<EmployeeSalaryStructureItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);

  const [formData, setFormData] = useState({
    basicSalary: 0,
    housingAllowance: 0,
    transportAllowance: 0,
    otherAllowance: 0,
    bonus: 0,
    deduction: 0,
  });

  const fetchSalaryStructures = async () => {
    setLoading(true);
    try {
      const res = await payrollApi.getSalaryStructures({
        search: search.trim() || undefined,
        page,
        limit: 10,
      });
      setItems(res.data);
      setPagination(res.pagination);
    } catch (err: any) {
      toast({
        title: "Error fetching structures",
        description: err.message || "Failed to load salary structures.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSalaryStructures();
  }, [page]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchSalaryStructures();
  };

  const handleOpenEdit = (item: EmployeeSalaryStructureItem) => {
    setSelectedItem(item);
    setFormData({
      basicSalary: item.salaryStructure.basicSalary || 0,
      housingAllowance: item.salaryStructure.housingAllowance || 0,
      transportAllowance: item.salaryStructure.transportAllowance || 0,
      otherAllowance: item.salaryStructure.otherAllowance || 0,
      bonus: item.salaryStructure.bonus || 0,
      deduction: item.salaryStructure.deduction || 0,
    });
    setIsModalOpen(true);
  };

  const handleSaveStructure = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;
    setSaving(true);
    try {
      await payrollApi.upsertSalaryStructure({
        userId: selectedItem.user.id,
        basicSalary: Number(formData.basicSalary),
        housingAllowance: Number(formData.housingAllowance),
        transportAllowance: Number(formData.transportAllowance),
        otherAllowance: Number(formData.otherAllowance),
        bonus: Number(formData.bonus),
        deduction: Number(formData.deduction),
      });

      toast({
        title: "Salary Structure Saved",
        description: `Updated salary components for ${selectedItem.user.name}`,
      });
      setIsModalOpen(false);
      fetchSalaryStructures();
    } catch (err: any) {
      toast({
        title: "Save Failed",
        description: err.message || "Could not save salary structure.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const formatMoney = (val: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "ETB",
      minimumFractionDigits: 2,
    }).format(val);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header & Back Button */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link href="/admin/payroll">
              <Button variant="ghost" size="sm" className="gap-2 text-gray-600 mb-2">
                <ArrowLeft className="h-4 w-4" /> Back to Payroll Dashboard
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
              <Settings2 className="h-7 w-7 text-blue-600" />
              Employee Salary Structures
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Configure baseline basic salary, allowances (housing, transport, other, bonus), and deductions for each employee.
            </p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="rounded-2xl bg-white p-4 border border-gray-200 shadow-xs">
          <form onSubmit={handleSearchSubmit} className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search employee by name, ID, or department..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
              Search
            </Button>
          </form>
        </div>

        {/* Data Table */}
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50/80 text-xs font-bold uppercase tracking-wider text-gray-500 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3.5">Employee</th>
                  <th className="px-4 py-3.5">Department & Position</th>
                  <th className="px-4 py-3.5 text-right">Basic Salary</th>
                  <th className="px-4 py-3.5 text-right">Housing</th>
                  <th className="px-4 py-3.5 text-right">Transport</th>
                  <th className="px-4 py-3.5 text-right">Other / Bonus</th>
                  <th className="px-4 py-3.5 text-right">Total Allowances</th>
                  <th className="px-4 py-3.5 text-right">Deduction</th>
                  <th className="px-4 py-3.5 text-right">Gross Salary</th>
                  <th className="px-4 py-3.5 text-right">Net Salary</th>
                  <th className="px-4 py-3.5 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan={11} className="py-12 text-center text-gray-400">
                      Loading employee salary structures...
                    </td>
                  </tr>
                ) : items.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="py-12 text-center text-gray-400">
                      No active employees found.
                    </td>
                  </tr>
                ) : (
                  items.map((item) => (
                    <tr key={item.user.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-gray-900">{item.user.name}</div>
                        <div className="text-xs text-gray-400">{item.user.employeeId}</div>
                      </td>
                      <td className="px-4 py-3.5 text-xs text-gray-700">
                        <div>{item.user.department?.name || "N/A"}</div>
                        <div className="text-gray-400">{item.user.position?.title || "N/A"}</div>
                      </td>
                      <td className="px-4 py-3.5 text-right font-semibold text-gray-900">
                        {formatMoney(item.salaryStructure.basicSalary)}
                      </td>
                      <td className="px-4 py-3.5 text-right font-medium text-gray-700">
                        {formatMoney(item.salaryStructure.housingAllowance)}
                      </td>
                      <td className="px-4 py-3.5 text-right font-medium text-gray-700">
                        {formatMoney(item.salaryStructure.transportAllowance)}
                      </td>
                      <td className="px-4 py-3.5 text-right font-medium text-gray-700">
                        {formatMoney(item.salaryStructure.otherAllowance + item.salaryStructure.bonus)}
                      </td>
                      <td className="px-4 py-3.5 text-right font-bold text-emerald-600">
                        +{formatMoney(item.computed.totalAllowances)}
                      </td>
                      <td className="px-4 py-3.5 text-right font-medium text-rose-600">
                        -{formatMoney(item.salaryStructure.deduction)}
                      </td>
                      <td className="px-4 py-3.5 text-right font-bold text-gray-900">
                        {formatMoney(item.computed.grossSalary)}
                      </td>
                      <td className="px-4 py-3.5 text-right font-black text-blue-700">
                        {formatMoney(item.computed.netSalary)}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenEdit(item)}
                          className="h-8 text-xs gap-1 text-blue-600 hover:text-blue-700 border-blue-200"
                        >
                          <Edit3 className="h-3.5 w-3.5" /> Edit
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Edit Modal Overlay */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Edit Salary Structure</h3>
                  {selectedItem && (
                    <p className="text-xs text-gray-500">
                      {selectedItem.user.name} ({selectedItem.user.employeeId})
                    </p>
                  )}
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSaveStructure} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-700">Basic Salary (ETB)</label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.basicSalary}
                    onChange={(e) => setFormData({ ...formData, basicSalary: parseFloat(e.target.value) || 0 })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
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
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-700">Transport Allowance</label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.transportAllowance}
                      onChange={(e) => setFormData({ ...formData, transportAllowance: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
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

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-700">Deduction (ETB)</label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.deduction}
                    onChange={(e) => setFormData({ ...formData, deduction: parseFloat(e.target.value) || 0 })}
                  />
                </div>

                {/* Computed Totals Preview */}
                <div className="rounded-xl bg-blue-50/80 p-3 text-xs space-y-1 text-blue-900 font-medium">
                  <div className="flex justify-between">
                    <span>Gross Salary:</span>
                    <span className="font-bold">
                      {formatMoney(
                        Number(formData.basicSalary) +
                          Number(formData.housingAllowance) +
                          Number(formData.transportAllowance) +
                          Number(formData.otherAllowance) +
                          Number(formData.bonus)
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Net Take-Home:</span>
                    <span className="font-extrabold text-blue-700">
                      {formatMoney(
                        Number(formData.basicSalary) +
                          Number(formData.housingAllowance) +
                          Number(formData.transportAllowance) +
                          Number(formData.otherAllowance) +
                          Number(formData.bonus) -
                          Number(formData.deduction)
                      )}
                    </span>
                  </div>
                </div>

                <div className="pt-2 flex justify-end gap-3">
                  <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={saving} className="bg-blue-600 hover:bg-blue-700">
                    {saving ? "Saving..." : "Save Salary Structure"}
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
