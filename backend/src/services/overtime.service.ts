import prisma from "../config/database";
import { AppError } from "../utils/response";
import { OvertimeCategory, OvertimeStatus } from "@prisma/client";
import {
  CreateOvertimeInput,
  ManagerApprovalInput,
  AdminApprovalInput,
  GetOvertimeRequestsQuery,
} from "../validators/overtime.validator";

const CATEGORY_MULTIPLIER_MAP: Record<OvertimeCategory, number> = {
  NORMAL_DAY: 1.5,
  WEEKEND: 2.0,
  PUBLIC_HOLIDAY: 2.5,
  NIGHT_SHIFT: 1.75,
};

const calculateOvertimeHours = (startTime: string, endTime: string): number => {
  const [startH, startM] = startTime.split(":").map(Number);
  const [endH, endM] = endTime.split(":").map(Number);

  let startMinutes = startH * 60 + startM;
  let endMinutes = endH * 60 + endM;

  if (endMinutes <= startMinutes) {
    // Overnight shift crossing midnight
    endMinutes += 24 * 60;
  }

  const diffMinutes = endMinutes - startMinutes;
  const hours = diffMinutes / 60;
  return Math.round(hours * 100) / 100;
};

const overtimeSelect = {
  id: true,
  userId: true,
  date: true,
  startTime: true,
  endTime: true,
  totalHours: true,
  category: true,
  multiplierRate: true,
  reason: true,
  status: true,
  managerId: true,
  managerComment: true,
  approvedById: true,
  adminComment: true,
  createdAt: true,
  updatedAt: true,
  user: {
    select: {
      id: true,
      name: true,
      email: true,
      employeeId: true,
      department: true,
      departmentRef: {
        select: { id: true, name: true, code: true },
      },
      position: {
        select: { id: true, title: true },
      },
    },
  },
  manager: {
    select: { id: true, name: true, employeeId: true },
  },
  approvedBy: {
    select: { id: true, name: true, employeeId: true },
  },
};

const formatOvertimeRequest = (req: any) => ({
  ...req,
  date: req.date ? req.date.toISOString().split("T")[0] : null,
  totalHours: Number(req.totalHours),
  multiplierRate: Number(req.multiplierRate),
  createdAt: req.createdAt ? req.createdAt.toISOString() : null,
  updatedAt: req.updatedAt ? req.updatedAt.toISOString() : null,
});

