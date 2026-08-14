import prisma from "../config/database";
import { AppError } from "../utils/response";
import {
  CreateLeaveTypeInput,
  UpdateLeaveTypeInput,
  CreateLeaveRequestInput,
  ManagerApprovalInput,
  AdminApprovalInput,
  GetLeaveRequestsQuery,
  UpdateLeaveBalanceInput,
} from "../validators/leave.validator";
import { toEthiopianDateString } from "../utils/ethiopian-time";

const leaveRequestSelect = {
  id: true,
  userId: true,
  leaveTypeId: true,
  startDate: true,
  endDate: true,
  totalDays: true,
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
      departmentRef: { select: { id: true, name: true, code: true } },
      position: { select: { id: true, title: true } },
    },
  },
  leaveType: {
    select: {
      id: true,
      code: true,
      name: true,
      isPaid: true,
    },
  },
  manager: {
    select: {
      id: true,
      name: true,
      employeeId: true,
    },
  },
  approvedBy: {
    select: {
      id: true,
      name: true,
      employeeId: true,
    },
  },
};

const formatRequest = (req: any) => ({
  ...req,
  totalDays: Number(req.totalDays),
  startDate: req.startDate ? req.startDate.toISOString().split("T")[0] : null,
  endDate: req.endDate ? req.endDate.toISOString().split("T")[0] : null,
});

const calculateWorkingDays = (start: Date, end: Date): number => {
  let count = 0;
  const cur = new Date(start);
  while (cur <= end) {
    const day = cur.getDay();
    if (day !== 0 && day !== 6) {
      count++;
    }
    cur.setDate(cur.getDate() + 1);
  }
  return count > 0 ? count : 1;
};

