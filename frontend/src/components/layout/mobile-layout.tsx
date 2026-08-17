"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { apiRequest } from "@/lib/api";
import { NotificationStats } from "@/types/notification";
import {
  Home,
  Clock,
  Calendar,
  FolderKanban,
  User,
  Bell,
  Building2,
  ChevronLeft,
} from "lucide-react";

export function MobileLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifStats = async () => {
    try {
      const stats = await apiRequest<NotificationStats>("/notifications/stats");
      setUnreadCount(stats.unreadCount);
    } catch (e) {
      console.error("Failed to load mobile notification stats", e);
    }
  };

  useEffect(() => {
    fetchNotifStats();
  }, [pathname]);

  const navItems = [
    { href: "/employee/mobile-app", label: "Home", icon: Home },
    { href: "/employee/mobile-app/attendance", label: "Attendance", icon: Clock },
    { href: "/employee/mobile-app/leave", label: "Leave", icon: Calendar },
    { href: "/employee/mobile-app/vault", label: "Vault", icon: FolderKanban },
    { href: "/employee/mobile-app/profile", label: "Profile", icon: User },
  ];

  return (
    <div className="min-h-screen bg-gray-200 py-0 sm:py-6 flex justify-center items-center">
      {/* Mobile Smartphone Frame Container */}
      <div className="w-full max-w-md bg-gray-50 min-h-screen sm:min-h-[840px] sm:max-h-[860px] sm:rounded-[36px] shadow-2xl flex flex-col overflow-hidden relative border-0 sm:border-8 sm:border-gray-800">
        {/* Top App Header */}
        <header className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white px-4 py-3.5 flex items-center justify-between sticky top-0 z-30 shadow-md">
          <div className="flex items-center gap-2">
            {pathname !== "/employee/mobile-app" ? (
              <Link href="/employee/mobile-app" className="p-1 hover:bg-white/10 rounded-full">
                <ChevronLeft className="h-5 w-5 text-white" />
              </Link>
            ) : (
              <Building2 className="h-6 w-6 text-blue-200" />
            )}
            <div>
              <h1 className="text-sm font-bold tracking-tight">AttendPro Mobile</h1>
              <p className="text-[10px] text-blue-200">{new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/employee/notifications" className="relative p-1.5 hover:bg-white/10 rounded-full">
              <Bell className="h-5 w-5 text-white" />
              {unreadCount > 0 && (
                <span className="absolute top-0 right-0 h-4 w-4 rounded-full bg-red-500 text-[9px] font-bold text-white flex items-center justify-center">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Link>

            <Link href="/employee" className="text-[11px] font-semibold bg-white/15 hover:bg-white/25 px-2.5 py-1 rounded-full text-white">
              Desktop
            </Link>
          </div>
        </header>

        {/* Scrollable Mobile Body Content */}
        <main className="flex-1 overflow-y-auto pb-20 p-4 space-y-4">
          {children}
        </main>

        {/* Bottom Tab Navigation Bar */}
        <nav className="fixed sm:absolute bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t border-gray-200 px-2 py-1.5 flex justify-around items-center z-30 shadow-lg">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all w-16",
                  isActive
                    ? "text-blue-600 font-bold bg-blue-50"
                    : "text-gray-500 hover:text-gray-900"
                )}
              >
                <Icon className={cn("h-5 w-5 mb-0.5", isActive ? "text-blue-600 scale-110" : "text-gray-400")} />
                <span className="text-[10px]">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
