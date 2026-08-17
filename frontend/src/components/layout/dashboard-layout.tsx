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
    <div className="min-h-screen bg-slate-50 dark:bg-[#090d16] text-slate-900 dark:text-slate-100 transition-colors duration-200">
      {/* Global Command Search Modal */}
      <GlobalSearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

      {/* Top Header Navbar */}
      <header className="border-b border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/85 backdrop-blur-xl sticky top-0 z-30 shadow-2xs transition-colors">
        <div className="w-full flex h-16 items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            {/* Mobile Hamburger Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-slate-600 dark:text-slate-300"
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>

            <div className="rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 p-2 text-white shadow-md shadow-blue-500/10">
              <Building2 className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                AttendPro <span className="text-[10px] sm:text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-800/60 hidden sm:inline">HRMS Enterprise</span>
              </h1>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium hidden sm:block">{currentDateTime || "Enterprise Workspace"}</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Global Search Pill Button */}
            <button
              onClick={() => setIsSearchOpen(true)}
              className="hidden md:flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-slate-200 dark:border-slate-800 bg-slate-100/80 dark:bg-slate-800/60 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:border-slate-300 dark:hover:border-slate-700 transition-all shadow-2xs"
            >
              <Search className="h-3.5 w-3.5" />
              <span>Search HRMS...</span>
              <kbd className="rounded-md bg-slate-200 dark:bg-slate-700/80 px-1.5 py-0.5 text-[9px] font-mono text-slate-600 dark:text-slate-300">
                Ctrl + K
              </kbd>
            </button>

            {/* Attendance Quick Rate Chip */}
            {isAdmin && (
              <div className="hidden lg:flex items-center gap-2 text-xs">
                <span className="rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 px-2.5 py-1 border border-emerald-200 dark:border-emerald-800/60 font-bold flex items-center gap-1.5">
                  <TrendingUp className="h-3.5 w-3.5" /> 94.5% Rate
                </span>
              </div>
            )}

            {/* Theme Toggle Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              className="h-9 w-9 rounded-full p-0 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              title={`Switch to ${theme === "light" ? "Dark" : "Light"} Mode`}
            >
              {theme === "light" ? <Moon className="h-4.5 w-4.5" /> : <Sun className="h-4.5 w-4.5 text-amber-400" />}
            </Button>

            {/* Notification Bell */}
            <Link href={notifPageUrl}>
              <Button variant="ghost" size="sm" className="relative p-2 h-9 w-9 rounded-full text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800">
                <Bell className="h-4.5 w-4.5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-rose-600 text-[10px] font-extrabold text-white shadow-xs animate-pulse">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </Button>
            </Link>

            <div className="hidden text-right sm:block border-l pl-3 border-slate-200 dark:border-slate-800">
              <p className="text-xs font-bold text-slate-900 dark:text-white leading-tight">{user?.name}</p>
              <p className="text-[10px] font-mono text-slate-500 dark:text-slate-400">{user?.employeeId} · <span className="font-semibold text-blue-600 dark:text-blue-400">{user?.role}</span></p>
            </div>

            <Button variant="outline" size="sm" onClick={logout} className="text-xs h-9 font-semibold">
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="w-full flex gap-4 sm:gap-6 px-4 sm:px-6 py-6 relative max-w-[1600px] mx-auto">
        {/* Desktop Collapsible Sidebar */}
        <nav className={cn(
          "hidden md:flex flex-col shrink-0 transition-all duration-300 ease-in-out relative border-r border-slate-200/80 dark:border-slate-800/80 pr-3 min-h-[calc(100vh-6rem)]",
          isCollapsed ? "w-16" : "w-60"
        )}>
          {/* Collapse Toggle Button */}
          <button
            onClick={toggleSidebar}
            className="absolute -right-3.5 top-3 z-20 h-7 w-7 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-md flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white transition-transform duration-200 hover:scale-110 cursor-pointer"
            title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>

          <ul className="space-y-1.5 sticky top-20">
            {links.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              const isNotifLink = link.label === "Notifications";
              return (
                <li key={link.href} className="relative group">
                  <Link
                    href={link.href}
                    title={isCollapsed ? link.label : undefined}
                    className={cn(
                      "flex items-center rounded-xl py-2.5 text-xs font-semibold transition-all duration-200",
                      isCollapsed ? "justify-center px-2" : "justify-between px-3.5",
                      isActive
                        ? "bg-blue-600 text-white shadow-sm shadow-blue-600/25 font-bold"
                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-white"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={cn("h-4 w-4 shrink-0 transition-transform group-hover:scale-110", isActive ? "text-white" : "text-slate-400 dark:text-slate-400")} />
                      {!isCollapsed && <span className="truncate">{link.label}</span>}
                    </div>

                    {!isCollapsed && isNotifLink && unreadCount > 0 && (
                      <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold", isActive ? "bg-white text-blue-700" : "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300")}>
                        {unreadCount}
                      </span>
                    )}
                  </Link>

                  {/* Icon-only Tooltip on Hover when Collapsed */}
                  {isCollapsed && (
                    <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center px-2.5 py-1 rounded-md bg-slate-900 text-white dark:bg-slate-800 dark:text-slate-100 text-xs font-semibold whitespace-nowrap shadow-lg z-50 pointer-events-none">
                      {link.label}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Mobile Slide-out Drawer Overlay */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-40 md:hidden bg-slate-950/70 backdrop-blur-xs flex">
            <div className="w-64 bg-white dark:bg-slate-900 h-full p-4 space-y-4 overflow-y-auto border-r border-slate-200 dark:border-slate-800 shadow-2xl">
              <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-blue-600" />
                  <span className="font-extrabold text-sm text-slate-900 dark:text-white">AttendPro HRMS</span>
                </div>
                <button onClick={() => setIsMobileMenuOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">
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
                          "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-semibold transition-colors",
                          isActive
                            ? "bg-blue-600 text-white font-bold shadow-xs"
                            : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
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