export const leaveService = {
  // --- LEAVE TYPES ---
  async getLeaveTypes(includeInactive = false) {
    const where = includeInactive ? {} : { isActive: true };
    const types = await prisma.leaveType.findMany({
      where,
      orderBy: { name: "asc" },
    });
    return types.map((t) => ({ ...t, defaultDaysPerYear: Number(t.defaultDaysPerYear) }));
  },

  async createLeaveType(data: CreateLeaveTypeInput) {
    const code = data.code.toUpperCase().trim();
    const existing = await prisma.leaveType.findUnique({ where: { code } });
    if (existing) {
      throw new AppError(400, "Leave type code already exists", undefined, "DUPLICATE_CODE");
    }

    const leaveType = await prisma.leaveType.create({
      data: {
        code,
        name: data.name.trim(),
        description: data.description?.trim() || null,
        defaultDaysPerYear: data.defaultDaysPerYear,
        isPaid: data.isPaid ?? true,
        requiresApproval: data.requiresApproval ?? true,
        isActive: data.isActive ?? true,
      },
    });

    return { ...leaveType, defaultDaysPerYear: Number(leaveType.defaultDaysPerYear) };
  },

  async updateLeaveType(id: string, data: UpdateLeaveTypeInput) {
    const existing = await prisma.leaveType.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError(404, "Leave type not found", undefined, "LEAVE_TYPE_NOT_FOUND");
    }

    if (data.code && data.code.toUpperCase() !== existing.code) {
      const duplicate = await prisma.leaveType.findUnique({ where: { code: data.code.toUpperCase() } });
      if (duplicate) {
        throw new AppError(400, "Leave type code already exists", undefined, "DUPLICATE_CODE");
      }
    }

    const updated = await prisma.leaveType.update({
      where: { id },
      data: {
        ...(data.code && { code: data.code.toUpperCase().trim() }),
        ...(data.name && { name: data.name.trim() }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.defaultDaysPerYear !== undefined && { defaultDaysPerYear: data.defaultDaysPerYear }),
        ...(data.isPaid !== undefined && { isPaid: data.isPaid }),
        ...(data.requiresApproval !== undefined && { requiresApproval: data.requiresApproval }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
    });

    return { ...updated, defaultDaysPerYear: Number(updated.defaultDaysPerYear) };
  },

  // --- LEAVE BALANCES ---
  async getOrCreateUserBalances(userId: string, year: number) {
    const leaveTypes = await prisma.leaveType.findMany({ where: { isActive: true } });
    const existingBalances = await prisma.leaveBalance.findMany({
      where: { userId, year },
      include: { leaveType: true },
    });

    const existingTypeIds = new Set(existingBalances.map((b) => b.leaveTypeId));

    for (const lt of leaveTypes) {
      if (!existingTypeIds.has(lt.id)) {
        await prisma.leaveBalance.create({
          data: {
            userId,
            leaveTypeId: lt.id,
            year,
            allocatedDays: lt.defaultDaysPerYear,
            usedDays: 0,
            pendingDays: 0,
          },
        });
      }
    }

    const allBalances = await prisma.leaveBalance.findMany({
      where: { userId, year },
      include: { leaveType: true },
    });

    return allBalances.map((b) => {
      const allocated = Number(b.allocatedDays);
      const used = Number(b.usedDays);
      const pending = Number(b.pendingDays);
      const remaining = Math.max(0, allocated - used - pending);
      return {
        id: b.id,
        userId: b.userId,
        leaveTypeId: b.leaveTypeId,
        leaveTypeName: b.leaveType.name,
        leaveTypeCode: b.leaveType.code,
        isPaid: b.leaveType.isPaid,
        year: b.year,
        allocatedDays: allocated,
        usedDays: used,
        pendingDays: pending,
        remainingDays: remaining,
      };
    });
  },

  async updateLeaveBalance(data: UpdateLeaveBalanceInput) {
    const { userId, leaveTypeId, year, allocatedDays } = data;

    const balance = await prisma.leaveBalance.upsert({
      where: { userId_leaveTypeId_year: { userId, leaveTypeId, year } },
      update: { allocatedDays },
      create: {
        userId,
        leaveTypeId,
        year,
        allocatedDays,
        usedDays: 0,
        pendingDays: 0,
      },
      include: { leaveType: true },
    });

    const allocated = Number(balance.allocatedDays);
    const used = Number(balance.usedDays);
    const pending = Number(balance.pendingDays);
    const remaining = Math.max(0, allocated - used - pending);

    return {
      ...balance,
      allocatedDays: allocated,
      usedDays: used,
      pendingDays: pending,
      remainingDays: remaining,
    };
  },

  // --- LEAVE REQUESTS ---
  async submitLeaveRequest(userId: string, data: CreateLeaveRequestInput) {
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);

    if (start > end) {
      throw new AppError(400, "Start date must be before or equal to end date", undefined, "INVALID_DATE_RANGE");
    }

    const totalDays = calculateWorkingDays(start, end);
    const year = start.getFullYear();

    const leaveType = await prisma.leaveType.findUnique({ where: { id: data.leaveTypeId } });
    if (!leaveType || !leaveType.isActive) {
      throw new AppError(400, "Invalid or inactive leave type", undefined, "INVALID_LEAVE_TYPE");
    }

    const balances = await this.getOrCreateUserBalances(userId, year);
    const targetBal = balances.find((b) => b.leaveTypeId === data.leaveTypeId);

    if (targetBal && targetBal.remainingDays < totalDays) {
      throw new AppError(
        400,
        `Insufficient leave balance. Remaining: ${targetBal.remainingDays} days, Requested: ${totalDays} days.`,
        undefined,
        "INSUFFICIENT_BALANCE"
      );
    }

    const applicant = await prisma.user.findUnique({ where: { id: userId } });
    if (!applicant) {
      throw new AppError(404, "User not found", undefined, "USER_NOT_FOUND");
    }

    const request = await prisma.leaveRequest.create({
      data: {
        userId,
        leaveTypeId: data.leaveTypeId,
        startDate: start,
        endDate: end,
        totalDays,
        reason: data.reason.trim(),
        status: "PENDING",
        managerId: applicant.managerId || null,
      },
      select: leaveRequestSelect,
    });

    // Update pending days on balance
    await prisma.leaveBalance.updateMany({
      where: { userId, leaveTypeId: data.leaveTypeId, year },
      data: { pendingDays: { increment: totalDays } },
    });

    return formatRequest(request);
  },

  async getLeaveRequests(params: GetLeaveRequestsQuery) {
    const {
      page = 1,
      limit = 10,
      status,
      departmentId,
      leaveTypeId,
      userId,
      search,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = params;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (status) where.status = status;
    if (leaveTypeId) where.leaveTypeId = leaveTypeId;
    if (userId) where.userId = userId;

    if (departmentId) {
      where.user = { departmentId };
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
      prisma.leaveRequest.count({ where }),
      prisma.leaveRequest.findMany({
        where,
        select: leaveRequestSelect,
        orderBy,
        skip,
        take: limit,
      }),
    ]);

    return {
      requests: requests.map(formatRequest),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  async getLeaveRequestById(id: string) {
    const request = await prisma.leaveRequest.findUnique({
      where: { id },
      select: leaveRequestSelect,
    });

    if (!request) {
      throw new AppError(404, "Leave request not found", undefined, "REQUEST_NOT_FOUND");
    }

    return formatRequest(request);
  },

  async approveByManager(requestId: string, managerId: string, input: ManagerApprovalInput) {
    const request = await prisma.leaveRequest.findUnique({ where: { id: requestId } });
    if (!request) {
      throw new AppError(404, "Leave request not found", undefined, "REQUEST_NOT_FOUND");
    }

    if (request.status !== "PENDING") {
      throw new AppError(400, `Cannot process request with status ${request.status}`, undefined, "INVALID_STATUS");
    }

    const action = input.action;
    const comment = input.comment?.trim() || null;

    if (action === "REJECT") {
      const updated = await prisma.leaveRequest.update({
        where: { id: requestId },
        data: {
          status: "REJECTED",
          managerId,
          managerComment: comment,
        },
        select: leaveRequestSelect,
      });

      // Restore pending days
      const year = new Date(request.startDate).getFullYear();
      await prisma.leaveBalance.updateMany({
        where: { userId: request.userId, leaveTypeId: request.leaveTypeId, year },
        data: { pendingDays: { decrement: request.totalDays } },
      });

      return formatRequest(updated);
    }

    // Manager Approval
    const updated = await prisma.leaveRequest.update({
      where: { id: requestId },
      data: {
        status: "APPROVED_BY_MANAGER",
        managerId,
        managerComment: comment,
      },
      select: leaveRequestSelect,
    });

    return formatRequest(updated);
  },

  async approveByAdmin(requestId: string, adminId: string, input: AdminApprovalInput) {
    const request = await prisma.leaveRequest.findUnique({
      where: { id: requestId },
      include: { leaveType: true },
    });

    if (!request) {
      throw new AppError(404, "Leave request not found", undefined, "REQUEST_NOT_FOUND");
    }

    if (request.status === "APPROVED" || request.status === "REJECTED" || request.status === "CANCELLED") {
      throw new AppError(400, `Request is already ${request.status}`, undefined, "INVALID_STATUS");
    }

    const action = input.action;
    const comment = input.comment?.trim() || null;
    const totalDays = Number(request.totalDays);
    const year = new Date(request.startDate).getFullYear();

    if (action === "REJECT") {
      const updated = await prisma.leaveRequest.update({
        where: { id: requestId },
        data: {
          status: "REJECTED",
          approvedById: adminId,
          adminComment: comment,
        },
        select: leaveRequestSelect,
      });

      // Decrement pending days
      await prisma.leaveBalance.updateMany({
        where: { userId: request.userId, leaveTypeId: request.leaveTypeId, year },
        data: { pendingDays: { decrement: totalDays } },
      });

      return formatRequest(updated);
    }

    // Final Approval: APPROVED
    const updated = await prisma.leaveRequest.update({
      where: { id: requestId },
      data: {
        status: "APPROVED",
        approvedById: adminId,
        adminComment: comment,
      },
      select: leaveRequestSelect,
    });

    // Update Balance: Decrement pending, Increment used
    await prisma.leaveBalance.updateMany({
      where: { userId: request.userId, leaveTypeId: request.leaveTypeId, year },
      data: {
        pendingDays: { decrement: totalDays },
        usedDays: { increment: totalDays },
      },
    });

    // Sync Attendance: Mark date range as ON_LEAVE
    const cur = new Date(request.startDate);
    const end = new Date(request.endDate);

    while (cur <= end) {
      const dateStr = cur.toISOString().split("T")[0];
      const ethDate = toEthiopianDateString(cur);

      await prisma.attendance.upsert({
        where: { userId_date: { userId: request.userId, date: cur } },
        update: { status: "ON_LEAVE" },
        create: {
          userId: request.userId,
          date: cur,
          ethiopianDate: ethDate,
          status: "ON_LEAVE",
        },
      });

      cur.setDate(cur.getDate() + 1);
    }

    return formatRequest(updated);
  },

  async cancelLeaveRequest(requestId: string, userId: string) {
    const request = await prisma.leaveRequest.findUnique({ where: { id: requestId } });
    if (!request) {
      throw new AppError(404, "Leave request not found", undefined, "REQUEST_NOT_FOUND");
    }

    if (request.userId !== userId) {
      throw new AppError(403, "You can only cancel your own leave requests", undefined, "FORBIDDEN");
    }

    if (request.status === "CANCELLED" || request.status === "REJECTED") {
      throw new AppError(400, "Request is already cancelled or rejected", undefined, "INVALID_STATUS");
    }

    const totalDays = Number(request.totalDays);
    const year = new Date(request.startDate).getFullYear();

    if (request.status === "PENDING" || request.status === "APPROVED_BY_MANAGER") {
      await prisma.leaveBalance.updateMany({
        where: { userId, leaveTypeId: request.leaveTypeId, year },
        data: { pendingDays: { decrement: totalDays } },
      });
    } else if (request.status === "APPROVED") {
      // Revert used days if approved request is cancelled
      await prisma.leaveBalance.updateMany({
        where: { userId, leaveTypeId: request.leaveTypeId, year },
        data: { usedDays: { decrement: totalDays } },
      });
    }

    const updated = await prisma.leaveRequest.update({
      where: { id: requestId },
      data: { status: "CANCELLED" },
      select: leaveRequestSelect,
    });

    return formatRequest(updated);
  },

  // --- CALENDAR & REPORTS ---
  async getLeaveCalendar(year: number, month: number, departmentId?: string) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const where: any = {
      status: "APPROVED",
      startDate: { lte: endDate },
      endDate: { gte: startDate },
    };

    if (departmentId) {
      where.user = { departmentId };
    }

    const requests = await prisma.leaveRequest.findMany({
      where,
      select: leaveRequestSelect,
      orderBy: { startDate: "asc" },
    });

    return requests.map(formatRequest);
  },

  async getLeaveReports(year: number, departmentId?: string) {
    const where: any = { year };
    if (departmentId) {
      where.user = { departmentId };
    }

    const balances = await prisma.leaveBalance.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, employeeId: true, department: true } },
        leaveType: true,
      },
    });

    const leaveTypes = await prisma.leaveType.findMany({ where: { isActive: true } });

    const totalAllocated = balances.reduce((acc, b) => acc + Number(b.allocatedDays), 0);
    const totalUsed = balances.reduce((acc, b) => acc + Number(b.usedDays), 0);
    const totalPending = balances.reduce((acc, b) => acc + Number(b.pendingDays), 0);

    return {
      year,
      summary: {
        totalAllocated,
        totalUsed,
        totalPending,
        totalRemaining: Math.max(0, totalAllocated - totalUsed - totalPending),
      },
      leaveTypes: leaveTypes.map((lt) => ({
        id: lt.id,
        code: lt.code,
        name: lt.name,
      })),
      userBalances: balances.map((b) => ({
        userId: b.userId,
        userName: b.user.name,
        employeeId: b.user.employeeId,
        department: b.user.department,
        leaveTypeId: b.leaveTypeId,
        leaveTypeName: b.leaveType.name,
        allocatedDays: Number(b.allocatedDays),
        usedDays: Number(b.usedDays),
        pendingDays: Number(b.pendingDays),
        remainingDays: Math.max(0, Number(b.allocatedDays) - Number(b.usedDays) - Number(b.pendingDays)),
      })),
    };
  },

  async getDepartmentLeaveReports(year: number, departmentId?: string) {
    const where: any = { year };
    if (departmentId) {
      where.user = { departmentId };
    }

    const balances = await prisma.leaveBalance.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            departmentId: true,
            department: true,
            departmentRef: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
          },
        },
      },
    });

    const deptMap = new Map<
      string,
      {
        departmentId: string | null;
        departmentName: string;
        departmentCode: string | null;
        userIds: Set<string>;
        totalAllocated: number;
        totalUsed: number;
        totalPending: number;
      }
    >();

    for (const b of balances) {
      const deptId = b.user.departmentId || null;
      const deptName = b.user.departmentRef?.name || b.user.department || "Unassigned";
      const deptCode = b.user.departmentRef?.code || null;
      const key = deptId || deptName;

      if (!deptMap.has(key)) {
        deptMap.set(key, {
          departmentId: deptId,
          departmentName: deptName,
          departmentCode: deptCode,
          userIds: new Set<string>(),
          totalAllocated: 0,
          totalUsed: 0,
          totalPending: 0,
        });
      }

      const entry = deptMap.get(key)!;
      entry.userIds.add(b.userId);
      entry.totalAllocated += Number(b.allocatedDays);
      entry.totalUsed += Number(b.usedDays);
      entry.totalPending += Number(b.pendingDays);
    }

    const departments = Array.from(deptMap.values()).map((dept) => {
      const remaining = Math.max(0, dept.totalAllocated - dept.totalUsed - dept.totalPending);
      return {
        departmentId: dept.departmentId,
        departmentName: dept.departmentName,
        departmentCode: dept.departmentCode,
        employeeCount: dept.userIds.size,
        totalAllocated: dept.totalAllocated,
        totalUsed: dept.totalUsed,
        totalPending: dept.totalPending,
        totalRemaining: remaining,
      };
    });

    departments.sort((a, b) => a.departmentName.localeCompare(b.departmentName));

    const totalEmployees = new Set(balances.map((b) => b.userId)).size;
    const totalAllocated = departments.reduce((acc, d) => acc + d.totalAllocated, 0);
    const totalUsed = departments.reduce((acc, d) => acc + d.totalUsed, 0);
    const totalPending = departments.reduce((acc, d) => acc + d.totalPending, 0);
    const totalRemaining = departments.reduce((acc, d) => acc + d.totalRemaining, 0);

    return {
      year,
      summary: {
        totalDepartments: departments.length,
        totalEmployees,
        totalAllocated,
        totalUsed,
        totalPending,
        totalRemaining,
      },
      departments,
    };
  },
};
