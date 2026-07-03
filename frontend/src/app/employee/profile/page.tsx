"use client";

import { useState } from "react";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/auth-context";
import { apiRequest, ApiError } from "@/lib/api";
import { AlertCircle, CheckCircle2, User, Shield, KeyRound, Mail, UserCheck, ShieldAlert } from "lucide-react";

function ProfileContent() {
  const { user } = useAuth();
  
  // Password change states
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordLoading, setPasswordLoading] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match");
      return;
    }

    setPasswordLoading(true);
    try {
      await apiRequest("/user/change-password", {
        method: "POST",
        body: JSON.stringify({ oldPassword, newPassword }),
      });
      setPasswordSuccess("Password changed successfully!");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setPasswordError(err instanceof ApiError ? err.message : "Failed to change password");
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Profile Settings</h2>
        <p className="text-gray-500">Manage your account information and password settings</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Personal Details */}
        <Card className="shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-blue-600" />
              <CardTitle>Employee Information</CardTitle>
            </div>
            <CardDescription>Your work credentials and details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col border-b border-gray-100 pb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Full Name</span>
              <span className="mt-1 font-medium text-gray-900">{user?.name}</span>
            </div>
            <div className="flex flex-col border-b border-gray-100 pb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Employee Code</span>
              <span className="mt-1 font-medium text-gray-900">{user?.employeeId}</span>
            </div>
            <div className="flex flex-col border-b border-gray-100 pb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Department</span>
              <span className="mt-1 font-medium text-gray-900">{user?.department || "—"}</span>
            </div>
            <div className="flex flex-col pb-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Email Address</span>
              <span className="mt-1 flex items-center gap-1.5 font-medium text-gray-900">
                <Mail className="h-4 w-4 text-gray-400" />
                {user?.email}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Security / Password Change */}
        <Card className="shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-blue-600" />
              <CardTitle>Security</CardTitle>
            </div>
            <CardDescription>Change your account password below</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleChangePassword} className="space-y-4">
              {passwordError && (
                <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {passwordError}
                </div>
              )}
              {passwordSuccess && (
                <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  {passwordSuccess}
                </div>
              )}
              
              <div className="space-y-1">
                <Label htmlFor="old-password">Current Password</Label>
                <Input
                  id="old-password"
                  type="password"
                  placeholder="••••••••"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  required
                  className="bg-white"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="new-password">New Password</Label>
                <Input
                  id="new-password"
                  type="password"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  className="bg-white"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="confirm-password">Confirm New Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="bg-white"
                />
              </div>

              <Button type="submit" className="w-full mt-2" disabled={passwordLoading}>
                {passwordLoading ? "Updating..." : "Update Password"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <ProtectedRoute requiredRole="EMPLOYEE">
      <DashboardLayout>
        <ProfileContent />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
