"use client";

import { useState, useEffect } from "react";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/auth-context";
import { apiRequest, ApiError } from "@/lib/api";
import { User } from "@/types";
import {
  User as UserIcon,
  Briefcase,
  ShieldCheck,
  KeyRound,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Building,
  Award,
  Clock,
  AlertCircle,
  CheckCircle2,
  BadgeCheck,
  Activity,
  UserCheck,
  Sparkles,
  RefreshCw,
} from "lucide-react";

function ProfileContent() {
  const { user: authUser } = useAuth();
  const [profileData, setProfileData] = useState<User | null>(null);
  const [fetching, setFetching] = useState(true);

  // Password change states
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Active tab state
  const [activeTab, setActiveTab] = useState<"personal" | "employment" | "account" | "security">("personal");

  useEffect(() => {
    let isMounted = true;
    async function loadProfile() {
      try {
        setFetching(true);
        const data = await apiRequest<User>("/auth/profile");
        if (isMounted) {
          setProfileData(data);
        }
      } catch (err) {
        console.error("Failed to load rich profile:", err);
      } finally {
        if (isMounted) {
          setFetching(false);
        }
      }
    }
    loadProfile();
    return () => {
      isMounted = false;
    };
  }, []);

  const user = profileData || authUser;

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match");
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters long");
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

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return "—";
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const formatDateTime = (dateStr?: string | null) => {
    if (!dateStr) return "—";
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      return date.toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  // Get last login time from device records or fallback
  const getLastLogin = () => {
    if (user?.employeeDevices && user.employeeDevices.length > 0) {
      const dates = user.employeeDevices
        .map((d) => d.lastUsedAt)
        .filter((d): d is string => Boolean(d))
        .map((d) => new Date(d).getTime());
      if (dates.length > 0) {
        const latest = Math.max(...dates);
        return formatDateTime(new Date(latest).toISOString());
      }
    }
    return "Active session (just now)";
  };

  const getStatusBadge = (status?: string | null) => {
    switch (status) {
      case "ACTIVE":
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">Active</span>;
      case "ON_LEAVE":
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">On Leave</span>;
      case "PROBATION":
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">Probation</span>;
      case "INACTIVE":
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">Inactive</span>;
      case "TERMINATED":
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-800">Terminated</span>;
      default:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">Active</span>;
    }
  };

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "EMP";

  return (
    <div className="space-y-6">
      {/* Header Banner Card */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-slate-800 p-6 text-white shadow-lg">
        <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-5">
          {/* Avatar / Profile Photo */}
          <div className="relative flex-shrink-0">
            {user?.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.name}
                className="h-24 w-24 rounded-full object-cover border-4 border-white/20 shadow-inner"
              />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-white/10 text-3xl font-bold border-4 border-white/20 backdrop-blur-sm shadow-inner text-white">
                {initials}
              </div>
            )}
            <div className="absolute bottom-0 right-0 h-5 w-5 rounded-full bg-emerald-500 border-2 border-white shadow-sm" title="Active Account" />
          </div>

          {/* User Brief Overview */}
          <div className="flex-1 text-center sm:text-left space-y-2">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h1 className="text-2xl font-bold tracking-tight">{user?.name}</h1>
              <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-3 py-0.5 text-xs font-semibold backdrop-blur-md">
                <BadgeCheck className="h-3.5 w-3.5" />
                {user?.employeeId}
              </span>
            </div>

            <p className="text-blue-100 text-sm flex flex-wrap items-center justify-center sm:justify-start gap-x-3 gap-y-1">
              <span>{user?.position?.title || "Employee Profile"}</span>
              {user?.departmentRef?.name || user?.department ? (
                <>
                  <span className="text-white/40">•</span>
                  <span>{user?.departmentRef?.name || user?.department}</span>
                </>
              ) : null}
            </p>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
              {getStatusBadge(user?.employmentStatus)}
              <span className="inline-flex items-center gap-1 text-xs text-blue-100/80 bg-white/10 px-2.5 py-0.5 rounded-full">
                <ShieldCheck className="h-3 w-3" />
                Role: {user?.role}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-gray-200 overflow-x-auto no-scrollbar space-x-2">
        <button
          onClick={() => setActiveTab("personal")}
          className={`flex items-center gap-2 py-3 px-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
            activeTab === "personal"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
          }`}
        >
          <UserIcon className="h-4 w-4" />
          Personal Information
        </button>
        <button
          onClick={() => setActiveTab("employment")}
          className={`flex items-center gap-2 py-3 px-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
            activeTab === "employment"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
          }`}
        >
          <Briefcase className="h-4 w-4" />
          Employment Information
        </button>
        <button
          onClick={() => setActiveTab("account")}
          className={`flex items-center gap-2 py-3 px-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
            activeTab === "account"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
          }`}
        >
          <Activity className="h-4 w-4" />
          Account & Status
        </button>
        <button
          onClick={() => setActiveTab("security")}
          className={`flex items-center gap-2 py-3 px-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
            activeTab === "security"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
          }`}
        >
          <KeyRound className="h-4 w-4" />
          Security & Password
        </button>
      </div>

      {/* Tab Content Areas */}

      {/* 1. PERSONAL INFORMATION */}
      {activeTab === "personal" && (
        <Card className="shadow-sm border-gray-200">
          <CardHeader className="border-b border-gray-100 bg-gray-50/50">
            <div className="flex items-center gap-2">
              <UserIcon className="h-5 w-5 text-blue-600" />
              <div>
                <CardTitle className="text-lg font-semibold text-gray-900">Personal Details</CardTitle>
                <CardDescription>Demographic and contact information</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">First Name</span>
                <p className="text-sm font-medium text-gray-900">{user?.firstName || "—"}</p>
              </div>
              <div className="space-y-1">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Middle Name</span>
                <p className="text-sm font-medium text-gray-900">{user?.middleName || "—"}</p>
              </div>
              <div className="space-y-1">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Last Name</span>
                <p className="text-sm font-medium text-gray-900">{user?.lastName || "—"}</p>
              </div>
              <div className="space-y-1">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Gender</span>
                <p className="text-sm font-medium text-gray-900">
                  {user?.gender ? user.gender.charAt(0) + user.gender.slice(1).toLowerCase() : "—"}
                </p>
              </div>
              <div className="space-y-1">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Date of Birth</span>
                <p className="text-sm font-medium text-gray-900 flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  {formatDate(user?.dateOfBirth)}
                </p>
              </div>
              <div className="space-y-1">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Phone Number</span>
                <p className="text-sm font-medium text-gray-900 flex items-center gap-1.5">
                  <Phone className="h-4 w-4 text-gray-400" />
                  {user?.phone || "—"}
                </p>
              </div>
              <div className="space-y-1 md:col-span-2 lg:col-span-2">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Email Address</span>
                <p className="text-sm font-medium text-gray-900 flex items-center gap-1.5">
                  <Mail className="h-4 w-4 text-gray-400" />
                  {user?.email}
                </p>
              </div>
              <div className="space-y-1 md:col-span-2 lg:col-span-3">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Residential Address</span>
                <p className="text-sm font-medium text-gray-900 flex items-start gap-1.5">
                  <MapPin className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                  <span>{user?.address || "—"}</span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 2. EMPLOYMENT INFORMATION */}
      {activeTab === "employment" && (
        <Card className="shadow-sm border-gray-200">
          <CardHeader className="border-b border-gray-100 bg-gray-50/50">
            <div className="flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-blue-600" />
              <div>
                <CardTitle className="text-lg font-semibold text-gray-900">Employment Details</CardTitle>
                <CardDescription>Work assignment, position, and managerial info</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Employee Code</span>
                <p className="text-sm font-medium text-gray-900 font-mono">{user?.employeeId}</p>
              </div>
              <div className="space-y-1">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Department</span>
                <p className="text-sm font-medium text-gray-900 flex items-center gap-1.5">
                  <Building className="h-4 w-4 text-gray-400" />
                  {user?.departmentRef?.name || user?.department || "Unassigned"}
                </p>
              </div>
              <div className="space-y-1">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Position / Job Title</span>
                <p className="text-sm font-medium text-gray-900 flex items-center gap-1.5">
                  <Award className="h-4 w-4 text-gray-400" />
                  {user?.position?.title || "Staff Member"}
                </p>
              </div>
              <div className="space-y-1">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Employment Status</span>
                <div className="pt-0.5">{getStatusBadge(user?.employmentStatus)}</div>
              </div>
              <div className="space-y-1">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Hire Date</span>
                <p className="text-sm font-medium text-gray-900 flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  {formatDate(user?.hireDate)}
                </p>
              </div>
              <div className="space-y-1">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Reporting Manager</span>
                <p className="text-sm font-medium text-gray-900 flex items-center gap-1.5">
                  <UserCheck className="h-4 w-4 text-gray-400" />
                  {user?.manager ? `${user.manager.name} (${user.manager.employeeId})` : "None Assigned"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 3. ACCOUNT & SYSTEM STATUS */}
      {activeTab === "account" && (
        <Card className="shadow-sm border-gray-200">
          <CardHeader className="border-b border-gray-100 bg-gray-50/50">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-600" />
              <div>
                <CardTitle className="text-lg font-semibold text-gray-900">Account Overview</CardTitle>
                <CardDescription>System access permissions and activity timestamps</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">System Role</span>
                <p className="text-sm font-medium text-gray-900">{user?.role}</p>
              </div>
              <div className="space-y-1">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Account Status</span>
                <div className="flex items-center gap-2 pt-0.5">
                  <span className={`h-2.5 w-2.5 rounded-full ${user?.isActive ? "bg-emerald-500" : "bg-rose-500"}`} />
                  <span className="text-sm font-medium text-gray-900">{user?.isActive ? "Active Account" : "Deactivated"}</span>
                </div>
              </div>
              <div className="space-y-1">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Last Activity / Login</span>
                <p className="text-sm font-medium text-gray-900 flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-gray-400" />
                  {getLastLogin()}
                </p>
              </div>
              <div className="space-y-1">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Account Created</span>
                <p className="text-sm font-medium text-gray-900 flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  {formatDateTime(user?.createdAt)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 4. SECURITY & CHANGE PASSWORD */}
      {activeTab === "security" && (
        <Card className="shadow-sm border-gray-200">
          <CardHeader className="border-b border-gray-100 bg-gray-50/50">
            <div className="flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-blue-600" />
              <div>
                <CardTitle className="text-lg font-semibold text-gray-900">Security Settings</CardTitle>
                <CardDescription>Update your login password to keep your account safe</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleChangePassword} className="max-w-md space-y-4">
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
                {passwordLoading ? "Updating Password..." : "Update Password"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
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
