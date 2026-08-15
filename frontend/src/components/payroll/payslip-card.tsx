"use client";

import React, { useRef } from "react";
import { PayrollRecord } from "@/types/payroll";
import { Button } from "@/components/ui/button";
import { Printer, Download, Building2, User, Calendar, CheckCircle2, Clock, DollarSign } from "lucide-react";
import jsPDF from "jspdf";

interface PayslipCardProps {
  payroll: PayrollRecord;
  showActions?: boolean;
}

const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export function PayslipCard({ payroll, showActions = true }: PayslipCardProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const formatCurrency = (val: number | string) => {
    const num = Number(val) || 0;
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "ETB",
      minimumFractionDigits: 2,
    }).format(num).replace("ETB", "ETB ");
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = () => {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const monthLabel = `${monthNames[payroll.month - 1]} ${payroll.year}`;
    const empName = payroll.user.name || "Employee";
    const deptName = payroll.user.departmentRef?.name || "N/A";
    const posTitle = payroll.user.position?.title || "N/A";

    // Colors
    const primaryColor = [37, 99, 235]; // Blue 600
    const textColor = [31, 41, 55]; // Gray 800
    const lightBg = [243, 244, 246]; // Gray 100

    // Header
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(0, 0, 210, 25, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("ATTENDPRO PAYROLL", 14, 15);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("EMPLOYEE PAYSLIP", 160, 15);

    // Employee Meta Info
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text(`Payslip for: ${monthLabel}`, 14, 35);

    doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
    doc.rect(14, 40, 182, 30, "F");

    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("Employee Name:", 18, 48);
    doc.text("Employee ID:", 18, 56);
    doc.text("Department:", 18, 64);

    doc.setFont("helvetica", "normal");
    doc.text(empName, 50, 48);
    doc.text(payroll.user.employeeId, 50, 56);
    doc.text(deptName, 50, 64);

    doc.setFont("helvetica", "bold");
    doc.text("Position:", 110, 48);
    doc.text("Status:", 110, 56);
    doc.text("Generated Date:", 110, 64);

    doc.setFont("helvetica", "normal");
    doc.text(posTitle, 140, 48);
    doc.text(payroll.status, 140, 56);
    doc.text(new Date(payroll.createdAt).toLocaleDateString(), 140, 64);

    // Earnings Section Header
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("EARNINGS & ALLOWANCES", 14, 80);

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text("Basic Salary", 14, 88);
    doc.text(formatCurrency(payroll.basicSalary), 196, 88, { align: "right" });

    doc.text("Housing Allowance", 14, 95);
    doc.text(formatCurrency(payroll.housingAllowance), 196, 95, { align: "right" });

    doc.text("Transport Allowance", 14, 102);
    doc.text(formatCurrency(payroll.transportAllowance), 196, 102, { align: "right" });

    doc.text("Other Allowance", 14, 109);
    doc.text(formatCurrency(payroll.otherAllowance), 196, 109, { align: "right" });

    doc.text("Bonus", 14, 116);
    doc.text(formatCurrency(payroll.bonus), 196, 116, { align: "right" });

    doc.setLineWidth(0.3);
    doc.line(14, 120, 196, 120);

    doc.setFont("helvetica", "bold");
    doc.text("TOTAL GROSS SALARY", 14, 126);
    doc.text(formatCurrency(payroll.grossSalary), 196, 126, { align: "right" });

    // Deductions Section Header
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("DEDUCTIONS", 14, 140);

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text("Deductions", 14, 148);
    doc.text(formatCurrency(payroll.deduction), 196, 148, { align: "right" });

    doc.line(14, 152, 196, 152);

    doc.setFont("helvetica", "bold");
    doc.text("TOTAL DEDUCTIONS", 14, 158);
    doc.text(formatCurrency(payroll.totalDeductions), 196, 158, { align: "right" });

    // Net Pay Box
    doc.setFillColor(239, 246, 255); // Blue 50
    doc.rect(14, 170, 182, 22, "F");

    doc.setDrawColor(37, 99, 235);
    doc.setLineWidth(0.5);
    doc.rect(14, 170, 182, 22, "S");

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 64, 175);
    doc.text("NET SALARY PAYABLE", 20, 184);
    doc.text(formatCurrency(payroll.netSalary), 190, 184, { align: "right" });

    // Footer
    doc.setFontSize(8);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(107, 114, 128);
    doc.text("This is a computer-generated payslip and requires no signature.", 105, 270, { align: "center" });

    doc.save(`Payslip_${payroll.user.employeeId}_${monthNames[payroll.month - 1]}_${payroll.year}.pdf`);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PAID":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-800">
            <CheckCircle2 className="h-3.5 w-3.5 text-green-600" /> Paid
          </span>
        );
      case "PROCESSED":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-800">
            <CheckCircle2 className="h-3.5 w-3.5 text-blue-600" /> Processed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
            <Clock className="h-3.5 w-3.5 text-amber-600" /> Draft
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      {showActions && (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl bg-white p-4 shadow-sm border border-gray-200 print:hidden">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>Status:</span>
            {getStatusBadge(payroll.status)}
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={handlePrint} className="gap-2">
              <Printer className="h-4 w-4" />
              Print Payslip
            </Button>
            <Button size="sm" onClick={handleDownloadPdf} className="gap-2 bg-blue-600 hover:bg-blue-700">
              <Download className="h-4 w-4" />
              Export PDF
            </Button>
          </div>
        </div>
      )}

      {/* Printable Payslip Card */}
      <div
        ref={printRef}
        className="mx-auto max-w-4xl overflow-hidden rounded-2xl bg-white border border-gray-200 shadow-md print:shadow-none print:border-none print:m-0 print:w-full"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-900 px-8 py-6 text-white print:bg-blue-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 backdrop-blur-md">
                <Building2 className="h-6 w-6 text-blue-200" />
              </div>
              <div>
                <h2 className="text-xl font-extrabold tracking-tight">AttendPro Payroll</h2>
                <p className="text-xs text-blue-200 font-medium">Official Employee Salary Statement</p>
              </div>
            </div>
            <div className="text-right">
              <span className="inline-block rounded-lg bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider backdrop-blur-sm">
                {monthNames[payroll.month - 1]} {payroll.year}
              </span>
            </div>
          </div>
        </div>

        <div className="p-8 space-y-8">
          {/* Employee Metadata */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 rounded-xl bg-gray-50/80 p-5 border border-gray-100">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <User className="h-4 w-4 text-blue-600 shrink-0" />
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Employee Name:</span>
                <span className="text-sm font-bold text-gray-900">{payroll.user.name}</span>
              </div>
              <div className="flex items-center gap-3">
                <Building2 className="h-4 w-4 text-blue-600 shrink-0" />
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Employee ID:</span>
                <span className="text-sm font-semibold text-gray-800">{payroll.user.employeeId}</span>
              </div>
              <div className="flex items-center gap-3">
                <Building2 className="h-4 w-4 text-blue-600 shrink-0" />
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Department:</span>
                <span className="text-sm font-medium text-gray-800">{payroll.user.departmentRef?.name || "N/A"}</span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <User className="h-4 w-4 text-blue-600 shrink-0" />
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Position:</span>
                <span className="text-sm font-medium text-gray-800">{payroll.user.position?.title || "N/A"}</span>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-blue-600 shrink-0" />
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Pay Period:</span>
                <span className="text-sm font-medium text-gray-800">
                  {monthNames[payroll.month - 1]} 1 - {monthNames[payroll.month - 1]} 30, {payroll.year}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-4 w-4 text-blue-600 shrink-0" />
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Status:</span>
                <div>{getStatusBadge(payroll.status)}</div>
              </div>
            </div>
          </div>

          {/* Earnings & Deductions Breakdown Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Earnings / Allowances */}
            <div className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-xs">
              <div className="bg-gray-100/80 px-4 py-3 border-b border-gray-200">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700 flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-green-600" />
                  Earnings & Allowances
                </h3>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex justify-between items-center text-sm py-1 border-b border-gray-100">
                  <span className="text-gray-600">Basic Salary</span>
                  <span className="font-semibold text-gray-900">{formatCurrency(payroll.basicSalary)}</span>
                </div>
                <div className="flex justify-between items-center text-sm py-1 border-b border-gray-100">
                  <span className="text-gray-600">Housing Allowance</span>
                  <span className="font-medium text-gray-800">{formatCurrency(payroll.housingAllowance)}</span>
                </div>
                <div className="flex justify-between items-center text-sm py-1 border-b border-gray-100">
                  <span className="text-gray-600">Transport Allowance</span>
                  <span className="font-medium text-gray-800">{formatCurrency(payroll.transportAllowance)}</span>
                </div>
                <div className="flex justify-between items-center text-sm py-1 border-b border-gray-100">
                  <span className="text-gray-600">Other Allowance</span>
                  <span className="font-medium text-gray-800">{formatCurrency(payroll.otherAllowance)}</span>
                </div>
                <div className="flex justify-between items-center text-sm py-1 border-b border-gray-100">
                  <span className="text-gray-600">Bonus</span>
                  <span className="font-medium text-gray-800">{formatCurrency(payroll.bonus)}</span>
                </div>
                <div className="pt-2 flex justify-between items-center text-sm font-bold text-gray-900">
                  <span>Total Gross Salary</span>
                  <span className="text-green-700 font-extrabold">{formatCurrency(payroll.grossSalary)}</span>
                </div>
              </div>
            </div>

            {/* Deductions */}
            <div className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-xs">
              <div className="bg-gray-100/80 px-4 py-3 border-b border-gray-200">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700 flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-red-600" />
                  Deductions
                </h3>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex justify-between items-center text-sm py-1 border-b border-gray-100">
                  <span className="text-gray-600">Standard Deduction</span>
                  <span className="font-medium text-gray-800">{formatCurrency(payroll.deduction)}</span>
                </div>
                <div className="pt-12 flex justify-between items-center text-sm font-bold text-gray-900">
                  <span>Total Deductions</span>
                  <span className="text-red-700 font-extrabold">{formatCurrency(payroll.totalDeductions)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Net Salary Payable Highlight Card */}
          <div className="rounded-2xl bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50 border-2 border-blue-200 p-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-blue-700">Net Take-Home Pay</p>
              <h4 className="text-2xl md:text-3xl font-black text-blue-900">{formatCurrency(payroll.netSalary)}</h4>
              <p className="text-xs text-blue-600 mt-1">
                Gross ({formatCurrency(payroll.grossSalary)}) - Total Deductions ({formatCurrency(payroll.totalDeductions)})
              </p>
            </div>
            <div className="text-right text-xs text-gray-500">
              <p>Processed: {payroll.processedAt ? new Date(payroll.processedAt).toLocaleDateString() : "Pending"}</p>
              <p>Paid: {payroll.paidAt ? new Date(payroll.paidAt).toLocaleDateString() : "Pending"}</p>
            </div>
          </div>

          {payroll.remarks && (
            <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 text-xs text-amber-900">
              <span className="font-bold">Remarks / Notes: </span>
              {payroll.remarks}
            </div>
          )}

          {/* Footer Notice */}
          <div className="pt-6 border-t border-gray-200 text-center text-xs text-gray-400">
            <p>This is a official computer-generated payslip from AttendPro Payroll System.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
