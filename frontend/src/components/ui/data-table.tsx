"use client";

import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  ArrowUpDown,
  FileSpreadsheet,
  FileText,
  ChevronLeft,
  ChevronRight,
  Eye,
  SlidersHorizontal,
} from "lucide-react";
import { exportToPdf, exportToExcel } from "@/lib/report-export";

export interface ColumnDef<T> {
  key: string;
  header: string;
  render?: (row: T) => React.ReactNode;
  sortable?: boolean;
}

interface DataTableProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  searchPlaceholder?: string;
  title?: string;
}

export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  searchPlaceholder = "Search records...",
  title,
}: DataTableProps<T>) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [visibleCols, setVisibleCols] = useState<string[]>(columns.map((c) => c.key));
  const [showColMenu, setShowColMenu] = useState(false);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const filteredData = data.filter((row) =>
    Object.values(row).some(
      (val) => val && String(val).toLowerCase().includes(search.toLowerCase())
    )
  );

  const sortedData = [...filteredData].sort((a, b) => {
    if (!sortKey) return 0;
    const aVal = a[sortKey];
    const bVal = b[sortKey];
    if (aVal < bVal) return sortDir === "asc" ? -1 : 1;
    if (aVal > bVal) return sortDir === "asc" ? 1 : -1;
    return 0;
  });

  const totalPages = Math.ceil(sortedData.length / pageSize) || 1;
  const paginatedData = sortedData.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handleExport = (type: "excel" | "pdf") => {
    const rows = sortedData.map((d) => ({
      employeeId: String(d.employeeId || d.id || "N/A"),
      name: String(d.name || d.title || "Record"),
      department: String(d.department || "General"),
      date: new Date().toLocaleDateString(),
      morningIn: String(d.morningIn || "-"),
      lunchOut: "-",
      lunchReturn: "-",
      finalOut: String(d.finalOut || "-"),
      status: String(d.status || "ACTIVE"),
      workedHours: String(d.workedHours || "-"),
    }));

    const opts = {
      reportTitle: title || "Data Table Export Report",
      dateRangeLabel: `As of ${new Date().toLocaleDateString()}`,
      generatedBy: "HRMS Portal",
      rows,
      summary: {
        totalEmployees: rows.length,
        present: rows.length,
        late: 0,
        absent: 0,
        halfDay: 0,
        lunchMissing: 0,
        attendancePercentage: 100,
      },
    };

    if (type === "excel") exportToExcel(opts);
    else if (type === "pdf") exportToPdf(opts);
  };

  return (
    <div className="space-y-4">
      {/* Table Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-white dark:bg-slate-900 p-3 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-xs">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <Input
            placeholder={searchPlaceholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 text-xs dark:bg-slate-950 dark:border-slate-800 dark:text-white"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Column Visibility Menu Button */}
          <div className="relative">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowColMenu(!showColMenu)}
              className="text-xs dark:border-slate-800"
            >
              <SlidersHorizontal className="mr-1.5 h-3.5 w-3.5" /> Columns
            </Button>
            {showColMenu && (
              <div className="absolute right-0 top-10 z-20 w-48 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 p-2 shadow-xl text-xs space-y-1">
                {columns.map((col) => (
                  <label
                    key={col.key}
                    className="flex items-center gap-2 p-1.5 rounded hover:bg-gray-100 dark:hover:bg-slate-800 cursor-pointer text-gray-700 dark:text-gray-200"
                  >
                    <input
                      type="checkbox"
                      checked={visibleCols.includes(col.key)}
                      onChange={(e) => {
                        if (e.target.checked) setVisibleCols([...visibleCols, col.key]);
                        else setVisibleCols(visibleCols.filter((k) => k !== col.key));
                      }}
                      className="rounded border-gray-300"
                    />
                    {col.header}
                  </label>
                ))}
              </div>
            )}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExport("excel")}
            className="text-xs text-emerald-600 dark:border-slate-800"
          >
            <FileSpreadsheet className="mr-1.5 h-3.5 w-3.5" /> Excel
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExport("pdf")}
            className="text-xs text-red-600 dark:border-slate-800"
          >
            <FileText className="mr-1.5 h-3.5 w-3.5" /> PDF
          </Button>
        </div>
      </div>

      {/* Table Element */}
      <div className="rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 dark:bg-slate-800/80 border-b border-gray-200 dark:border-slate-800 text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <tr>
                {columns
                  .filter((col) => visibleCols.includes(col.key))
                  .map((col) => (
                    <th key={col.key} className="px-6 py-3.5">
                      {col.sortable !== false ? (
                        <button
                          onClick={() => handleSort(col.key)}
                          className="flex items-center gap-1 hover:text-gray-900 dark:hover:text-white"
                        >
                          {col.header} <ArrowUpDown className="h-3 w-3 text-gray-400" />
                        </button>
                      ) : (
                        col.header
                      )}
                    </th>
                  ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-slate-800 text-gray-900 dark:text-gray-100">
              {paginatedData.length ? (
                paginatedData.map((row, rIdx) => (
                  <tr key={rIdx} className="hover:bg-gray-50 dark:hover:bg-slate-800/60 transition-colors">
                    {columns
                      .filter((col) => visibleCols.includes(col.key))
                      .map((col) => (
                        <td key={col.key} className="px-6 py-3.5">
                          {col.render ? col.render(row) : row[col.key] ?? "-"}
                        </td>
                      ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={visibleCols.length} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                    No matching records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-3 bg-gray-50 dark:bg-slate-950 border-t border-gray-200 dark:border-slate-800 flex justify-between items-center text-xs text-gray-500">
          <span>
            Page <strong className="text-gray-900 dark:text-white">{currentPage}</strong> of <strong className="text-gray-900 dark:text-white">{totalPages}</strong> ({sortedData.length} total)
          </span>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(currentPage - 1)}
              className="h-8 dark:border-slate-800"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage(currentPage + 1)}
              className="h-8 dark:border-slate-800"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
