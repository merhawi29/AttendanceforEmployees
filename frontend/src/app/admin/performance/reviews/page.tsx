"use client";

import { useEffect, useState } from "react";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/api";
import { PerformanceReview, PerformanceRating } from "@/types/performance";
import {
  Award,
  Plus,
  Search,
  Loader2,
  RefreshCw,
  Eye,
  Trash2,
  FileText,
} from "lucide-react";

interface EmployeeSimple {
  id: string;
  name: string;
  employeeId: string;
  department?: string | null;
}

export default function AdminPerformanceReviewsPage() {
  const [reviews, setReviews] = useState<PerformanceReview[]>([]);
  const [employees, setEmployees] = useState<EmployeeSimple[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedRating, setSelectedRating] = useState<string>("ALL");

  // Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedReview, setSelectedReview] = useState<PerformanceReview | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    employeeId: "",
    reviewDate: new Date().toISOString().slice(0, 10),
    overallScore: 85,
    rating: "VERY_GOOD" as PerformanceRating,
    strengths: "",
    weaknesses: "",
    comments: "",
    recommendation: "REGULAR_INCREMENT",
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [reviewRes, empRes] = await Promise.all([
        apiRequest<PerformanceReview[]>("/performance/reviews"),
        apiRequest<EmployeeSimple[]>("/employees"),
      ]);
      setReviews(reviewRes);
      setEmployees(empRes);
    } catch (err) {
      console.error("Failed to load review data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleScoreChange = (score: number) => {
    let rating: PerformanceRating = "POOR";
    if (score >= 90) rating = "OUTSTANDING";
    else if (score >= 80) rating = "VERY_GOOD";
    else if (score >= 70) rating = "GOOD";
    else if (score >= 60) rating = "FAIR";

    setFormData((prev) => ({ ...prev, overallScore: score, rating }));
  };

  const handleCreateReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.employeeId) return;

    setSubmitting(true);
    try {
      await apiRequest<PerformanceReview>("/performance/reviews", {
        method: "POST",
        body: JSON.stringify(formData),
      });
      setIsCreateOpen(false);
      fetchData();
    } catch (err) {
      console.error("Failed to submit review", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteReview = async (id: string) => {
    if (!confirm("Are you sure you want to delete this evaluation review?")) return;
    try {
      await apiRequest(`/performance/reviews/${id}`, { method: "DELETE" });
      fetchData();
    } catch (err) {
      console.error("Failed to delete review", err);
    }
  };

  const filteredReviews = reviews.filter((r) => {
    const matchesSearch =
      r.employee?.name.toLowerCase().includes(search.toLowerCase()) ||
      r.employee?.employeeId.toLowerCase().includes(search.toLowerCase());
    const matchesRating = selectedRating === "ALL" || r.rating === selectedRating;
    return matchesSearch && matchesRating;
  });

  return (
    <ProtectedRoute requiredRole="ADMIN">
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Award className="h-6 w-6 text-blue-600" />
                Employee Performance Reviews
              </h1>
              <p className="text-sm text-gray-500">
                Create and manage official employee evaluation reviews and scores.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
                <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
              <Button onClick={() => setIsCreateOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white">
                <Plus className="mr-2 h-4 w-4" />
                New Performance Review
              </Button>
            </div>
          </div>

          {/* Filters & Search */}
          <Card>
            <CardContent className="p-4 flex flex-col sm:flex-row gap-4 justify-between items-center">
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by employee name..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>

              <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                {["ALL", "OUTSTANDING", "VERY_GOOD", "GOOD", "FAIR", "POOR"].map((tier) => (
                  <Button
                    key={tier}
                    variant={selectedRating === tier ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedRating(tier)}
                    className="text-xs"
                  >
                    {tier.replace("_", " ")}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Table */}
          <Card>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex h-48 items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                </div>
              ) : filteredReviews.length ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 border-b text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      <tr>
                        <th className="px-6 py-3">Employee</th>
                        <th className="px-6 py-3">Department</th>
                        <th className="px-6 py-3">Review Date</th>
                        <th className="px-6 py-3">Overall Score</th>
                        <th className="px-6 py-3">Rating Tier</th>
                        <th className="px-6 py-3">Recommendation</th>
                        <th className="px-6 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredReviews.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div>
                              <p className="font-semibold text-gray-900">{item.employee?.name}</p>
                              <p className="text-xs text-gray-500">{item.employee?.employeeId}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-gray-600">{item.employee?.department || "General"}</td>
                          <td className="px-6 py-4 text-gray-600">
                            {new Date(item.reviewDate).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4">
                            <span className="font-bold text-gray-900">{item.overallScore}</span> / 100
                          </td>
                          <td className="px-6 py-4">
                            <Badge
                              className={
                                item.rating === "OUTSTANDING"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : item.rating === "VERY_GOOD"
                                  ? "bg-blue-100 text-blue-800"
                                  : item.rating === "GOOD"
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-red-100 text-red-800"
                              }
                            >
                              {item.rating.replace("_", " ")}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 text-xs font-medium text-gray-700">
                            {item.recommendation || "Standard Review"}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedReview(item)}
                                className="h-8 w-8 p-0"
                              >
                                <Eye className="h-4 w-4 text-blue-600" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteReview(item.id)}
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
                  No performance reviews match the selected filter.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Create Modal */}
          {isCreateOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <Card className="w-full max-w-xl bg-white shadow-xl max-h-[90vh] overflow-y-auto">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="h-5 w-5 text-blue-600" />
                    New Employee Evaluation Review
                  </CardTitle>
                  <CardDescription>Submit performance scores and feedback notes</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleCreateReview} className="space-y-4">
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

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Overall Score (0-100)</label>
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          value={formData.overallScore}
                          onChange={(e) => handleScoreChange(Number(e.target.value))}
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Calculated Rating Tier</label>
                        <Badge className="w-full justify-center py-2 text-sm bg-blue-100 text-blue-800">
                          {formData.rating.replace("_", " ")}
                        </Badge>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Review Date</label>
                      <Input
                        type="date"
                        value={formData.reviewDate}
                        onChange={(e) => setFormData({ ...formData, reviewDate: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Key Strengths</label>
                      <textarea
                        className="w-full rounded-md border border-gray-300 p-2 text-sm"
                        rows={2}
                        placeholder="Notable achievements, technical skills, leadership..."
                        value={formData.strengths}
                        onChange={(e) => setFormData({ ...formData, strengths: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Areas for Improvement</label>
                      <textarea
                        className="w-full rounded-md border border-gray-300 p-2 text-sm"
                        rows={2}
                        placeholder="Growth areas, communication, workflow timing..."
                        value={formData.weaknesses}
                        onChange={(e) => setFormData({ ...formData, weaknesses: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Recommendation</label>
                      <Input
                        placeholder="PROMOTION, SALARY_INCREMENT, TRAINING, RETAIN..."
                        value={formData.recommendation}
                        onChange={(e) => setFormData({ ...formData, recommendation: e.target.value })}
                      />
                    </div>

                    <div className="flex justify-end gap-2 pt-4 border-t">
                      <Button variant="outline" type="button" onClick={() => setIsCreateOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={submitting} className="bg-blue-600 text-white">
                        {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Evaluation"}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>
          )}

          {/* View Detail Modal */}
          {selectedReview && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <Card className="w-full max-w-lg bg-white shadow-xl">
                <CardHeader>
                  <CardTitle className="text-lg">Evaluation Details</CardTitle>
                  <CardDescription>
                    {selectedReview.employee?.name} ({selectedReview.employee?.employeeId})
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center rounded-lg bg-gray-50 p-3">
                    <div>
                      <p className="text-xs text-gray-500">Overall Score</p>
                      <p className="text-2xl font-bold text-gray-900">{selectedReview.overallScore} / 100</p>
                    </div>
                    <Badge className="bg-emerald-100 text-emerald-800 text-sm py-1 px-3">
                      {selectedReview.rating.replace("_", " ")}
                    </Badge>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase">Strengths</p>
                    <p className="text-sm text-gray-800">{selectedReview.strengths || "None specified"}</p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase">Weaknesses / Growth</p>
                    <p className="text-sm text-gray-800">{selectedReview.weaknesses || "None specified"}</p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase">Recommendation</p>
                    <p className="text-sm font-semibold text-blue-700">{selectedReview.recommendation || "N/A"}</p>
                  </div>

                  <div className="flex justify-end pt-4 border-t">
                    <Button variant="outline" onClick={() => setSelectedReview(null)}>
                      Close
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
