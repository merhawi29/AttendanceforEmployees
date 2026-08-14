import prisma from "../config/database";
import { AppError } from "../utils/response";
import {
  CreateDepartmentInput,
  UpdateDepartmentInput,
  GetDepartmentsQuery,
} from "../validators/department.validator";

const departmentSelect = {
  id: true,
  code: true,
  name: true,
  description: true,
  managerId: true,
  parentDepartmentId: true,
  costCenterCode: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
  head: {
    select: {
      id: true,
      name: true,
      email: true,
      employeeId: true,
    },
  },
  parentDepartment: {
    select: {
      id: true,
      code: true,
      name: true,
    },
  },
  _count: {
    select: {
      members: true,
      subDepartments: true,
    },
  },
};

export const departmentService = {
  async getDepartments(params: GetDepartmentsQuery) {
    const { page = 1, limit = 10, search, isActive, parentDepartmentId, sortBy = "name", sortOrder = "asc" } = params;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    if (parentDepartmentId) {
      where.parentDepartmentId = parentDepartmentId;
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { code: { contains: search } },
        { costCenterCode: { contains: search } },
      ];
    }

    const orderBy = { [sortBy]: sortOrder };

    const [total, departments] = await Promise.all([
      prisma.department.count({ where }),
      prisma.department.findMany({
        where,
        select: departmentSelect,
        orderBy,
        skip,
        take: limit,
      }),
    ]);

    const formattedDepartments = departments.map((dept) => ({
      ...dept,
      memberCount: dept._count.members,
      subDepartmentCount: dept._count.subDepartments,
    }));

    return {
      departments: formattedDepartments,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  async getDepartmentById(id: string) {
    const department = await prisma.department.findUnique({
      where: { id },
      select: {
        ...departmentSelect,
        subDepartments: {
          select: {
            id: true,
            code: true,
            name: true,
            isActive: true,
            _count: { select: { members: true } },
          },
        },
        members: {
          select: {
            id: true,
            name: true,
            email: true,
            employeeId: true,
            role: true,
            isActive: true,
          },
          take: 50,
        },
      },
    });

    if (!department) {
      throw new AppError(404, "Department not found", undefined, "DEPARTMENT_NOT_FOUND");
    }

    return {
      ...department,
      memberCount: department._count.members,
      subDepartmentCount: department._count.subDepartments,
    };
  },

  async getDepartmentTree() {
    const departments = await prisma.department.findMany({
      where: { isActive: true },
      select: {
        id: true,
        code: true,
        name: true,
        parentDepartmentId: true,
        _count: { select: { members: true } },
      },
      orderBy: { name: "asc" },
    });

    return departments;
  },

  async createDepartment(data: CreateDepartmentInput) {
    const existingCode = await prisma.department.findUnique({
      where: { code: data.code.toUpperCase() },
    });

    if (existingCode) {
      throw new AppError(400, "Department code already exists", undefined, "DUPLICATE_CODE");
    }

    const existingName = await prisma.department.findFirst({
      where: { name: data.name.trim() },
    });

    if (existingName) {
      throw new AppError(400, "Department name already exists", undefined, "DUPLICATE_NAME");
    }

    if (data.managerId) {
      const manager = await prisma.user.findUnique({
        where: { id: data.managerId },
      });
      if (!manager) {
        throw new AppError(400, "Employee not found", undefined, "MANAGER_NOT_FOUND");
      }
      if (!manager.isActive) {
        throw new AppError(400, "Cannot assign an inactive employee as Department Head", undefined, "INACTIVE_MANAGER");
      }

      const existingManagerDept = await prisma.department.findUnique({
        where: { managerId: data.managerId },
      });
      if (existingManagerDept) {
        throw new AppError(
          400,
          `Employee "${manager.name}" is already Department Head of ${existingManagerDept.name}`,
          undefined,
          "MANAGER_ALREADY_ASSIGNED"
        );
      }
    }

    if (data.parentDepartmentId) {
      const parent = await prisma.department.findUnique({
        where: { id: data.parentDepartmentId },
      });
      if (!parent) {
        throw new AppError(400, "Parent department not found", undefined, "PARENT_NOT_FOUND");
      }
    }

    const department = await prisma.department.create({
      data: {
        code: data.code.toUpperCase(),
        name: data.name,
        description: data.description,
        managerId: data.managerId || null,
        parentDepartmentId: data.parentDepartmentId || null,
        costCenterCode: data.costCenterCode || null,
        isActive: data.isActive ?? true,
      },
      select: departmentSelect,
    });

    return department;
  },

  async updateDepartment(id: string, data: UpdateDepartmentInput) {
    const existing = await prisma.department.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new AppError(404, "Department not found", undefined, "DEPARTMENT_NOT_FOUND");
    }

    if (data.code && data.code.toUpperCase() !== existing.code) {
      const duplicate = await prisma.department.findUnique({
        where: { code: data.code.toUpperCase() },
      });
      if (duplicate) {
        throw new AppError(400, "Department code already exists", undefined, "DUPLICATE_CODE");
      }
    }

    if (data.name && data.name.trim() !== existing.name) {
      const duplicateName = await prisma.department.findFirst({
        where: { name: data.name.trim(), id: { not: id } },
      });
      if (duplicateName) {
        throw new AppError(400, "Department name already exists", undefined, "DUPLICATE_NAME");
      }
    }

    if (data.managerId && data.managerId !== existing.managerId) {
      const manager = await prisma.user.findUnique({
        where: { id: data.managerId },
      });
      if (!manager) {
        throw new AppError(400, "Employee not found", undefined, "MANAGER_NOT_FOUND");
      }
      if (!manager.isActive) {
        throw new AppError(400, "Cannot assign an inactive employee as Department Head", undefined, "INACTIVE_MANAGER");
      }

      const existingManagerDept = await prisma.department.findFirst({
        where: { managerId: data.managerId, id: { not: id } },
      });
      if (existingManagerDept) {
        throw new AppError(
          400,
          `Employee "${manager.name}" is already Department Head of ${existingManagerDept.name}`,
          undefined,
          "MANAGER_ALREADY_ASSIGNED"
        );
      }
    }

    if (data.parentDepartmentId) {
      if (data.parentDepartmentId === id) {
        throw new AppError(400, "A department cannot be its own parent", undefined, "INVALID_PARENT");
      }

      const parent = await prisma.department.findUnique({
        where: { id: data.parentDepartmentId },
      });
      if (!parent) {
        throw new AppError(400, "Parent department not found", undefined, "PARENT_NOT_FOUND");
      }
    }

    const updated = await prisma.department.update({
      where: { id },
      data: {
        ...(data.code && { code: data.code.toUpperCase() }),
        ...(data.name && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.managerId !== undefined && { managerId: data.managerId }),
        ...(data.parentDepartmentId !== undefined && { parentDepartmentId: data.parentDepartmentId }),
        ...(data.costCenterCode !== undefined && { costCenterCode: data.costCenterCode }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
      select: departmentSelect,
    });

    return updated;
  },

  async deleteDepartment(id: string) {
    const existing = await prisma.department.findUnique({
      where: { id },
      include: {
        _count: {
          select: { members: true, subDepartments: true },
        },
      },
    });

    if (!existing) {
      throw new AppError(404, "Department not found", undefined, "DEPARTMENT_NOT_FOUND");
    }

    if (existing._count.members > 0) {
      throw new AppError(400, `Cannot delete department with ${existing._count.members} assigned members. Reassign members first.`, undefined, "HAS_MEMBERS");
    }

    if (existing._count.subDepartments > 0) {
      throw new AppError(400, `Cannot delete department with ${existing._count.subDepartments} sub-departments. Delete or reassign sub-departments first.`, undefined, "HAS_SUBDEPARTMENTS");
    }

    await prisma.department.delete({
      where: { id },
    });

    return { id, message: "Department deleted successfully" };
  },
};
