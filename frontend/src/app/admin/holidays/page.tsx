"use client";

import { useEffect, useState, useCallback } from "react";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { HolidayCalendar, getHolidayBadgeStyle } from "@/components/holidays/holiday-calendar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Holiday,
  HolidayStats,
  HolidayType,
  HolidayCalendarEvent,
  HolidaySummaryReport,
} from "@/types/holiday";
import {
  getHolidays,
  getHolidayStats,
  getHolidayCalendar,
  getHolidaySummaryReport,
  createHoliday,
  updateHoliday,
  deleteHoliday,
} from "@/lib/holiday-api";
import {
  exportGenericPdf,
  exportGenericExcel,
  printGenericReport,
} from "@/lib/advanced-report-export";
import { useAuth } from "@/contexts/auth-context";
import {
  Loader2,
  Search,
  Plus,
  Edit2,
  Trash2,
  Calendar,
  CalendarDays,
  PartyPopper,
  Building2,
  Globe,
  MapPin,
  Repeat,
  FileText,
  Download,
  Printer,
  X,
  AlertTriangle,
  Sparkles,
  BarChart3,
} from "lucide-react";

function AdminHolidaysPageContent() {
  const { user } = useAuth();

  // State
  const [activeTab, setActiveTab] = useState<"table" | "calendar" | "reports">("table");
  const [stats, setStats] = useState<HolidayStats | null>(null);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<HolidayCalendarEvent[]>([]);
  const [summaryReport, setSummaryReport] = useState<HolidaySummaryReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  // Create Modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [holidayDate, setHolidayDate] = useState("");
  const [holidayType, setHolidayType] = useState<HolidayType>("PUBLIC");
  const [isRecurring, setIsRecurring] = useState(false);
  const [isActive, setIsActive] = useState(true);

  // Edit Modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState<Holiday | null>(null);

  // Delete Modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingHoliday, setDeletingHoliday] = useState<Holiday | null>(null);

  // Fetch all data
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsData, holidaysRes, calendarData, reportData] = await Promise.all([
        getHolidayStats(),
        getHolidays({ year: selectedYear, type: typeFilter, search: searchQuery, limit: 100 }),
        getHolidayCalendar(selectedYear),
        getHolidaySummaryReport(selectedYear),
      ]);

      setStats(statsData);
      setHolidays(holidaysRes.holidays);
      setCalendarEvents(calendarData);
      setSummaryReport(reportData);
    } catch (err: any) {
      setError(err?.message || "Failed to load holiday data");
    } finally {
      setLoading(false);
    }
  }, [selectedYear, typeFilter, searchQuery]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle Create Submission
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !holidayDate) return;

    setSubmitting(true);
    setError(null);
    try {
      await createHoliday({
        name,
        description: description || null,
        holidayDate,
        holidayType,
        isRecurring,
        isActive,
      });

      setCreateModalOpen(false);
      resetForm();
      fetchData();
    } catch (err: any) {
      setError(err?.message || "Failed to create holiday");
    } finally {
      setSubmitting(false);
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (h: Holiday) => {
    setEditingHoliday(h);
    setName(h.name);
    setDescription(h.description || "");
    setHolidayDate(h.holidayDate.split("T")[0]);
    setHolidayType(h.holidayType);
    setIsRecurring(h.isRecurring);
    setIsActive(h.isActive);
    setEditModalOpen(true);
  };

  // Handle Edit Submission
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingHoliday || !name || !holidayDate) return;

    setSubmitting(true);
    setError(null);
    try {
      await updateHoliday(editingHoliday.id, {
        name,
        description: description || null,
        holidayDate,
        holidayType,
        isRecurring,
        isActive,
      });

      setEditModalOpen(false);
      setEditingHoliday(null);
      resetForm();
      fetchData();
    } catch (err: any) {
      setError(err?.message || "Failed to update holiday");
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Delete Confirmation
  const handleDeleteConfirm = async () => {
    if (!deletingHoliday) return;

    setSubmitting(true);
    setError(null);
    try {
      await deleteHoliday(deletingHoliday.id);
      setDeleteModalOpen(false);
      setDeletingHoliday(null);
      fetchData();
    } catch (err: any) {
      setError(err?.message || "Failed to delete holiday");
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setName("");
    setDescription("");
    setHolidayDate("");
    setHolidayType("PUBLIC");
    setIsRecurring(false);
    setIsActive(true);
  };

  // Filtered Holidays for Data Table
  const filteredHolidays = holidays.filter((h) => {
    const matchesSearch =
      h.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (h.description && h.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesType = typeFilter === "ALL" || h.holidayType === typeFilter;
    return matchesSearch && matchesType;
  });

  // Report Export Actions
  const getExportData = () => {
    const headers = ["Holiday Name", "Date", "Type", "Recurring", "Status", "Description"];
    const rows = filteredHolidays.map((h) => [
      h.name,
      new Date(h.holidayDate).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }),
      h.holidayType,
      h.isRecurring ? "Yes (Annual)" : "No",
      h.isActive ? "Active" : "Inactive",
      h.description || "—",
    ]);
    return { title: `Holiday Management Report (${selectedYear})`, headers, rows };
  };

  const handleExportPdf = () => {
    const { title, headers, rows } = getExportData();
    exportGenericPdf(title, headers, rows);
  };

  const handleExportExcel = () => {
    const { title, headers, rows } = getExportData();
    exportGenericExcel(title, headers, rows);
  };

  const handlePrint = () => {
    const { title, headers, rows } = getExportData();
    printGenericReport(title, headers, rows);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2.5">
            <PartyPopper className="h-7 w-7 text-blue-600" />
            Holiday Management
          </h2>
          <p className="text-gray-500 text-sm">
            Centralized management of public, company, and regional holidays
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button onClick={() => { resetForm(); setCreateModalOpen(true); }} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4" /> Add Holiday
          </Button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200 shadow-2xs">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-3 rounded-xl bg-blue-600 text-white">
              <Calendar className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-blue-700 uppercase tracking-wider">Total Holidays</p>
              <p className="text-2xl font-bold text-blue-950">{stats?.totalHolidays || 0}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100/50 border-red-200 shadow-2xs">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-3 rounded-xl bg-red-600 text-white">
              <Globe className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-red-700 uppercase tracking-wider">Public Holidays</p>
              <p className="text-2xl font-bold text-red-950">{stats?.publicHolidays || 0}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100/50 border-indigo-200 shadow-2xs">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-3 rounded-xl bg-indigo-600 text-white">
              <Building2 className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-indigo-700 uppercase tracking-wider">Company Holidays</p>
              <p className="text-2xl font-bold text-indigo-950">{stats?.companyHolidays || 0}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-amber-100/50 border-amber-200 shadow-2xs">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-3 rounded-xl bg-amber-500 text-white">
              <MapPin className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-amber-800 uppercase tracking-wider">Regional Holidays</p>
              <p className="text-2xl font-bold text-amber-950">{stats?.regionalHolidays || 0}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 border-emerald-200 shadow-2xs">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-3 rounded-xl bg-emerald-600 text-white">
              <CalendarDays className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">This Month</p>
              <p className="text-2xl font-bold text-emerald-950">{stats?.holidaysThisMonth || 0}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main View Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-200 pb-3">
        <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab("table")}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all flex items-center gap-2 ${
              activeTab === "table" ? "bg-white text-blue-700 shadow-xs" : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <Calendar className="h-4 w-4" /> Table View
          </button>
          <button
            onClick={() => setActiveTab("calendar")}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all flex items-center gap-2 ${
              activeTab === "calendar" ? "bg-white text-blue-700 shadow-xs" : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <CalendarDays className="h-4 w-4" /> Calendar View
          </button>
          <button
            onClick={() => setActiveTab("reports")}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all flex items-center gap-2 ${
              activeTab === "reports" ? "bg-white text-blue-700 shadow-xs" : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <BarChart3 className="h-4 w-4" /> Summary Reports
          </button>
        </div>

        {/* Quick Exports */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExportPdf}>
            <FileText className="h-4 w-4 text-red-600" /> Export PDF
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportExcel}>
            <Download className="h-4 w-4 text-green-600" /> Export Excel
          </Button>
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="h-4 w-4 text-gray-600" /> Print
          </Button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertTriangle className="h-5 w-5 shrink-0 text-red-600" />
          {error}
        </div>
      )}

      {/* TAB 1: DATA TABLE VIEW */}
      {activeTab === "table" && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <Card className="shadow-2xs border-gray-200">
            <CardContent className="p-4 flex flex-wrap items-center gap-4">
              <div className="flex-1 min-w-[220px] relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search holiday by name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 bg-white"
                />
              </div>

              <div className="w-[180px]">
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="w-full h-9 rounded-lg border border-gray-300 bg-white px-3 py-1 text-sm shadow-2xs focus:border-blue-500 focus:outline-none"
                >
                  <option value="ALL">All Holiday Types</option>
                  <option value="PUBLIC">Public Holiday</option>
                  <option value="COMPANY">Company Holiday</option>
                  <option value="REGIONAL">Regional Holiday</option>
                </select>
              </div>

              <div className="w-[140px]">
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
                  className="w-full h-9 rounded-lg border border-gray-300 bg-white px-3 py-1 text-sm shadow-2xs focus:border-blue-500 focus:outline-none"
                >
                  {[2024, 2025, 2026, 2027, 2028].map((y) => (
                    <option key={y} value={y}>{y} Calendar</option>
                  ))}
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Table Card */}
          <Card className="shadow-2xs border-gray-200">
            <CardHeader className="pb-3 border-b border-gray-100 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">Holiday Records</CardTitle>
                <CardDescription>Configured annual and static holiday dates</CardDescription>
              </div>
              <Badge variant="secondary" className="font-semibold">
                {filteredHolidays.length} Holidays Found
              </Badge>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex justify-center py-20">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                </div>
              ) : filteredHolidays.length === 0 ? (
                <p className="py-20 text-center text-sm text-gray-400">No holiday records found matching filters.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead>
                      <tr className="border-b border-gray-200 bg-gray-50/50 text-gray-500 uppercase tracking-wider text-xs font-semibold">
                        <th className="py-3.5 px-4">Holiday Name</th>
                        <th className="py-3.5 px-4">Date</th>
                        <th className="py-3.5 px-4">Holiday Type</th>
                        <th className="py-3.5 px-4">Recurring</th>
                        <th className="py-3.5 px-4">Status</th>
                        <th className="py-3.5 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredHolidays.map((h) => {
                        const style = getHolidayBadgeStyle(h.holidayType);
                        return (
                          <tr key={h.id} className="hover:bg-gray-50/30 transition-colors">
                            <td className="py-4 px-4 font-semibold text-gray-900">
                              <div>
                                <p className="text-base font-bold text-gray-900">{h.name}</p>
                                {h.description && (
                                  <p className="text-xs text-gray-500 font-normal line-clamp-1">{h.description}</p>
                                )}
                              </div>
                            </td>
                            <td className="py-4 px-4 font-semibold text-gray-700">
                              {new Date(h.holidayDate).toLocaleDateString("en-US", {
                                weekday: "short",
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              })}
                            </td>
                            <td className="py-4 px-4">
                              <Badge className={`border text-xs px-2.5 py-0.5 font-semibold ${style.bg}`}>
                                {style.label}
                              </Badge>
                            </td>
                            <td className="py-4 px-4">
                              {h.isRecurring ? (
                                <span className="inline-flex items-center gap-1 text-purple-700 font-semibold text-xs bg-purple-50 px-2 py-0.5 rounded-full border border-purple-100">
                                  <Repeat className="h-3 w-3" /> Yes (Yearly)
                                </span>
                              ) : (
                                <span className="text-gray-400 text-xs font-medium">No</span>
                              )}
                            </td>
                            <td className="py-4 px-4">
                              <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                h.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                              }`}>
                                {h.isActive ? "Active" : "Inactive"}
                              </span>
                            </td>
                            <td className="py-4 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleOpenEdit(h)}
                                  className="h-8 px-2 text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                                >
                                  <Edit2 className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => { setDeletingHoliday(h); setDeleteModalOpen(true); }}
                                  className="h-8 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 2: CALENDAR VIEW */}
      {activeTab === "calendar" && (
        <HolidayCalendar events={calendarEvents} />
      )}

      {/* TAB 3: SUMMARY REPORTS */}
      {activeTab === "reports" && summaryReport && (
        <div className="space-y-6">
          {/* Summary Breakdown Metrics */}
          <div className="grid gap-4 sm:grid-cols-4">
            <Card className="bg-white border-gray-200">
              <CardContent className="p-4">
                <p className="text-xs text-gray-500 font-semibold uppercase">Total Annual Holidays</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{summaryReport.summary.totalHolidays}</p>
              </CardContent>
            </Card>
            <Card className="bg-red-50/50 border-red-200">
              <CardContent className="p-4">
                <p className="text-xs text-red-700 font-semibold uppercase">Public Holidays</p>
                <p className="text-3xl font-bold text-red-900 mt-1">{summaryReport.summary.publicHolidays}</p>
              </CardContent>
            </Card>
            <Card className="bg-blue-50/50 border-blue-200">
              <CardContent className="p-4">
                <p className="text-xs text-blue-700 font-semibold uppercase">Company Holidays</p>
                <p className="text-3xl font-bold text-blue-900 mt-1">{summaryReport.summary.companyHolidays}</p>
              </CardContent>
            </Card>
            <Card className="bg-amber-50/50 border-amber-200">
              <CardContent className="p-4">
                <p className="text-xs text-amber-800 font-semibold uppercase">Regional Holidays</p>
                <p className="text-3xl font-bold text-amber-950 mt-1">{summaryReport.summary.regionalHolidays}</p>
              </CardContent>
            </Card>
          </div>

          {/* Visual Breakdown Cards */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="shadow-2xs">
              <CardHeader>
                <CardTitle className="text-base font-bold">Holidays By Type</CardTitle>
                <CardDescription>Categorized distribution</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {summaryReport.holidaysByType.map((t) => {
                  const percent = summaryReport.summary.totalHolidays > 0
                    ? Math.round((t.count / summaryReport.summary.totalHolidays) * 100)
                    : 0;
                  return (
                    <div key={t.type} className="space-y-1">
                      <div className="flex justify-between text-sm font-semibold">
                        <span>{t.name}</span>
                        <span>{t.count} ({percent}%)</span>
                      </div>
                      <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            t.type === "PUBLIC" ? "bg-red-500" : t.type === "COMPANY" ? "bg-blue-600" : "bg-amber-500"
                          }`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            <Card className="shadow-2xs">
              <CardHeader>
                <CardTitle className="text-base font-bold">Holidays By Month ({selectedYear})</CardTitle>
                <CardDescription>Monthly density</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-6 gap-2 text-center">
                  {summaryReport.holidaysByMonth.map((m) => (
                    <div key={m.month} className="p-2.5 rounded-lg border border-gray-100 bg-gray-50/50">
                      <p className="text-xs font-bold text-gray-500 uppercase">{m.month}</p>
                      <p className="text-xl font-bold text-blue-600 mt-1">{m.count}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* CREATE HOLIDAY MODAL */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden border border-gray-100">
            <form onSubmit={handleCreateSubmit}>
              <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                  <PartyPopper className="h-5 w-5 text-blue-600" /> Create New Holiday
                </h3>
                <button type="button" onClick={() => setCreateModalOpen(false)} className="text-gray-400 hover:text-gray-900">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="space-y-1">
                  <Label htmlFor="create-name">Holiday Name *</Label>
                  <Input
                    id="create-name"
                    placeholder="e.g. New Year's Day, Ethiopian Christmas"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="create-date">Holiday Date *</Label>
                    <Input
                      id="create-date"
                      type="date"
                      value={holidayDate}
                      onChange={(e) => setHolidayDate(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="create-type">Holiday Type</Label>
                    <select
                      id="create-type"
                      value={holidayType}
                      onChange={(e) => setHolidayType(e.target.value as HolidayType)}
                      className="w-full h-10 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-2xs focus:border-blue-500 focus:outline-none"
                    >
                      <option value="PUBLIC">Public Holiday</option>
                      <option value="COMPANY">Company Holiday</option>
                      <option value="REGIONAL">Regional Holiday</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="create-desc">Description (Optional)</Label>
                  <textarea
                    id="create-desc"
                    rows={2}
                    placeholder="Provide additional context or details..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 p-2.5 text-sm shadow-2xs focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div className="flex items-center gap-6 pt-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isRecurring}
                      onChange={(e) => setIsRecurring(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    Annual Recurring (Every Year)
                  </label>

                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    Active Status
                  </label>
                </div>
              </div>

              <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setCreateModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting} className="bg-blue-600 hover:bg-blue-700">
                  {submitting ? "Creating..." : "Save Holiday"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT HOLIDAY MODAL */}
      {editModalOpen && editingHoliday && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden border border-gray-100">
            <form onSubmit={handleEditSubmit}>
              <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                  <Edit2 className="h-5 w-5 text-orange-600" /> Edit Holiday Record
                </h3>
                <button type="button" onClick={() => setEditModalOpen(false)} className="text-gray-400 hover:text-gray-900">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="space-y-1">
                  <Label htmlFor="edit-name">Holiday Name *</Label>
                  <Input
                    id="edit-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="edit-date">Holiday Date *</Label>
                    <Input
                      id="edit-date"
                      type="date"
                      value={holidayDate}
                      onChange={(e) => setHolidayDate(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="edit-type">Holiday Type</Label>
                    <select
                      id="edit-type"
                      value={holidayType}
                      onChange={(e) => setHolidayType(e.target.value as HolidayType)}
                      className="w-full h-10 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-2xs focus:border-blue-500 focus:outline-none"
                    >
                      <option value="PUBLIC">Public Holiday</option>
                      <option value="COMPANY">Company Holiday</option>
                      <option value="REGIONAL">Regional Holiday</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="edit-desc">Description</Label>
                  <textarea
                    id="edit-desc"
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 p-2.5 text-sm shadow-2xs focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div className="flex items-center gap-6 pt-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isRecurring}
                      onChange={(e) => setIsRecurring(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    Annual Recurring (Every Year)
                  </label>

                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    Active Status
                  </label>
                </div>
              </div>

              <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setEditModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting} className="bg-blue-600 hover:bg-blue-700">
                  {submitting ? "Updating..." : "Update Holiday"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteModalOpen && deletingHoliday && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden border border-gray-100">
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3 text-red-600">
                <AlertTriangle className="h-6 w-6" />
                <h3 className="font-bold text-gray-900 text-lg">Delete Holiday</h3>
              </div>
              <p className="text-sm text-gray-600">
                Are you sure you want to delete holiday <strong className="text-gray-900">{deletingHoliday.name}</strong>?
                This action cannot be undone.
              </p>
            </div>
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setDeleteModalOpen(false)}>Cancel</Button>
              <Button onClick={handleDeleteConfirm} disabled={submitting} className="bg-red-600 hover:bg-red-700 text-white">
                {submitting ? "Deleting..." : "Delete Holiday"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminHolidaysPage() {
  return (
    <ProtectedRoute requiredRole="ADMIN">
      <DashboardLayout>
        <AdminHolidaysPageContent />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
