"use client";

import { useEffect, useState } from "react";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/api";
import { PerformanceGoal, GoalStatus } from "@/types/performance";
import {
  Target,
  Plus,
  Search,
  Loader2,
  RefreshCw,
  Trash2,
  CheckCircle2,
  Calendar,
} from "lucide-react";

interface EmployeeSimple {
  id: string;
  name: string;
  employeeId: string;
  department?: string | null;
}

export default function AdminPerformanceGoalsPage() {
  const [goals, setGoals] = useState<PerformanceGoal[]>([]);
  const [employees, setEmployees] = useState<EmployeeSimple[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");

  // Modal State
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    employeeId: "",
    title: "",
    description: "",
    targetDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
    progressPercentage: 0,
    status: "NOT_STARTED" as GoalStatus,
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [goalsRes, empRes] = await Promise.all([
        apiRequest<PerformanceGoal[]>("/performance/goals"),
        apiRequest<EmployeeSimple[]>("/employees"),
      ]);
      setGoals(goalsRes);
      setEmployees(empRes);
    } catch (err) {
      console.error("Failed to load goals data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAssignGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.employeeId || !formData.title) return;

    setSubmitting(true);
    try {
      await apiRequest<PerformanceGoal>("/performance/goals", {
        method: "POST",
        body: JSON.stringify(formData),
      });
      setIsAssignOpen(false);
      setFormData({
        employeeId: "",
        title: "",
        description: "",
        targetDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
        progressPercentage: 0,
        status: "NOT_STARTED",
      });
      fetchData();
    } catch (err) {
      console.error("Failed to assign goal", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteGoal = async (id: string) => {
    if (!confirm("Are you sure you want to delete this performance goal?")) return;
    try {
      await apiRequest(`/performance/goals/${id}`, { method: "DELETE" });
      fetchData();
    } catch (err) {
      console.error("Failed to delete goal", err);
    }
  };

  const filteredGoals = goals.filter((g) => {
    const matchesSearch =
      g.title.toLowerCase().includes(search.toLowerCase()) ||
      g.employee?.name.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = selectedStatus === "ALL" || g.status === selectedStatus;
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
                <Target className="h-6 w-6 text-emerald-600" />
                Employee Performance Goals
              </h1>
              <p className="text-sm text-gray-500">
                Assign and track KPI objectives, target dates, and progress percentage.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
                <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
              <Button onClick={() => setIsAssignOpen(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                <Plus className="mr-2 h-4 w-4" />
                Assign Employee Goal
              </Button>
            </div>
          </div>

          {/* Filters & Search */}
          <Card>
            <CardContent className="p-4 flex flex-col sm:flex-row gap-4 justify-between items-center">
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search goals or employee..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>

              <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                {["ALL", "NOT_STARTED", "IN_PROGRESS", "COMPLETED", "CANCELLED"].map((st) => (
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

          {/* Goals Grid */}
          {loading ? (
            <div className="flex h-48 items-center justify-center rounded-xl bg-white shadow-sm">
              <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
            </div>
          ) : filteredGoals.length ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredGoals.map((goal) => (
                <Card key={goal.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <Badge
                        className={
                          goal.status === "COMPLETED"
                            ? "bg-emerald-100 text-emerald-800"
                            : goal.status === "IN_PROGRESS"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-gray-100 text-gray-700"
                        }
                      >
                        {goal.status.replace("_", " ")}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteGoal(goal.id)}
                        className="h-7 w-7 p-0 text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <CardTitle className="text-base mt-2">{goal.title}</CardTitle>
                    <CardDescription className="text-xs font-medium text-gray-700">
                      Employee: {goal.employee?.name} ({goal.employee?.employeeId})
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {goal.description && (
                      <p className="text-xs text-gray-600 line-clamp-2">{goal.description}</p>
                    )}

                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">Progress</span>
                        <span className="font-bold text-gray-900">{goal.progressPercentage}%</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
                        <div
                          className="h-full bg-emerald-600 rounded-full transition-all"
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
              <CardContent className="py-12 text-center text-sm text-gray-500">
                No performance goals found for the current filter.
              </CardContent>
            </Card>
          )}

          {/* Assign Goal Modal */}
          {isAssignOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <Card className="w-full max-w-lg bg-white shadow-xl">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Target className="h-5 w-5 text-emerald-600" />
                    Assign Employee Performance Goal
                  </CardTitle>
                  <CardDescription>Create a quantifiable KPI target for an employee</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleAssignGoal} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Select Employee *</label>
                      <select
                        className="w-full rounded-md border border-gray-300 p-2 text-sm"
                        value={formData.employeeId}
                        onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
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

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Goal Title *</label>
                      <Input
                        placeholder="e.g. Q3 Automated Testing Suite Coverage"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Description</label>
                      <textarea
                        className="w-full rounded-md border border-gray-300 p-2 text-sm"
                        rows={3}
                        placeholder="Detailed deliverables, milestones, and success criteria..."
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Target Date *</label>
                      <Input
                        type="date"
                        value={formData.targetDate}
                        onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })}
                        required
                      />
                    </div>

                    <div className="flex justify-end gap-2 pt-4 border-t">
                      <Button variant="outline" type="button" onClick={() => setIsAssignOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={submitting} className="bg-emerald-600 text-white">
                        {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Assign Goal"}
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
