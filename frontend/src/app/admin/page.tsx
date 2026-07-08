"use client";

import { useEffect, useState, useCallback } from "react";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { StatsCards } from "@/components/admin/stats-cards";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { DashboardStats, Attendance, AttendanceStatus } from "@/types";
import { apiRequest, ApiError } from "@/lib/api";
import { formatTime, getStatusColor, formatStatusLabel } from "@/lib/utils";
import {
  Loader2,
  Search,
  Filter,
  Eye,
  Edit2,
  X,
  Calendar,
  Building,
  Mail,
  Phone,
  CalendarDays,
  Percent,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Clock,
  Sparkles,
  Layers,
  Award
} from "lucide-react";

interface EmployeeSummary {
  employeeCode: string;
  department: string;
  email: string;
  phone: string;
  hireDate: string;
  attendancePercentage: number;
  totalPresentDays: number;
  totalLateDays: number;
  totalAbsentDays: number;
}

function calculateWorkedHours(a: Attendance): string {
  if (!a.morningIn || !a.finalOut) return "—";
  const start = new Date(a.morningIn).getTime();
  const end = new Date(a.finalOut).getTime();
  let diff = end - start;

  if (a.lunchOut && a.lunchReturn) {
    const lOut = new Date(a.lunchOut).getTime();
    const lReturn = new Date(a.lunchReturn).getTime();
    if (lReturn > lOut) {
      diff -= (lReturn - lOut);
    }
  }

  const hours = diff / (1000 * 60 * 60);
  if (hours < 0) return "—";
  return `${hours.toFixed(1)} hrs`;
}

