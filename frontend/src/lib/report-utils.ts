import { Attendance, AttendanceStatus, User } from "@/types";
import { formatTime, formatStatusLabel } from "@/lib/utils";

export type ReportType =
  | "daily"
  | "weekly"
  | "monthly"
  | "custom"
  | "employee"
  | "department"
  | "late"
  | "absent";

export interface DateRange {
  startDate: string;
  endDate: string;
  label: string;
}

export interface ReportSummary {
  totalEmployees: number;
  present: number;
  late: number;
  absent: number;
  halfDay: number;
  lunchMissing: number;
  attendancePercentage: number;
}

export interface ReportRow {
  employeeId: string;
  name: string;
  department: string;
  date: string;
  morningIn: string;
  lunchOut: string;
  lunchReturn: string;
  finalOut: string;
  status: string;
  workedHours: string;
}

export interface TrendDay {
  date: string;
  label: string;
  present: number;
  late: number;
  absent: number;
  total: number;
}

export interface DepartmentStat {
  department: string;
  present: number;
  late: number;
  absent: number;
  total: number;
  percentage: number;
}

export interface LateEmployee {
  name: string;
  employeeId: string;
  department: string;
  lateCount: number;
}

export interface ReportAnalytics {
  trend: TrendDay[];
  monthlyDays: TrendDay[];
  departments: DepartmentStat[];
  avgCheckIn: string;
  avgCheckOut: string;
  topLateEmployees: LateEmployee[];
}

export const REPORT_TYPE_LABELS: Record<ReportType, string> = {
  daily: "Daily Attendance Report",
  weekly: "Weekly Report",
  monthly: "Monthly Report",
  custom: "Custom Date Range Report",
  employee: "Employee Attendance Report",
  department: "Department Attendance Report",
  late: "Late Employees Report",
  absent: "Absent Employees Report",
};

export const COMPANY_NAME = "AttendPro";

function toDateStr(d: Date): string {
  return d.toISOString().split("T")[0];
}

export function getDateRangeForReportType(
  type: ReportType,
  customStart?: string,
  customEnd?: string
): DateRange {
  const today = new Date();
  const todayStr = toDateStr(today);

  switch (type) {
    case "daily":
      return { startDate: todayStr, endDate: todayStr, label: "Today" };
    case "weekly": {
      const day = today.getDay();
      const diff = today.getDate() - day + (day === 0 ? -6 : 1);
      const start = new Date(today);
      start.setDate(diff);
      return {
        startDate: toDateStr(start),
        endDate: todayStr,
        label: "This Week",
      };
    }
    case "monthly": {
      const start = new Date(today.getFullYear(), today.getMonth(), 1);
      return {
        startDate: toDateStr(start),
        endDate: todayStr,
        label: "This Month",
      };
    }
    case "custom":
      return {
        startDate: customStart || todayStr,
        endDate: customEnd || todayStr,
        label: `${customStart || todayStr} – ${customEnd || todayStr}`,
      };
    default:
      return { startDate: todayStr, endDate: todayStr, label: "Today" };
  }
}

export function calculateWorkedHours(a: Attendance): string {
  if (!a.morningIn || !a.finalOut) return "—";
  const start = new Date(a.morningIn).getTime();
  const end = new Date(a.finalOut).getTime();
  let diff = end - start;
  if (a.lunchOut && a.lunchReturn) {
    const lOut = new Date(a.lunchOut).getTime();
    const lReturn = new Date(a.lunchReturn).getTime();
    if (lReturn > lOut) diff -= lReturn - lOut;
  }
  const hours = diff / (1000 * 60 * 60);
  if (hours < 0) return "—";
  return `${hours.toFixed(1)} hrs`;
}

export function attendanceToRow(a: Attendance): ReportRow {
  return {
    employeeId: a.user?.employeeId || "—",
    name: a.user?.name || "—",
    department: a.user?.department || "—",
    date: a.ethiopianDateLabel || a.ethiopianDate || a.date?.split("T")[0] || "—",
    morningIn: formatTime(a.morningIn),
    lunchOut: formatTime(a.lunchOut),
    lunchReturn: formatTime(a.lunchReturn),
    finalOut: formatTime(a.finalOut),
    status: formatStatusLabel(a.status),
    workedHours: calculateWorkedHours(a),
  };
}

export function computeReportSummary(
  attendances: Attendance[],
  totalEmployees: number
): ReportSummary {
  const present = attendances.filter((a) => a.status === "PRESENT").length;
  const late = attendances.filter((a) => a.status === "LATE").length;
  const absent = attendances.filter((a) => a.status === "ABSENT").length;
  const halfDay = attendances.filter((a) => a.status === "HALF_DAY").length;
  const lunchMissing = attendances.filter((a) => a.status === "LUNCH_MISSING").length;
  const attended = present + late;
  const total = attendances.length || totalEmployees;
  const attendancePercentage =
    total > 0 ? Math.round((attended / total) * 100) : 0;

  return {
    totalEmployees: totalEmployees || total,
    present,
    late,
    absent,
    halfDay,
    lunchMissing,
    attendancePercentage,
  };
}

export function filterReportData(
  attendances: Attendance[],
  options: {
    search: string;
    department: string;
    status: string;
    employeeId: string;
    reportType: ReportType;
  }
): Attendance[] {
  return attendances.filter((a) => {
    const matchesSearch =
      !options.search ||
      a.user?.name.toLowerCase().includes(options.search.toLowerCase()) ||
      a.user?.employeeId.toLowerCase().includes(options.search.toLowerCase());

    const matchesDept =
      options.department === "ALL" || a.user?.department === options.department;

    const matchesStatus =
      options.status === "ALL" || a.status === options.status;

    const matchesEmployee =
      options.employeeId === "ALL" || a.user?.id === options.employeeId;

    let matchesType = true;
    if (options.reportType === "late") matchesType = a.status === "LATE";
    if (options.reportType === "absent") matchesType = a.status === "ABSENT";

    return matchesSearch && matchesDept && matchesStatus && matchesEmployee && matchesType;
  });
}

