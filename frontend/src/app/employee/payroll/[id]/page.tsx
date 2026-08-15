"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { PayslipCard } from "@/components/payroll/payslip-card";
import { payrollApi } from "@/lib/payroll-api";
import { PayrollRecord } from "@/types/payroll";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";

export default function EmployeePayslipDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { toast } = useToast();
  const [record, setRecord] = useState<PayrollRecord | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    payrollApi
      .getPayrollById(id)
      .then((data) => setRecord(data))
      .catch((err) => {
        toast({
          title: "Error loading payslip",
          description: err.message || "Failed to load payslip.",
          variant: "destructive",
        });
      })
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3 print:hidden">
          <Link href="/employee/payroll">
            <Button variant="ghost" size="sm" className="gap-2 text-gray-600">
              <ArrowLeft className="h-4 w-4" /> Back to My Payslips
            </Button>
          </Link>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center text-gray-400">
            Loading itemized payslip...
          </div>
        ) : !record ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center text-gray-400">
            Payslip not found or unavailable.
          </div>
        ) : (
          <PayslipCard payroll={record} showActions={true} />
        )}
      </div>
    </DashboardLayout>
  );
}
