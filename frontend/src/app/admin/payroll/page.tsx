"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { payrollApi } from "@/lib/payroll-api";
import { PayrollRecord, PayrollStatus } from "@/types/payroll";
import { useToast } from "@/hooks/use-toast";
import {
  CreditCard,
  PlusCircle,
  Settings2,
  FileText,
  Search,
  Eye,
  CheckCircle2,
  DollarSign,
  TrendingUp,
  AlertCircle,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const months = [
  { value: 1, label: "January" },
  { value: 2, label: "February" },
  { value: 3, label: "March" },
  { value: 4, label: "April" },
  { value: 5, label: "May" },
  { value: 6, label: "June" },
  { value: 7, label: "July" },
  { value: 8, label: "August" },
  { value: 9, label: "September" },
  { value: 10, label: "October" },
  { value: 11, label: "November" },
  { value: 12, label: "December" },
];

export default function AdminPayrollDashboard() {
  const { toast } = useToast();
  const currentDate = new Date();

  const [month, setMonth] = useState<number>(currentDate.getMonth() + 1);
  const [year, setYear] = useState<number>(currentDate.getFullYear());
  const [status, setStatus] = useState<PayrollStatus | "ALL">("ALL");
  const [search, setSearch] = useState<string>("");
  const [page, setPage] = useState<number>(1);

  const [loading, setLoading] = useState<boolean>(true);
  const [records, setRecords] = useState<PayrollRecord[]>([]);
  const [summary, setSummary] = useState<any>({
    totalRecords: 0,
    totalGrossSalary: 0,
    totalAllowances: 0,
    totalDeductions: 0,
    totalNetSalary: 0,
  });
  const [pagination, setPagination] = useState<any>({
    page: 1,
    totalPages: 1,
    total: 0,
  });

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [processingBatch, setProcessingBatch] = useState<boolean>(false);

  const fetchPayroll = async () => {
    setLoading(true);
    try {
      const res = await payrollApi.getPayrollRecords({
        month,
        year,
        status: status === "ALL" ? undefined : status,
        search: search.trim() || undefined,
        page,
        limit: 10,
      });

      setRecords(res.records);
      setSummary(res.summary);
      setPagination(res.pagination);
    } catch (err: any) {
      toast({
        title: "Error fetching payroll",
        description: err.message || "Failed to load payroll records.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayroll();
  }, [month, year, status, page]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchPayroll();
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(records.map((r) => r.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleBatchStatusUpdate = async (newStatus: PayrollStatus) => {
    if (selectedIds.length === 0) return;
    setProcessingBatch(true);
    try {
      const res = await payrollApi.batchUpdateStatus(selectedIds, newStatus);
      toast({
        title: "Status Updated",
        description: res.message,
      });
      setSelectedIds([]);
      fetchPayroll();
    } catch (err: any) {
      toast({
        title: "Failed to update status",
        description: err.message || "Something went wrong.",
        variant: "destructive",
      });
    } finally {
      setProcessingBatch(false);
    }
  };

  const handleDeleteRecord = async (id: string) => {
    if (!confirm("Are you sure you want to delete this draft payroll record?")) return;
    try {
      await payrollApi.deletePayrollRecord(id);
      toast({ title: "Deleted", description: "Draft payroll record removed." });
      fetchPayroll();
    } catch (err: any) {
      toast({
        title: "Delete Failed",
        description: err.message || "Failed to delete record.",
        variant: "destructive",
      });
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
        {/* Page Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
              <CreditCard className="h-7 w-7 text-blue-600" />
              Payroll Management
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Generate monthly employee payroll, adjust allowances/deductions, print payslips, and view summary reports.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link href="/admin/payroll/salary-structures">
              <Button variant="outline" size="sm" className="gap-2">
                <Settings2 className="h-4 w-4" />
                Salary Structures
              </Button>
            </Link>
            <Link href="/admin/payroll/reports">
              <Button variant="outline" size="sm" className="gap-2">
                <FileText className="h-4 w-4" />
                Payroll Reports
              </Button>
            </Link>
            <Link href="/admin/payroll/generate">
              <Button size="sm" className="gap-2 bg-blue-600 hover:bg-blue-700">
                <PlusCircle className="h-4 w-4" />
                Generate Payroll
              </Button>
            </Link>
          </div>
        </div>

        {/* Summary Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Gross Salary</span>
              <div className="rounded-xl bg-blue-50 p-2 text-blue-600">
                <TrendingUp className="h-5 w-5" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900 mt-3">{formatMoney(summary.totalGrossSalary)}</p>
            <p className="text-xs text-gray-500 mt-1">{summary.totalRecords} payroll records loaded</p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Allowances</span>
              <div className="rounded-xl bg-emerald-50 p-2 text-emerald-600">
                <DollarSign className="h-5 w-5" />
              </div>
            </div>
            <p className="text-2xl font-bold text-emerald-700 mt-3">{formatMoney(summary.totalAllowances)}</p>
            <p className="text-xs text-emerald-600 mt-1">Housing, Transport, Bonus, Other</p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Deductions</span>
              <div className="rounded-xl bg-rose-50 p-2 text-rose-600">
                <AlertCircle className="h-5 w-5" />
              </div>
            </div>
            <p className="text-2xl font-bold text-rose-700 mt-3">{formatMoney(summary.totalDeductions)}</p>
            <p className="text-xs text-rose-600 mt-1">Fixed standard deductions</p>
          </div>

          <div className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-800 uppercase tracking-wider">Total Net Payable</span>
              <div className="rounded-xl bg-blue-600 p-2 text-white">
                <CreditCard className="h-5 w-5" />
              </div>
            </div>
            <p className="text-2xl font-black text-blue-950 mt-3">{formatMoney(summary.totalNetSalary)}</p>
            <p className="text-xs text-blue-700 mt-1">Actual take-home total cost</p>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="rounded-2xl bg-white p-4 border border-gray-200 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center gap-4">
            {/* Month Picker */}
            <div className="w-40">
              <label className="text-xs font-medium text-gray-500 block mb-1">Month</label>
              <select
                value={month}
                onChange={(e) => setMonth(parseInt(e.target.value, 10))}
                className="flex h-9 w-full rounded-md border border-gray-300 bg-white px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {months.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Year Picker */}
            <div className="w-32">
              <label className="text-xs font-medium text-gray-500 block mb-1">Year</label>
              <select
                value={year}
                onChange={(e) => setYear(parseInt(e.target.value, 10))}
                className="flex h-9 w-full rounded-md border border-gray-300 bg-white px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {[2024, 2025, 2026, 2027].map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div className="w-36">
              <label className="text-xs font-medium text-gray-500 block mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="flex h-9 w-full rounded-md border border-gray-300 bg-white px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">All Statuses</option>
                <option value="DRAFT">Draft</option>
                <option value="PROCESSED">Processed</option>
                <option value="PAID">Paid</option>
              </select>
            </div>

            {/* Search Input */}
            <form onSubmit={handleSearchSubmit} className="flex-1 min-w-[200px]">
              <label className="text-xs font-medium text-gray-500 block mb-1">Search Employee</label>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search by name, ID, email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 h-9"
                />
              </div>
            </form>
          </div>

          {/* Batch Actions Bar */}
          {selectedIds.length > 0 && (
            <div className="flex items-center justify-between rounded-xl bg-blue-50 px-4 py-2.5 border border-blue-200">
              <span className="text-xs font-semibold text-blue-900">
                {selectedIds.length} payroll record(s) selected
              </span>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={processingBatch}
                  onClick={() => handleBatchStatusUpdate("PROCESSED")}
                  className="h-8 text-xs bg-white border-blue-300 text-blue-700 hover:bg-blue-100"
                >
                  <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Mark Processed
                </Button>
                <Button
                  size="sm"
                  disabled={processingBatch}
                  onClick={() => handleBatchStatusUpdate("PAID")}
                  className="h-8 text-xs bg-green-600 hover:bg-green-700 text-white"
                >
                  <DollarSign className="h-3.5 w-3.5 mr-1" /> Mark Paid
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Data Table */}
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50/80 text-xs font-bold uppercase tracking-wider text-gray-500 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3.5 w-10">
                    <input
                      type="checkbox"
                      checked={records.length > 0 && selectedIds.length === records.length}
                      onChange={handleSelectAll}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                  <th className="px-4 py-3.5">Employee</th>
                  <th className="px-4 py-3.5">Department</th>
                  <th className="px-4 py-3.5 text-right">Basic Salary</th>
                  <th className="px-4 py-3.5 text-right">Allowances</th>
                  <th className="px-4 py-3.5 text-right">Gross Salary</th>
                  <th className="px-4 py-3.5 text-right">Deductions</th>
                  <th className="px-4 py-3.5 text-right">Net Salary</th>
                  <th className="px-4 py-3.5 text-center">Status</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-gray-400">
                      Loading payroll records...
                    </td>
                  </tr>
                ) : records.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-gray-400">
                      No payroll records found for this period. Click "Generate Payroll" to get started.
                    </td>
                  </tr>
                ) : (
                  records.map((rec) => (
                    <tr key={rec.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="px-4 py-3.5">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(rec.id)}
                          onChange={() => handleSelectOne(rec.id)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-gray-900">{rec.user.name}</div>
                        <div className="text-xs text-gray-400">{rec.user.employeeId}</div>
                      </td>
                      <td className="px-4 py-3.5 text-xs text-gray-700">
                        {rec.user.departmentRef?.name || "N/A"}
                      </td>
                      <td className="px-4 py-3.5 text-right font-medium text-gray-800">
                        {formatMoney(rec.basicSalary)}
                      </td>
                      <td className="px-4 py-3.5 text-right font-medium text-emerald-600">
                        +{formatMoney(rec.totalAllowances)}
                      </td>
                      <td className="px-4 py-3.5 text-right font-bold text-gray-900">
                        {formatMoney(rec.grossSalary)}
                      </td>
                      <td className="px-4 py-3.5 text-right font-medium text-rose-600">
                        -{formatMoney(rec.totalDeductions)}
                      </td>
                      <td className="px-4 py-3.5 text-right font-black text-blue-700">
                        {formatMoney(rec.netSalary)}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        {rec.status === "PAID" ? (
                          <span className="inline-flex rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-800">
                            Paid
                          </span>
                        ) : rec.status === "PROCESSED" ? (
                          <span className="inline-flex rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-800">
                            Processed
                          </span>
                        ) : (
                          <span className="inline-flex rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
                            Draft
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link href={`/admin/payroll/${rec.id}`}>
                            <Button variant="ghost" size="sm" className="h-8 text-xs gap-1 text-blue-600">
                              <Eye className="h-3.5 w-3.5" /> Details
                            </Button>
                          </Link>
                          {rec.status === "DRAFT" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteRecord(rec.id)}
                              className="h-8 text-xs text-rose-600 hover:text-rose-700"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3 bg-gray-50/50">
              <span className="text-xs text-gray-500">
                Page {pagination.page} of {pagination.totalPages} ({pagination.total} total items)
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                  className="h-8 text-xs gap-1"
                >
                  <ChevronLeft className="h-3.5 w-3.5" /> Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= pagination.totalPages}
                  onClick={() => setPage(page + 1)}
                  className="h-8 text-xs gap-1"
                >
                  Next <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
