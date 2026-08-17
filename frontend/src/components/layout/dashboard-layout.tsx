"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { useTheme } from "@/contexts/theme-context";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { apiRequest } from "@/lib/api";
import { NotificationStats } from "@/types/notification";
import { GlobalSearchModal } from "./global-search-modal";
import {
  LayoutDashboard,
  Users,
  Shield,
  Clock,
  LogOut,
  Building2,
  Briefcase,
  User,
  Settings,
  Smartphone,
  FileText,
  Calendar,
  CreditCard,
  PartyPopper,
  Award,
  Target,
  UserPlus,
  Laptop,
  GraduationCap,
  FolderKanban,
  Bell,
  Sun,
  Moon,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Search,
  Command,
  TrendingUp,
} from "lucide-react";

const adminLinks = [
  { href: "/admin", label: "Executive Dashboard", icon: LayoutDashboard },
  { href: "/admin/departments", label: "Departments", icon: Building2 },
  { href: "/admin/positions", label: "Positions", icon: Briefcase },
  { href: "/admin/notifications", label: "Notifications", icon: Bell },
  { href: "/admin/documents", label: "Documents", icon: FolderKanban },
  { href: "/admin/assets", label: "Assets", icon: Laptop },
  { href: "/admin/training", label: "Training", icon: GraduationCap },
  { href: "/admin/ats", label: "Recruitment / ATS", icon: UserPlus },
  { href: "/admin/holidays", label: "Holidays", icon: PartyPopper },
  { href: "/admin/performance", label: "Performance", icon: Award },
  { href: "/admin/leave", label: "Leave Management", icon: Calendar },
  { href: "/admin/overtime", label: "Overtime Management", icon: Clock },
  { href: "/admin/payroll", label: "Payroll Management", icon: CreditCard },
  { href: "/admin/attendance", label: "Attendance", icon: Clock },
  { href: "/admin/reports", label: "Reports & Analytics", icon: FileText },
  { href: "/admin/users", label: "Employees", icon: Users },
  { href: "/admin/devices", label: "Devices", icon: Smartphone },
  { href: "/admin/ips", label: "IP Whitelist", icon: Shield },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

const employeeLinks = [
  { href: "/employee", label: "My Attendance", icon: Clock },
  { href: "/employee/mobile-app", label: "Mobile Self-Service App", icon: Smartphone },
  { href: "/employee/notifications", label: "Notifications", icon: Bell },
  { href: "/employee/holidays", label: "Holidays", icon: PartyPopper },
  { href: "/employee/documents", label: "My Documents & Policies", icon: FolderKanban },
  { href: "/employee/assets", label: "My Assets", icon: Laptop },
  { href: "/employee/training", label: "My Trainings", icon: GraduationCap },
  { href: "/employee/performance", label: "My Performance", icon: Target },
  { href: "/employee/leave", label: "My Leave", icon: Calendar },
  { href: "/employee/overtime", label: "My Overtime", icon: Clock },
  { href: "/employee/payroll", label: "My Payslips", icon: CreditCard },
  { href: "/employee/devices", label: "My Devices", icon: Smartphone },
  { href: "/employee/profile", label: "Profile", icon: User },
];

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout, isAdmin } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();
  const links = isAdmin ? adminLinks : employeeLinks;
  const notifPageUrl = isAdmin ? "/admin/notifications" : "/employee/notifications";

  const [unreadCount, setUnreadCount] = useState(0);
  const [currentDateTime, setCurrentDateTime] = useState<string>("");
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  useEffect(() => {
    const savedCollapse = localStorage.getItem("attendpro_sidebar_collapsed");
    if (savedCollapse === "true") setIsCollapsed(true);
  }, []);

  const toggleSidebar = () => {
    const nextState = !isCollapsed;
    setIsCollapsed(nextState);
    localStorage.setItem("attendpro_sidebar_collapsed", String(nextState));
  };

  const fetchNotifStats = async () => {
    try {
      const stats = await apiRequest<NotificationStats>("/notifications/stats");
      setUnreadCount(stats.unreadCount);
    } catch (e) {
      console.error("Failed to load notification stats", e);
    }
  };

  useEffect(() => {
    fetchNotifStats();
  }, [pathname]);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentDateTime(
        now.toLocaleDateString(undefined, {
          weekday: "short",
          month: "short",
          day: "numeric",
          year: "numeric",
        }) +
          " · " +
          now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 30000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-gray-100 transition-colors">
      {/* Global Command Search Modal */}
      <GlobalSearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

      {/* Top Header Navbar */}
      <header className="border-b border-gray-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md sticky top-0 z-30 shadow-xs">
        <div className="w-full flex h-16 items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            {/* Mobile Hamburger Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-gray-600 dark:text-gray-300"
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>

            <div className="rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 p-2 text-white shadow-md">
              <Building2 className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-lg font-extrabold text-gray-900 dark:text-white tracking-tight flex items-center gap-1.5">
                AttendPro <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-800 hidden sm:inline">HRMS Enterprise</span>
              </h1>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 hidden sm:block">{currentDateTime || "Executive Workspace"}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Global Search Pill Button */}
            <button
              onClick={() => setIsSearchOpen(true)}
              className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/80 text-xs text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <Search className="h-3.5 w-3.5" />
              <span>Search HRMS...</span>
              <kbd className="rounded bg-gray-200 dark:bg-slate-700 px-1.5 py-0.5 text-[9px] font-mono text-gray-600 dark:text-gray-300">
                Ctrl + K
              </kbd>
            </button>

            {/* Attendance & Headcount Quick Status Chips */}
            {isAdmin && (
              <div className="hidden lg:flex items-center gap-2 text-xs">
                <span className="rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 px-2.5 py-1 border border-emerald-200 dark:border-emerald-800 font-semibold flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" /> 94.5% Rate
                </span>
              </div>
            )}

            {/* Theme Toggle Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              className="h-9 w-9 rounded-full p-0 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800"
              title={`Switch to ${theme === "light" ? "Dark" : "Light"} Mode`}
            >
              {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5 text-amber-400" />}
            </Button>

            {/* Notification Bell */}
            <Link href={notifPageUrl}>
              <Button variant="ghost" size="sm" className="relative p-2 h-9 w-9 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800">
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white shadow-sm animate-pulse">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </Button>
            </Link>

            <div className="hidden text-right sm:block border-l pl-3 border-gray-200 dark:border-slate-800">
              <p className="text-xs font-bold text-gray-900 dark:text-white">{user?.name}</p>
              <p className="text-[10px] font-mono text-gray-500 dark:text-gray-400">{user?.employeeId} · <span className="font-semibold text-indigo-600 dark:text-indigo-400">{user?.role}</span></p>
            </div>

            <Button variant="outline" size="sm" onClick={logout} className="dark:border-slate-700 dark:hover:bg-slate-800 text-xs">
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="w-full flex gap-4 sm:gap-6 px-4 py-6 relative">
        {/* Desktop Collapsible Sidebar */}
        <nav className={cn(
          "hidden md:flex flex-col shrink-0 transition-all duration-300 relative",
          isCollapsed ? "w-20" : "w-64"
        )}>
          {/* Collapse Toggle Button */}
          <button
            onClick={toggleSidebar}
            className="absolute -right-3 top-2 z-20 h-6 w-6 rounded-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shadow-md flex items-center justify-center text-gray-500 hover:text-gray-900 dark:hover:text-white"
            title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {isCollapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
          </button>

          <ul className="space-y-1 sticky top-20">
            {links.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              const isNotifLink = link.label === "Notifications";
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    title={isCollapsed ? link.label : undefined}
                    className={cn(
                      "flex items-center rounded-xl px-3 py-2 text-xs font-semibold transition-all",
                      isCollapsed ? "justify-center" : "justify-between",
                      isActive
                        ? "bg-blue-600 text-white shadow-sm font-bold"
                        : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-white"
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={cn("h-4 w-4 shrink-0", isActive ? "text-white" : "text-gray-400 dark:text-gray-400")} />
                      {!isCollapsed && <span>{link.label}</span>}
                    </div>
                    {!isCollapsed && isNotifLink && unreadCount > 0 && (
                      <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold", isActive ? "bg-white text-blue-700" : "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300")}>
                        {unreadCount}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Mobile Slide-out Drawer Overlay */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-40 md:hidden bg-black/60 backdrop-blur-xs flex">
            <div className="w-64 bg-white dark:bg-slate-900 h-full p-4 space-y-4 overflow-y-auto border-r border-gray-200 dark:border-slate-800 shadow-2xl">
              <div className="flex justify-between items-center pb-3 border-b border-gray-200 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-blue-600" />
                  <span className="font-bold text-sm text-gray-900 dark:text-white">AttendPro HRMS</span>
                </div>
                <button onClick={() => setIsMobileMenuOpen(false)} className="text-gray-400">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <ul className="space-y-1">
                {links.map((link) => {
                  const Icon = link.icon;
                  const isActive = pathname === link.href;
                  return (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={cn(
                          "flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-semibold transition-colors",
                          isActive
                            ? "bg-blue-600 text-white font-bold"
                            : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800"
                        )}
                      >
                        <Icon className="h-4 w-4" />
                        {link.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        )}

        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
