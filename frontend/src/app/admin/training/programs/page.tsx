"use client";

import { useEffect, useState } from "react";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/api";
import { TrainingProgram, TrainingStatus } from "@/types/training";
import {
  BookOpen,
  Plus,
  Search,
  Loader2,
  RefreshCw,
  Trash2,
  Calendar,
  User,
  MapPin,
  FileText,
  ExternalLink,
} from "lucide-react";

export default function AdminTrainingProgramsPage() {
  const [programs, setPrograms] = useState<TrainingProgram[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");

  // Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    code: `TRN-${Math.floor(100 + Math.random() * 900)}`,
    title: "",
    category: "Technical",
    description: "",
    trainerName: "",
    location: "Corporate Training Center",
    materialsUrl: "https://example.com/materials/course_syllabus.pdf",
    startDate: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
    endDate: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
    capacity: 25,
    status: "OPEN" as TrainingStatus,
  });

  const fetchPrograms = async () => {
    setLoading(true);
    try {
      const data = await apiRequest<TrainingProgram[]>("/training/programs");
      setPrograms(data);
    } catch (err) {
      console.error("Failed to load training programs", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrograms();
  }, []);

  const handleCreateProgram = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.code || !formData.startDate) return;

    setSubmitting(true);
    try {
      await apiRequest<TrainingProgram>("/training/programs", {
        method: "POST",
        body: JSON.stringify(formData),
      });
      setIsCreateOpen(false);
      setFormData({
        code: `TRN-${Math.floor(100 + Math.random() * 900)}`,
        title: "",
        category: "Technical",
        description: "",
        trainerName: "",
        location: "Corporate Training Center",
        materialsUrl: "https://example.com/materials/course_syllabus.pdf",
        startDate: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
        endDate: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
        capacity: 25,
        status: "OPEN",
      });
      fetchPrograms();
    } catch (err) {
      console.error("Failed to create training program", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteProgram = async (id: string) => {
    if (!confirm("Are you sure you want to delete this training program?")) return;
    try {
      await apiRequest(`/training/programs/${id}`, { method: "DELETE" });
      fetchPrograms();
    } catch (err) {
      console.error("Failed to delete program", err);
    }
  };

  const filteredPrograms = programs.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.code.toLowerCase().includes(search.toLowerCase()) ||
      (p.category && p.category.toLowerCase().includes(search.toLowerCase())) ||
      (p.trainerName && p.trainerName.toLowerCase().includes(search.toLowerCase()));
    const matchesStatus = selectedStatus === "ALL" || p.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <ProtectedRoute requiredRole="ADMIN">
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <BookOpen className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                Course Catalog & Training Programs
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Create and manage employee professional development courses, study material links, and capacity limits.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={fetchPrograms} disabled={loading} className="dark:bg-slate-900 dark:border-slate-800">
                <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
              <Button onClick={() => setIsCreateOpen(true)} className="bg-purple-600 hover:bg-purple-700 text-white shadow-md shadow-purple-500/20">
                <Plus className="mr-2 h-4 w-4" />
                New Training Program
              </Button>
            </div>
          </div>

          {/* Filters & Search */}
          <Card className="dark:bg-slate-900/80 dark:border-slate-800">
            <CardContent className="p-4 flex flex-col sm:flex-row gap-4 justify-between items-center">
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search course title, trainer, code..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 dark:bg-slate-900 dark:border-slate-800"
                />
              </div>

              <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                {["ALL", "OPEN", "CLOSED", "UPCOMING", "IN_PROGRESS", "COMPLETED"].map((st) => (
                  <Button
                    key={st}
                    variant={selectedStatus === st ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedStatus(st)}
                    className="text-xs dark:bg-slate-900 dark:border-slate-800"
                  >
                    {st.replace("_", " ")}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Programs Table */}
          <Card className="dark:bg-slate-900/80 dark:border-slate-800">
            <CardContent className="p-0">
              {loading ? (
                <div className="flex h-48 items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
                </div>
              ) : filteredPrograms.length ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      <tr>
                        <th className="px-6 py-3">Course Code & Title</th>
                        <th className="px-6 py-3">Category</th>
                        <th className="px-6 py-3">Trainer & Location</th>
                        <th className="px-6 py-3">Schedule</th>
                        <th className="px-6 py-3">Seats & Enrolled</th>
                        <th className="px-6 py-3">Status</th>
                        <th className="px-6 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                      {filteredPrograms.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                          <td className="px-6 py-4">
                            <div>
                              <p className="font-semibold text-slate-900 dark:text-slate-100">{item.title}</p>
                              <p className="text-xs text-slate-500 font-mono">{item.code}</p>
                              {item.materialsUrl && (
                                <a
                                  href={item.materialsUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center text-[11px] text-purple-600 dark:text-purple-400 hover:underline mt-0.5"
                                >
                                  <FileText className="h-3 w-3 mr-1" /> Materials Link <ExternalLink className="h-2.5 w-2.5 ml-0.5" />
                                </a>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-slate-700 dark:text-slate-300">{item.category || "General"}</td>
                          <td className="px-6 py-4 text-xs text-slate-600 dark:text-slate-400 space-y-0.5">
                            <span className="flex items-center gap-1 font-semibold text-slate-800 dark:text-slate-200">
                              <User className="h-3.5 w-3.5 text-purple-500" />
                              {item.trainerName || "TBD"}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3.5 w-3.5 text-slate-400" />
                              {item.location || "Online"}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-xs text-slate-600 dark:text-slate-400">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5 text-purple-500" />
                              {new Date(item.startDate).toLocaleDateString()} - {new Date(item.endDate).toLocaleDateString()}
                            </span>
                          </td>
                          <td className="px-6 py-4 font-semibold text-slate-900 dark:text-slate-100">
                            {item._count?.enrollments || 0} / {item.capacity} enrolled
                          </td>
                          <td className="px-6 py-4">
                            <Badge
                              className={
                                item.status === "OPEN"
                                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                                  : item.status === "COMPLETED"
                                  ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20"
                                  : "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20"
                              }
                            >
                              {item.status}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteProgram(item.id)}
                              className="h-8 w-8 p-0 text-rose-600 hover:text-rose-800"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-12 text-center text-sm text-slate-500 dark:text-slate-400">
                  No training programs match the selected filter.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Create Program Modal */}
          {isCreateOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <Card className="w-full max-w-xl bg-white dark:bg-slate-900 shadow-xl max-h-[90vh] overflow-y-auto border dark:border-slate-800">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2 text-slate-900 dark:text-slate-100">
                    <BookOpen className="h-5 w-5 text-purple-600" />
                    New Training Program Requisition
                  </CardTitle>
                  <CardDescription>Create a new training course or workshop</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleCreateProgram} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Course Code *</label>
                        <Input
                          value={formData.code}
                          onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Category</label>
                        <select
                          className="w-full rounded-md border border-slate-300 dark:border-slate-800 p-2 text-sm bg-transparent dark:text-slate-100 dark:bg-slate-900"
                          value={formData.category}
                          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        >
                          <option value="Technical">Technical</option>
                          <option value="Leadership">Leadership</option>
                          <option value="Compliance">Compliance & Security</option>
                          <option value="Soft Skills">Soft Skills & Communication</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Course Title *</label>
                      <Input
                        placeholder="e.g. Enterprise Full Stack System Architecture"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Description *</label>
                      <textarea
                        className="w-full rounded-md border border-slate-300 dark:border-slate-800 p-2 text-sm bg-transparent dark:text-slate-100"
                        rows={3}
                        placeholder="Detailed syllabus, course objectives, learning outcomes..."
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Trainer / Instructor</label>
                        <Input
                          placeholder="e.g. Dr. Samuel Tadesse"
                          value={formData.trainerName}
                          onChange={(e) => setFormData({ ...formData, trainerName: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Location / Platform</label>
                        <Input
                          placeholder="e.g. Training Lab A / Zoom"
                          value={formData.location}
                          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Course Study Materials URL (Unlocked after Approval)</label>
                      <Input
                        placeholder="https://example.com/materials/course_syllabus.pdf"
                        value={formData.materialsUrl}
                        onChange={(e) => setFormData({ ...formData, materialsUrl: e.target.value })}
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Start Date *</label>
                        <Input
                          type="date"
                          value={formData.startDate}
                          onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">End Date *</label>
                        <Input
                          type="date"
                          value={formData.endDate}
                          onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Max Capacity Seats</label>
                        <Input
                          type="number"
                          value={formData.capacity}
                          onChange={(e) => setFormData({ ...formData, capacity: Number(e.target.value) })}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Initial Status</label>
                      <select
                        className="w-full rounded-md border border-slate-300 dark:border-slate-800 p-2 text-sm bg-transparent dark:text-slate-100 dark:bg-slate-900"
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value as TrainingStatus })}
                      >
                        <option value="OPEN">OPEN for Applications</option>
                        <option value="CLOSED">CLOSED for Applications</option>
                        <option value="UPCOMING">UPCOMING</option>
                        <option value="IN_PROGRESS">IN PROGRESS</option>
                      </select>
                    </div>

                    <div className="flex justify-end gap-2 pt-4 border-t dark:border-slate-800">
                      <Button variant="outline" type="button" onClick={() => setIsCreateOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={submitting} className="bg-purple-600 text-white">
                        {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Publish Training Course"}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
