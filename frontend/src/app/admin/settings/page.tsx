"use client";

import { useEffect, useState } from "react";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiRequest, ApiError } from "@/lib/api";
import { Loader2, AlertCircle, CheckCircle2, Settings, Clock, Timer, Save } from "lucide-react";

interface SettingsState {
  morningCheckInStart: string;
  morningCheckInEnd: string;
  lunchStartTime: string;
  lunchReturnDeadline: string;
  workEndTime: string;
  gracePeriodMinutes: number;
}

function SettingsContent() {
  const [settings, setSettings] = useState<SettingsState>({
    morningCheckInStart: "08:30",
    morningCheckInEnd: "08:45",
    lunchStartTime: "12:30",
    lunchReturnDeadline: "13:30",
    workEndTime: "17:30",
    gracePeriodMinutes: 15,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    async function loadSettings() {
      try {
        const data = await apiRequest<SettingsState>("/attendance/settings");
        setSettings(data);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Failed to load settings");
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await apiRequest("/admin/settings", {
        method: "POST",
        body: JSON.stringify({
          ...settings,
          gracePeriodMinutes: Number(settings.gracePeriodMinutes),
        }),
      });
      setSuccess("Settings updated successfully!");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Attendance Settings</h2>
        <p className="text-gray-500">Configure global attendance check-in windows, deadlines, and grace periods</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6 max-w-2xl">
        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}
        {success && (
          <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            {success}
          </div>
        )}

        <Card className="shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-600" />
              <CardTitle>Time Windows</CardTitle>
            </div>
            <CardDescription>Specify the start and end times for attendance actions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="morning-start">Morning Check-In Start</Label>
                <Input
                  id="morning-start"
                  type="time"
                  value={settings.morningCheckInStart}
                  onChange={(e) => setSettings({ ...settings, morningCheckInStart: e.target.value })}
                  required
                  className="bg-white"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="morning-end">Morning Check-In End</Label>
                <Input
                  id="morning-end"
                  type="time"
                  value={settings.morningCheckInEnd}
                  onChange={(e) => setSettings({ ...settings, morningCheckInEnd: e.target.value })}
                  required
                  className="bg-white"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="lunch-start">Lunch Break Start</Label>
                <Input
                  id="lunch-start"
                  type="time"
                  value={settings.lunchStartTime}
                  onChange={(e) => setSettings({ ...settings, lunchStartTime: e.target.value })}
                  required
                  className="bg-white"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="lunch-deadline">Lunch Return Deadline</Label>
                <Input
                  id="lunch-deadline"
                  type="time"
                  value={settings.lunchReturnDeadline}
                  onChange={(e) => setSettings({ ...settings, lunchReturnDeadline: e.target.value })}
                  required
                  className="bg-white"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="work-end">Work End (Checkout Opens)</Label>
                <Input
                  id="work-end"
                  type="time"
                  value={settings.workEndTime}
                  onChange={(e) => setSettings({ ...settings, workEndTime: e.target.value })}
                  required
                  className="bg-white"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Timer className="h-5 w-5 text-blue-600" />
              <CardTitle>Grace Period Config</CardTitle>
            </div>
            <CardDescription>Define buffer periods before status changes to Late</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-1 max-w-sm">
              <Label htmlFor="grace-period">Grace Period (Minutes)</Label>
              <Input
                id="grace-period"
                type="number"
                min="0"
                max="120"
                value={settings.gracePeriodMinutes}
                onChange={(e) => setSettings({ ...settings, gracePeriodMinutes: Number(e.target.value) })}
                required
                className="bg-white"
              />
              <p className="text-xs text-gray-500 mt-1">Applied directly after the lunch return deadline.</p>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" size="lg" disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Settings
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <ProtectedRoute requiredRole="ADMIN">
      <DashboardLayout>
        <SettingsContent />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