export const overtimeService = {
  async submitOvertimeRequest(userId: string, data: CreateOvertimeInput) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new AppError(404, "User not found", undefined, "USER_NOT_FOUND");
    }

    const dateObj = new Date(data.date);
    const totalHours = calculateOvertimeHours(data.startTime, data.endTime);

    if (totalHours <= 0) {
      throw new AppError(400, "Invalid overtime duration", undefined, "INVALID_DURATION");
    }

    const existingPending = await prisma.overtimeRequest.findFirst({
      where: {
        userId,
        date: dateObj,
        status: { in: ["PENDING", "APPROVED_BY_MANAGER", "APPROVED"] },
      },
    });

    if (existingPending) {
      throw new AppError(
        400,
        "An active or approved overtime request already exists for this date",
        undefined,
        "DUPLICATE_OVERTIME_REQUEST"
      );
    }

    const multiplierRate = CATEGORY_MULTIPLIER_MAP[data.category] || 1.5;

    const request = await prisma.overtimeRequest.create({
      data: {
        userId,
        date: dateObj,
        startTime: data.startTime,
        endTime: data.endTime,
        totalHours,
        category: data.category,
        multiplierRate,
        reason: data.reason.trim(),
        status: "PENDING",
        managerId: user.managerId || null,
      },
      select: overtimeSelect,
    });

    return formatOvertimeRequest(request);
  },

  async getOvertimeRequests(params: GetOvertimeRequestsQuery) {
    const {
      page = 1,
      limit = 10,
      status,
      departmentId,
      userId,
      startDate,
      endDate,
      search,
      sortBy = "date",
      sortOrder = "desc",
    } = params;

    const skip = (page - 1) * limit;
    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (userId) {
      where.userId = userId;
    }

    if (departmentId) {
      where.user = { departmentId };
    }

    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }

    if (search) {
      where.OR = [
        { reason: { contains: search } },
        { user: { name: { contains: search } } },
        { user: { employeeId: { contains: search } } },
      ];
    }

    const orderBy = { [sortBy]: sortOrder };

    const [total, requests] = await Promise.all([
      prisma.overtimeRequest.count({ where }),
      prisma.overtimeRequest.findMany({
        where,
        select: overtimeSelect,
        orderBy,
        skip,
        take: limit,
      }),
    ]);

    return {
      requests: requests.map(formatOvertimeRequest),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  async getOvertimeRequestById(id: string) {
    const request = await prisma.overtimeRequest.findUnique({
      where: { id },
      select: overtimeSelect,
    });

    if (!request) {
      throw new AppError(404, "Overtime request not found", undefined, "NOT_FOUND");
    }

    return formatOvertimeRequest(request);
  },

  async approveByManager(requestId: string, managerId: string, data: ManagerApprovalInput) {
    const request = await prisma.overtimeRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      throw new AppError(404, "Overtime request not found", undefined, "NOT_FOUND");
    }

    if (request.status !== "PENDING") {
      throw new AppError(400, `Cannot process request with status ${request.status}`, undefined, "INVALID_STATUS");
    }

    const updated = await prisma.overtimeRequest.update({
      where: { id: requestId },
      data: {
        status: data.action === "APPROVE" ? "APPROVED_BY_MANAGER" : "REJECTED",
        managerId,
        managerComment: data.comment?.trim() || null,
      },
      select: overtimeSelect,
    });

    return formatOvertimeRequest(updated);
  },

  async approveByAdmin(requestId: string, adminId: string, data: AdminApprovalInput) {
    const request = await prisma.overtimeRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      throw new AppError(404, "Overtime request not found", undefined, "NOT_FOUND");
    }

    if (request.status === "CANCELLED" || request.status === "REJECTED") {
      throw new AppError(400, `Cannot approve a ${request.status.toLowerCase()} request`, undefined, "INVALID_STATUS");
    }

    const updated = await prisma.overtimeRequest.update({
      where: { id: requestId },
      data: {
        status: data.action === "APPROVE" ? "APPROVED" : "REJECTED",
        approvedById: adminId,
        adminComment: data.comment?.trim() || null,
      },
      select: overtimeSelect,
    });

    return formatOvertimeRequest(updated);
  },

  async cancelOvertimeRequest(requestId: string, userId: string) {
    const request = await prisma.overtimeRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      throw new AppError(404, "Overtime request not found", undefined, "NOT_FOUND");
    }

    if (request.userId !== userId) {
      throw new AppError(403, "You can only cancel your own overtime requests", undefined, "FORBIDDEN");
    }

    if (request.status === "APPROVED" || request.status === "REJECTED") {
      throw new AppError(400, "Cannot cancel a request that has already been finalized", undefined, "INVALID_STATUS");
    }

    const updated = await prisma.overtimeRequest.update({
      where: { id: requestId },
      data: { status: "CANCELLED" },
      select: overtimeSelect,
    });

    return formatOvertimeRequest(updated);
  },

  async getDepartmentOvertimeReports(year: number, month?: number) {
    const startDate = new Date(year, month ? month - 1 : 0, 1);
    const endDate = new Date(year, month ? month : 12, 0);

    const requests = await prisma.overtimeRequest.findMany({
      where: {
        date: { gte: startDate, lte: endDate },
      },
      include: {
        user: {
          select: {
            id: true,
            departmentId: true,
            department: true,
            departmentRef: { select: { id: true, name: true, code: true } },
          },
        },
      },
    });

    const deptMap = new Map<string, {
      departmentId: string | null;
      departmentName: string;
      departmentCode: string | null;
      userIds: Set<string>;
      totalRequests: number;
      approvedHours: number;
      pendingHours: number;
      weightedPayrollHours: number;
    }>();

    for (const req of requests) {
      const deptId = req.user.departmentId || null;
      const deptName = req.user.departmentRef?.name || req.user.department || "Unassigned";
      const deptCode = req.user.departmentRef?.code || null;
      const key = deptId || deptName;

      if (!deptMap.has(key)) {
        deptMap.set(key, {
          departmentId: deptId,
          departmentName: deptName,
          departmentCode: deptCode,
          userIds: new Set(),
          totalRequests: 0,
          approvedHours: 0,
          pendingHours: 0,
          weightedPayrollHours: 0,
        });
      }

      const entry = deptMap.get(key)!;
      entry.userIds.add(req.userId);
      entry.totalRequests += 1;

      const hours = Number(req.totalHours);
      const rate = Number(req.multiplierRate);

      if (req.status === "APPROVED") {
        entry.approvedHours += hours;
        entry.weightedPayrollHours += hours * rate;
      } else if (req.status === "PENDING" || req.status === "APPROVED_BY_MANAGER") {
        entry.pendingHours += hours;
      }
    }

    const departments = Array.from(deptMap.values()).map((d) => ({
      departmentId: d.departmentId,
      departmentName: d.departmentName,
      departmentCode: d.departmentCode,
      employeeCount: d.userIds.size,
      totalRequests: d.totalRequests,
      approvedHours: Math.round(d.approvedHours * 100) / 100,
      pendingHours: Math.round(d.pendingHours * 100) / 100,
      weightedPayrollHours: Math.round(d.weightedPayrollHours * 100) / 100,
    }));

    departments.sort((a, b) => b.approvedHours - a.approvedHours);

    return {
      year,
      month: month || null,
      departments,
    };
  },

  async getMonthlyOvertimeReports(year: number, month?: number) {
    const targetMonth = month || new Date().getMonth() + 1;
    const startDate = new Date(year, targetMonth - 1, 1);
    const endDate = new Date(year, targetMonth, 0);

    const requests = await prisma.overtimeRequest.findMany({
      where: {
        date: { gte: startDate, lte: endDate },
      },
      select: overtimeSelect,
      orderBy: { date: "desc" },
    });

    const formatted = requests.map(formatOvertimeRequest);

    const totalApprovedHours = formatted
      .filter((r) => r.status === "APPROVED")
      .reduce((acc, r) => acc + r.totalHours, 0);

    const totalWeightedHours = formatted
      .filter((r) => r.status === "APPROVED")
      .reduce((acc, r) => acc + r.totalHours * r.multiplierRate, 0);

    return {
      year,
      month: targetMonth,
      summary: {
        totalRequests: formatted.length,
        approvedRequests: formatted.filter((r) => r.status === "APPROVED").length,
        pendingRequests: formatted.filter((r) => r.status === "PENDING" || r.status === "APPROVED_BY_MANAGER").length,
        rejectedRequests: formatted.filter((r) => r.status === "REJECTED").length,
        totalApprovedHours: Math.round(totalApprovedHours * 100) / 100,
        totalWeightedHours: Math.round(totalWeightedHours * 100) / 100,
      },
      requests: formatted,
    };
  },

  async getAdminOvertimeMetrics() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const requests = await prisma.overtimeRequest.findMany({
      where: {
        date: { gte: startOfMonth, lte: endOfMonth },
      },
      include: {
        user: { select: { department: true, departmentRef: { select: { name: true } } } },
      },
    });

    const pendingRequestsCount = await prisma.overtimeRequest.count({
      where: { status: { in: ["PENDING", "APPROVED_BY_MANAGER"] } },
    });

    let totalApprovedHours = 0;
    let totalWeightedHours = 0;
    const deptHoursMap = new Map<string, number>();

    for (const req of requests) {
      if (req.status === "APPROVED") {
        const hours = Number(req.totalHours);
        const rate = Number(req.multiplierRate);
        totalApprovedHours += hours;
        totalWeightedHours += hours * rate;

        const deptName = req.user.departmentRef?.name || req.user.department || "Unassigned";
        deptHoursMap.set(deptName, (deptHoursMap.get(deptName) || 0) + hours);
      }
    }

    let topDepartment = "N/A";
    let topDepartmentHours = 0;
    for (const [dept, hours] of deptHoursMap.entries()) {
      if (hours > topDepartmentHours) {
        topDepartmentHours = hours;
        topDepartment = dept;
      }
    }

    return {
      pendingRequestsCount,
      totalApprovedHoursThisMonth: Math.round(totalApprovedHours * 100) / 100,
      totalWeightedHoursThisMonth: Math.round(totalWeightedHours * 100) / 100,
      topDepartmentThisMonth: topDepartment,
      topDepartmentHoursThisMonth: Math.round(topDepartmentHours * 100) / 100,
    };
  },
};