function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Filters
  const [dateFilter, setDateFilter] = useState<"today" | "yesterday" | "this-week" | "custom">("today");
  const [customDate, setCustomDate] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDept, setSelectedDept] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");

  // Unique departments for filter list
  const [departments, setDepartments] = useState<string[]>([]);

  // Modals
  const [selectedUserSummary, setSelectedUserSummary] = useState<EmployeeSummary | null>(null);
  const [selectedUserSummaryName, setSelectedUserSummaryName] = useState("");
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [viewLoading, setViewLoading] = useState(false);

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<Attendance | null>(null);
  const [editMorningIn, setEditMorningIn] = useState("");
  const [editLunchOut, setEditLunchOut] = useState("");
  const [editLunchReturn, setEditLunchReturn] = useState("");
  const [editFinalOut, setEditFinalOut] = useState("");
  const [editStatus, setEditStatus] = useState<AttendanceStatus>("PRESENT");

  const [error, setError] = useState<string | null>(null);

  // Fetch Attendance Log & Stats
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Calculate date filters
      let queryStr = "";
      const todayStr = new Date().toISOString().split("T")[0];
      
      if (dateFilter === "today") {
        queryStr = `?date=${todayStr}`;
      } else if (dateFilter === "yesterday") {
        const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
        queryStr = `?date=${yesterday}`;
      } else if (dateFilter === "this-week") {
        const today = new Date();
        const day = today.getDay();
        const diff = today.getDate() - day + (day === 0 ? -6 : 1);
        const startOfWeek = new Date(today.setDate(diff)).toISOString().split("T")[0];
        queryStr = `?startDate=${startOfWeek}&endDate=${todayStr}`;
      } else if (dateFilter === "custom") {
        queryStr = `?date=${customDate || new Date().toISOString().split("T")[0]}`;
      }

      const [statsData, attendanceData] = await Promise.all([
        apiRequest<DashboardStats>("/attendance/stats"),
        apiRequest<Attendance[]>(`/attendance/all${queryStr}`),
      ]);

      setStats(statsData);
      setAttendances(attendanceData);

      // Extract departments dynamically
      const depts = new Set<string>();
      attendanceData.forEach((a) => {
        if (a.user?.department) depts.add(a.user.department);
      });
      setDepartments(Array.from(depts));
    } catch (err) {
      setError("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }, [dateFilter, customDate]);

  useEffect(() => {
    setCustomDate(new Date().toISOString().split("T")[0]);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Open view modal and load details
  const handleOpenView = async (record: Attendance) => {
    if (!record.user?.id) return;
    setViewLoading(true);
    setSelectedUserSummaryName(record.user.name);
    setViewModalOpen(true);
    try {
      const summary = await apiRequest<EmployeeSummary>(`/admin/users/${record.user.id}/summary`);
      setSelectedUserSummary(summary);
    } catch (err) {
      console.error(err);
    } finally {
      setViewLoading(false);
    }
  };

  // Populate times in edit modal
  const handleOpenEdit = (record: Attendance) => {
    setEditingRecord(record);
    
    // Format times into HH:MM for time inputs
    const formatToInputTime = (dateStr: string | null | undefined) => {
      if (!dateStr) return "";
      const d = new Date(dateStr);
      return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
    };

    setEditMorningIn(formatToInputTime(record.morningIn));
    setEditLunchOut(formatToInputTime(record.lunchOut));
    setEditLunchReturn(formatToInputTime(record.lunchReturn));
    setEditFinalOut(formatToInputTime(record.finalOut));
    setEditStatus(record.status || "PRESENT");
    setEditModalOpen(true);
  };

  // Handle Edit Attendance Submission
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecord) return;
    setSubmitting(true);
    
    // Helper to construct DateTime from record date and input HH:MM
    const buildDateTimeString = (timeStr: string) => {
      if (!timeStr) return null;
      const baseDate = new Date(editingRecord.date);
      const [h, m] = timeStr.split(":");
      baseDate.setHours(parseInt(h, 10), parseInt(m, 10), 0, 0);
      return baseDate.toISOString();
    };

    try {
      await apiRequest(`/admin/attendance/${editingRecord.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          morningIn: buildDateTimeString(editMorningIn),
          lunchOut: buildDateTimeString(editLunchOut),
          lunchReturn: buildDateTimeString(editLunchReturn),
          finalOut: buildDateTimeString(editFinalOut),
          status: editStatus,
        }),
      });
      setEditModalOpen(false);
      fetchData();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to update record");
    } finally {
      setSubmitting(false);
    }
  };

  // Client-side filtering logic
  const filteredAttendances = attendances.filter((a) => {
    const matchesSearch =
      a.user?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.user?.employeeId.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesDept = selectedDept === "ALL" || a.user?.department === selectedDept;
    const matchesStatus = selectedStatus === "ALL" || a.status === selectedStatus;

    return matchesSearch && matchesDept && matchesStatus;
  });

  // Calculate stats for Reports segment
  const reportsTotal = filteredAttendances.length;
  const reportsPresent = filteredAttendances.filter(a => a.status === "PRESENT").length;
  const reportsLate = filteredAttendances.filter(a => a.status === "LATE").length;
  const reportsAbsent = filteredAttendances.filter(a => a.status === "ABSENT").length;
  
  const presentPercent = reportsTotal > 0 ? Math.round((reportsPresent / reportsTotal) * 100) : 0;
  const latePercent = reportsTotal > 0 ? Math.round((reportsLate / reportsTotal) * 100) : 0;
  const absentPercent = reportsTotal > 0 ? Math.round((reportsAbsent / reportsTotal) * 100) : 0;
  const overallCompliance = reportsTotal > 0 ? Math.round(((reportsPresent + reportsLate) / reportsTotal) * 100) : 100;

  if (loading && attendances.length === 0) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Admin Dashboard</h2>
          <p className="text-gray-500">Overview of today&apos;s activity, logs, and reporting</p>
        </div>
      </div>

      {stats && <StatsCards stats={stats} />}

      {/* Reports segment */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2 shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-blue-600 animate-pulse" />
              <CardTitle>Attendance Distribution Reports</CardTitle>
            </div>
            <CardDescription>Visual stats for current loaded date range</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between text-sm font-medium mb-1">
                  <span className="flex items-center gap-1.5 text-green-700">
                    <CheckCircle className="h-4 w-4" /> Present
                  </span>
                  <span>{reportsPresent} / {reportsTotal} ({presentPercent}%)</span>
                </div>
                <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-green-500 h-full rounded-full transition-all duration-500" style={{ width: `${presentPercent}%` }}></div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-sm font-medium mb-1">
                  <span className="flex items-center gap-1.5 text-orange-700">
                    <Clock className="h-4 w-4" /> Late
                  </span>
                  <span>{reportsLate} / {reportsTotal} ({latePercent}%)</span>
                </div>
                <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-orange-500 h-full rounded-full transition-all duration-500" style={{ width: `${latePercent}%` }}></div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-sm font-medium mb-1">
                  <span className="flex items-center gap-1.5 text-red-700">
                    <XCircle className="h-4 w-4" /> Absent
                  </span>
                  <span>{reportsAbsent} / {reportsTotal} ({absentPercent}%)</span>
                </div>
                <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-red-50 h-full rounded-full border-r border-red-500 relative">
                    <div className="bg-red-500 h-full rounded-full transition-all duration-500" style={{ width: `${absentPercent}%` }}></div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Circular Compliance Gauge */}
        <Card className="shadow-sm flex flex-col justify-between">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Attendance Percentage</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-4 flex-1">
            <div className="relative flex items-center justify-center w-28 h-28">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="56" cy="56" r="48" stroke="#f3f4f6" strokeWidth="8" fill="transparent" />
                <circle
                  cx="56"
                  cy="56"
                  r="48"
                  stroke="#2563eb"
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray="301.6"
                  strokeDashoffset={301.6 - (301.6 * overallCompliance) / 100}
                  className="transition-all duration-700 ease-out"
                />
              </svg>
              <div className="absolute text-center">
                <p className="text-2xl font-bold text-gray-900">{overallCompliance}%</p>
                <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Compliance</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <XCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Interactive Filters Panel */}
      <Card className="shadow-sm border-gray-200 bg-white">
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-wrap items-center gap-4">
            {/* Search */}
            <div className="flex-1 min-w-[200px] relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search employee or code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-white"
              />
            </div>

            {/* Department Filter */}
            <div className="w-[180px]">
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="w-full h-9 rounded-lg border border-gray-300 bg-white px-3 py-1 text-sm shadow-sm focus:border-blue-500 focus:outline-none"
              >
                <option value="ALL">All Departments</option>
                {departments.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div className="w-[160px]">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full h-9 rounded-lg border border-gray-300 bg-white px-3 py-1 text-sm shadow-sm focus:border-blue-500 focus:outline-none"
              >
                <option value="ALL">All Statuses</option>
                <option value="PRESENT">Present</option>
                <option value="LATE">Late</option>
                <option value="ABSENT">Absent</option>
                <option value="HALF_DAY">Half Day</option>
                <option value="LUNCH_MISSING">Lunch Missing</option>
              </select>
            </div>

            {/* Date Quick Filters */}
            <div className="flex items-center gap-1.5 border border-gray-300 rounded-lg p-1 bg-gray-50/50">
              {(["today", "yesterday", "this-week", "custom"] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setDateFilter(mode)}
                  className={`px-3 py-1 text-xs font-semibold rounded-md capitalize transition-colors ${
                    dateFilter === mode ? "bg-white text-blue-700 shadow-sm" : "text-gray-500 hover:text-gray-900"
                  }`}
                >
                  {mode.replace("-", " ")}
                </button>
              ))}
            </div>

            {/* Custom Date Input */}
            {dateFilter === "custom" && (
              <Input
                type="date"
                value={customDate}
                onChange={(e) => setCustomDate(e.target.value)}
                className="w-auto h-9 bg-white"
              />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Main Attendance Table */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3 border-b border-gray-100 flex flex-row items-center justify-between">
          <div>
            <CardTitle>Attendance Log Table</CardTitle>
            <CardDescription>Detailed check-in records and hours calculated</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : filteredAttendances.length === 0 ? (
            <p className="py-20 text-center text-sm text-gray-400">No matching attendance records found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50/50 text-gray-500 uppercase tracking-wider text-xs font-semibold">
                    <th className="py-3.5 px-4">Employee</th>
                    <th className="py-3.5 px-4">Department</th>
                    <th className="py-3.5 px-4">Morning In</th>
                    <th className="py-3.5 px-4">Lunch Out</th>
                    <th className="py-3.5 px-4">Lunch Return</th>
                    <th className="py-3.5 px-4">Final Out</th>
                    <th className="py-3.5 px-4">Worked Hours</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4">IP Address</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredAttendances.map((a) => (
                    <tr key={a.id} className="hover:bg-gray-50/30 transition-colors">
                      <td className="py-4 px-4">
                        <p className="font-semibold text-gray-900">{a.user?.name}</p>
                        <p className="text-xs text-gray-400 font-medium">{a.user?.employeeId}</p>
                      </td>
                      <td className="py-4 px-4 text-gray-600 font-medium">{a.user?.department || "—"}</td>
                      <td className="py-4 px-4 text-gray-600 font-medium">{formatTime(a.morningIn)}</td>
                      <td className="py-4 px-4 text-gray-600 font-medium">{formatTime(a.lunchOut)}</td>
                      <td className="py-4 px-4 text-gray-600 font-medium">{formatTime(a.lunchReturn)}</td>
                      <td className="py-4 px-4 text-gray-600 font-medium">{formatTime(a.finalOut)}</td>
                      <td className="py-4 px-4 text-gray-700 font-semibold">{calculateWorkedHours(a)}</td>
                      <td className="py-4 px-4">
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider ${getStatusColor(a.status)}`}>
                          {formatStatusLabel(a.status)}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-xs text-gray-400 font-semibold">{a.ipAddress || "—"}</td>
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenView(a)}
                            className="h-8 px-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          >
                            <Eye className="h-4 w-4" />
                            <span className="sr-only">View</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenEdit(a)}
                            className="h-8 px-2 text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                          >
                            <Edit2 className="h-4 w-4" />
                            <span className="sr-only">Edit</span>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Details Modal Overlay */}
      {viewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden border border-gray-100">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                <Award className="h-5 w-5 text-blue-600" /> Attendance Profile Summary
              </h3>
              <button onClick={() => setViewModalOpen(false)} className="text-gray-400 hover:text-gray-900 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              {viewLoading || !selectedUserSummary ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 bg-blue-50/50 p-3 rounded-lg">
                    <div className="bg-blue-100 p-2 rounded-full">
                      <Sparkles className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 text-base">{selectedUserSummaryName}</h4>
                      <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">{selectedUserSummary.department || "No Department"}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex flex-col">
                      <span className="text-gray-400 font-medium text-xs uppercase">Employee Code</span>
                      <span className="font-semibold text-gray-900">{selectedUserSummary.employeeCode}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-gray-400 font-medium text-xs uppercase">Email Address</span>
                      <span className="font-semibold text-gray-900 flex items-center gap-1">
                        <Mail className="h-3.5 w-3.5 text-gray-400" /> {selectedUserSummary.email}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-gray-400 font-medium text-xs uppercase">Phone</span>
                      <span className="font-semibold text-gray-900 flex items-center gap-1">
                        <Phone className="h-3.5 w-3.5 text-gray-400" /> {selectedUserSummary.phone}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-gray-400 font-medium text-xs uppercase">Hire Date</span>
                      <span className="font-semibold text-gray-900 flex items-center gap-1">
                        <CalendarDays className="h-3.5 w-3.5 text-gray-400" /> {selectedUserSummary.hireDate}
                      </span>
                    </div>
                  </div>

                  <div className="border-t border-gray-100 pt-4 space-y-3">
                    <h5 className="font-semibold text-xs uppercase text-gray-400 tracking-wider">Metrics Summary</h5>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="bg-green-50 p-2.5 rounded-lg border border-green-100">
                        <p className="text-xs text-green-700 font-medium">Present</p>
                        <p className="text-xl font-bold text-green-900">{selectedUserSummary.totalPresentDays}d</p>
                      </div>
                      <div className="bg-orange-50 p-2.5 rounded-lg border border-orange-100">
                        <p className="text-xs text-orange-700 font-medium">Late</p>
                        <p className="text-xl font-bold text-orange-900">{selectedUserSummary.totalLateDays}d</p>
                      </div>
                      <div className="bg-red-50 p-2.5 rounded-lg border border-red-100">
                        <p className="text-xs text-red-700 font-medium">Absent</p>
                        <p className="text-xl font-bold text-red-900">{selectedUserSummary.totalAbsentDays}d</p>
                      </div>
                    </div>

                    <div className="bg-gray-50 p-3 rounded-lg flex items-center justify-between mt-2">
                      <span className="text-sm font-semibold text-gray-600">Overall Attendance Ratio</span>
                      <span className="text-base font-bold text-blue-600">{selectedUserSummary.attendancePercentage}%</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end">
              <Button onClick={() => setViewModalOpen(false)}>Close Summary</Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Attendance Modal Overlay */}
      {editModalOpen && editingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden border border-gray-100">
            <form onSubmit={handleSaveEdit}>
              <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                  <Edit2 className="h-5 w-5 text-blue-600" /> Edit Attendance Logs
                </h3>
                <button type="button" onClick={() => setEditModalOpen(false)} className="text-gray-400 hover:text-gray-900 transition-colors">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div className="bg-gray-50 p-3 rounded-lg text-sm text-gray-600 font-medium border border-gray-100">
                  <p>Employee: <strong className="text-gray-900">{editingRecord.user?.name}</strong></p>
                  <p className="mt-1">Date: <strong className="text-gray-900">{editingRecord.ethiopianDateLabel || editingRecord.ethiopianDate}</strong></p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="edit-morning">Morning Check-In</Label>
                    <Input
                      id="edit-morning"
                      type="time"
                      value={editMorningIn}
                      onChange={(e) => setEditMorningIn(e.target.value)}
                      className="bg-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="edit-lunchout">Lunch Out</Label>
                    <Input
                      id="edit-lunchout"
                      type="time"
                      value={editLunchOut}
                      onChange={(e) => setEditLunchOut(e.target.value)}
                      className="bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="edit-lunchreturn">Lunch Return</Label>
                    <Input
                      id="edit-lunchreturn"
                      type="time"
                      value={editLunchReturn}
                      onChange={(e) => setEditLunchReturn(e.target.value)}
                      className="bg-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="edit-finalout">Final Check-Out</Label>
                    <Input
                      id="edit-finalout"
                      type="time"
                      value={editFinalOut}
                      onChange={(e) => setEditFinalOut(e.target.value)}
                      className="bg-white"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="edit-status">Attendance Status Override</Label>
                  <select
                    id="edit-status"
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as AttendanceStatus)}
                    className="w-full h-10 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none"
                  >
                    <option value="PRESENT">Present</option>
                    <option value="LATE">Late</option>
                    <option value="ABSENT">Absent</option>
                    <option value="HALF_DAY">Half Day</option>
                    <option value="LUNCH_MISSING">Lunch Missing</option>
                  </select>
                </div>
              </div>
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setEditModalOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? "Saving Changes..." : "Save Logs"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminPage() {
  return (
    <ProtectedRoute requiredRole="ADMIN">
      <DashboardLayout>
        <AdminDashboard />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
