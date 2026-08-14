import bcrypt from "bcryptjs";
import prisma from "../config/database";
import { AppError } from "../utils/response";
import {
  CreateEmployeeInput,
  UpdateEmployeeInput,
  GetEmployeesQuery,
} from "../validators/employee.validator";

const userSelect = {
  id: true,
  email: true,
  name: true,
  firstName: true,
  middleName: true,
  lastName: true,
  employeeId: true,
  gender: true,
  dateOfBirth: true,
  address: true,
  avatarUrl: true,
  department: true,
  departmentId: true,
  positionId: true,
  managerId: true,
  phone: true,
  hireDate: true,
  employmentType: true,
  employmentStatus: true,
  salary: true,
  role: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
  departmentRef: {
    select: {
      id: true,
      code: true,
      name: true,
      isActive: true,
    },
  },
  position: {
    select: {
      id: true,
      code: true,
      title: true,
      jobLevel: true,
      departmentId: true,
      isActive: true,
    },
  },
  manager: {
    select: {
      id: true,
      name: true,
      employeeId: true,
      email: true,
    },
  },
};

const formatUser = (user: any) => ({
  ...user,
  salary: user.salary !== null && user.salary !== undefined ? Number(user.salary) : null,
  dateOfBirth: user.dateOfBirth ? user.dateOfBirth.toISOString().split("T")[0] : null,
  hireDate: user.hireDate ? user.hireDate.toISOString().split("T")[0] : null,
});

