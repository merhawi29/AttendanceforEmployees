"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  FileText,
  FileDown,
  FileSpreadsheet,
  Printer,
  ArrowRight,
} from "lucide-react";

interface ReportQuickActionsProps {
  onDownloadToday?: () => void;
  onExportPdf?: () => void;
  onExportExcel?: () => void;
  onPrint?: () => void;
  compact?: boolean;
}

export function ReportQuickActions({
  onDownloadToday,
  onExportPdf,
  onExportExcel,
  onPrint,
  compact = false,
}: ReportQuickActionsProps) {
  const actions = [
    {
      label: "Download Today's Report",
      description: "Get today's attendance summary",
      icon: FileDown,
      color: "from-blue-50 to-blue-100/50 border-blue-200 text-blue-700",
      iconColor: "text-blue-600 bg-blue-100",
      onClick: onDownloadToday,
      href: onDownloadToday ? undefined : compact ? "/admin/reports?type=daily" : undefined,
    },
    {
      label: "Export PDF",
      description: "Professional PDF report",
      icon: FileText,
      color: "from-red-50 to-red-100/50 border-red-200 text-red-700",
      iconColor: "text-red-600 bg-red-100",
      onClick: onExportPdf,
    },
    {
      label: "Export Excel",
      description: "Spreadsheet export",
      icon: FileSpreadsheet,
      color: "from-green-50 to-green-100/50 border-green-200 text-green-700",
      iconColor: "text-green-600 bg-green-100",
      onClick: onExportExcel,
    },
    {
      label: "Print Report",
      description: "Print-friendly format",
      icon: Printer,
      color: "from-purple-50 to-purple-100/50 border-purple-200 text-purple-700",
      iconColor: "text-purple-600 bg-purple-100",
      onClick: onPrint,
    },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {actions.map((action) => {
        const Icon = action.icon;
        const content = (
          <Card className={`bg-gradient-to-br ${action.color} shadow-sm hover:shadow-md transition-shadow cursor-pointer h-full`}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`rounded-lg p-2.5 ${action.iconColor}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold">{action.label}</p>
                <p className="text-xs opacity-70 truncate">{action.description}</p>
              </div>
              {compact && action.href && (
                <ArrowRight className="h-4 w-4 opacity-50 shrink-0" />
              )}
            </CardContent>
          </Card>
        );

        if (action.href) {
          return (
            <Link key={action.label} href={action.href} className="block">
              {content}
            </Link>
          );
        }

        return (
          <button
            key={action.label}
            type="button"
            onClick={action.onClick}
            className="text-left w-full"
            disabled={!action.onClick}
          >
            {content}
          </button>
        );
      })}
    </div>
  );
}

export function ReportsPageLink() {
  return (
    <Link href="/admin/reports">
      <Button variant="outline" size="sm" className="gap-2">
        <FileText className="h-4 w-4" />
        View All Reports
      </Button>
    </Link>
  );
}
