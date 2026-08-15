"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { payrollApi } from "@/lib/payroll-api";
import { MonthlyPayrollSummaryReport, DepartmentPayrollSummaryReport, TotalPayrollCostReport } from "@/types/payroll";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, FileText, Building2, TrendingUp, Calendar } from "lucide-react";

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

export default function PayrollReportsPage() {
  const { toast } = useToast();
  const currentDate = new Date();

  const [activeTab, setActiveTab] = useState<"monthly" | "department" | "annual">("monthly");
  const [month, setMonth] = useState<number>(currentDate.getMonth() + 1);
  const [year, setYear] = useState<number>(currentDate.getFullYear());

  const [loading, setLoading] = useState<boolean>(true);
  const [monthlySummary, setMonthlySummary] = useState<MonthlyPayrollSummaryReport | null>(null);
  const [deptSummary, setDeptSummary] = useState<DepartmentPayrollSummaryReport[]>([]);
  const [totalCostReport, setTotalCostReport] = useState<TotalPayrollCostReport | null>(null);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const [mRes, dRes, tRes] = await Promise.all([
        payrollApi.getMonthlySummaryReport({ month, year }),
        payrollApi.getDepartmentSummaryReport({ month, year }),
        payrollApi.getTotalPayrollCostReport({ year }),
      ]);

      setMonthlySummary(mRes);
      setDeptSummary(dRes);
      setTotalCostReport(tRes);
    } catch (err: any) {
      toast({
        title: "Error loading reports",
        description: err.message || "Failed to fetch payroll reports.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [month, year]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "ETB",
      minimumFractionDigits: 2,
    }).format(val);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header & Controls */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link href="/admin/payroll">
              <Button variant="ghost" size="sm" className="gap-2 text-gray-600 mb-2">
                <ArrowLeft className="h-4 w-4" /> Back to Payroll Dashboard
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
              <FileText className="h-7 w-7 text-blue-600" />
              Payroll Analytics & Reports
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Monthly executive payroll summary, department cost distribution, and annual expenditure analytics.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Month selector */}
            <select
              value={month}
              onChange={(e) => setMonth(parseInt(e.target.value, 10))}
              className="flex h-9 w-36 rounded-md border border-gray-300 bg-white px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {months.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>

            {/* Year selector */}
            <select
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value, 10))}
              className="flex h-9 w-28 rounded-md border border-gray-300 bg-white px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {[2024, 2025, 2026, 2027].map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Tab Navigation Buttons */}
        <div className="flex gap-2 border-b border-gray-200 pb-2">
          <button
            onClick={() => setActiveTab("monthly")}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-colors ${
              activeTab === "monthly" ? "bg-blue-600 text-white" : "bg-white text-gray-600 hover:bg-gray-100"
            }`}
          >
            <Calendar className="h-4 w-4" /> Monthly Summary
          </button>
          <button
            onClick={() => setActiveTab("department")}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-colors ${
              activeTab === "department" ? "bg-blue-600 text-white" : "bg-white text-gray-600 hover:bg-gray-100"
            }`}
          >
            <Building2 className="h-4 w-4" /> Department Summary
          </button>
          <button
            onClick={() => setActiveTab("annual")}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-colors ${
              activeTab === "annual" ? "bg-blue-600 text-white" : "bg-white text-gray-600 hover:bg-gray-100"
            }`}
          >
            <TrendingUp className="h-4 w-4" /> Total Payroll Cost ({year})
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === "monthly" && (
          <div className="space-y-6">
            {loading ? (
              <div className="p-12 text-center text-gray-400 bg-white rounded-2xl border border-gray-200">
                Loading monthly summary report...
              </div>
            ) : !monthlySummary ? (
              <div className="p-12 text-center text-gray-400 bg-white rounded-2xl border border-gray-200">
                No data available for {months[month - 1].label} {year}.
              </div>
            ) : (
              <div className="space-y-6">
                {/* Metric Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xs">
                    <span className="text-xs font-semibold text-gray-500 uppercase">Processed Employees</span>
                    <p className="text-3xl font-black text-gray-900 mt-2">{monthlySummary.totalEmployees}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {monthlySummary.draftCount} Drafts · {monthlySummary.processedCount} Processed · {monthlySummary.paidCount} Paid
                    </p>
                  </div>

                  <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xs">
                    <span className="text-xs font-semibold text-gray-500 uppercase">Total Basic Salary</span>
                    <p className="text-2xl font-bold text-gray-900 mt-2">{formatCurrency(monthlySummary.totalBasicSalary)}</p>
                  </div>

                  <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xs">
                    <span className="text-xs font-semibold text-emerald-700 uppercase">Total Allowances</span>
                    <p className="text-2xl font-bold text-emerald-700 mt-2">+{formatCurrency(monthlySummary.totalAllowances)}</p>
                  </div>

                  <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5 shadow-xs">
                    <span className="text-xs font-bold text-blue-800 uppercase">Total Gross Salary</span>
                    <p className="text-2xl font-black text-blue-900 mt-2">{formatCurrency(monthlySummary.totalGrossSalary)}</p>
                  </div>
                </div>

                {/* Summary Table */}
                <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xs space-y-4">
                  <h3 className="text-lg font-bold text-gray-900">
                    Monthly Breakdown Statement - {months[month - 1].label} {year}
                  </h3>
                  <div className="divide-y divide-gray-100 text-sm">
                    <div className="py-3 flex justify-between">
                      <span className="text-gray-600">Total Base Basic Salaries</span>
                      <span className="font-semibold text-gray-900">{formatCurrency(monthlySummary.totalBasicSalary)}</span>
                    </div>
                    <div className="py-3 flex justify-between">
                      <span className="text-gray-600">Total Allowances (Housing, Transport, Other, Bonus)</span>
                      <span className="font-semibold text-emerald-600">+{formatCurrency(monthlySummary.totalAllowances)}</span>
                    </div>
                    <div className="py-3 flex justify-between font-bold bg-gray-50 px-3 rounded-lg">
                      <span className="text-gray-900">Total Monthly Gross Expenditure</span>
                      <span className="text-blue-900">{formatCurrency(monthlySummary.totalGrossSalary)}</span>
                    </div>
                    <div className="py-3 flex justify-between">
                      <span className="text-gray-600">Total Deductions</span>
                      <span className="font-semibold text-rose-600">-{formatCurrency(monthlySummary.totalDeductions)}</span>
                    </div>
                    <div className="py-4 flex justify-between text-base font-black bg-blue-50 px-4 rounded-xl border border-blue-200">
                      <span className="text-blue-950">Total Net Take-Home Payroll</span>
                      <span className="text-blue-700">{formatCurrency(monthlySummary.totalNetSalary)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "department" && (
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xs">
            <div className="p-5 border-b border-gray-200 bg-gray-50/50">
              <h3 className="text-base font-bold text-gray-900">
                Department-Wise Payroll Summary ({months[month - 1].label} {year})
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-gray-50 text-xs font-bold uppercase tracking-wider text-gray-500 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3.5">Department</th>
                    <th className="px-4 py-3.5 text-center">Employees</th>
                    <th className="px-4 py-3.5 text-right">Basic Salary</th>
                    <th className="px-4 py-3.5 text-right">Allowances</th>
                    <th className="px-4 py-3.5 text-right">Deductions</th>
                    <th className="px-4 py-3.5 text-right">Gross Salary</th>
                    <th className="px-4 py-3.5 text-right">Net Salary</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-gray-400">
                        Loading department summary...
                      </td>
                    </tr>
                  ) : deptSummary.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-gray-400">
                        No payroll data available for this month.
                      </td>
                    </tr>
                  ) : (
                    deptSummary.map((d, idx) => (
                      <tr key={idx} className="hover:bg-gray-50/60">
                        <td className="px-4 py-3.5 font-bold text-gray-900">
                          {d.departmentName} {d.departmentCode ? `(${d.departmentCode})` : ""}
                        </td>
                        <td className="px-4 py-3.5 text-center font-semibold text-gray-700">
                          {d.employeeCount}
                        </td>
                        <td className="px-4 py-3.5 text-right font-medium text-gray-800">
                          {formatCurrency(d.totalBasicSalary)}
                        </td>
                        <td className="px-4 py-3.5 text-right font-medium text-emerald-600">
                          +{formatCurrency(d.totalAllowances)}
                        </td>
                        <td className="px-4 py-3.5 text-right font-medium text-rose-600">
                          -{formatCurrency(d.totalDeductions)}
                        </td>
                        <td className="px-4 py-3.5 text-right font-bold text-gray-900">
                          {formatCurrency(d.totalGrossSalary)}
                        </td>
                        <td className="px-4 py-3.5 text-right font-black text-blue-700">
                          {formatCurrency(d.totalNetSalary)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "annual" && (
          <div className="space-y-6">
            {loading ? (
              <div className="p-12 text-center text-gray-400 bg-white rounded-2xl border border-gray-200">
                Loading total cost report...
              </div>
            ) : !totalCostReport ? (
              <div className="p-12 text-center text-gray-400 bg-white rounded-2xl border border-gray-200">
                No annual cost data available.
              </div>
            ) : (
              <div className="space-y-6">
                {/* Annual Totals Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xs">
                    <span className="text-xs font-semibold text-gray-500 uppercase">Annual Gross Cost</span>
                    <p className="text-2xl font-bold text-gray-900 mt-2">{formatCurrency(totalCostReport.annualTotalGross)}</p>
                  </div>
                  <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xs">
                    <span className="text-xs font-semibold text-emerald-700 uppercase">Annual Total Allowances</span>
                    <p className="text-2xl font-bold text-emerald-700 mt-2">+{formatCurrency(totalCostReport.annualTotalAllowances)}</p>
                  </div>
                  <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xs">
                    <span className="text-xs font-semibold text-rose-700 uppercase">Annual Total Deductions</span>
                    <p className="text-2xl font-bold text-rose-700 mt-2">-{formatCurrency(totalCostReport.annualTotalDeductions)}</p>
                  </div>
                  <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5 shadow-xs">
                    <span className="text-xs font-bold text-blue-800 uppercase">Annual Total Net Pay</span>
                    <p className="text-2xl font-black text-blue-900 mt-2">{formatCurrency(totalCostReport.annualTotalNet)}</p>
                  </div>
                </div>

                {/* Monthly Cost Breakdown Table */}
                <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xs">
                  <div className="p-5 border-b border-gray-200 bg-gray-50/50">
                    <h3 className="text-base font-bold text-gray-900">
                      Annual Monthly Expenditure Trend ({totalCostReport.year})
                    </h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-600">
                      <thead className="bg-gray-50 text-xs font-bold uppercase tracking-wider text-gray-500 border-b border-gray-200">
                        <tr>
                          <th className="px-4 py-3.5">Month</th>
                          <th className="px-4 py-3.5 text-center">Employees</th>
                          <th className="px-4 py-3.5 text-right">Allowances</th>
                          <th className="px-4 py-3.5 text-right">Deductions</th>
                          <th className="px-4 py-3.5 text-right">Gross Cost</th>
                          <th className="px-4 py-3.5 text-right">Net Cost</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {totalCostReport.monthlyBreakdown.map((m) => (
                          <tr key={m.month} className="hover:bg-gray-50/60">
                            <td className="px-4 py-3.5 font-bold text-gray-900">
                              {months[m.month - 1].label}
                            </td>
                            <td className="px-4 py-3.5 text-center text-gray-700">
                              {m.employeeCount}
                            </td>
                            <td className="px-4 py-3.5 text-right text-emerald-600">
                              +{formatCurrency(m.totalAllowances)}
                            </td>
                            <td className="px-4 py-3.5 text-right text-rose-600">
                              -{formatCurrency(m.totalDeductions)}
                            </td>
                            <td className="px-4 py-3.5 text-right font-bold text-gray-900">
                              {formatCurrency(m.grossSalary)}
                            </td>
                            <td className="px-4 py-3.5 text-right font-black text-blue-700">
                              {formatCurrency(m.netSalary)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