export const employeeService = {
  async getEmployees(params: GetEmployeesQuery) {
    const {
      page = 1,
      limit = 10,
      search,
      departmentId,
      positionId,
      role,
      employmentStatus,
      isActive,
      sortBy = "name",
      sortOrder = "asc",
    } = params;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    if (employmentStatus) {
      where.employmentStatus = employmentStatus;
    }

    if (role) {
      where.role = role;
    }

    if (departmentId) {
      where.departmentId = departmentId;
    }

    if (positionId) {
      where.positionId = positionId;
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { firstName: { contains: search } },
        { lastName: { contains: search } },
        { email: { contains: search } },
        { employeeId: { contains: search } },
        { phone: { contains: search } },
      ];
    }

    const orderBy = { [sortBy]: sortOrder };

    const [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        select: userSelect,
        orderBy,
        skip,
        take: limit,
      }),
    ]);

    return {
      employees: users.map(formatUser),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  async getEmployeeById(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        ...userSelect,
        directReports: {
          select: {
            id: true,
            name: true,
            employeeId: true,
            email: true,
          },
        },
        employeeDevices: {
          select: {
            id: true,
            deviceId: true,
            deviceName: true,
            browser: true,
            operatingSystem: true,
            isApproved: true,
            lastUsedAt: true,
          },
        },
        attendances: {
          take: 5,
          orderBy: { date: "desc" },
          select: {
            id: true,
            date: true,
            ethiopianDate: true,
            status: true,
            morningIn: true,
            finalOut: true,
          },
        },
      },
    });

    if (!user) {
      throw new AppError(404, "Employee not found", undefined, "EMPLOYEE_NOT_FOUND");
    }

    return formatUser(user);
  },

  async createEmployee(data: CreateEmployeeInput) {
    const email = data.email.toLowerCase().trim();
    const employeeId = data.employeeId.trim();

    const existingEmail = await prisma.user.findUnique({ where: { email } });
    if (existingEmail) {
      throw new AppError(409, "Email address already registered", undefined, "DUPLICATE_EMAIL");
    }

    const existingEmpId = await prisma.user.findUnique({ where: { employeeId } });
    if (existingEmpId) {
      throw new AppError(409, "Employee ID already exists", undefined, "DUPLICATE_EMPLOYEE_ID");
    }

    let departmentName = "";
    if (data.departmentId) {
      const dept = await prisma.department.findUnique({ where: { id: data.departmentId } });
      if (!dept) {
        throw new AppError(400, "Department not found", undefined, "DEPARTMENT_NOT_FOUND");
      }
      if (!dept.isActive) {
        throw new AppError(400, "Cannot assign employee to an inactive department", undefined, "INACTIVE_DEPARTMENT");
      }
      departmentName = dept.name;
    }

    if (data.positionId) {
      const pos = await prisma.position.findUnique({ where: { id: data.positionId } });
      if (!pos) {
        throw new AppError(400, "Position not found", undefined, "POSITION_NOT_FOUND");
      }
      if (!pos.isActive) {
        throw new AppError(400, "Cannot assign employee to an inactive position", undefined, "INACTIVE_POSITION");
      }
      if (data.departmentId && pos.departmentId !== data.departmentId) {
        throw new AppError(
          400,
          "Selected position does not belong to the selected department",
          undefined,
          "POSITION_DEPARTMENT_MISMATCH"
        );
      }
    }

    if (data.managerId) {
      const manager = await prisma.user.findUnique({ where: { id: data.managerId } });
      if (!manager) {
        throw new AppError(400, "Reporting manager not found", undefined, "MANAGER_NOT_FOUND");
      }
      if (!manager.isActive) {
        throw new AppError(400, "Reporting manager is inactive", undefined, "INACTIVE_MANAGER");
      }
    }

    const firstName = data.firstName?.trim() || null;
    const middleName = data.middleName?.trim() || null;
    const lastName = data.lastName?.trim() || null;

    const computedName =
      [firstName, middleName, lastName].filter(Boolean).join(" ") ||
      data.name?.trim() ||
      email.split("@")[0];

    const hashedPassword = await bcrypt.hash(data.password, 12);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: computedName,
        firstName,
        middleName,
        lastName,
        employeeId,
        gender: data.gender || null,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
        address: data.address?.trim() || null,
        avatarUrl: data.avatarUrl?.trim() || null,
        department: departmentName || null,
        departmentId: data.departmentId || null,
        positionId: data.positionId || null,
        managerId: data.managerId || null,
        phone: data.phone?.trim() || null,
        hireDate: data.hireDate ? new Date(data.hireDate) : null,
        employmentType: data.employmentType || "FULL_TIME",
        employmentStatus: data.employmentStatus || "ACTIVE",
        salary: data.salary !== undefined && data.salary !== null ? data.salary : null,
        role: data.role || "EMPLOYEE",
        isActive: data.isActive ?? true,
      },
      select: userSelect,
    });

    return formatUser(user);
  },

  async updateEmployee(id: string, data: UpdateEmployeeInput) {
    const existing = await prisma.user.findUnique({ where: { id } });

    if (!existing) {
      throw new AppError(404, "Employee not found", undefined, "EMPLOYEE_NOT_FOUND");
    }

    if (data.email && data.email.toLowerCase().trim() !== existing.email) {
      const duplicateEmail = await prisma.user.findUnique({
        where: { email: data.email.toLowerCase().trim() },
      });
      if (duplicateEmail) {
        throw new AppError(409, "Email address already registered", undefined, "DUPLICATE_EMAIL");
      }
    }

    if (data.employeeId && data.employeeId.trim() !== existing.employeeId) {
      const duplicateEmpId = await prisma.user.findUnique({
        where: { employeeId: data.employeeId.trim() },
      });
      if (duplicateEmpId) {
        throw new AppError(409, "Employee ID already exists", undefined, "DUPLICATE_EMPLOYEE_ID");
      }
    }

    const targetDeptId = data.departmentId !== undefined ? data.departmentId : existing.departmentId;
    let departmentName = existing.department;

    if (data.departmentId !== undefined) {
      if (data.departmentId) {
        const dept = await prisma.department.findUnique({ where: { id: data.departmentId } });
        if (!dept) {
          throw new AppError(400, "Department not found", undefined, "DEPARTMENT_NOT_FOUND");
        }
        if (!dept.isActive) {
          throw new AppError(400, "Cannot assign employee to an inactive department", undefined, "INACTIVE_DEPARTMENT");
        }
        departmentName = dept.name;
      } else {
        departmentName = null;
      }
    }

    if (data.positionId !== undefined) {
      if (data.positionId) {
        const pos = await prisma.position.findUnique({ where: { id: data.positionId } });
        if (!pos) {
          throw new AppError(400, "Position not found", undefined, "POSITION_NOT_FOUND");
        }
        if (!pos.isActive) {
          throw new AppError(400, "Cannot assign employee to an inactive position", undefined, "INACTIVE_POSITION");
        }
        if (targetDeptId && pos.departmentId !== targetDeptId) {
          throw new AppError(
            400,
            "Selected position does not belong to the selected department",
            undefined,
            "POSITION_DEPARTMENT_MISMATCH"
          );
        }
      }
    }

    if (data.managerId !== undefined && data.managerId) {
      if (data.managerId === id) {
        throw new AppError(400, "An employee cannot be their own manager", undefined, "INVALID_MANAGER");
      }
      const manager = await prisma.user.findUnique({ where: { id: data.managerId } });
      if (!manager) {
        throw new AppError(400, "Reporting manager not found", undefined, "MANAGER_NOT_FOUND");
      }
      if (!manager.isActive) {
        throw new AppError(400, "Reporting manager is inactive", undefined, "INACTIVE_MANAGER");
      }
    }

    const firstName = data.firstName !== undefined ? (data.firstName?.trim() || null) : existing.firstName;
    const middleName = data.middleName !== undefined ? (data.middleName?.trim() || null) : existing.middleName;
    const lastName = data.lastName !== undefined ? (data.lastName?.trim() || null) : existing.lastName;

    const computedName =
      (firstName || middleName || lastName)
        ? [firstName, middleName, lastName].filter(Boolean).join(" ")
        : data.name
        ? data.name.trim()
        : existing.name;

    let hashedPassword = undefined;
    if (data.password) {
      hashedPassword = await bcrypt.hash(data.password, 12);
    }

    const updated = await prisma.user.update({
      where: { id },
      data: {
        ...(data.email && { email: data.email.toLowerCase().trim() }),
        ...(hashedPassword && { password: hashedPassword }),
        name: computedName,
        ...(data.firstName !== undefined && { firstName }),
        ...(data.middleName !== undefined && { middleName }),
        ...(data.lastName !== undefined && { lastName }),
        ...(data.employeeId && { employeeId: data.employeeId.trim() }),
        ...(data.gender !== undefined && { gender: data.gender }),
        ...(data.dateOfBirth !== undefined && { dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null }),
        ...(data.address !== undefined && { address: data.address }),
        ...(data.avatarUrl !== undefined && { avatarUrl: data.avatarUrl }),
        ...(data.departmentId !== undefined && { departmentId: data.departmentId, department: departmentName }),
        ...(data.positionId !== undefined && { positionId: data.positionId }),
        ...(data.managerId !== undefined && { managerId: data.managerId }),
        ...(data.phone !== undefined && { phone: data.phone }),
        ...(data.hireDate !== undefined && { hireDate: data.hireDate ? new Date(data.hireDate) : null }),
        ...(data.employmentType && { employmentType: data.employmentType }),
        ...(data.employmentStatus && { employmentStatus: data.employmentStatus }),
        ...(data.salary !== undefined && { salary: data.salary }),
        ...(data.role && { role: data.role }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
      select: userSelect,
    });

    return formatUser(updated);
  },

  async deleteEmployee(id: string) {
    const existing = await prisma.user.findUnique({
      where: { id },
      include: {
        _count: {
          select: { attendances: true },
        },
      },
    });

    if (!existing) {
      throw new AppError(404, "Employee not found", undefined, "EMPLOYEE_NOT_FOUND");
    }

    // If employee has historical attendance records, soft-deactivate to preserve records
    if (existing._count.attendances > 0) {
      await prisma.user.update({
        where: { id },
        data: {
          isActive: false,
          employmentStatus: "INACTIVE",
        },
      });
      return { id, message: "Employee deactivated successfully (attendance history preserved)" };
    }

    await prisma.user.delete({ where: { id } });
    return { id, message: "Employee record deleted successfully" };
  },
};
