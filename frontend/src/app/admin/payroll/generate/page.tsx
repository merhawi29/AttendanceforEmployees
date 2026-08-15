"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { payrollApi } from "@/lib/payroll-api";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Play, CheckCircle2, Building2, Calendar, Sparkles } from "lucide-react";

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

export default function GeneratePayrollPage() {
  const router = useRouter();
  const { toast } = useToast();

  const currentDate = new Date();
  const [month, setMonth] = useState<number>(currentDate.getMonth() + 1);
  const [year, setYear] = useState<number>(currentDate.getFullYear());
  const [departmentId, setDepartmentId] = useState<string>("ALL");
  const [overwriteDrafts, setOverwriteDrafts] = useState<boolean>(true);

  const [departments, setDepartments] = useState<any[]>([]);
  const [generating, setGenerating] = useState<boolean>(false);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    fetch("/api/departments")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.data)) {
          setDepartments(data.data);
        }
      })
      .catch(() => {});
  }, []);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenerating(true);
    setResult(null);

    try {
      const res = await payrollApi.generatePayroll({
        month,
        year,
        departmentId: departmentId === "ALL" ? undefined : departmentId,
        overwriteDrafts,
      });

      setResult(res);
      toast({
        title: "Payroll Generation Success",
        description: res.message,
      });
    } catch (err: any) {
      toast({
        title: "Generation Failed",
        description: err.message || "Failed to generate payroll.",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Top Back Link */}
        <div className="flex items-center gap-3">
          <Link href="/admin/payroll">
            <Button variant="ghost" size="sm" className="gap-2 text-gray-600">
              <ArrowLeft className="h-4 w-4" /> Back to Payroll Dashboard
            </Button>
          </Link>
        </div>

        {/* Card Header */}
        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-xs space-y-6">
          <div className="flex items-center gap-4 border-b border-gray-100 pb-6">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <Sparkles className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Generate Monthly Payroll</h1>
              <p className="text-sm text-gray-500 mt-1">
                Batch calculate basic salary, housing, transport, bonus, and deductions for employees.
              </p>
            </div>
          </div>

          <form onSubmit={handleGenerate} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Select Month */}
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-gray-700 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-blue-600" /> Payroll Month
                </label>
                <select
                  value={month}
                  onChange={(e) => setMonth(parseInt(e.target.value, 10))}
                  className="flex h-11 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {months.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Select Year */}
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-gray-700 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-blue-600" /> Payroll Year
                </label>
                <select
                  value={year}
                  onChange={(e) => setYear(parseInt(e.target.value, 10))}
                  className="flex h-11 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {[2024, 2025, 2026, 2027].map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Department Filter */}
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-gray-700 flex items-center gap-2">
                <Building2 className="h-4 w-4 text-blue-600" /> Target Department
              </label>
              <select
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
                className="flex h-11 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">All Departments (Entire Company)</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name} ({dept.code})
                  </option>
                ))}
              </select>
            </div>

            {/* Options Checkbox */}
            <div className="rounded-xl bg-gray-50 p-4 border border-gray-200">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={overwriteDrafts}
                  onChange={(e) => setOverwriteDrafts(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <span className="text-sm font-semibold text-gray-900 block">Re-calculate & Overwrite Existing Drafts</span>
                  <span className="text-xs text-gray-500">
                    If DRAFT records already exist for this month/year, recalculate them with the latest salary structures. Records marked as PROCESSED or PAID will never be overwritten.
                  </span>
                </div>
              </label>
            </div>

            {/* Submit Button */}
            <div className="pt-2 flex justify-end gap-4">
              <Link href="/admin/payroll">
                <Button type="button" variant="outline" className="h-11 px-6">
                  Cancel
                </Button>
              </Link>
              <Button
                type="submit"
                disabled={generating}
                className="h-11 px-8 gap-2 bg-blue-600 hover:bg-blue-700 font-semibold"
              >
                {generating ? (
                  "Processing Payroll..."
                ) : (
                  <>
                    <Play className="h-4 w-4 fill-current" /> Generate Payroll Now
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>

        {/* Results Banner */}
        {result && (
          <div className="rounded-2xl bg-emerald-50 border-2 border-emerald-200 p-6 space-y-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-6 w-6 text-emerald-600" />
              <h3 className="text-lg font-bold text-emerald-950">Generation Summary</h3>
            </div>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="bg-white rounded-xl p-3 border border-emerald-100">
                <span className="text-xs text-gray-500 block">Created Drafts</span>
                <span className="text-2xl font-bold text-emerald-700">{result.generatedCount}</span>
              </div>
              <div className="bg-white rounded-xl p-3 border border-emerald-100">
                <span className="text-xs text-gray-500 block">Updated Drafts</span>
                <span className="text-2xl font-bold text-blue-700">{result.updatedDraftCount}</span>
              </div>
              <div className="bg-white rounded-xl p-3 border border-emerald-100">
                <span className="text-xs text-gray-500 block">Skipped / Locked</span>
                <span className="text-2xl font-bold text-amber-700">{result.skippedCount}</span>
              </div>
            </div>
            <div className="pt-2 flex justify-end">
              <Button onClick={() => router.push("/admin/payroll")} className="bg-emerald-700 hover:bg-emerald-800">
                View Payroll Dashboard
              </Button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
