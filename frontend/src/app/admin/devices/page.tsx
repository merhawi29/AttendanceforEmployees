"use client";

import { useEffect, useState, useCallback } from "react";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmployeeDevice } from "@/types";
import { apiRequest } from "@/lib/api";
import {
  Loader2,
  Smartphone,
  Check,
  X,
  Trash2,
  Monitor,
  Globe,
  Activity,
} from "lucide-react";

function DeviceStatusBadge({ device }: { device: EmployeeDevice }) {
  if (!device.isActive) {
    return <Badge variant="destructive">Deactivated</Badge>;
  }
  if (device.isApproved) {
    return <Badge variant="success">Approved</Badge>;
  }
  return <Badge variant="warning">Pending</Badge>;
}

function DevicesPageContent() {
  const [devices, setDevices] = useState<EmployeeDevice[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDevices = useCallback(async () => {
    try {
      const data = await apiRequest<EmployeeDevice[]>("/devices/admin");
      setDevices(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDevices();
  }, [fetchDevices]);

  const handleApprove = async (id: string, isApproved: boolean) => {
    await apiRequest(`/devices/admin/${id}/approve`, {
      method: "PATCH",
      body: JSON.stringify({ isApproved }),
    });
    fetchDevices();
  };

  const handleToggle = async (id: string) => {
    await apiRequest(`/devices/admin/${id}/toggle`, {
      method: "PATCH",
    });
    fetchDevices();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Remove this device registration?")) return;
    await apiRequest(`/devices/admin/${id}`, { method: "DELETE" });
    fetchDevices();
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Device Management</h2>
        <p className="text-gray-500">Approve or manage employee registered devices</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-blue-600" />
            Registered Devices
          </CardTitle>
          <CardDescription>
            Devices must be approved before employees can use them for attendance
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : devices.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-500">No devices registered yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-left text-gray-500 uppercase tracking-wider text-xs font-semibold">
                    <th className="pb-3 pr-4">Employee</th>
                    <th className="pb-3 pr-4">Device</th>
                    <th className="pb-3 pr-4">Browser/OS</th>
                    <th className="pb-3 pr-4">IP Address</th>
                    <th className="pb-3 pr-4">Last Used</th>
                    <th className="pb-3 pr-4">Status</th>
                    <th className="pb-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {devices.map((device) => (
                    <tr key={device.id} className="hover:bg-gray-50/30 transition-colors">
                      <td className="py-3 pr-4">
                        <p className="font-semibold text-gray-900">{device.employee?.name}</p>
                        <p className="text-xs text-gray-400 font-medium">{device.employee?.employeeId}</p>
                      </td>
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-2">
                          <Monitor className="h-4 w-4 text-gray-400" />
                          <span className="font-medium text-gray-700">{device.deviceName || device.deviceId.slice(0, 8)}</span>
                        </div>
                      </td>
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-2">
                          <Globe className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-600">{device.browser || "—"}</span>
                        </div>
                        <p className="text-xs text-gray-400">{device.operatingSystem || ""}</p>
                      </td>
                      <td className="py-3 pr-4 font-mono text-xs text-gray-500">{device.ipAddress || "—"}</td>
                      <td className="py-3 pr-4 text-gray-500">
                        {device.lastUsedAt
                          ? new Date(device.lastUsedAt).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "—"}
                      </td>
                      <td className="py-3 pr-4">
                        <DeviceStatusBadge device={device} />
                      </td>
                      <td className="py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {!device.isApproved && device.isActive && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleApprove(device.id, true)}
                              className="h-8 px-2 text-green-600 hover:text-green-700 hover:bg-green-50"
                            >
                              <Check className="h-4 w-4" />
                              <span className="sr-only">Approve</span>
                            </Button>
                          )}
                          {device.isApproved && device.isActive && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleApprove(device.id, false)}
                              className="h-8 px-2 text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                            >
                              <X className="h-4 w-4" />
                              <span className="sr-only">Unapprove</span>
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggle(device.id)}
                            className="h-8 px-2 text-gray-600 hover:text-gray-700 hover:bg-gray-50"
                          >
                            <Activity className="h-4 w-4" />
                            <span className="sr-only">Toggle</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(device.id)}
                            className="h-8 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Delete</span>
                          </Button>
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
    </div>
  );
}

export default function AdminDevicesPage() {
  return (
    <ProtectedRoute requiredRole="ADMIN">
      <DashboardLayout>
        <DevicesPageContent />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
