"use client";

import { useEffect, useState, useCallback } from "react";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { AllowedIp } from "@/types";
import { apiRequest, ApiError } from "@/lib/api";
import { Loader2, Plus, Trash2, Shield } from "lucide-react";

function IpsPage() {
  const [ips, setIps] = useState<AllowedIp[]>([]);
  const [loading, setLoading] = useState(true);
  const [ipAddress, setIpAddress] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchIps = useCallback(async () => {
    try {
      const data = await apiRequest<AllowedIp[]>("/admin/ips");
      setIps(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchIps();
  }, [fetchIps]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await apiRequest("/admin/ips", {
        method: "POST",
        body: JSON.stringify({ ipAddress, description }),
      });
      setIpAddress("");
      setDescription("");
      fetchIps();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to add IP");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleIp = async (id: string, isActive: boolean) => {
    await apiRequest(`/admin/ips/${id}/toggle`, {
      method: "PATCH",
      body: JSON.stringify({ isActive: !isActive }),
    });
    fetchIps();
  };

  const deleteIp = async (id: string) => {
    if (!confirm("Remove this IP from whitelist?")) return;
    await apiRequest(`/admin/ips/${id}`, { method: "DELETE" });
    fetchIps();
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">IP Whitelist</h2>
        <p className="text-gray-500">Control which IP addresses can record attendance</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-600" />
            Add Allowed IP
          </CardTitle>
          <CardDescription>
            Employees can only check in from whitelisted office network IPs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAdd} className="flex flex-col gap-4 sm:flex-row sm:items-end">
            {error && <p className="col-span-full text-sm text-red-600 sm:col-span-3">{error}</p>}
            <div className="flex-1 space-y-2">
              <Label>IP Address</Label>
              <Input
                placeholder="192.168.1.100"
                value={ipAddress}
                onChange={(e) => setIpAddress(e.target.value)}
                required
              />
            </div>
            <div className="flex-1 space-y-2">
              <Label>Description</Label>
              <Input
                placeholder="Office network"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <Button type="submit" disabled={submitting}>
              <Plus className="h-4 w-4" />
              {submitting ? "Adding..." : "Add IP"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Whitelisted IPs</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : ips.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-500">No IPs whitelisted yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-left text-gray-500">
                    <th className="pb-3 pr-4 font-medium">IP Address</th>
                    <th className="pb-3 pr-4 font-medium">Description</th>
                    <th className="pb-3 pr-4 font-medium">Status</th>
                    <th className="pb-3 pr-4 font-medium">Added</th>
                    <th className="pb-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {ips.map((ip) => (
                    <tr key={ip.id} className="border-b border-gray-100">
                      <td className="py-3 pr-4 font-mono font-medium">{ip.ipAddress}</td>
                      <td className="py-3 pr-4 text-gray-600">{ip.description || "—"}</td>
                      <td className="py-3 pr-4">
                        <Badge variant={ip.isActive ? "success" : "destructive"}>
                          {ip.isActive ? "Active" : "Disabled"}
                        </Badge>
                      </td>
                      <td className="py-3 pr-4 text-gray-500">
                        {new Date(ip.createdAt).toLocaleDateString("en-US")}
                      </td>
                      <td className="py-3">
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => toggleIp(ip.id, ip.isActive)}>
                            {ip.isActive ? "Disable" : "Enable"}
                          </Button>
                          <Button variant="destructive" size="sm" onClick={() => deleteIp(ip.id)}>
                            <Trash2 className="h-3 w-3" />
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

export default function AdminIpsPage() {
  return (
    <ProtectedRoute requiredRole="ADMIN">
      <DashboardLayout>
        <IpsPage />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
