"use client";

import { useEffect, useState } from "react";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/api";
import { JobApplication, ApplicationStatus } from "@/types/ats";
import {
  Users,
  Search,
  Loader2,
  RefreshCw,
  Star,
  UserCheck,
  Building2,
  Phone,
  Mail,
  Briefcase,
  ChevronRight,
} from "lucide-react";

const STAGES: ApplicationStatus[] = [
  "APPLIED",
  "SCREENED",
  "INTERVIEW_SCHEDULED",
  "OFFER_EXTENDED",
  "HIRED",
  "REJECTED",
];

export default function AdminAtsApplicationsPage() {
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Convert to Employee State
  const [convertApp, setConvertApp] = useState<JobApplication | null>(null);
  const [submittingConvert, setSubmittingConvert] = useState(false);
  const [convertData, setConvertData] = useState({
    employeeId: `EMP${Math.floor(100 + Math.random() * 900)}`,
    department: "Engineering",
    role: "EMPLOYEE",
    password: "employee123",
  });

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const data = await apiRequest<JobApplication[]>("/ats/applications");
      setApplications(data);
    } catch (err) {
      console.error("Failed to load candidate applications", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const handleUpdateStage = async (id: string, nextStatus: ApplicationStatus) => {
    try {
      await apiRequest(`/ats/applications/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: nextStatus }),
      });
      fetchApplications();
    } catch (err) {
      console.error("Failed to update candidate stage", err);
    }
  };

  const handleRating = async (id: string, rating: number) => {
    try {
      await apiRequest(`/ats/applications/${id}/rate`, {
        method: "PATCH",
        body: JSON.stringify({ rating }),
      });
      fetchApplications();
    } catch (err) {
      console.error("Failed to rate candidate", err);
    }
  };

  const handleConvertEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!convertApp) return;

    setSubmittingConvert(true);
    try {
      await apiRequest(`/ats/applications/${convertApp.id}/convert-employee`, {
        method: "POST",
        body: JSON.stringify(convertData),
      });
      setConvertApp(null);
      fetchApplications();
      alert(`Candidate ${convertApp.applicantName} onboarded successfully as Employee ${convertData.employeeId}!`);
    } catch (err) {
      console.error("Failed to onboard employee", err);
    } finally {
      setSubmittingConvert(false);
    }
  };

  const filtered = applications.filter(
    (a) =>
      a.applicantName.toLowerCase().includes(search.toLowerCase()) ||
      a.email.toLowerCase().includes(search.toLowerCase()) ||
      (a.jobPosting && a.jobPosting.title.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <ProtectedRoute requiredRole="ADMIN">
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Users className="h-6 w-6 text-emerald-600" />
                Candidate Application Pipeline
              </h1>
              <p className="text-sm text-gray-500">
                Track candidates through screening, interviews, offers, and employee onboarding.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={fetchApplications} disabled={loading}>
                <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                Refresh Pipeline
              </Button>
            </div>
          </div>

          {/* Search Bar */}
          <Card>
            <CardContent className="p-4">
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search candidates or job title..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </CardContent>
          </Card>

          {/* Kanban Stage Pipeline */}
          {loading ? (
            <div className="flex h-48 items-center justify-center rounded-xl bg-white shadow-sm">
              <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-6 overflow-x-auto pb-4">
              {STAGES.map((stage) => {
                const stageApps = filtered.filter((a) => a.status === stage);
                return (
                  <div key={stage} className="rounded-xl bg-gray-50 p-3 border min-w-[220px]">
                    <div className="flex items-center justify-between mb-3 border-b pb-2">
                      <h3 className="text-xs font-bold uppercase text-gray-700 tracking-wider">
                        {stage.replace("_", " ")}
                      </h3>
                      <Badge variant="secondary" className="text-xs">
                        {stageApps.length}
                      </Badge>
                    </div>

                    <div className="space-y-3">
                      {stageApps.map((candidate) => (
                        <Card key={candidate.id} className="bg-white shadow-sm hover:shadow-md transition-shadow">
                          <CardContent className="p-3 space-y-2">
                            <div className="flex justify-between items-start">
                              <p className="font-semibold text-sm text-gray-900">{candidate.applicantName}</p>
                              <div className="flex items-center text-amber-500">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star
                                    key={star}
                                    className={`h-3 w-3 cursor-pointer ${
                                      (candidate.rating || 0) >= star ? "fill-amber-400" : "text-gray-300"
                                    }`}
                                    onClick={() => handleRating(candidate.id, star)}
                                  />
                                ))}
                              </div>
                            </div>

                            <p className="text-xs text-gray-500 font-medium flex items-center gap-1">
                              <Briefcase className="h-3 w-3 text-blue-500" />
                              {candidate.jobPosting?.title || "Job Requisition"}
                            </p>

                            {candidate.currentCompany && (
                              <p className="text-[11px] text-gray-400">Company: {candidate.currentCompany}</p>
                            )}

                            {candidate.experienceYears !== undefined && candidate.experienceYears !== null && (
                              <p className="text-[11px] font-semibold text-emerald-600">
                                {candidate.experienceYears} Years Experience
                              </p>
                            )}

                            {/* Stage Move Dropdown */}
                            <div className="pt-2 border-t flex flex-col gap-1">
                              <select
                                className="w-full rounded border border-gray-200 p-1 text-[11px] bg-gray-50 font-medium"
                                value={candidate.status}
                                onChange={(e) => handleUpdateStage(candidate.id, e.target.value as ApplicationStatus)}
                              >
                                {STAGES.map((s) => (
                                  <option key={s} value={s}>
                                    Move to: {s.replace("_", " ")}
                                  </option>
                                ))}
                              </select>

                              {candidate.status === "HIRED" && (
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    setConvertApp(candidate);
                                    setConvertData((prev) => ({
                                      ...prev,
                                      department: candidate.jobPosting?.department || "Engineering",
                                    }));
                                  }}
                                  className="w-full h-7 text-[11px] bg-emerald-600 hover:bg-emerald-700 text-white mt-1"
                                >
                                  <UserCheck className="mr-1 h-3 w-3" />
                                  Onboard Employee
                                </Button>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}

                      {!stageApps.length && (
                        <p className="text-center py-6 text-xs text-gray-400 italic">No candidates</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Onboard Hired Candidate Modal */}
          {convertApp && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <Card className="w-full max-w-md bg-white shadow-xl">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <UserCheck className="h-5 w-5 text-emerald-600" />
                    Onboard Candidate as Employee
                  </CardTitle>
                  <CardDescription>
                    Convert hired applicant {convertApp.applicantName} ({convertApp.email}) into an active Employee user.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleConvertEmployee} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Employee Code / ID *</label>
                      <Input
                        value={convertData.employeeId}
                        onChange={(e) => setConvertData({ ...convertData, employeeId: e.target.value })}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Assigned Department</label>
                      <Input
                        value={convertData.department}
                        onChange={(e) => setConvertData({ ...convertData, department: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Default Password</label>
                      <Input
                        type="password"
                        value={convertData.password}
                        onChange={(e) => setConvertData({ ...convertData, password: e.target.value })}
                        required
                      />
                    </div>

                    <div className="flex justify-end gap-2 pt-4 border-t">
                      <Button variant="outline" type="button" onClick={() => setConvertApp(null)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={submittingConvert} className="bg-emerald-600 text-white">
                        {submittingConvert ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm & Create Account"}
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
