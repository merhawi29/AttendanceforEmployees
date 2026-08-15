"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface BarChartItem {
  label: string;
  value: number;
  secondaryValue?: number;
  color?: string;
}

interface MultiBarChartProps {
  title: string;
  description?: string;
  items: BarChartItem[];
  maxValue?: number;
  unit?: string;
}

export function SimpleBarChart({ title, description, items, maxValue, unit = "" }: MultiBarChartProps) {
  const max = maxValue || Math.max(...items.map((i) => i.value), 1);

  return (
    <Card className="shadow-sm border border-gray-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-bold text-gray-900">{title}</CardTitle>
        {description && <CardDescription className="text-xs">{description}</CardDescription>}
      </CardHeader>
      <CardContent className="space-y-3">
        {items.length === 0 ? (
          <p className="text-xs text-gray-400 py-6 text-center">No data available</p>
        ) : (
          items.map((item, idx) => {
            const pct = Math.min(Math.round((item.value / max) * 100), 100);
            return (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between text-xs font-semibold text-gray-700">
                  <span className="truncate max-w-[200px]">{item.label}</span>
                  <span className="text-gray-900 font-bold">
                    {item.value.toLocaleString()} {unit}
                  </span>
                </div>
                <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden flex">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      item.color || "bg-blue-600"
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}

export function TrendLineChart({
  title,
  description,
  data,
}: {
  title: string;
  description?: string;
  data: Array<{ label: string; value: number }>;
}) {
  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <Card className="shadow-sm border border-gray-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-bold text-gray-900">{title}</CardTitle>
        {description && <CardDescription className="text-xs">{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="text-xs text-gray-400 py-6 text-center">No trend data available</p>
        ) : (
          <div className="flex items-end gap-2 h-36 pt-4 border-b border-gray-100 pb-2 overflow-x-auto">
            {data.map((d, i) => {
              const heightPct = Math.max(Math.round((d.value / max) * 100), 8);
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1 min-w-[28px]">
                  <span className="text-[10px] font-bold text-gray-600">{d.value}</span>
                  <div
                    className="w-full bg-gradient-to-t from-blue-600 to-indigo-500 rounded-t-sm transition-all duration-300 hover:opacity-80"
                    style={{ height: `${heightPct}%` }}
                    title={`${d.label}: ${d.value}`}
                  />
                  <span className="text-[9px] text-gray-400 truncate max-w-[36px]">{d.label}</span>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
