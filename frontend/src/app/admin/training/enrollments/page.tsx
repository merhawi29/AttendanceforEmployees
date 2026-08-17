"use client";

import { useEffect, useState } from "react";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/api";
import {
  TrainingEnrollment,
  TrainingProgram,
  EnrollmentStatus,
  AdminTrainingStats,
} from "@/types/training";
import {
  Users,
  Plus,
  Loader2,
  RefreshCw,
  Award,
  BookOpen,
  UserCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Check,
  X,
  FileText,
  AlertCircle,
} from "lucide-react";

interface SimpleUser {
  id: string;
  name: string;
  employeeId: string;
  department?: string | null;
}

export default function AdminTrainingEnrollmentsPage() {
  const [activeTab, setActiveTab] = useState<"pending" | "approved" | "completed" | "all">("pending");
  const [stats, setStats] = useState<AdminTrainingStats>({
    totalTrainings: 0,
    openTrainings: 0,
    pendingRequests: 0,
    approvedParticipants: 0,
    completedTrainings: 0,
  });
  const [enrollments, setEnrollments] = useState<TrainingEnrollment[]>([]);
  const [programs, setPrograms] = useState<TrainingProgram[]>([]);
  const [employees, setEmployees] = useState<SimpleUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Modals & Action State
  const [isEnrollOpen, setIsEnrollOpen] = useState(false);
  const [selectedEnrollment, setSelectedEnrollment] = useState<TrainingEnrollment | null>(null);
  const [actionModal, setActionModal] = useState<{
    enrollment: TrainingEnrollment;
    type: "approve" | "reject";
  } | null>(null);
  const [actionRemarks, setActionRemarks] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ title: string; type: "success" | "error" } | null>(null);

  // Form State
  const [enrollData, setEnrollData] = useState({
    trainingProgramId: "",
    employeeId: "",
    status: "APPROVED" as EnrollmentStatus,
    remarks: "Direct enrollment by HR Admin",
  });

  const [certData, setCertData] = useState({
    status: "COMPLETED" as EnrollmentStatus,
    score: 95,
    certificateNo: `CERT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
    completionDate: new Date().toISOString().slice(0, 10),
    feedback: "Demonstrated strong mastery of core modules.",
    remarks: "Passed final evaluation.",
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, enrollRes, progRes, empRes] = await Promise.all([
        apiRequest<AdminTrainingStats>("/training/stats"),
        apiRequest<TrainingEnrollment[]>("/training/admin/enrollments"),
        apiRequest<TrainingProgram[]>("/training/programs"),
        apiRequest<any>("/employees"),
      ]);

      setStats(statsRes);
      setEnrollments(Array.isArray(enrollRes) ? enrollRes : []);
      const validPrograms = Array.isArray(progRes) ? progRes : [];
      const validEmployees = Array.isArray(empRes) ? empRes : empRes?.employees || [];
      setPrograms(validPrograms);
      setEmployees(validEmployees);

      if (validPrograms.length && !enrollData.trainingProgramId) {
        setEnrollData((prev) => ({ ...prev, trainingProgramId: validPrograms[0].id }));
      }
    } catch (err) {
      console.error("Failed to load admin enrollment workflow data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleApproveOrReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actionModal) return;

    setSubmitting(true);
    const { enrollment, type } = actionModal;
    try {
      await apiRequest(`/training/enrollments/${enrollment.id}/${type}`, {
        method: "POST",
        body: JSON.stringify({ remarks: actionRemarks }),
      });
      setToast({
        title: `Training application ${type === "approve" ? "APPROVED" : "REJECTED"} successfully.`,
        type: "success",
      });
      setActionModal(null);
      setActionRemarks("");
      fetchData();
    } catch (err: any) {
      console.error("Failed to process approval workflow", err);
      setToast({ title: err?.message || "Failed to process action", type: "error" });
    } finally {
      setSubmitting(false);
      setTimeout(() => setToast(null), 4000);
    }
  };

  const handleEnrollDirect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!enrollData.trainingProgramId || !enrollData.employeeId) return;

    setSubmitting(true);
    try {
      await apiRequest<TrainingEnrollment>("/training/enroll", {
        method: "POST",
        body: JSON.stringify(enrollData),
      });
      setIsEnrollOpen(false);
      setToast({ title: "Employee enrolled successfully.", type: "success" });
      fetchData();
    } catch (err: any) {
      console.error("Failed to enroll employee", err);
      setToast({ title: err?.message || "Failed to enroll employee", type: "error" });
    } finally {
      setSubmitting(false);
      setTimeout(() => setToast(null), 4000);
    }
  };

  const handleCompleteTraining = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEnrollment) return;

    setSubmitting(true);
    try {
      await apiRequest(`/training/enrollments/${selectedEnrollment.id}/complete`, {
        method: "POST",
        body: JSON.stringify(certData),
      });
      setSelectedEnrollment(null);
      setToast({ title: "Training marked completed & certificate issued!", type: "success" });
      fetchData();
    } catch (err: any) {
      console.error("Failed to complete training", err);
      setToast({ title: err?.message || "Failed to complete training", type: "error" });
    } finally {
      setSubmitting(false);
      setTimeout(() => setToast(null), 4000);
    }
  };

  const filteredEnrollments = enrollments.filter((e) => {
    const matchesSearch =
      (e.employee?.name && e.employee.name.toLowerCase().includes(search.toLowerCase())) ||
      (e.employee?.employeeId && e.employee.employeeId.toLowerCase().includes(search.toLowerCase())) ||
      (e.trainingProgram?.title && e.trainingProgram.title.toLowerCase().includes(search.toLowerCase())) ||
      (e.trainingProgram?.code && e.trainingProgram.code.toLowerCase().includes(search.toLowerCase()));

    if (!matchesSearch) return false;
    if (activeTab === "pending") return e.status === "PENDING";
    if (activeTab === "approved") return e.status === "APPROVED" || e.status === "ENROLLED";
    if (activeTab === "completed") return e.status === "COMPLETED";
    return true;
  });

  const pendingCount = enrollments.filter((e) => e.status === "PENDING").length;
  const approvedCount = enrollments.filter((e) => e.status === "APPROVED" || e.status === "ENROLLED").length;
  const completedCount = enrollments.filter((e) => e.status === "COMPLETED").length;

  return (
    <ProtectedRoute requiredRole="ADMIN">
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Users className="h-7 w-7 text-purple-600 dark:text-purple-400" />
                Training Enrollment & Approval Queue
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Review employee training applications, grant approvals, grade completed courses, and issue certificates.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={fetchData} disabled={loading} className="dark:bg-slate-900 dark:border-slate-800">
                <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
              <Button onClick={() => setIsEnrollOpen(true)} className="bg-purple-600 hover:bg-purple-700 text-white shadow-md shadow-purple-500/20">
                <Plus className="mr-2 h-4 w-4" />
                Direct Enroll Candidate
              </Button>
            </div>
          </div>

          {/* Toast Notification */}
          {toast && (
            <div
              className={`p-4 rounded-xl text-sm font-medium flex items-center gap-2 border ${
                toast.type === "success"
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                  : "bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400"
              }`}
            >
              {toast.type === "success" ? <CheckCircle2 className="h-5 w-5 shrink-0" /> : <AlertCircle className="h-5 w-5 shrink-0" />}
              {toast.title}
            </div>
          )}

          {/* Admin KPI Metrics */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <Card className="dark:bg-slate-900/80 dark:border-slate-800">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Total Courses</p>
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">{stats.totalTrainings}</h3>
                </div>
                <div className="h-10 w-10 rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center">
                  <BookOpen className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>

            <Card className="dark:bg-slate-900/80 dark:border-slate-800">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Open Programs</p>
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">{stats.openTrainings}</h3>
                </div>
                <div className="h-10 w-10 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center">
                  <UserCheck className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>

            <Card className="dark:bg-slate-900/80 dark:border-slate-800 border-l-4 border-l-amber-500">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-amber-600 dark:text-amber-400 uppercase font-semibold">Pending Requests</p>
                  <h3 className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">{stats.pendingRequests}</h3>
                </div>
                <div className="h-10 w-10 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
                  <Clock className="h-5 w-5 animate-pulse" />
                </div>
              </CardContent>
            </Card>

            <Card className="dark:bg-slate-900/80 dark:border-slate-800">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Approved Active</p>
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">{stats.approvedParticipants}</h3>
                </div>
                <div className="h-10 w-10 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>

            <Card className="dark:bg-slate-900/80 dark:border-slate-800">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Completed</p>
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">{stats.completedTrainings}</h3>
                </div>
                <div className="h-10 w-10 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
                  <Award className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters Bar & Tabs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-3">
            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
              <button
                onClick={() => setActiveTab("pending")}
                className={`py-2 px-4 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === "pending"
                    ? "bg-amber-500 text-white shadow-md shadow-amber-500/20"
                    : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                }`}
              >
                <Clock className="h-3.5 w-3.5" /> Pending Queue ({pendingCount})
              </button>

              <button
                onClick={() => setActiveTab("approved")}
                className={`py-2 px-4 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === "approved"
                    ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                    : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                }`}
              >
                <CheckCircle2 className="h-3.5 w-3.5" /> Approved Participants ({approvedCount})
              </button>

              <button
                onClick={() => setActiveTab("completed")}
                className={`py-2 px-4 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === "completed"
                    ? "bg-emerald-600 text-white shadow-md shadow-emerald-500/20"
                    : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                }`}
              >
                <Award className="h-3.5 w-3.5" /> Completed ({completedCount})
              </button>

              <button
                onClick={() => setActiveTab("all")}
                className={`py-2 px-4 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === "all"
                    ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                    : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                }`}
              >
                <Users className="h-3.5 w-3.5" /> All Requests ({enrollments.length})
              </button>
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search candidate name, ID, course..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9 text-xs dark:bg-slate-900 dark:border-slate-800"
              />
            </div>
          </div>

          {/* Enrollments Queue Table */}
          <Card className="dark:bg-slate-900/80 dark:border-slate-800">
            <CardContent className="p-0">
              {loading ? (
                <div className="flex h-48 items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
                </div>
              ) : filteredEnrollments.length ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      <tr>
                        <th className="px-6 py-3">Applicant Employee</th>
                        <th className="px-6 py-3">Training Course</th>
                        <th className="px-6 py-3">Application Date</th>
                        <th className="px-6 py-3">Status</th>
                        <th className="px-6 py-3">Approver / Remarks</th>
                        <th className="px-6 py-3 text-right">Workflow Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800/80">
                      {filteredEnrollments.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                          <td className="px-6 py-4">
                            <div>
                              <p className="font-semibold text-slate-900 dark:text-slate-100">{item.employee?.name}</p>
                              <p className="text-xs text-slate-500 font-mono">{item.employee?.employeeId} ({item.employee?.department || "General"})</p>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div>
                              <p className="font-semibold text-slate-900 dark:text-slate-100">{item.trainingProgram?.title}</p>
                              <p className="text-xs text-slate-500 font-mono">{item.trainingProgram?.code}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-xs text-slate-600 dark:text-slate-400">
                            {item.appliedAt ? new Date(item.appliedAt).toLocaleDateString() : new Date(item.enrolledDate).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4">
                            <Badge
                              className={
                                item.status === "APPROVED" || item.status === "ENROLLED"
                                  ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20"
                                  : item.status === "COMPLETED"
                                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                                  : item.status === "PENDING"
                                  ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                                  : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
                              }
                            >
                              {item.status}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 text-xs text-slate-600 dark:text-slate-400 max-w-xs">
                            {item.approvedBy && (
                              <p className="font-semibold text-slate-800 dark:text-slate-200">
                                Approved By: {item.approvedBy.name}
                              </p>
                            )}
                            {item.remarks && <p className="italic text-slate-500 dark:text-slate-400 line-clamp-1">"{item.remarks}"</p>}
                            {item.certificateNo && (
                              <p className="font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">
                                Cert: {item.certificateNo} ({item.score}%)
                              </p>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-2">
                              {/* If PENDING: Show Approve & Reject buttons */}
                              {item.status === "PENDING" && (
                                <>
                                  <Button
                                    size="sm"
                                    onClick={() => setActionModal({ enrollment: item, type: "approve" })}
                                    className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
                                  >
                                    <Check className="h-3.5 w-3.5 mr-1" /> Approve
                                  </Button>

                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setActionModal({ enrollment: item, type: "reject" })}
                                    className="h-8 border-rose-500/30 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 text-xs"
                                  >
                                    <X className="h-3.5 w-3.5 mr-1" /> Reject
                                  </Button>
                                </>
                              )}

                              {/* If APPROVED or ENROLLED: Show Complete & Certify button */}
                              {(item.status === "APPROVED" || item.status === "ENROLLED") && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedEnrollment(item);
                                    setCertData({
                                      status: "COMPLETED",
                                      score: item.score || 95,
                                      certificateNo: item.certificateNo || `CERT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
                                      completionDate: new Date().toISOString().slice(0, 10),
                                      feedback: item.feedback || "Successfully completed training requirements.",
                                      remarks: item.remarks || "Completed course.",
                                    });
                                  }}
                                  className="h-8 text-xs bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30 hover:bg-purple-500/20"
                                >
                                  <Award className="mr-1 h-3.5 w-3.5" /> Complete & Certify
                                </Button>
                              )}

                              {/* If REJECTED: allow Re-approve */}
                              {item.status === "REJECTED" && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setActionModal({ enrollment: item, type: "approve" })}
                                  className="h-8 text-xs text-blue-600 dark:text-blue-400"
                                >
                                  Re-Approve
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-12 text-center text-sm text-slate-500 dark:text-slate-400">
                  No enrollment applications match the selected queue filter.
                </div>
              )}
            </CardContent>
          </Card>

          {/* APPROVE / REJECT MODAL */}
          {actionModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <Card className="w-full max-w-md bg-white dark:bg-slate-900 shadow-xl border dark:border-slate-800">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    {actionModal.type === "approve" ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-rose-500" />
                    )}
                    {actionModal.type === "approve" ? "Approve Training Application" : "Reject Training Application"}
                  </CardTitle>
                  <CardDescription>
                    Applicant: {actionModal.enrollment.employee?.name} | Course: {actionModal.enrollment.trainingProgram?.title}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleApproveOrReject} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        {actionModal.type === "approve" ? "Approval Notes / Instructions (Optional)" : "Rejection Reason *"}
                      </label>
                      <textarea
                        className="w-full rounded-md border border-slate-300 dark:border-slate-800 p-2 text-sm bg-transparent dark:text-slate-100"
                        rows={3}
                        placeholder={
                          actionModal.type === "approve"
                            ? "e.g. Approved. Please attend orientation session on day 1."
                            : "e.g. Prerequisites not met / Department budget capacity exceeded."
                        }
                        value={actionRemarks}
                        onChange={(e) => setActionRemarks(e.target.value)}
                        required={actionModal.type === "reject"}
                      />
                    </div>

                    <div className="flex justify-end gap-2 pt-3 border-t dark:border-slate-800">
                      <Button variant="outline" type="button" onClick={() => setActionModal(null)}>
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={submitting}
                        className={actionModal.type === "approve" ? "bg-emerald-600 text-white hover:bg-emerald-700" : "bg-rose-600 text-white hover:bg-rose-700"}
                      >
                        {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : actionModal.type === "approve" ? "Confirm Approval" : "Confirm Rejection"}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>
          )}

          {/* DIRECT ENROLL EMPLOYEE MODAL */}
          {isEnrollOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <Card className="w-full max-w-md bg-white dark:bg-slate-900 shadow-xl border dark:border-slate-800">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2 text-slate-900 dark:text-slate-100">
                    <UserCheck className="h-5 w-5 text-purple-600" />
                    Directly Enroll Employee
                  </CardTitle>
                  <CardDescription>Bypass approval queue and directly register candidate into course</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleEnrollDirect} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Select Training Course *</label>
                      <select
                        className="w-full rounded-md border border-slate-300 dark:border-slate-800 p-2 text-sm bg-transparent dark:text-slate-100 dark:bg-slate-900"
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
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Select Candidate Employee *</label>
                      <select
                        className="w-full rounded-md border border-slate-300 dark:border-slate-800 p-2 text-sm bg-transparent dark:text-slate-100 dark:bg-slate-900"
                        value={enrollData.employeeId}
                        onChange={(e) => setEnrollData({ ...enrollData, employeeId: e.target.value })}
                        required
                      >
                        <option value="">-- Choose Employee --</option>
                        {Array.isArray(employees) && employees.map((emp) => (
                          <option key={emp.id} value={emp.id}>
                            {emp.name} ({emp.employeeId}) - {emp.department || "General"}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Enrollment Remarks</label>
                      <Input
                        placeholder="Direct assignment note"
                        value={enrollData.remarks}
                        onChange={(e) => setEnrollData({ ...enrollData, remarks: e.target.value })}
                      />
                    </div>

                    <div className="flex justify-end gap-2 pt-4 border-t dark:border-slate-800">
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

          {/* COMPLETE & CERTIFY MODAL */}
          {selectedEnrollment && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <Card className="w-full max-w-lg bg-white dark:bg-slate-900 shadow-xl border dark:border-slate-800">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2 text-slate-900 dark:text-slate-100">
                    <Award className="h-5 w-5 text-amber-500" />
                    Complete Training & Issue Certification
                  </CardTitle>
                  <CardDescription>
                    Employee: {selectedEnrollment.employee?.name} | Course: {selectedEnrollment.trainingProgram?.title}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleCompleteTraining} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Score Grade (0-100)</label>
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          value={certData.score}
                          onChange={(e) => setCertData({ ...certData, score: Number(e.target.value) })}
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Certificate Number</label>
                        <Input
                          placeholder="e.g. CERT-2026-TRN-001"
                          value={certData.certificateNo}
                          onChange={(e) => setCertData({ ...certData, certificateNo: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Completion Date</label>
                      <Input
                        type="date"
                        value={certData.completionDate}
                        onChange={(e) => setCertData({ ...certData, completionDate: e.target.value })}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Instructor Feedback</label>
                      <textarea
                        className="w-full rounded-md border border-slate-300 dark:border-slate-800 p-2 text-sm bg-transparent dark:text-slate-100"
                        rows={2}
                        placeholder="Performance evaluation notes..."
                        value={certData.feedback}
                        onChange={(e) => setCertData({ ...certData, feedback: e.target.value })}
                      />
                    </div>

                    <div className="flex justify-end gap-2 pt-4 border-t dark:border-slate-800">
                      <Button variant="outline" type="button" onClick={() => setSelectedEnrollment(null)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={submitting} className="bg-emerald-600 text-white">
                        {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Issue Certificate & Complete"}
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
