"use client";

import { useEffect, useState } from "react";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/api";
import { JobPosting, JobStatus } from "@/types/ats";
import {
  Briefcase,
  Plus,
  Search,
  Loader2,
  RefreshCw,
  Trash2,
  CheckCircle2,
  XCircle,
  Building2,
  MapPin,
  Clock,
} from "lucide-react";

export default function AdminAtsJobsPage() {
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");

  // Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    code: `JOB-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
    title: "",
    department: "Engineering",
    location: "Addis Ababa (Hybrid)",
    employmentType: "FULL_TIME",
    description: "",
    requirements: "",
    minSalary: 35000,
    maxSalary: 55000,
    status: "OPEN" as JobStatus,
    closingDate: new Date(Date.now() + 45 * 86400000).toISOString().slice(0, 10),
  });

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const data = await apiRequest<JobPosting[]>("/ats/jobs");
      setJobs(data);
    } catch (err) {
      console.error("Failed to load job postings", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.code) return;

    setSubmitting(true);
    try {
      await apiRequest<JobPosting>("/ats/jobs", {
        method: "POST",
        body: JSON.stringify(formData),
      });
      setIsCreateOpen(false);
      setFormData({
        code: `JOB-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
        title: "",
        department: "Engineering",
        location: "Addis Ababa (Hybrid)",
        employmentType: "FULL_TIME",
        description: "",
        requirements: "",
        minSalary: 35000,
        maxSalary: 55000,
        status: "OPEN",
        closingDate: new Date(Date.now() + 45 * 86400000).toISOString().slice(0, 10),
      });
      fetchJobs();
    } catch (err) {
      console.error("Failed to create job posting", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (job: JobPosting) => {
    const nextStatus: JobStatus = job.status === "OPEN" ? "CLOSED" : "OPEN";
    try {
      await apiRequest(`/ats/jobs/${job.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: nextStatus }),
      });
      fetchJobs();
    } catch (err) {
      console.error("Failed to toggle job status", err);
    }
  };

  const handleDeleteJob = async (id: string) => {
    if (!confirm("Are you sure you want to delete this job posting?")) return;
    try {
      await apiRequest(`/ats/jobs/${id}`, { method: "DELETE" });
      fetchJobs();
    } catch (err) {
      console.error("Failed to delete job posting", err);
    }
  };

  const filteredJobs = jobs.filter((j) => {
    const matchesSearch =
      j.title.toLowerCase().includes(search.toLowerCase()) ||
      j.code.toLowerCase().includes(search.toLowerCase()) ||
      (j.department && j.department.toLowerCase().includes(search.toLowerCase()));
    const matchesStatus = selectedStatus === "ALL" || j.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <ProtectedRoute requiredRole="ADMIN">
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Briefcase className="h-6 w-6 text-blue-600" />
                Job Postings Management
              </h1>
              <p className="text-sm text-gray-500">
                Create, edit, and publish open positions for recruitment.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={fetchJobs} disabled={loading}>
                <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
              <Button onClick={() => setIsCreateOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white">
                <Plus className="mr-2 h-4 w-4" />
                New Job Posting
              </Button>
            </div>
          </div>

          {/* Filters & Search */}
          <Card>
            <CardContent className="p-4 flex flex-col sm:flex-row gap-4 justify-between items-center">
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search job title or code..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>

              <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                {["ALL", "OPEN", "DRAFT", "ON_HOLD", "CLOSED"].map((st) => (
                  <Button
                    key={st}
                    variant={selectedStatus === st ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedStatus(st)}
                    className="text-xs"
                  >
                    {st.replace("_", " ")}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Jobs Table */}
          <Card>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex h-48 items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                </div>
              ) : filteredJobs.length ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 border-b text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      <tr>
                        <th className="px-6 py-3">Job Code & Title</th>
                        <th className="px-6 py-3">Department</th>
                        <th className="px-6 py-3">Location</th>
                        <th className="px-6 py-3">Status</th>
                        <th className="px-6 py-3">Applicants</th>
                        <th className="px-6 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredJobs.map((job) => (
                        <tr key={job.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div>
                              <p className="font-semibold text-gray-900">{job.title}</p>
                              <p className="text-xs text-gray-500 font-mono">{job.code}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-gray-600">
                            <span className="flex items-center gap-1">
                              <Building2 className="h-3.5 w-3.5 text-gray-400" />
                              {job.department || "General"}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-gray-600">
                            <span className="flex items-center gap-1 text-xs">
                              <MapPin className="h-3.5 w-3.5 text-gray-400" />
                              {job.location || "N/A"}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <Badge
                              className={
                                job.status === "OPEN"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : job.status === "DRAFT"
                                  ? "bg-gray-100 text-gray-800"
                                  : "bg-red-100 text-red-800"
                              }
                            >
                              {job.status}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 font-semibold text-gray-900">
                            {job._count?.applications || 0} candidate(s)
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleToggleStatus(job)}
                                className="h-8 text-xs"
                              >
                                {job.status === "OPEN" ? (
                                  <>
                                    <XCircle className="mr-1 h-3.5 w-3.5 text-red-500" /> Close
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle2 className="mr-1 h-3.5 w-3.5 text-emerald-500" /> Publish Open
                                  </>
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteJob(job.id)}
                                className="h-8 w-8 p-0 text-red-600 hover:text-red-800"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-12 text-center text-sm text-gray-500">
                  No job postings match the selected filter.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Create Job Modal */}
          {isCreateOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <Card className="w-full max-w-xl bg-white shadow-xl max-h-[90vh] overflow-y-auto">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Briefcase className="h-5 w-5 text-blue-600" />
                    New Job Requisition Posting
                  </CardTitle>
                  <CardDescription>Publish a new open position for candidates</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleCreateJob} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Job Code *</label>
                        <Input
                          value={formData.code}
                          onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Department</label>
                        <Input
                          value={formData.department}
                          onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Job Title *</label>
                      <Input
                        placeholder="e.g. Senior Frontend Developer"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Location</label>
                        <Input
                          placeholder="e.g. Addis Ababa (Hybrid)"
                          value={formData.location}
                          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Employment Type</label>
                        <select
                          className="w-full rounded-md border border-gray-300 p-2 text-sm"
                          value={formData.employmentType}
                          onChange={(e) => setFormData({ ...formData, employmentType: e.target.value })}
                        >
                          <option value="FULL_TIME">Full-Time</option>
                          <option value="PART_TIME">Part-Time</option>
                          <option value="CONTRACT">Contract</option>
                          <option value="INTERN">Internship</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Description *</label>
                      <textarea
                        className="w-full rounded-md border border-gray-300 p-2 text-sm"
                        rows={3}
                        placeholder="Overview of duties, role responsibilities..."
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Requirements & Qualifications</label>
                      <textarea
                        className="w-full rounded-md border border-gray-300 p-2 text-sm"
                        rows={3}
                        placeholder="Key skills, degree requirements, tech stack experience..."
                        value={formData.requirements}
                        onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Min Monthly Salary (ETB)</label>
                        <Input
                          type="number"
                          value={formData.minSalary}
                          onChange={(e) => setFormData({ ...formData, minSalary: Number(e.target.value) })}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Max Monthly Salary (ETB)</label>
                        <Input
                          type="number"
                          value={formData.maxSalary}
                          onChange={(e) => setFormData({ ...formData, maxSalary: Number(e.target.value) })}
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-4 border-t">
                      <Button variant="outline" type="button" onClick={() => setIsCreateOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={submitting} className="bg-blue-600 text-white">
                        {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Publish Job Posting"}
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
