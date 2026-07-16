"use client";

import { useEffect, useState, useCallback } from "react";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmployeeDevice, DeviceStatus } from "@/types";
import { apiRequest, ApiError } from "@/lib/api";
import { getDeviceInfo, resetDeviceId } from "@/lib/device";
import {
  Loader2,
  Smartphone,
  Monitor,
  Globe,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Shield,
} from "lucide-react";

function EmployeeDevicesContent() {
  const [devices, setDevices] = useState<EmployeeDevice[]>([]);
  const [deviceStatus, setDeviceStatus] = useState<DeviceStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [devicesData, statusData] = await Promise.all([
        apiRequest<EmployeeDevice[]>("/devices/my"),
        apiRequest<DeviceStatus>("/devices/status"),
      ]);
      setDevices(devicesData);
      setDeviceStatus(statusData);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRegister = async () => {
    setRegistering(true);
    setError(null);
    setSuccess(null);
    try {
      const info = getDeviceInfo();
      await apiRequest("/devices/register", {
        method: "POST",
        body: JSON.stringify(info),
      });
      setSuccess("Device registration request submitted successfully. Waiting for administrator approval.");
      fetchData();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Registration failed");
    } finally {
      setRegistering(false);
    }
  };

  const handleReset = async () => {
    if (!confirm("Reset all registered devices? You will need to re-register.")) return;
    setResetting(true);
    setError(null);
    try {
      await apiRequest("/devices/reset", { method: "POST" });
      resetDeviceId();
      setDevices([]);
      setDeviceStatus(null);
      setSuccess("Devices reset. Please re-register.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Reset failed");
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">My Devices</h2>
        <p className="text-gray-500">Manage devices used for attendance check-in</p>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          {success}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-600" />
            Device Registration
          </CardTitle>
          <CardDescription>
            Register this browser as a trusted device. Admin approval is required before you can check in.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {deviceStatus && (
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg bg-blue-50 p-3 border border-blue-100">
                <p className="text-xs font-semibold text-blue-700 uppercase tracking-wider">Registered</p>
                <p className="text-lg font-bold text-blue-900">{deviceStatus.hasDevice ? "Yes" : "No"}</p>
              </div>
              <div className="rounded-lg bg-green-50 p-3 border border-green-100">
                <p className="text-xs font-semibold text-green-700 uppercase tracking-wider">Approved</p>
                <p className="text-lg font-bold text-green-900">{deviceStatus.isApproved ? "Yes" : "No"}</p>
              </div>
              <div className="rounded-lg bg-orange-50 p-3 border border-orange-100">
                <p className="text-xs font-semibold text-orange-700 uppercase tracking-wider">Pending Approval</p>
                <p className="text-lg font-bold text-orange-900">{deviceStatus.pendingCount}</p>
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <Button onClick={handleRegister} disabled={registering}>
              {registering ? "Registering..." : "Register This Device"}
            </Button>
            <Button variant="outline" onClick={handleReset} disabled={resetting}>
              <RefreshCw className="h-4 w-4" />
              {resetting ? "Resetting..." : "Reset All"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-blue-600" />
            Registered Devices ({devices.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : devices.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-500">
              No devices registered. Register this device above.
            </p>
          ) : (
            <div className="space-y-3">
              {devices.map((device) => (
                <div
                  key={device.id}
                  className="flex items-center justify-between rounded-lg border border-gray-200 p-4"
                >
                  <div className="flex items-center gap-3">
                    <Monitor className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="font-semibold text-gray-900">{device.deviceName || "Unnamed Device"}</p>
                      <p className="text-xs text-gray-500 flex items-center gap-2">
                        <Globe className="h-3 w-3" />
                        {device.browser || "Unknown"} · {device.operatingSystem || "Unknown"}
                        {device.lastUsedAt && ` · Last used ${new Date(device.lastUsedAt).toLocaleDateString()}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {device.isApproved ? (
                      <Badge variant="success">Approved</Badge>
                    ) : (
                      <Badge variant="warning">Pending</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function EmployeeDevicesPage() {
  return (
    <ProtectedRoute requiredRole="EMPLOYEE">
      <DashboardLayout>
        <EmployeeDevicesContent />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
