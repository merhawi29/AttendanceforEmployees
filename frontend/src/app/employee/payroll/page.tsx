"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { payrollApi } from "@/lib/payroll-api";
import { PayrollRecord } from "@/types/payroll";
import { useToast } from "@/hooks/use-toast";
import { CreditCard, Eye } from "lucide-react";

const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export default function EmployeePayrollPage() {
  const { toast } = useToast();
  const currentDate = new Date();
  const [year, setYear] = useState<number>(currentDate.getFullYear());
  const [loading, setLoading] = useState<boolean>(true);
  const [payslips, setPayslips] = useState<PayrollRecord[]>([]);

  const fetchMyPayslips = async () => {
    setLoading(true);
    try {
      const data = await payrollApi.getMyPayslips(year);
      setPayslips(data);
    } catch (err: any) {
      toast({
        title: "Error fetching payslips",
        description: err.message || "Failed to load payslips.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyPayslips();
  }, [year]);

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
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
              <CreditCard className="h-7 w-7 text-blue-600" />
              My Payslips
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              View and download your monthly itemized salary statements and payment history.
            </p>
          </div>

          <div className="w-32">
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
        </div>

        {/* Payslips Grid */}
        {loading ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center text-gray-400">
            Loading your payslips...
          </div>
        ) : payslips.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center text-gray-400">
            No published payslips found for {year}.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {payslips.map((pay) => (
              <div
                key={pay.id}
                className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xs hover:shadow-md transition-all space-y-5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 font-bold text-sm">
                      {pay.month}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">{monthNames[pay.month - 1]} {pay.year}</h3>
                      <p className="text-xs text-gray-400">Monthly Statement</p>
                    </div>
                  </div>
                  {pay.status === "PAID" ? (
                    <span className="inline-flex rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-800">
                      Paid
                    </span>
                  ) : (
                    <span className="inline-flex rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-800">
                      Processed
                    </span>
                  )}
                </div>

                <div className="space-y-2 rounded-xl bg-gray-50/80 p-3 text-xs border border-gray-100">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Gross Salary:</span>
                    <span className="font-semibold text-gray-900">{formatMoney(pay.grossSalary)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Total Deductions:</span>
                    <span className="font-semibold text-rose-600">-{formatMoney(pay.totalDeductions)}</span>
                  </div>
                  <div className="pt-1 border-t border-gray-200 flex justify-between font-bold text-sm text-blue-900">
                    <span>Net Pay:</span>
                    <span className="text-blue-700">{formatMoney(pay.netSalary)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-1">
                  <Link href={`/employee/payroll/${pay.id}`} className="w-full">
                    <Button variant="outline" size="sm" className="w-full gap-2 text-blue-600 border-blue-200 hover:bg-blue-50">
                      <Eye className="h-4 w-4" /> View Itemized Payslip
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
