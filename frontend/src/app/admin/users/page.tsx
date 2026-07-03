"use client";

import { useEffect, useState, useCallback } from "react";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { User } from "@/types";
import { apiRequest, ApiError } from "@/lib/api";
import {
  Loader2,
  Plus,
  Trash2,
  KeyRound,
  X,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
} from "lucide-react";

function PasswordStrengthHint({ password }: { password: string }) {
  const rules = [
    { label: "At least 8 characters", ok: password.length >= 8 },
    { label: "One uppercase letter (A–Z)", ok: /[A-Z]/.test(password) },
    { label: "One lowercase letter (a–z)", ok: /[a-z]/.test(password) },
    { label: "One number (0–9)", ok: /[0-9]/.test(password) },
  ];

  return (
    <ul className="mt-2 space-y-1">
      {rules.map((r) => (
        <li
          key={r.label}
          className={`flex items-center gap-1.5 text-xs font-medium ${
            r.ok ? "text-green-700" : "text-gray-400"
          }`}
        >
          <span
            className={`inline-flex h-3.5 w-3.5 items-center justify-center rounded-full text-[9px] font-bold ${
              r.ok ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-400"
            }`}
          >
            {r.ok ? "✓" : "·"}
          </span>
          {r.label}
        </li>
      ))}
    </ul>
  );
}

