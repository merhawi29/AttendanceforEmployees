"use client";

import { useEffect, useState } from "react";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/api";
import { Asset } from "@/types/asset";
import {
  Laptop,
  Smartphone,
  CreditCard,
  Monitor,
  Loader2,
  RefreshCw,
  Calendar,
  ShieldCheck,
} from "lucide-react";

export default function EmployeeAssetsPage() {
  const [myAssets, setMyAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMyAssets = async () => {
    setLoading(true);
    try {
      const data = await apiRequest<Asset[]>("/assets/my-assets");
      setMyAssets(data);
    } catch (err) {
      console.error("Failed to load employee assigned assets", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyAssets();
  }, []);

  return (
    <ProtectedRoute requiredRole="EMPLOYEE">
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Laptop className="h-6 w-6 text-blue-600" />
                My Assigned Corporate Assets
              </h1>
              <p className="text-sm text-gray-500">
                View company laptops, mobile phones, ID badges, and monitors issued to you.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={fetchMyAssets} disabled={loading}>
                <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </div>
          </div>

          {/* Asset List Grid */}
          {loading ? (
            <div className="flex h-48 items-center justify-center rounded-xl bg-white shadow-sm">
              <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
            </div>
          ) : myAssets.length ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {myAssets.map((asset) => (
                <Card key={asset.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3 flex flex-row items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-blue-50 p-3 text-blue-600">
                        {asset.category?.name.toLowerCase().includes("laptop") ? (
                          <Laptop className="h-6 w-6" />
                        ) : asset.category?.name.toLowerCase().includes("phone") ? (
                          <Smartphone className="h-6 w-6" />
                        ) : asset.category?.name.toLowerCase().includes("id") ? (
                          <CreditCard className="h-6 w-6" />
                        ) : (
                          <Monitor className="h-6 w-6" />
                        )}
                      </div>
                      <div>
                        <CardTitle className="text-base">{asset.name}</CardTitle>
                        <CardDescription className="text-xs font-mono text-gray-500">
                          {asset.assetTag}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge className="bg-emerald-100 text-emerald-800">
                      {asset.condition}
                    </Badge>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="rounded-lg bg-gray-50 p-3 space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Category:</span>
                        <span className="font-semibold text-gray-900">{asset.category?.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Brand / Model:</span>
                        <span className="font-semibold text-gray-900">
                          {asset.brand || "N/A"} {asset.model ? `(${asset.model})` : ""}
                        </span>
                      </div>
                      {asset.serialNumber && (
                        <div className="flex justify-between font-mono">
                          <span className="text-gray-500">Serial No:</span>
                          <span className="font-semibold text-gray-900">{asset.serialNumber}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5 text-gray-400" />
                        Issued: {asset.assignedDate ? new Date(asset.assignedDate).toLocaleDateString() : "Assigned"}
                      </span>
                      <span className="flex items-center gap-1 text-emerald-600 font-medium">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        Active Asset
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center text-sm text-gray-500">
                You do not have any assigned corporate assets registered at this time.
              </CardContent>
            </Card>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
