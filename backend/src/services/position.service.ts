import prisma from "../config/database";
import { AppError } from "../utils/response";
import {
  CreatePositionInput,
  UpdatePositionInput,
  GetPositionsQuery,
} from "../validators/position.validator";

const positionSelect = {
  id: true,
  code: true,
  title: true,
  description: true,
  departmentId: true,
  jobLevel: true,
  minSalary: true,
  maxSalary: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
  department: {
    select: {
      id: true,
      code: true,
      name: true,
    },
  },
};

const formatPosition = (pos: any) => ({
  ...pos,
  minSalary: pos.minSalary !== null && pos.minSalary !== undefined ? Number(pos.minSalary) : null,
  maxSalary: pos.maxSalary !== null && pos.maxSalary !== undefined ? Number(pos.maxSalary) : null,
});

export const positionService = {
  async getPositions(params: GetPositionsQuery) {
    const { page = 1, limit = 10, search, departmentId, jobLevel, isActive, sortBy = "title", sortOrder = "asc" } = params;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    if (departmentId) {
      where.departmentId = departmentId;
    }

    if (jobLevel) {
      where.jobLevel = jobLevel;
    }

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { code: { contains: search } },
        { jobLevel: { contains: search } },
        { description: { contains: search } },
      ];
    }

    const orderBy = { [sortBy]: sortOrder };

    const [total, positions] = await Promise.all([
      prisma.position.count({ where }),
      prisma.position.findMany({
        where,
        select: positionSelect,
        orderBy,
        skip,
        take: limit,
      }),
    ]);

    return {
      positions: positions.map(formatPosition),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  async getPositionById(id: string) {
    const position = await prisma.position.findUnique({
      where: { id },
      select: positionSelect,
    });

    if (!position) {
      throw new AppError(404, "Position not found", undefined, "POSITION_NOT_FOUND");
    }

    return formatPosition(position);
  },

  async createPosition(data: CreatePositionInput) {
    const existingCode = await prisma.position.findUnique({
      where: { code: data.code.toUpperCase() },
    });

    if (existingCode) {
      throw new AppError(400, "Position code already exists", undefined, "DUPLICATE_CODE");
    }

    const department = await prisma.department.findUnique({
      where: { id: data.departmentId },
    });

    if (!department) {
      throw new AppError(400, "Target department not found", undefined, "DEPARTMENT_NOT_FOUND");
    }

    const position = await prisma.position.create({
      data: {
        code: data.code.toUpperCase(),
        title: data.title.trim(),
        description: data.description || null,
        departmentId: data.departmentId,
        jobLevel: data.jobLevel || null,
        minSalary: data.minSalary !== undefined && data.minSalary !== null ? data.minSalary : null,
        maxSalary: data.maxSalary !== undefined && data.maxSalary !== null ? data.maxSalary : null,
        isActive: data.isActive ?? true,
      },
      select: positionSelect,
    });

    return formatPosition(position);
  },

  async updatePosition(id: string, data: UpdatePositionInput) {
    const existing = await prisma.position.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new AppError(404, "Position not found", undefined, "POSITION_NOT_FOUND");
    }

    if (data.code && data.code.toUpperCase() !== existing.code) {
      const duplicateCode = await prisma.position.findUnique({
        where: { code: data.code.toUpperCase() },
      });
      if (duplicateCode) {
        throw new AppError(400, "Position code already exists", undefined, "DUPLICATE_CODE");
      }
    }

    if (data.departmentId && data.departmentId !== existing.departmentId) {
      const department = await prisma.department.findUnique({
        where: { id: data.departmentId },
      });
      if (!department) {
        throw new AppError(400, "Target department not found", undefined, "DEPARTMENT_NOT_FOUND");
      }
    }

    const updated = await prisma.position.update({
      where: { id },
      data: {
        ...(data.code && { code: data.code.toUpperCase() }),
        ...(data.title && { title: data.title.trim() }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.departmentId && { departmentId: data.departmentId }),
        ...(data.jobLevel !== undefined && { jobLevel: data.jobLevel }),
        ...(data.minSalary !== undefined && { minSalary: data.minSalary }),
        ...(data.maxSalary !== undefined && { maxSalary: data.maxSalary }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
      select: positionSelect,
    });

    return formatPosition(updated);
  },

  async deletePosition(id: string) {
    const existing = await prisma.position.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new AppError(404, "Position not found", undefined, "POSITION_NOT_FOUND");
    }

    await prisma.position.delete({
      where: { id },
    });

    return { id, message: "Position deleted successfully" };
  },
};
