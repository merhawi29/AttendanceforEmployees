"use client";

import { useState } from "react";
import { useAuth, ApiError } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, AlertCircle, CheckCircle2 } from "lucide-react";
import { apiRequest } from "@/lib/api";

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Password reset states
  const [mode, setMode] = useState<"login" | "forgot" | "reset">("login");
  const [forgotEmail, setForgotEmail] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      const res = await apiRequest<{ token: string }>("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email: forgotEmail }),
      });
      setResetToken(res.token);
      setSuccess("Reset token generated successfully! It has been pre-filled below.");
      setMode("reset");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to generate reset token");
    } finally {
      setLoading(false);
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      await apiRequest("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ token: resetToken, newPassword }),
      });
      setSuccess("Password reset successfully. Please sign in now.");
      setMode("login");
      setPassword("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-100">
            <Building2 className="h-7 w-7 text-blue-600" />
          </div>
          <CardTitle className="text-2xl">AttendPro</CardTitle>
          <CardDescription>
            {mode === "login" && "Sign in to manage your attendance"}
            {mode === "forgot" && "Recover your account password"}
            {mode === "reset" && "Enter your token to reset password"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              {success}
            </div>
          )}

          {mode === "login" && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <button
                    type="button"
                    onClick={() => {
                      setMode("forgot");
                      setError(null);
                      setSuccess(null);
                    }}
                    className="text-xs font-medium text-blue-600 hover:underline"
                  >
                    Forgot Password?
                  </button>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Signing in..." : "Sign In"}
              </Button>
            </form>
          )}

          {mode === "forgot" && (
            <form onSubmit={handleForgotSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="forgot-email">Email Address</Label>
                <Input
                  id="forgot-email"
                  type="email"
                  placeholder="you@company.com"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Sending..." : "Send Reset Token"}
              </Button>
              <div className="text-center mt-2">
                <button
                  type="button"
                  onClick={() => {
                    setMode("login");
                    setError(null);
                    setSuccess(null);
                  }}
                  className="text-sm font-medium text-blue-600 hover:underline"
                >
                  Back to Login
                </button>
              </div>
            </form>
          )}

          {mode === "reset" && (
            <form onSubmit={handleResetSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reset-token">Reset Token</Label>
                <Input
                  id="reset-token"
                  type="text"
                  placeholder="Paste token here"
                  value={resetToken}
                  onChange={(e) => setResetToken(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <Input
                  id="new-password"
                  type="password"
                  placeholder="At least 8 chars with upper, lower, & number"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Resetting..." : "Reset Password"}
              </Button>
              <div className="text-center mt-2">
                <button
                  type="button"
                  onClick={() => {
                    setMode("login");
                    setError(null);
                    setSuccess(null);
                  }}
                  className="text-sm font-medium text-blue-600 hover:underline"
                >
                  Back to Login
                </button>
              </div>
            </form>
          )}


        </CardContent>
      </Card>
    </div>
  );
}
