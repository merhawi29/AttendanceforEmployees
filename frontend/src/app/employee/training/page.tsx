"use client";

import { useEffect, useState } from "react";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/api";
import { TrainingEnrollment } from "@/types/training";
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
} from "lucide-react";

export default function EmployeeTrainingPage() {
  const [myTrainings, setMyTrainings] = useState<TrainingEnrollment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMyTrainings = async () => {
    setLoading(true);
    try {
      const data = await apiRequest<TrainingEnrollment[]>("/training/my-trainings");
      setMyTrainings(data);
    } catch (err) {
      console.error("Failed to load employee training courses", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyTrainings();
  }, []);

  return (
    <ProtectedRoute requiredRole="EMPLOYEE">
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <GraduationCap className="h-6 w-6 text-purple-600" />
                My Enrolled Training Courses
              </h1>
              <p className="text-sm text-gray-500">
                View your skill development courses, workshop schedules, scores, and verified certificates.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={fetchMyTrainings} disabled={loading}>
                <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </div>
          </div>

          {/* Training Grid */}
          {loading ? (
            <div className="flex h-48 items-center justify-center rounded-xl bg-white shadow-sm">
              <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
            </div>
          ) : myTrainings.length ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {myTrainings.map((item) => (
                <Card key={item.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3 flex flex-row items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-purple-50 p-3 text-purple-600">
                        <BookOpen className="h-6 w-6" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{item.trainingProgram?.title}</CardTitle>
                        <CardDescription className="text-xs font-mono text-gray-500">
                          {item.trainingProgram?.code}
                        </CardDescription>
                      </div>
                    </div>
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
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-xs text-gray-600 line-clamp-2">
                      {item.trainingProgram?.description}
                    </p>

                    <div className="rounded-lg bg-gray-50 p-3 space-y-1 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500 flex items-center gap-1">
                          <User className="h-3.5 w-3.5 text-gray-400" /> Trainer:
                        </span>
                        <span className="font-semibold text-gray-900">
                          {item.trainingProgram?.trainerName || "TBD"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500 flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5 text-gray-400" /> Location:
                        </span>
                        <span className="font-semibold text-gray-900">
                          {item.trainingProgram?.location || "TBD"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500 flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5 text-gray-400" /> Schedule:
                        </span>
                        <span className="font-semibold text-gray-900">
                          {item.trainingProgram?.startDate ? new Date(item.trainingProgram.startDate).toLocaleDateString() : ""} - {item.trainingProgram?.endDate ? new Date(item.trainingProgram.endDate).toLocaleDateString() : ""}
                        </span>
                      </div>
                    </div>

                    {/* Certificate & Grade Badge */}
                    {item.certificateNo ? (
                      <div className="rounded-lg bg-amber-50 p-3 border border-amber-200 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-amber-800 flex items-center gap-1">
                            <Award className="h-4 w-4 text-amber-600" />
                            {item.certificateNo}
                          </span>
                          <span className="font-bold text-emerald-700">{item.score}% Grade</span>
                        </div>
                        {item.issueDate && (
                          <p className="text-[11px] text-amber-700 mt-1">
                            Issued: {new Date(item.issueDate).toLocaleDateString()}
                          </p>
                        )}
                        {item.feedback && (
                          <p className="text-[11px] text-gray-600 italic mt-1 border-t border-amber-200 pt-1">
                            "{item.feedback}"
                          </p>
                        )}
                      </div>
                    ) : item.score !== null && item.score !== undefined ? (
                      <div className="rounded-lg bg-blue-50 p-2 text-center text-xs font-semibold text-blue-800">
                        Current Score: {item.score}%
                      </div>
                    ) : null}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center text-sm text-gray-500">
                You are not enrolled in any training courses at this time.
              </CardContent>
            </Card>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
