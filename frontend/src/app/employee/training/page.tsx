"use client";

import { useEffect, useState } from "react";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/api";
import {
  TrainingEnrollment,
  AvailableTrainingProgram,
  EmployeeTrainingStats,
} from "@/types/training";
import {
  GraduationCap,
  BookOpen,
  Award,
  Calendar,
  User,
  MapPin,
  Loader2,
  RefreshCw,
  CheckCircle2,
  Clock,
  ExternalLink,
  Users,
  AlertCircle,
  FileText,
  Send,
} from "lucide-react";

export default function EmployeeTrainingPage() {
  const [activeTab, setActiveTab] = useState<"available" | "pending" | "approved" | "completed">("available");
  const [stats, setStats] = useState<EmployeeTrainingStats>({
    availableTrainings: 0,
    pendingRequests: 0,
    approvedTrainings: 0,
    completedTrainings: 0,
  });
  const [availableTrainings, setAvailableTrainings] = useState<AvailableTrainingProgram[]>([]);
  const [myTrainings, setMyTrainings] = useState<TrainingEnrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [applyingId, setApplyingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{ title: string; type: "success" | "error" } | null>(null);

  const fetchTrainingData = async () => {
    setLoading(true);
    try {
      const [statsRes, availRes, myRes] = await Promise.all([
        apiRequest<EmployeeTrainingStats>("/training/stats"),
        apiRequest<AvailableTrainingProgram[]>("/training/available"),
        apiRequest<TrainingEnrollment[]>("/training/my-trainings"),
      ]);
      setStats(statsRes);
      setAvailableTrainings(Array.isArray(availRes) ? availRes : []);
      setMyTrainings(Array.isArray(myRes) ? myRes : []);
    } catch (err) {
      console.error("Failed to load training portal data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrainingData();
  }, []);

  const handleApply = async (programId: string) => {
    setApplyingId(programId);
    try {
      await apiRequest("/training/apply", {
        method: "POST",
        body: JSON.stringify({ trainingProgramId: programId }),
      });
      setToastMessage({
        title: "Training application submitted! Under Admin review.",
        type: "success",
      });
      fetchTrainingData();
    } catch (err: any) {
      console.error("Failed to apply for training", err);
      setToastMessage({
        title: err?.message || "Failed to apply for training.",
        type: "error",
      });
    } finally {
      setApplyingId(null);
      setTimeout(() => setToastMessage(null), 5000);
    }
  };

  const pendingList = myTrainings.filter((t) => t.status === "PENDING");
  const approvedList = myTrainings.filter((t) => t.status === "APPROVED" || t.status === "ENROLLED");
  const completedList = myTrainings.filter((t) => t.status === "COMPLETED");

  return (
    <ProtectedRoute requiredRole="EMPLOYEE">
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <GraduationCap className="h-7 w-7 text-purple-500" />
                Employee Skill & Training Portal
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Enroll in corporate training programs, track application approvals, access study materials, and earn certificates.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={fetchTrainingData} disabled={loading} className="dark:bg-slate-900 dark:border-slate-800">
                <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </div>
          </div>

          {/* Alert Toast Notification */}
          {toastMessage && (
            <div
              className={`p-4 rounded-xl text-sm font-medium flex items-center gap-2 border transition-all ${
                toastMessage.type === "success"
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                  : "bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400"
              }`}
            >
              {toastMessage.type === "success" ? (
                <CheckCircle2 className="h-5 w-5 shrink-0" />
              ) : (
                <AlertCircle className="h-5 w-5 shrink-0" />
              )}
              {toastMessage.title}
            </div>
          )}

          {/* KPI Stat Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card
              onClick={() => setActiveTab("available")}
              className={`cursor-pointer transition-all border dark:border-slate-800 ${
                activeTab === "available"
                  ? "ring-2 ring-purple-500 bg-purple-500/5 dark:bg-purple-950/20"
                  : "hover:border-purple-500/40"
              }`}
            >
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Available Open
                  </p>
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
                    {stats.availableTrainings}
                  </h3>
                </div>
                <div className="h-12 w-12 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
                  <BookOpen className="h-6 w-6" />
                </div>
              </CardContent>
            </Card>

            <Card
              onClick={() => setActiveTab("pending")}
              className={`cursor-pointer transition-all border dark:border-slate-800 ${
                activeTab === "pending"
                  ? "ring-2 ring-amber-500 bg-amber-500/5 dark:bg-amber-950/20"
                  : "hover:border-amber-500/40"
              }`}
            >
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Pending Requests
                  </p>
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
                    {stats.pendingRequests}
                  </h3>
                </div>
                <div className="h-12 w-12 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                  <Clock className="h-6 w-6" />
                </div>
              </CardContent>
            </Card>

            <Card
              onClick={() => setActiveTab("approved")}
              className={`cursor-pointer transition-all border dark:border-slate-800 ${
                activeTab === "approved"
                  ? "ring-2 ring-blue-500 bg-blue-500/5 dark:bg-blue-950/20"
                  : "hover:border-blue-500/40"
              }`}
            >
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Approved Trainings
                  </p>
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
                    {stats.approvedTrainings}
                  </h3>
                </div>
                <div className="h-12 w-12 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
              </CardContent>
            </Card>

            <Card
              onClick={() => setActiveTab("completed")}
              className={`cursor-pointer transition-all border dark:border-slate-800 ${
                activeTab === "completed"
                  ? "ring-2 ring-emerald-500 bg-emerald-500/5 dark:bg-emerald-950/20"
                  : "hover:border-emerald-500/40"
              }`}
            >
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Completed Courses
                  </p>
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
                    {stats.completedTrainings}
                  </h3>
                </div>
                <div className="h-12 w-12 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                  <Award className="h-6 w-6" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Navigation Tabs Bar */}
          <div className="flex border-b border-slate-200 dark:border-slate-800">
            <button
              onClick={() => setActiveTab("available")}
              className={`py-3 px-4 font-semibold text-sm border-b-2 flex items-center gap-2 transition-all ${
                activeTab === "available"
                  ? "border-purple-500 text-purple-600 dark:text-purple-400"
                  : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
              }`}
            >
              <BookOpen className="h-4 w-4" />
              Available Open Catalog ({availableTrainings.length})
            </button>
            <button
              onClick={() => setActiveTab("pending")}
              className={`py-3 px-4 font-semibold text-sm border-b-2 flex items-center gap-2 transition-all ${
                activeTab === "pending"
                  ? "border-amber-500 text-amber-600 dark:text-amber-400"
                  : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
              }`}
            >
              <Clock className="h-4 w-4" />
              My Applications ({pendingList.length})
            </button>
            <button
              onClick={() => setActiveTab("approved")}
              className={`py-3 px-4 font-semibold text-sm border-b-2 flex items-center gap-2 transition-all ${
                activeTab === "approved"
                  ? "border-blue-500 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
              }`}
            >
              <CheckCircle2 className="h-4 w-4" />
              Approved Trainings ({approvedList.length})
            </button>
            <button
              onClick={() => setActiveTab("completed")}
              className={`py-3 px-4 font-semibold text-sm border-b-2 flex items-center gap-2 transition-all ${
                activeTab === "completed"
                  ? "border-emerald-500 text-emerald-600 dark:text-emerald-400"
                  : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
              }`}
            >
              <Award className="h-4 w-4" />
              Completed ({completedList.length})
            </button>
          </div>

          {/* TAB 1: AVAILABLE TRAININGS CATALOG */}
          {activeTab === "available" && (
            <div>
              {loading ? (
                <div className="flex h-48 items-center justify-center rounded-xl bg-slate-900/50 border dark:border-slate-800">
                  <Loader2 className="h-6 w-6 animate-spin text-purple-500" />
                </div>
              ) : availableTrainings.length ? (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {availableTrainings.map((item) => (
                    <Card
                      key={item.id}
                      className="flex flex-col justify-between hover:shadow-lg transition-all dark:bg-slate-900/80 dark:border-slate-800"
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-2">
                          <Badge variant="secondary" className="text-xs bg-purple-500/10 text-purple-600 dark:text-purple-400 border-none font-mono">
                            {item.code}
                          </Badge>
                          <Badge
                            className={
                              item.isFull
                                ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
                                : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                            }
                          >
                            <Users className="h-3 w-3 mr-1" />
                            {item.enrolledCount} / {item.capacity} Seats
                          </Badge>
                        </div>
                        <CardTitle className="text-lg mt-2 text-slate-900 dark:text-slate-100">
                          {item.title}
                        </CardTitle>
                        <CardDescription className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                          {item.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="rounded-xl bg-slate-50 dark:bg-slate-950/60 p-3 space-y-2 text-xs border border-slate-100 dark:border-slate-800/80">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                              <User className="h-3.5 w-3.5 text-purple-500" /> Trainer:
                            </span>
                            <span className="font-semibold text-slate-800 dark:text-slate-200">
                              {item.trainerName || "Corporate Lead"}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                              <MapPin className="h-3.5 w-3.5 text-purple-500" /> Location:
                            </span>
                            <span className="font-semibold text-slate-800 dark:text-slate-200">
                              {item.location || "Online Virtual Room"}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                              <Calendar className="h-3.5 w-3.5 text-purple-500" /> Schedule:
                            </span>
                            <span className="font-semibold text-slate-800 dark:text-slate-200">
                              {new Date(item.startDate).toLocaleDateString()} - {new Date(item.endDate).toLocaleDateString()}
                            </span>
                          </div>
                        </div>

                        {/* Apply Action Button / Status Badge */}
                        <div className="pt-2">
                          {item.myEnrollment ? (
                            <div className="text-center">
                              {item.myEnrollment.status === "PENDING" && (
                                <Badge className="w-full py-2 bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 justify-center">
                                  <Clock className="h-3.5 w-3.5 mr-1.5 animate-pulse" /> Application Under Admin Review
                                </Badge>
                              )}
                              {item.myEnrollment.status === "APPROVED" && (
                                <Badge className="w-full py-2 bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 justify-center">
                                  <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" /> Enrolled & Approved
                                </Badge>
                              )}
                              {item.myEnrollment.status === "COMPLETED" && (
                                <Badge className="w-full py-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 justify-center">
                                  <Award className="h-3.5 w-3.5 mr-1.5" /> Completed Course
                                </Badge>
                              )}
                            </div>
                          ) : (
                            <Button
                              onClick={() => handleApply(item.id)}
                              disabled={item.isFull || applyingId === item.id}
                              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium shadow-md shadow-purple-500/20"
                            >
                              {applyingId === item.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : item.isFull ? (
                                "Course Full"
                              ) : (
                                <>
                                  <Send className="h-4 w-4 mr-2" /> Apply for Enrollment
                                </>
                              )}
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="dark:bg-slate-900/60 dark:border-slate-800">
                  <CardContent className="py-12 text-center text-sm text-slate-500 dark:text-slate-400">
                    No open training programs available for application at this moment.
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* TAB 2: PENDING APPLICATIONS */}
          {activeTab === "pending" && (
            <div>
              {pendingList.length ? (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {pendingList.map((item) => (
                    <Card key={item.id} className="dark:bg-slate-900/80 dark:border-slate-800">
                      <CardHeader className="pb-3 flex flex-row items-start justify-between">
                        <div>
                          <CardTitle className="text-base text-slate-900 dark:text-slate-100">
                            {item.trainingProgram?.title}
                          </CardTitle>
                          <CardDescription className="text-xs font-mono text-slate-500">
                            {item.trainingProgram?.code}
                          </CardDescription>
                        </div>
                        <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30">
                          <Clock className="h-3 w-3 mr-1" /> Pending Approval
                        </Badge>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <p className="text-xs text-slate-600 dark:text-slate-300">
                          {item.trainingProgram?.description}
                        </p>
                        <div className="rounded-lg bg-slate-50 dark:bg-slate-950 p-3 space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                          <div className="flex justify-between">
                            <span>Trainer:</span>
                            <span className="font-semibold text-slate-900 dark:text-slate-100">
                              {item.trainingProgram?.trainerName || "TBD"}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Applied Date:</span>
                            <span className="font-semibold text-slate-900 dark:text-slate-100">
                              {item.appliedAt ? new Date(item.appliedAt).toLocaleDateString() : new Date(item.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="dark:bg-slate-900/60 dark:border-slate-800">
                  <CardContent className="py-12 text-center text-sm text-slate-500 dark:text-slate-400">
                    You have no pending training application requests.
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* TAB 3: APPROVED TRAININGS & MATERIALS ACCESS */}
          {activeTab === "approved" && (
            <div>
              {approvedList.length ? (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  {approvedList.map((item) => (
                    <Card key={item.id} className="dark:bg-slate-900/80 dark:border-slate-800 border-l-4 border-l-blue-500">
                      <CardHeader className="pb-3 flex flex-row items-start justify-between">
                        <div>
                          <CardTitle className="text-base text-slate-900 dark:text-slate-100">
                            {item.trainingProgram?.title}
                          </CardTitle>
                          <CardDescription className="text-xs font-mono text-slate-500">
                            {item.trainingProgram?.code}
                          </CardDescription>
                        </div>
                        <Badge className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30">
                          <CheckCircle2 className="h-3 w-3 mr-1" /> Approved & Active
                        </Badge>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <p className="text-xs text-slate-600 dark:text-slate-300">
                          {item.trainingProgram?.description}
                        </p>
                        <div className="rounded-xl bg-slate-50 dark:bg-slate-950 p-3 space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                          <div className="flex justify-between">
                            <span>Trainer:</span>
                            <span className="font-semibold text-slate-900 dark:text-slate-100">
                              {item.trainingProgram?.trainerName || "TBD"}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Schedule:</span>
                            <span className="font-semibold text-slate-900 dark:text-slate-100">
                              {item.trainingProgram?.startDate ? new Date(item.trainingProgram.startDate).toLocaleDateString() : ""} - {item.trainingProgram?.endDate ? new Date(item.trainingProgram.endDate).toLocaleDateString() : ""}
                            </span>
                          </div>
                          {item.approvedBy && (
                            <div className="flex justify-between">
                              <span>Approved By:</span>
                              <span className="font-semibold text-blue-600 dark:text-blue-400">
                                {item.approvedBy.name}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Unlocked Course Materials Button */}
                        <div>
                          {item.trainingProgram?.materialsUrl ? (
                            <a
                              href={item.trainingProgram.materialsUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="w-full inline-flex items-center justify-center py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs shadow-md shadow-blue-500/20 transition-all"
                            >
                              <FileText className="h-4 w-4 mr-2" /> Access Course Study Materials <ExternalLink className="h-3.5 w-3.5 ml-1.5" />
                            </a>
                          ) : (
                            <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-950 text-center text-xs text-slate-500 dark:text-slate-400 italic">
                              Course materials will be made available by instructor before class start.
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="dark:bg-slate-900/60 dark:border-slate-800">
                  <CardContent className="py-12 text-center text-sm text-slate-500 dark:text-slate-400">
                    You have no approved active training courses.
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* TAB 4: COMPLETED TRAININGS & CERTIFICATES */}
          {activeTab === "completed" && (
            <div>
              {completedList.length ? (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  {completedList.map((item) => (
                    <Card key={item.id} className="dark:bg-slate-900/80 dark:border-slate-800 border-l-4 border-l-emerald-500">
                      <CardHeader className="pb-3 flex flex-row items-start justify-between">
                        <div>
                          <CardTitle className="text-base text-slate-900 dark:text-slate-100">
                            {item.trainingProgram?.title}
                          </CardTitle>
                          <CardDescription className="text-xs font-mono text-slate-500">
                            {item.trainingProgram?.code}
                          </CardDescription>
                        </div>
                        <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30">
                          <Award className="h-3 w-3 mr-1" /> Completed
                        </Badge>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 p-4 text-xs space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5 text-sm">
                              <Award className="h-4 w-4 text-amber-600" />
                              {item.certificateNo || "Verified Completion"}
                            </span>
                            {item.score !== null && item.score !== undefined && (
                              <Badge className="bg-emerald-600 text-white font-bold">
                                Grade: {item.score}%
                              </Badge>
                            )}
                          </div>
                          {item.issueDate && (
                            <p className="text-slate-600 dark:text-slate-400">
                              Issued On: {new Date(item.issueDate).toLocaleDateString()}
                            </p>
                          )}
                          {item.feedback && (
                            <p className="text-slate-600 dark:text-slate-300 italic pt-1 border-t border-amber-200 dark:border-amber-900/40">
                              "{item.feedback}"
                            </p>
                          )}
                        </div>

                        {item.trainingProgram?.materialsUrl && (
                          <a
                            href={item.trainingProgram.materialsUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center text-xs font-medium text-purple-600 dark:text-purple-400 hover:underline"
                          >
                            <FileText className="h-3.5 w-3.5 mr-1" /> Reference Course Notes & Materials <ExternalLink className="h-3 w-3 ml-1" />
                          </a>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="dark:bg-slate-900/60 dark:border-slate-800">
                  <CardContent className="py-12 text-center text-sm text-slate-500 dark:text-slate-400">
                    You have not completed any training programs yet.
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
