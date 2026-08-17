"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/api";
import { Notification, GetNotificationsResponse, NotificationType } from "@/types/notification";
import {
  Bell,
  Megaphone,
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
  Users,
} from "lucide-react";

export default function AdminNotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<"ALL" | "UNREAD">("ALL");

  // Broadcast Modal State
  const [isBroadcastOpen, setIsBroadcastOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [broadcastData, setBroadcastData] = useState({
    title: "",
    message: "",
    type: "SYSTEM" as NotificationType,
    link: "/employee",
    targetRole: "ALL" as "ALL" | "ADMIN" | "EMPLOYEE",
  });

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

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastData.title || !broadcastData.message) return;

    setSubmitting(true);
    try {
      await apiRequest("/notifications/broadcast", {
        method: "POST",
        body: JSON.stringify(broadcastData),
      });
      setIsBroadcastOpen(false);
      setBroadcastData({
        title: "",
        message: "",
        type: "SYSTEM",
        link: "/employee",
        targetRole: "ALL",
      });
      fetchNotifications();
      alert("System announcement broadcasted successfully!");
    } catch (err) {
      console.error("Failed to broadcast announcement", err);
    } finally {
      setSubmitting(false);
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
      case "ATS":
        return <Users className="h-5 w-5 text-indigo-600" />;
      default:
        return <Info className="h-5 w-5 text-blue-600" />;
    }
  };

  return (
    <ProtectedRoute requiredRole="ADMIN">
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Bell className="h-6 w-6 text-blue-600" />
                Notification Center & System Announcements
              </h1>
              <p className="text-sm text-gray-500">
                View real-time system alerts, leave/asset notifications, and broadcast announcements to employees.
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
              <Button onClick={() => setIsBroadcastOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white">
                <Megaphone className="mr-2 h-4 w-4" />
                Broadcast Announcement
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
                  {unreadCount} unread notification(s)
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

          {/* Broadcast Announcement Modal */}
          {isBroadcastOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <Card className="w-full max-w-lg bg-white shadow-xl">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Megaphone className="h-5 w-5 text-blue-600" />
                    Broadcast System Announcement
                  </CardTitle>
                  <CardDescription>Send an in-app alert to all employees or specific roles</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleBroadcast} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Target Audience</label>
                        <select
                          className="w-full rounded-md border border-gray-300 p-2 text-sm"
                          value={broadcastData.targetRole}
                          onChange={(e) =>
                            setBroadcastData({
                              ...broadcastData,
                              targetRole: e.target.value as "ALL" | "ADMIN" | "EMPLOYEE",
                            })
                          }
                        >
                          <option value="ALL">All Users & Employees</option>
                          <option value="EMPLOYEE">Employees Only</option>
                          <option value="ADMIN">Admins Only</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Alert Category</label>
                        <select
                          className="w-full rounded-md border border-gray-300 p-2 text-sm"
                          value={broadcastData.type}
                          onChange={(e) =>
                            setBroadcastData({
                              ...broadcastData,
                              type: e.target.value as NotificationType,
                            })
                          }
                        >
                          <option value="SYSTEM">System Announcement</option>
                          <option value="HOLIDAY">Holiday & Office Hours</option>
                          <option value="DOCUMENT">Document Policy</option>
                          <option value="TRAINING">Training Opportunity</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Announcement Title *</label>
                      <Input
                        placeholder="e.g. Office Closing Notice for Ethiopian New Year"
                        value={broadcastData.title}
                        onChange={(e) => setBroadcastData({ ...broadcastData, title: e.target.value })}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Announcement Message *</label>
                      <textarea
                        className="w-full rounded-md border border-gray-300 p-2 text-sm"
                        rows={4}
                        placeholder="Full announcement details..."
                        value={broadcastData.message}
                        onChange={(e) => setBroadcastData({ ...broadcastData, message: e.target.value })}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Action Deep Link URL</label>
                      <Input
                        placeholder="e.g. /employee/holidays"
                        value={broadcastData.link}
                        onChange={(e) => setBroadcastData({ ...broadcastData, link: e.target.value })}
                      />
                    </div>

                    <div className="flex justify-end gap-2 pt-4 border-t">
                      <Button variant="outline" type="button" onClick={() => setIsBroadcastOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={submitting} className="bg-blue-600 text-white">
                        {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send Broadcast"}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
