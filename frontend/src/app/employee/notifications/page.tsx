"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/api";
import { Notification, GetNotificationsResponse, NotificationType } from "@/types/notification";
import {
  Bell,
  CheckCircle2,
  CheckCheck,
  Trash2,
  Loader2,
  RefreshCw,
  ExternalLink,
  Info,
  Calendar,
  Laptop,
  FolderKanban,
  Award,
  CreditCard,
} from "lucide-react";

export default function EmployeeNotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<"ALL" | "UNREAD">("ALL");

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const isReadParam = selectedFilter === "UNREAD" ? "false" : undefined;
      const url = isReadParam ? `/notifications?isRead=${isReadParam}` : "/notifications";
      const data = await apiRequest<GetNotificationsResponse>(url);
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch (err) {
      console.error("Failed to load notifications", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [selectedFilter]);

  const handleMarkAsRead = async (id: string) => {
    try {
      await apiRequest(`/notifications/${id}/read`, { method: "PATCH" });
      fetchNotifications();
    } catch (err) {
      console.error("Failed to mark notification as read", err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await apiRequest("/notifications/read-all", { method: "PATCH" });
      fetchNotifications();
    } catch (err) {
      console.error("Failed to mark all as read", err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await apiRequest(`/notifications/${id}`, { method: "DELETE" });
      fetchNotifications();
    } catch (err) {
      console.error("Failed to delete notification", err);
    }
  };

  const getNotifIcon = (type: NotificationType) => {
    switch (type) {
      case "LEAVE":
        return <Calendar className="h-5 w-5 text-blue-600" />;
      case "ASSET":
        return <Laptop className="h-5 w-5 text-emerald-600" />;
      case "DOCUMENT":
        return <FolderKanban className="h-5 w-5 text-amber-600" />;
      case "TRAINING":
      case "PERFORMANCE":
        return <Award className="h-5 w-5 text-purple-600" />;
      case "PAYROLL":
        return <CreditCard className="h-5 w-5 text-green-600" />;
      default:
        return <Info className="h-5 w-5 text-blue-600" />;
    }
  };

  return (
    <ProtectedRoute requiredRole="EMPLOYEE">
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Bell className="h-6 w-6 text-blue-600" />
                My Notifications & System Alerts
              </h1>
              <p className="text-sm text-gray-500">
                View leave approvals, asset assignments, document expiration warnings, and company announcements.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" size="sm" onClick={fetchNotifications} disabled={loading}>
                <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
              <Button variant="outline" size="sm" onClick={handleMarkAllAsRead} disabled={unreadCount === 0}>
                <CheckCheck className="mr-2 h-4 w-4 text-emerald-600" />
                Mark All as Read
              </Button>
            </div>
          </div>

          {/* Filter Bar */}
          <Card>
            <CardContent className="p-4 flex justify-between items-center">
              <div className="flex gap-2">
                <Button
                  variant={selectedFilter === "ALL" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedFilter("ALL")}
                >
                  All Alerts ({notifications.length})
                </Button>
                <Button
                  variant={selectedFilter === "UNREAD" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedFilter("UNREAD")}
                >
                  Unread ({unreadCount})
                </Button>
              </div>

              {unreadCount > 0 && (
                <Badge className="bg-red-100 text-red-800">
                  {unreadCount} unread alert(s)
                </Badge>
              )}
            </CardContent>
          </Card>

          {/* Notification List */}
          <Card>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex h-48 items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                </div>
              ) : notifications.length ? (
                <div className="divide-y divide-gray-200">
                  {notifications.map((item) => (
                    <div
                      key={item.id}
                      className={`p-4 flex items-start justify-between transition-colors ${
                        item.isRead ? "bg-white" : "bg-blue-50/50"
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div className="rounded-lg bg-gray-100 p-2.5 mt-0.5">
                          {getNotifIcon(item.type)}
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-gray-900 text-sm">{item.title}</h3>
                            <Badge variant="secondary" className="text-[10px]">
                              {item.type}
                            </Badge>
                            {!item.isRead && (
                              <span className="h-2 w-2 rounded-full bg-blue-600"></span>
                            )}
                          </div>
                          <p className="text-xs text-gray-600">{item.message}</p>
                          <p className="text-[11px] text-gray-400">
                            {new Date(item.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {item.link && (
                          <Link href={item.link}>
                            <Button variant="ghost" size="sm" className="h-8 text-xs text-blue-600">
                              <ExternalLink className="mr-1 h-3.5 w-3.5" /> View
                            </Button>
                          </Link>
                        )}
                        {!item.isRead && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleMarkAsRead(item.id)}
                            className="h-8 text-xs text-emerald-600"
                          >
                            <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> Read
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(item.id)}
                          className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center text-sm text-gray-500">
                  No notifications found.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
