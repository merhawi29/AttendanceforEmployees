"use client";

import { useEffect, useState } from "react";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/auth-context";
import { apiRequest } from "@/lib/api";
import { PerformanceGoal, PerformanceReview } from "@/types/performance";
import {
  Target,
  Award,
  Plus,
  Loader2,
  RefreshCw,
  Calendar,
  CheckCircle2,
  TrendingUp,
} from "lucide-react";

export default function EmployeePerformancePage() {
  const { user } = useAuth();
  const [goals, setGoals] = useState<PerformanceGoal[]>([]);
  const [reviews, setReviews] = useState<PerformanceReview[]>([]);
  const [loading, setLoading] = useState(true);

  // Update Progress State
  const [selectedGoal, setSelectedGoal] = useState<PerformanceGoal | null>(null);
  const [newProgress, setNewProgress] = useState(0);
  const [progressNote, setProgressNote] = useState("");
  const [updating, setUpdating] = useState(false);

  // View Audit History Modal
  const [viewHistoryGoal, setViewHistoryGoal] = useState<PerformanceGoal | null>(null);

  // New Self Goal State
  const [isAddGoalOpen, setIsAddGoalOpen] = useState(false);
  const [submittingGoal, setSubmittingGoal] = useState(false);
  const [newGoalData, setNewGoalData] = useState({
    title: "",
    description: "",
    targetDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [goalsRes, reviewsRes] = await Promise.all([
        apiRequest<PerformanceGoal[]>("/performance/goals"),
        apiRequest<PerformanceReview[]>("/performance/reviews"),
      ]);
      setGoals(goalsRes);
      setReviews(reviewsRes);
    } catch (err) {
      console.error("Failed to load employee performance data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUpdateProgress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGoal) return;

    setUpdating(true);
    try {
      await apiRequest(`/performance/goals/${selectedGoal.id}/progress`, {
        method: "PATCH",
        body: JSON.stringify({
          progressPercentage: newProgress,
          note: progressNote,
        }),
      });
      setSelectedGoal(null);
      setProgressNote("");
      fetchData();
    } catch (err) {
      console.error("Failed to update progress", err);
    } finally {
      setUpdating(false);
    }
  };

  const handleAddGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoalData.title || !user) return;

    setSubmittingGoal(true);
    try {
      await apiRequest<PerformanceGoal>("/performance/goals", {
        method: "POST",
        body: JSON.stringify({
          ...newGoalData,
          employeeId: user.id,
        }),
      });
      setIsAddGoalOpen(false);
      setNewGoalData({
        title: "",
        description: "",
        targetDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
      });
      fetchData();
    } catch (err) {
      console.error("Failed to add goal", err);
    } finally {
      setSubmittingGoal(false);
    }
  };

  const latestReview = reviews.length ? reviews[0] : null;
  const avgScore = reviews.length
    ? Math.round((reviews.reduce((acc, r) => acc + r.overallScore, 0) / reviews.length) * 10) / 10
    : 0;

  return (
    <ProtectedRoute requiredRole="EMPLOYEE">
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Target className="h-6 w-6 text-blue-600" />
                My Performance Dashboard
              </h1>
              <p className="text-sm text-gray-500">
                Track your personal goals, update progress, and review manager evaluations.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
                <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
              <Button onClick={() => setIsAddGoalOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white">
                <Plus className="mr-2 h-4 w-4" />
                Add Personal Goal
              </Button>
            </div>
          </div>

          {/* Overview Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-500">Latest Review Rating</span>
                  <Award className="h-5 w-5 text-amber-500" />
                </div>
                <div className="mt-2 text-2xl font-bold text-gray-900">
                  {latestReview ? latestReview.rating.replace("_", " ") : "Pending Review"}
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  {latestReview ? `Score: ${latestReview.overallScore}/100` : "No evaluation recorded yet"}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-500">Average Historical Score</span>
                  <TrendingUp className="h-5 w-5 text-emerald-600" />
                </div>
                <div className="mt-2 text-2xl font-bold text-gray-900">{avgScore} / 100</div>
                <p className="mt-1 text-xs text-emerald-600 font-medium">Across {reviews.length} evaluation(s)</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-500">Active Goals</span>
                  <CheckCircle2 className="h-5 w-5 text-blue-600" />
                </div>
                <div className="mt-2 text-2xl font-bold text-gray-900">{goals.length}</div>
                <p className="mt-1 text-xs text-gray-500">
                  {goals.filter((g) => g.status === "COMPLETED").length} completed
                </p>
              </CardContent>
            </Card>
          </div>

          {/* My Goals Section */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Target className="h-5 w-5 text-emerald-600" />
              My Performance Goals
            </h2>

            {loading ? (
              <div className="flex h-32 items-center justify-center rounded-xl bg-white shadow-sm">
                <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
              </div>
            ) : goals.length ? (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {goals.map((goal) => (
                  <Card key={goal.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between gap-2">
                        <Badge
                          className={
                            goal.status === "COMPLETED"
                              ? "bg-emerald-100 text-emerald-800"
                              : goal.status === "COMPLETION_REQUESTED"
                              ? "bg-amber-100 text-amber-800 border border-amber-300"
                              : goal.status === "IN_PROGRESS"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-gray-100 text-gray-700"
                          }
                        >
                          {goal.status === "COMPLETION_REQUESTED" ? "Completion Requested" : goal.status.replace("_", " ")}
                        </Badge>

                        <div className="flex items-center gap-1.5">
                          {goal.progressHistories && goal.progressHistories.length > 0 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setViewHistoryGoal(goal)}
                              className="h-7 text-xs text-slate-600 hover:text-slate-900"
                            >
                              History ({goal.progressHistories.length})
                            </Button>
                          )}

                          {goal.status !== "COMPLETED" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedGoal(goal);
                                setNewProgress(goal.progressPercentage);
                                setProgressNote("");
                              }}
                              className="h-7 text-xs font-semibold"
                            >
                              Update Progress
                            </Button>
                          )}
                        </div>
                      </div>
                      <CardTitle className="text-base mt-2">{goal.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {goal.description && <p className="text-xs text-gray-600">{goal.description}</p>}

                      {goal.status === "COMPLETION_REQUESTED" && (
                        <div className="rounded-md bg-amber-50 p-2.5 text-xs text-amber-800 border border-amber-200 font-medium">
                          Completion requested — awaiting manager review.
                        </div>
                      )}

                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-500">Completion</span>
                          <span className="font-bold text-gray-900">{goal.progressPercentage}%</span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              goal.status === "COMPLETED" ? "bg-emerald-600" : goal.status === "COMPLETION_REQUESTED" ? "bg-amber-500" : "bg-blue-600"
                            }`}
                            style={{ width: `${goal.progressPercentage}%` }}
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          Target: {new Date(goal.targetDate).toLocaleDateString()}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-8 text-center text-sm text-gray-500">
                  No performance goals recorded yet.
                </CardContent>
              </Card>
            )}
          </div>

          {/* My Reviews Section */}
          <div className="space-y-4 pt-4">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Award className="h-5 w-5 text-amber-500" />
              My Evaluation History
            </h2>

            {reviews.length ? (
              <div className="space-y-4">
                {reviews.map((rev) => (
                  <Card key={rev.id}>
                    <CardHeader className="bg-gray-50/50 pb-3 border-b">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-base font-semibold text-gray-900">
                            Evaluation Score: {rev.overallScore} / 100
                          </CardTitle>
                          <CardDescription className="text-xs">
                            Reviewed on {new Date(rev.reviewDate).toLocaleDateString()} by {rev.reviewer?.name || "Manager"}
                          </CardDescription>
                        </div>
                        <Badge className="bg-emerald-100 text-emerald-800 text-sm py-1 px-3">
                          {rev.rating.replace("_", " ")}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 space-y-3">
                      {rev.strengths && (
                        <div>
                          <p className="text-xs font-semibold text-gray-500 uppercase">Key Strengths</p>
                          <p className="text-sm text-gray-800">{rev.strengths}</p>
                        </div>
                      )}
                      {rev.weaknesses && (
                        <div>
                          <p className="text-xs font-semibold text-gray-500 uppercase">Areas for Growth</p>
                          <p className="text-sm text-gray-800">{rev.weaknesses}</p>
                        </div>
                      )}
                      {rev.recommendation && (
                        <div>
                          <p className="text-xs font-semibold text-gray-500 uppercase">Manager Recommendation</p>
                          <p className="text-sm font-semibold text-blue-700">{rev.recommendation}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-8 text-center text-sm text-gray-500">
                  No performance evaluations recorded yet.
                </CardContent>
              </Card>
            )}
          </div>

          {/* Update Progress Modal */}
          {selectedGoal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <Card className="w-full max-w-md bg-white shadow-xl">
                <CardHeader>
                  <CardTitle className="text-lg">Update Goal Progress</CardTitle>
                  <CardDescription>{selectedGoal.title}</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleUpdateProgress} className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="font-semibold text-gray-700">Progress Percentage</span>
                        <span className="font-bold text-blue-600">{newProgress}%</span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={newProgress}
                        onChange={(e) => setNewProgress(Number(e.target.value))}
                        className="w-full accent-blue-600 cursor-pointer"
                      />
                    </div>

                    <div className="flex justify-end gap-2 pt-4 border-t">
                      <Button variant="outline" type="button" onClick={() => setSelectedGoal(null)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={updating} className="bg-blue-600 text-white">
                        {updating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Progress"}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Add Goal Modal */}
          {isAddGoalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <Card className="w-full max-w-md bg-white shadow-xl">
                <CardHeader>
                  <CardTitle className="text-lg">Add Personal Goal</CardTitle>
                  <CardDescription>Set an objective for your performance development</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleAddGoal} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Goal Title *</label>
                      <Input
                        placeholder="e.g. Complete Advanced React Certification"
                        value={newGoalData.title}
                        onChange={(e) => setNewGoalData({ ...newGoalData, title: e.target.value })}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Description</label>
                      <textarea
                        className="w-full rounded-md border border-gray-300 p-2 text-sm"
                        rows={3}
                        placeholder="Milestones and expected outcomes..."
                        value={newGoalData.description}
                        onChange={(e) => setNewGoalData({ ...newGoalData, description: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Target Date *</label>
                      <Input
                        type="date"
                        value={newGoalData.targetDate}
                        onChange={(e) => setNewGoalData({ ...newGoalData, targetDate: e.target.value })}
                        required
                      />
                    </div>

                    <div className="flex justify-end gap-2 pt-4 border-t">
                      <Button variant="outline" type="button" onClick={() => setIsAddGoalOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={submittingGoal} className="bg-blue-600 text-white">
                        {submittingGoal ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add Goal"}
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