function avgTimeFromRecords(
  records: Attendance[],
  field: "morningIn" | "finalOut"
): string {
  const times = records
    .map((a) => a[field])
    .filter(Boolean)
    .map((d) => new Date(d!).getTime());

  if (times.length === 0) return "—";

  const avg = times.reduce((s, t) => s + t, 0) / times.length;
  const date = new Date(avg);
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export function buildTrendForDays(
  attendances: Attendance[],
  days: number
): TrendDay[] {
  const result: TrendDay[] = [];
  const today = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = toDateStr(d);
    const dayRecords = attendances.filter(
      (a) => a.date?.split("T")[0] === dateStr
    );
    result.push({
      date: dateStr,
      label: d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }),
      present: dayRecords.filter((a) => a.status === "PRESENT").length,
      late: dayRecords.filter((a) => a.status === "LATE").length,
      absent: dayRecords.filter((a) => a.status === "ABSENT").length,
      total: dayRecords.length,
    });
  }
  return result;
}

export function buildDepartmentStats(attendances: Attendance[]): DepartmentStat[] {
  const map = new Map<string, { present: number; late: number; absent: number; total: number }>();

  attendances.forEach((a) => {
    const dept = a.user?.department || "Unassigned";
    const current = map.get(dept) || { present: 0, late: 0, absent: 0, total: 0 };
    current.total++;
    if (a.status === "PRESENT") current.present++;
    else if (a.status === "LATE") current.late++;
    else if (a.status === "ABSENT") current.absent++;
    map.set(dept, current);
  });

  return Array.from(map.entries())
    .map(([department, stats]) => ({
      department,
      ...stats,
      percentage:
        stats.total > 0
          ? Math.round(((stats.present + stats.late) / stats.total) * 100)
          : 0,
    }))
    .sort((a, b) => b.total - a.total);
}

export function buildTopLateEmployees(attendances: Attendance[]): LateEmployee[] {
  const map = new Map<string, LateEmployee>();

  attendances
    .filter((a) => a.status === "LATE")
    .forEach((a) => {
      const key = a.userId;
      const existing = map.get(key);
      if (existing) {
        existing.lateCount++;
      } else {
        map.set(key, {
          name: a.user?.name || "Unknown",
          employeeId: a.user?.employeeId || "—",
          department: a.user?.department || "—",
          lateCount: 1,
        });
      }
    });

  return Array.from(map.values())
    .sort((a, b) => b.lateCount - a.lateCount)
    .slice(0, 10);
}

export function buildAnalytics(
  attendances: Attendance[],
  trendAttendances: Attendance[]
): ReportAnalytics {
  const today = new Date();
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const monthRecords = attendances.filter((a) => {
    const d = new Date(a.date);
    return d >= monthStart && d <= today;
  });

  const daysInMonth = today.getDate();
  const monthlyDays: TrendDay[] = [];
  for (let i = 1; i <= daysInMonth; i++) {
    const d = new Date(today.getFullYear(), today.getMonth(), i);
    const dateStr = toDateStr(d);
    const dayRecords = monthRecords.filter(
      (a) => a.date?.split("T")[0] === dateStr
    );
    monthlyDays.push({
      date: dateStr,
      label: String(i),
      present: dayRecords.filter((a) => a.status === "PRESENT").length,
      late: dayRecords.filter((a) => a.status === "LATE").length,
      absent: dayRecords.filter((a) => a.status === "ABSENT").length,
      total: dayRecords.length,
    });
  }

  return {
    trend: buildTrendForDays(trendAttendances, 7),
    monthlyDays,
    departments: buildDepartmentStats(attendances),
    avgCheckIn: avgTimeFromRecords(attendances, "morningIn"),
    avgCheckOut: avgTimeFromRecords(attendances, "finalOut"),
    topLateEmployees: buildTopLateEmployees(attendances),
  };
}

export function extractDepartments(attendances: Attendance[]): string[] {
  const depts = new Set<string>();
  attendances.forEach((a) => {
    if (a.user?.department) depts.add(a.user.department);
  });
  return Array.from(depts).sort();
}

export function extractEmployees(attendances: Attendance[]): Pick<User, "id" | "name" | "employeeId">[] {
  const map = new Map<string, Pick<User, "id" | "name" | "employeeId">>();
  attendances.forEach((a) => {
    if (a.user?.id) {
      map.set(a.user.id, {
        id: a.user.id,
        name: a.user.name,
        employeeId: a.user.employeeId,
      });
    }
  });
  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
}

export function buildAttendanceQuery(range: DateRange): string {
  if (range.startDate === range.endDate) {
    return `?date=${range.startDate}`;
  }
  return `?startDate=${range.startDate}&endDate=${range.endDate}`;
}

export function getTrendDateRange(): DateRange {
  const today = new Date();
  const start = new Date(today);
  start.setDate(start.getDate() - 6);
  return {
    startDate: toDateStr(start),
    endDate: toDateStr(today),
    label: "Last 7 Days",
  };
}

export function getMonthlyDateRange(): DateRange {
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), 1);
  return {
    startDate: toDateStr(start),
    endDate: toDateStr(today),
    label: "This Month",
  };
}