function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    employeeId: "",
    department: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Reset password modal
  const [resetTarget, setResetTarget] = useState<User | null>(null);
  const [resetPassword, setResetPassword] = useState("");
  const [resetConfirm, setResetConfirm] = useState("");
  const [showResetPw, setShowResetPw] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetSuccess, setResetSuccess] = useState(false);

  const fetchUsers = useCallback(async () => {
    try {
      const data = await apiRequest<User[]>("/admin/users");
      setUsers(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await apiRequest("/auth/register", {
        method: "POST",
        body: JSON.stringify(form),
      });
      setForm({ name: "", email: "", password: "", employeeId: "", department: "" });
      setShowForm(false);
      fetchUsers();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to create user");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    await apiRequest(`/admin/users/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ isActive: !isActive }),
    });
    fetchUsers();
  };

  const deleteUser = async (id: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return;
    await apiRequest(`/admin/users/${id}`, { method: "DELETE" });
    fetchUsers();
  };

  const openResetModal = (user: User) => {
    setResetTarget(user);
    setResetPassword("");
    setResetConfirm("");
    setResetError(null);
    setResetSuccess(false);
    setShowResetPw(false);
    setShowResetConfirm(false);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError(null);

    if (resetPassword !== resetConfirm) {
      setResetError("Passwords do not match.");
      return;
    }

    setResetLoading(true);
    try {
      await apiRequest("/admin/reset-password", {
        method: "POST",
        body: JSON.stringify({ userId: resetTarget!.id, newPassword: resetPassword }),
      });
      setResetSuccess(true);
    } catch (err) {
      setResetError(
        err instanceof ApiError ? err.message : "Failed to reset password."
      );
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Employees</h2>
          <p className="text-gray-500">Manage employee accounts</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="h-4 w-4" />
          Add Employee
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>New Employee</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="grid gap-4 sm:grid-cols-2">
              {error && <p className="col-span-full text-sm text-red-600">{error}</p>}
              <div className="space-y-2">
                <Label>Name</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Employee ID</Label>
                <Input value={form.employeeId} onChange={(e) => setForm({ ...form, employeeId: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Department</Label>
                <Input value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />
              </div>
              <div className="col-span-full space-y-2">
                <Label>Password</Label>
                <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
              </div>
              <div className="col-span-full flex gap-2">
                <Button type="submit" disabled={submitting}>
                  {submitting ? "Creating..." : "Create Employee"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-left text-gray-500">
                    <th className="pb-3 pr-4 font-medium">Name</th>
                    <th className="pb-3 pr-4 font-medium">Email</th>
                    <th className="pb-3 pr-4 font-medium">Employee ID</th>
                    <th className="pb-3 pr-4 font-medium">Department</th>
                    <th className="pb-3 pr-4 font-medium">Role</th>
                    <th className="pb-3 pr-4 font-medium">Status</th>
                    <th className="pb-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b border-gray-100">
                      <td className="py-3 pr-4 font-medium">{user.name}</td>
                      <td className="py-3 pr-4 text-gray-600">{user.email}</td>
                      <td className="py-3 pr-4">{user.employeeId}</td>
                      <td className="py-3 pr-4">{user.department || "—"}</td>
                      <td className="py-3 pr-4">
                        <Badge variant={user.role === "ADMIN" ? "default" : "secondary"}>{user.role}</Badge>
                      </td>
                      <td className="py-3 pr-4">
                        <Badge variant={user.isActive ? "success" : "destructive"}>
                          {user.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </td>
                      <td className="py-3">
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleActive(user.id, user.isActive)}
                          >
                            {user.isActive ? "Deactivate" : "Activate"}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openResetModal(user)}
                            className="gap-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200"
                          >
                            <KeyRound className="h-3.5 w-3.5" />
                            Reset Password
                          </Button>
                          {user.role !== "ADMIN" && (
                            <Button variant="destructive" size="sm" onClick={() => deleteUser(user.id)}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reset Password Modal */}
      {resetTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden border border-gray-100">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
                <KeyRound className="h-4 w-4 text-blue-600" />
                Reset Password — {resetTarget.name}
              </h3>
              <button
                onClick={() => setResetTarget(null)}
                className="text-gray-400 hover:text-gray-700 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6">
              {resetSuccess ? (
                <div className="flex flex-col items-center gap-3 py-4 text-center">
                  <CheckCircle2 className="h-12 w-12 text-green-500" />
                  <p className="font-semibold text-gray-900">Password reset successfully!</p>
                  <p className="text-sm text-gray-500">
                    {resetTarget.name}&apos;s password has been updated. They will need to log in again.
                  </p>
                  <Button className="mt-2 w-full" onClick={() => setResetTarget(null)}>
                    Done
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleResetPassword} className="space-y-4">
                  {resetError && (
                    <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                      <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                      <span>{resetError}</span>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <Label htmlFor="new-pw">New Password</Label>
                    <div className="relative">
                      <Input
                        id="new-pw"
                        type={showResetPw ? "text" : "password"}
                        placeholder="Enter new password"
                        value={resetPassword}
                        onChange={(e) => setResetPassword(e.target.value)}
                        required
                        className="pr-10 bg-white"
                      />
                      <button
                        type="button"
                        onClick={() => setShowResetPw((v) => !v)}
                        className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-700"
                      >
                        {showResetPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {resetPassword && <PasswordStrengthHint password={resetPassword} />}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="confirm-pw">Confirm Password</Label>
                    <div className="relative">
                      <Input
                        id="confirm-pw"
                        type={showResetConfirm ? "text" : "password"}
                        placeholder="Re-enter new password"
                        value={resetConfirm}
                        onChange={(e) => setResetConfirm(e.target.value)}
                        required
                        className={`pr-10 bg-white ${
                          resetConfirm && resetConfirm !== resetPassword
                            ? "border-red-400 focus:border-red-400"
                            : ""
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowResetConfirm((v) => !v)}
                        className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-700"
                      >
                        {showResetConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {resetConfirm && resetConfirm !== resetPassword && (
                      <p className="text-xs text-red-600 font-medium">Passwords do not match</p>
                    )}
                  </div>

                  <div className="flex gap-3 pt-1">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1"
                      onClick={() => setResetTarget(null)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1"
                      disabled={resetLoading || resetPassword !== resetConfirm || !resetPassword}
                    >
                      {resetLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-1" />
                          Resetting...
                        </>
                      ) : (
                        "Reset Password"
                      )}
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminUsersPage() {
  return (
    <ProtectedRoute requiredRole="ADMIN">
      <DashboardLayout>
        <UsersPage />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
