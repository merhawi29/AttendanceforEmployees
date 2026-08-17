"use client";

import { useEffect, useState } from "react";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/api";
import { Interview, InterviewType, InterviewStatus, JobApplication } from "@/types/ats";
import {
  CalendarCheck,
  Plus,
  Loader2,
  RefreshCw,
  Video,
  FileText,
  User,
  Star,
  CheckCircle2,
} from "lucide-react";

interface InterviewerUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

export default function AdminAtsInterviewsPage() {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [interviewers, setInterviewers] = useState<InterviewerUser[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals State
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [selectedInterview, setSelectedInterview] = useState<Interview | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [scheduleData, setScheduleData] = useState({
    jobApplicationId: "",
    interviewerId: "",
    interviewType: "TECHNICAL" as InterviewType,
    scheduledAt: new Date(Date.now() + 86400000).toISOString().slice(0, 16),
    location: "Google Meet - https://meet.google.com/abc-defg-hij",
  });

  const [feedbackData, setFeedbackData] = useState({
    feedback: "",
    score: 85,
    status: "COMPLETED" as InterviewStatus,
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [intRes, appRes, userRes] = await Promise.all([
        apiRequest<Interview[]>("/ats/interviews"),
        apiRequest<JobApplication[]>("/ats/applications"),
        apiRequest<any>("/employees"),
      ]);
      setInterviews(Array.isArray(intRes) ? intRes : []);
      setApplications(Array.isArray(appRes) ? appRes : []);
      const validInterviewers = Array.isArray(userRes) ? userRes : userRes?.employees || [];
      setInterviewers(validInterviewers);
      if (validInterviewers.length && !scheduleData.interviewerId) {
        setScheduleData((prev) => ({ ...prev, interviewerId: validInterviewers[0].id }));
      }
    } catch (err) {
      console.error("Failed to load interview data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduleData.jobApplicationId || !scheduleData.interviewerId) return;

    setSubmitting(true);
    try {
      await apiRequest<Interview>("/ats/interviews", {
        method: "POST",
        body: JSON.stringify(scheduleData),
      });
      setIsScheduleOpen(false);
      fetchData();
    } catch (err) {
      console.error("Failed to schedule interview", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInterview) return;

    setSubmitting(true);
    try {
      await apiRequest(`/ats/interviews/${selectedInterview.id}/feedback`, {
        method: "PATCH",
        body: JSON.stringify(feedbackData),
      });
      setSelectedInterview(null);
      fetchData();
    } catch (err) {
      console.error("Failed to submit feedback", err);
    } finally {
      setSubmitting(false);
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
                <CalendarCheck className="h-6 w-6 text-purple-600" />
                Interview Schedules & Evaluation Feedback
              </h1>
              <p className="text-sm text-gray-500">
                Schedule interview sessions, assign internal interviewers, and record candidate scores.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
                <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
              <Button onClick={() => setIsScheduleOpen(true)} className="bg-purple-600 hover:bg-purple-700 text-white">
                <Plus className="mr-2 h-4 w-4" />
                Schedule Interview
              </Button>
            </div>
          </div>

          {/* Interviews Table */}
          <Card>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex h-48 items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
                </div>
              ) : interviews.length ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 border-b text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      <tr>
                        <th className="px-6 py-3">Candidate</th>
                        <th className="px-6 py-3">Job Position</th>
                        <th className="px-6 py-3">Type</th>
                        <th className="px-6 py-3">Date & Time</th>
                        <th className="px-6 py-3">Interviewer</th>
                        <th className="px-6 py-3">Status & Score</th>
                        <th className="px-6 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {interviews.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div>
                              <p className="font-semibold text-gray-900">{item.jobApplication?.applicantName}</p>
                              <p className="text-xs text-gray-500">{item.jobApplication?.email}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-gray-700">
                            {item.jobApplication?.jobPosting?.title || "Requisition"}
                          </td>
                          <td className="px-6 py-4">
                            <Badge className="bg-purple-100 text-purple-800">
                              {item.interviewType}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 text-xs text-gray-600">
                            {new Date(item.scheduledAt).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 text-gray-700">
                            <span className="flex items-center gap-1 text-xs font-medium">
                              <User className="h-3.5 w-3.5 text-gray-400" />
                              {item.interviewer?.name}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col gap-1">
                              <Badge
                                className={
                                  item.status === "COMPLETED"
                                    ? "bg-emerald-100 text-emerald-800"
                                    : item.status === "SCHEDULED"
                                    ? "bg-blue-100 text-blue-800"
                                    : "bg-red-100 text-red-800"
                                }
                              >
                                {item.status}
                              </Badge>
                              {item.score !== null && item.score !== undefined && (
                                <span className="text-xs font-bold text-gray-900">
                                  Score: {item.score}/100
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedInterview(item);
                                setFeedbackData({
                                  feedback: item.feedback || "",
                                  score: item.score || 85,
                                  status: item.status === "SCHEDULED" ? "COMPLETED" : item.status,
                                });
                              }}
                              className="h-8 text-xs"
                            >
                              <FileText className="mr-1 h-3.5 w-3.5 text-purple-600" /> Feedback
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-12 text-center text-sm text-gray-500">
                  No interview sessions scheduled yet.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Schedule Interview Modal */}
          {isScheduleOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <Card className="w-full max-w-md bg-white shadow-xl">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <CalendarCheck className="h-5 w-5 text-purple-600" />
                    Schedule Candidate Interview
                  </CardTitle>
                  <CardDescription>Assign an interviewer and date for technical evaluation</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSchedule} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Select Candidate *</label>
                      <select
                        className="w-full rounded-md border border-gray-300 p-2 text-sm"
                        value={scheduleData.jobApplicationId}
                        onChange={(e) => setScheduleData({ ...scheduleData, jobApplicationId: e.target.value })}
                        required
                      >
                        <option value="">-- Choose Candidate --</option>
                        {applications.map((app) => (
                          <option key={app.id} value={app.id}>
                            {app.applicantName} ({app.jobPosting?.title || "Job"})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Assigned Interviewer *</label>
                      <select
                        className="w-full rounded-md border border-gray-300 p-2 text-sm"
                        value={scheduleData.interviewerId}
                        onChange={(e) => setScheduleData({ ...scheduleData, interviewerId: e.target.value })}
                        required
                      >
                        <option value="">-- Choose Interviewer --</option>
                        {Array.isArray(interviewers) && interviewers.map((usr) => (
                          <option key={usr.id} value={usr.id}>
                            {usr.name} ({usr.email})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Interview Type</label>
                        <select
                          className="w-full rounded-md border border-gray-300 p-2 text-sm"
                          value={scheduleData.interviewType}
                          onChange={(e) => setScheduleData({ ...scheduleData, interviewType: e.target.value as InterviewType })}
                        >
                          <option value="PHONE_SCREEN">Phone Screen</option>
                          <option value="TECHNICAL">Technical</option>
                          <option value="HR">HR</option>
                          <option value="MANAGER">Managerial</option>
                          <option value="FINAL">Final Round</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Scheduled Date & Time *</label>
                        <Input
                          type="datetime-local"
                          value={scheduleData.scheduledAt}
                          onChange={(e) => setScheduleData({ ...scheduleData, scheduledAt: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Location / Video Link</label>
                      <Input
                        placeholder="Google Meet or Office Room"
                        value={scheduleData.location}
                        onChange={(e) => setScheduleData({ ...scheduleData, location: e.target.value })}
                      />
                    </div>

                    <div className="flex justify-end gap-2 pt-4 border-t">
                      <Button variant="outline" type="button" onClick={() => setIsScheduleOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={submitting} className="bg-purple-600 text-white">
                        {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Schedule Session"}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Interview Feedback Modal */}
          {selectedInterview && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <Card className="w-full max-w-lg bg-white shadow-xl">
                <CardHeader>
                  <CardTitle className="text-lg">Submit Interview Feedback & Score</CardTitle>
                  <CardDescription>
                    Candidate: {selectedInterview.jobApplication?.applicantName}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmitFeedback} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Evaluation Score (0-100)</label>
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          value={feedbackData.score}
                          onChange={(e) => setFeedbackData({ ...feedbackData, score: Number(e.target.value) })}
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Session Status</label>
                        <select
                          className="w-full rounded-md border border-gray-300 p-2 text-sm"
                          value={feedbackData.status}
                          onChange={(e) => setFeedbackData({ ...feedbackData, status: e.target.value as InterviewStatus })}
                        >
                          <option value="COMPLETED">Completed</option>
                          <option value="CANCELLED">Cancelled</option>
                          <option value="NO_SHOW">No Show</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Interviewer Feedback Notes *</label>
                      <textarea
                        className="w-full rounded-md border border-gray-300 p-2 text-sm"
                        rows={4}
                        placeholder="Detailed technical assessment, domain knowledge, soft skills..."
                        value={feedbackData.feedback}
                        onChange={(e) => setFeedbackData({ ...feedbackData, feedback: e.target.value })}
                        required
                      />
                    </div>

                    <div className="flex justify-end gap-2 pt-4 border-t">
                      <Button variant="outline" type="button" onClick={() => setSelectedInterview(null)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={submitting} className="bg-purple-600 text-white">
                        {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Feedback"}
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
