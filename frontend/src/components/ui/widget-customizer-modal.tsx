"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SlidersHorizontal, Check, X, Eye, EyeOff } from "lucide-react";

export interface WidgetConfig {
  kpiCards: boolean;
  attendanceTrend: boolean;
  statusDistribution: boolean;
  deptComparison: boolean;
  leaveWidget: boolean;
  overtimeWidget: boolean;
  payrollWidget: boolean;
  leaderboard: boolean;
  upcomingEvents: boolean;
  quickActions: boolean;
  activityFeed: boolean;
}

export const defaultWidgetConfig: WidgetConfig = {
  kpiCards: true,
  attendanceTrend: true,
  statusDistribution: true,
  deptComparison: true,
  leaveWidget: true,
  overtimeWidget: true,
  payrollWidget: true,
  leaderboard: true,
  upcomingEvents: true,
  quickActions: true,
  activityFeed: true,
};

export function WidgetCustomizerModal({
  isOpen,
  onClose,
  config,
  onSave,
}: {
  isOpen: boolean;
  onClose: () => void;
  config: WidgetConfig;
  onSave: (newConfig: WidgetConfig) => void;
}) {
  const [localConfig, setLocalConfig] = useState<WidgetConfig>(config);

  const toggleWidget = (key: keyof WidgetConfig) => {
    setLocalConfig((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = () => {
    onSave(localConfig);
    onClose();
  };

  if (!isOpen) return null;

  const widgetsList: Array<{ key: keyof WidgetConfig; label: string; desc: string }> = [
    { key: "kpiCards", label: "KPI Metric Cards Row", desc: "Headcount, Present, Absent, Late, Leave, Rate %" },
    { key: "quickActions", label: "Quick Actions Grid", desc: "Shortcuts for Add Employee, Payroll, Leave, OT" },
    { key: "attendanceTrend", label: "Attendance Trend Chart", desc: "Weekly/Monthly attendance & absence area chart" },
    { key: "statusDistribution", label: "Attendance Distribution Doughnut", desc: "Today's present vs late vs absent pie chart" },
    { key: "deptComparison", label: "Department Attendance Bar Chart", desc: "Comparative rate % across departments" },
    { key: "leaderboard", label: "Department Leaderboard", desc: "Ranking badges and performance stats" },
    { key: "leaveWidget", label: "Leave Management Widget", desc: "Pending, approved, and currently on leave" },
    { key: "overtimeWidget", label: "Overtime Analytics Widget", desc: "Total OT hours and top OT employees" },
    { key: "payrollWidget", label: "Payroll Expenditure Widget", desc: "Monthly payroll cost (ETB) and salary metrics" },
    { key: "upcomingEvents", label: "Upcoming Events Calendar", desc: "Company holidays, birthdays, anniversaries" },
    { key: "activityFeed", label: "Recent System Activity Timeline", desc: "Real-time stream of attendance & leave events" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <Card className="w-full max-w-lg bg-white dark:bg-slate-900 shadow-2xl rounded-2xl border border-gray-200 dark:border-slate-800">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-bold flex items-center gap-2 text-gray-900 dark:text-white">
              <SlidersHorizontal className="h-5 w-5 text-blue-600" />
              Customize Executive Dashboard
            </CardTitle>
            <CardDescription className="text-xs">Show or hide widgets to personalize your workspace layout</CardDescription>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            <X className="h-5 w-5" />
          </button>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="max-h-96 overflow-y-auto space-y-2 pr-1">
            {widgetsList.map((w) => {
              const isEnabled = localConfig[w.key];
              return (
                <div
                  key={w.key}
                  onClick={() => toggleWidget(w.key)}
                  className="flex items-center justify-between p-3 rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/60 hover:border-blue-500 cursor-pointer transition-colors"
                >
                  <div>
                    <p className="text-xs font-bold text-gray-900 dark:text-white">{w.label}</p>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400">{w.desc}</p>
                  </div>
                  <div className={`p-2 rounded-lg text-xs font-semibold flex items-center gap-1 ${
                    isEnabled ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300" : "bg-gray-200 dark:bg-slate-700 text-gray-500"
                  }`}>
                    {isEnabled ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-between items-center pt-3 border-t border-gray-200 dark:border-slate-800">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLocalConfig(defaultWidgetConfig)}
              className="text-xs dark:border-slate-800"
            >
              Reset to Default
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={onClose} className="text-xs dark:border-slate-800">
                Cancel
              </Button>
              <Button size="sm" onClick={handleSave} className="text-xs bg-blue-600 hover:bg-blue-700 text-white">
                <Check className="mr-1.5 h-3.5 w-3.5" /> Save Preferences
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
