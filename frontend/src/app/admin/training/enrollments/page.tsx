"use client";

import { useEffect, useState } from "react";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/api";
import { TrainingEnrollment, TrainingProgram, EnrollmentStatus } from "@/types/training";
import {
  Users,
  Plus,
  Loader2,
  RefreshCw,
  Award,
  BookOpen,
  UserCheck,
  CheckCircle2,
  Trash2,
} from "lucide-react";

interface SimpleUser {
  id: string;
  name: string;
  employeeId: string;
  department?: string | null;
}

export default function AdminTrainingEnrollmentsPage() {
  const [enrollments, setEnrollments] = useState<TrainingEnrollment[]>([]);
  const [programs, setPrograms] = useState<TrainingProgram[]>([]);
  const [employees, setEmployees] = useState<SimpleUser[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals State
  const [isEnrollOpen, setIsEnrollOpen] = useState(false);
  const [selectedEnrollment, setSelectedEnrollment] = useState<TrainingEnrollment | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [enrollData, setEnrollData] = useState({
    trainingProgramId: "",
    employeeId: "",
    status: "ENROLLED" as EnrollmentStatus,
  });

  const [certData, setCertData] = useState({
    status: "COMPLETED" as EnrollmentStatus,
    score: 90,
    certificateNo: `CERT-${new Date().getFullYear()}-001`,
    issueDate: new Date().toISOString().slice(0, 10),
    feedback: "Exceeded course expectations and demonstrated high technical proficiency.",
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [progRes, empRes] = await Promise.all([
        apiRequest<TrainingProgram[]>("/training/programs"),
        apiRequest<SimpleUser[]>("/employees"),
      ]);
      setPrograms(progRes);
      setEmployees(empRes);

      // Fetch all enrollments by getting full program details
      const allEnrollments: TrainingEnrollment[] = [];
      for (const prog of progRes) {
        try {
          const detail = await apiRequest<TrainingProgram & { enrollments: TrainingEnrollment[] }>(`/training/programs/${prog.id}`);
          if (detail.enrollments) {
            allEnrollments.push(...detail.enrollments.map((e) => ({ ...e, trainingProgram: prog })));
          }
        } catch (e) {
          console.error(e);
        }
      }
      setEnrollments(allEnrollments);
      if (progRes.length && !enrollData.trainingProgramId) {
        setEnrollData((prev) => ({ ...prev, trainingProgramId: progRes[0].id }));
      }
    } catch (err) {
      console.error("Failed to load enrollment data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleEnroll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!enrollData.trainingProgramId || !enrollData.employeeId) return;

    setSubmitting(true);
    try {
      await apiRequest<TrainingEnrollment>("/training/enroll", {
        method: "POST",
        body: JSON.stringify(enrollData),
      });
      setIsEnrollOpen(false);
      fetchData();
    } catch (err) {
      console.error("Failed to enroll employee", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateCertification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEnrollment) return;

    setSubmitting(true);
    try {
      await apiRequest(`/training/enrollments/${selectedEnrollment.id}`, {
        method: "PATCH",
        body: JSON.stringify(certData),
      });
      setSelectedEnrollment(null);
      fetchData();
    } catch (err) {
      console.error("Failed to update certification", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelEnrollment = async (id: string) => {
    if (!confirm("Are you sure you want to cancel this employee enrollment?")) return;
    try {
      await apiRequest(`/training/enrollments/${id}`, { method: "DELETE" });
      fetchData();
    } catch (err) {
      console.error("Failed to cancel enrollment", err);
    }
  };

  return (
    <ProtectedRoute requiredRole="ADMIN">
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Users className="h-6 w-6 text-purple-600" />
                Employee Enrollments & Certification
              </h1>
              <p className="text-sm text-gray-500">
                Enroll candidates into active courses, track scores, and issue verified certificates.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
                <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
              <Button onClick={() => setIsEnrollOpen(true)} className="bg-purple-600 hover:bg-purple-700 text-white">
                <Plus className="mr-2 h-4 w-4" />
                Enroll Employee
              </Button>
            </div>
          </div>

          {/* Enrollments Table */}
          <Card>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex h-48 items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
                </div>
              ) : enrollments.length ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 border-b text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      <tr>
                        <th className="px-6 py-3">Employee</th>
                        <th className="px-6 py-3">Training Course</th>
                        <th className="px-6 py-3">Enrolled Date</th>
                        <th className="px-6 py-3">Status</th>
                        <th className="px-6 py-3">Score & Certification</th>
                        <th className="px-6 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {enrollments.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div>
                              <p className="font-semibold text-gray-900">{item.employee?.name}</p>
                              <p className="text-xs text-gray-500">{item.employee?.employeeId}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div>
                              <p className="font-semibold text-gray-900">{item.trainingProgram?.title}</p>
                              <p className="text-xs text-gray-500 font-mono">{item.trainingProgram?.code}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-xs text-gray-600">
                            {new Date(item.enrolledDate).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4">
                            <Badge
                              className={
                                item.status === "COMPLETED"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : item.status === "IN_PROGRESS"
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-purple-100 text-purple-800"
                              }
                            >
                              {item.status}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 text-xs">
                            {item.certificateNo ? (
                              <div>
                                <p className="font-bold text-amber-700 flex items-center gap-1">
                                  <Award className="h-3.5 w-3.5" />
                                  {item.certificateNo}
                                </p>
                                <p className="text-gray-500">
                                  Score: {item.score}% · Issued {item.issueDate ? new Date(item.issueDate).toLocaleDateString() : ""}
                                </p>
                              </div>
                            ) : item.score !== null && item.score !== undefined ? (
                              <span className="font-semibold text-gray-900">Score: {item.score}%</span>
                            ) : (
                              <span className="text-gray-400 italic">In progress</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedEnrollment(item);
                                  setCertData({
                                    status: item.status === "ENROLLED" ? "COMPLETED" : item.status,
                                    score: item.score || 90,
                                    certificateNo: item.certificateNo || `CERT-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
                                    issueDate: item.issueDate ? new Date(item.issueDate).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
                                    feedback: item.feedback || "",
                                  });
                                }}
                                className="h-8 text-xs text-purple-700 hover:bg-purple-50"
                              >
                                <Award className="mr-1 h-3.5 w-3.5" /> Certify & Grade
                              </Button>

                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleCancelEnrollment(item.id)}
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
                  No employee enrollments recorded yet.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Enroll Employee Modal */}
          {isEnrollOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <Card className="w-full max-w-md bg-white shadow-xl">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <UserCheck className="h-5 w-5 text-purple-600" />
                    Enroll Employee in Course
                  </CardTitle>
                  <CardDescription>Select a training program and candidate employee</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleEnroll} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Select Training Course *</label>
                      <select
                        className="w-full rounded-md border border-gray-300 p-2 text-sm"
                        value={enrollData.trainingProgramId}
                        onChange={(e) => setEnrollData({ ...enrollData, trainingProgramId: e.target.value })}
                        required
                      >
                        {programs.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.title} ({p.code})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Select Employee *</label>
                      <select
                        className="w-full rounded-md border border-gray-300 p-2 text-sm"
                        value={enrollData.employeeId}
                        onChange={(e) => setEnrollData({ ...enrollData, employeeId: e.target.value })}
                        required
                      >
                        <option value="">-- Choose Employee --</option>
                        {employees.map((emp) => (
                          <option key={emp.id} value={emp.id}>
                            {emp.name} ({emp.employeeId}) - {emp.department || "General"}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex justify-end gap-2 pt-4 border-t">
                      <Button variant="outline" type="button" onClick={() => setIsEnrollOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={submitting} className="bg-purple-600 text-white">
                        {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm Enrollment"}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Update Progress & Certificate Modal */}
          {selectedEnrollment && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <Card className="w-full max-w-lg bg-white shadow-xl">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Award className="h-5 w-5 text-amber-600" />
                    Grade Progress & Issue Certification
                  </CardTitle>
                  <CardDescription>
                    Employee: {selectedEnrollment.employee?.name} | Course: {selectedEnrollment.trainingProgram?.title}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleUpdateCertification} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Enrollment Status</label>
                        <select
                          className="w-full rounded-md border border-gray-300 p-2 text-sm"
                          value={certData.status}
                          onChange={(e) => setCertData({ ...certData, status: e.target.value as EnrollmentStatus })}
                        >
                          <option value="ENROLLED">Enrolled</option>
                          <option value="IN_PROGRESS">In Progress</option>
                          <option value="COMPLETED">Completed</option>
                          <option value="DROPPED">Dropped</option>
                          <option value="FAILED">Failed</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Score / Grade (0-100)</label>
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          value={certData.score}
                          onChange={(e) => setCertData({ ...certData, score: Number(e.target.value) })}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Certificate Number</label>
                        <Input
                          placeholder="e.g. CERT-2026-DEV-001"
                          value={certData.certificateNo}
                          onChange={(e) => setCertData({ ...certData, certificateNo: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Certificate Issue Date</label>
                        <Input
                          type="date"
                          value={certData.issueDate}
                          onChange={(e) => setCertData({ ...certData, issueDate: e.target.value })}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Instructor Feedback / Notes</label>
                      <textarea
                        className="w-full rounded-md border border-gray-300 p-2 text-sm"
                        rows={3}
                        placeholder="Performance feedback, achievements, project review notes..."
                        value={certData.feedback}
                        onChange={(e) => setCertData({ ...certData, feedback: e.target.value })}
                      />
                    </div>

                    <div className="flex justify-end gap-2 pt-4 border-t">
                      <Button variant="outline" type="button" onClick={() => setSelectedEnrollment(null)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={submitting} className="bg-purple-600 text-white">
                        {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Certification"}
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
