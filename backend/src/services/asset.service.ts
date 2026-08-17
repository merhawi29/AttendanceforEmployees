import prisma from "../config/database";
import { AssetStatus, AssetCondition, AssignmentStatus, Prisma } from "@prisma/client";
import { AppError } from "../utils/response";

export interface CreateCategoryInput {
  code: string;
  name: string;
  description?: string;
}

export interface CreateAssetInput {
  assetTag: string;
  name: string;
  categoryId: string;
  brand?: string;
  model?: string;
  serialNumber?: string;
  purchaseDate?: string;
  purchaseCost?: number;
  warrantyExpiry?: string;
  status?: AssetStatus;
  condition?: AssetCondition;
  assignedToId?: string;
  notes?: string;
}

export interface AssignAssetInput {
  assetId: string;
  employeeId: string;
  assignedById: string;
  assignedDate?: string;
  conditionOnAssign?: AssetCondition;
  notes?: string;
}

export interface ReturnAssetInput {
  returnedDate?: string;
  conditionOnReturn?: AssetCondition;
  targetStatus?: AssetStatus;
  notes?: string;
}

export const assetService = {
  // --- CATEGORIES ---
  async createCategory(data: CreateCategoryInput) {
    const existing = await prisma.assetCategory.findFirst({
      where: { OR: [{ code: data.code }, { name: data.name }] },
    });
    if (existing) {
      throw new AppError(409, "Asset category code or name already exists", undefined, "DUPLICATE_CATEGORY");
    }

    return prisma.assetCategory.create({
      data: {
        code: data.code,
        name: data.name,
        description: data.description || null,
      },
      include: {
        _count: { select: { assets: true } },
      },
    });
  },

  async getCategories() {
    return prisma.assetCategory.findMany({
      include: {
        _count: { select: { assets: true } },
      },
      orderBy: { name: "asc" },
    });
  },

  async updateCategory(categoryId: string, data: Partial<CreateCategoryInput>) {
    const cat = await prisma.assetCategory.findUnique({ where: { id: categoryId } });
    if (!cat) {
      throw new AppError(404, "Asset category not found", undefined, "CATEGORY_NOT_FOUND");
    }

    return prisma.assetCategory.update({
      where: { id: categoryId },
      data: {
        code: data.code,
        name: data.name,
        description: data.description,
      },
      include: {
        _count: { select: { assets: true } },
      },
    });
  },

  async deleteCategory(categoryId: string) {
    const cat = await prisma.assetCategory.findUnique({ where: { id: categoryId } });
    if (!cat) {
      throw new AppError(404, "Asset category not found", undefined, "CATEGORY_NOT_FOUND");
    }
    return prisma.assetCategory.delete({ where: { id: categoryId } });
  },

  // --- ASSETS ---
  async createAsset(data: CreateAssetInput) {
    const existingTag = await prisma.asset.findUnique({ where: { assetTag: data.assetTag } });
    if (existingTag) {
      throw new AppError(409, "Asset Tag already exists", undefined, "DUPLICATE_ASSET_TAG");
    }

    if (data.serialNumber) {
      const existingSn = await prisma.asset.findUnique({ where: { serialNumber: data.serialNumber } });
      if (existingSn) {
        throw new AppError(409, "Serial Number already exists", undefined, "DUPLICATE_SERIAL_NUMBER");
      }
    }

    const category = await prisma.assetCategory.findUnique({ where: { id: data.categoryId } });
    if (!category) {
      throw new AppError(404, "Asset Category not found", undefined, "CATEGORY_NOT_FOUND");
    }

    let assignedDate: Date | null = null;
    let status = data.status || AssetStatus.AVAILABLE;

    if (data.assignedToId) {
      const emp = await prisma.user.findUnique({ where: { id: data.assignedToId } });
      if (!emp) throw new AppError(404, "Assigned employee user not found", undefined, "USER_NOT_FOUND");
      status = AssetStatus.ASSIGNED;
      assignedDate = new Date();
    }

    return prisma.asset.create({
      data: {
        assetTag: data.assetTag,
        name: data.name,
        categoryId: data.categoryId,
        brand: data.brand || null,
        model: data.model || null,
        serialNumber: data.serialNumber || null,
        purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : null,
        purchaseCost: data.purchaseCost !== undefined ? new Prisma.Decimal(data.purchaseCost) : null,
        warrantyExpiry: data.warrantyExpiry ? new Date(data.warrantyExpiry) : null,
        status,
        condition: data.condition || AssetCondition.EXCELLENT,
        assignedToId: data.assignedToId || null,
        assignedDate,
        notes: data.notes || null,
      },
      include: {
        category: { select: { id: true, name: true, code: true } },
        assignedTo: { select: { id: true, name: true, employeeId: true, department: true } },
      },
    });
  },

  async updateAsset(assetId: string, data: Partial<CreateAssetInput>) {
    const asset = await prisma.asset.findUnique({ where: { id: assetId } });
    if (!asset) {
      throw new AppError(404, "Asset not found", undefined, "ASSET_NOT_FOUND");
    }

    const updateData: Prisma.AssetUpdateInput = {};
    if (data.assetTag !== undefined) updateData.assetTag = data.assetTag;
    if (data.name !== undefined) updateData.name = data.name;
    if (data.categoryId !== undefined) updateData.category = { connect: { id: data.categoryId } };
    if (data.brand !== undefined) updateData.brand = data.brand;
    if (data.model !== undefined) updateData.model = data.model;
    if (data.serialNumber !== undefined) updateData.serialNumber = data.serialNumber;
    if (data.purchaseDate !== undefined) updateData.purchaseDate = new Date(data.purchaseDate);
    if (data.purchaseCost !== undefined) updateData.purchaseCost = new Prisma.Decimal(data.purchaseCost);
    if (data.warrantyExpiry !== undefined) updateData.warrantyExpiry = new Date(data.warrantyExpiry);
    if (data.status !== undefined) updateData.status = data.status;
    if (data.condition !== undefined) updateData.condition = data.condition;
    if (data.notes !== undefined) updateData.notes = data.notes;

    return prisma.asset.update({
      where: { id: assetId },
      data: updateData,
      include: {
        category: { select: { id: true, name: true, code: true } },
        assignedTo: { select: { id: true, name: true, employeeId: true, department: true } },
      },
    });
  },

  async deleteAsset(assetId: string) {
    const asset = await prisma.asset.findUnique({ where: { id: assetId } });
    if (!asset) {
      throw new AppError(404, "Asset not found", undefined, "ASSET_NOT_FOUND");
    }
    return prisma.asset.delete({ where: { id: assetId } });
  },

  async getAssets(query: { categoryId?: string; status?: AssetStatus; assignedToId?: string; search?: string }) {
    const where: Prisma.AssetWhereInput = {};
    if (query.categoryId) where.categoryId = query.categoryId;
    if (query.status) where.status = query.status;
    if (query.assignedToId) where.assignedToId = query.assignedToId;
    if (query.search) {
      where.OR = [
        { assetTag: { contains: query.search } },
        { name: { contains: query.search } },
        { brand: { contains: query.search } },
        { model: { contains: query.search } },
        { serialNumber: { contains: query.search } },
        { assignedTo: { name: { contains: query.search } } },
      ];
    }

    return prisma.asset.findMany({
      where,
      include: {
        category: { select: { id: true, name: true, code: true } },
        assignedTo: { select: { id: true, name: true, employeeId: true, department: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  },

  async getAssetById(assetId: string) {
    const asset = await prisma.asset.findUnique({
      where: { id: assetId },
      include: {
        category: true,
        assignedTo: { select: { id: true, name: true, employeeId: true, department: true, email: true } },
        assignments: {
          include: {
            employee: { select: { id: true, name: true, employeeId: true } },
            assigner: { select: { id: true, name: true } },
          },
          orderBy: { assignedDate: "desc" },
        },
      },
    });
    if (!asset) {
      throw new AppError(404, "Asset not found", undefined, "ASSET_NOT_FOUND");
    }
    return asset;
  },

  // --- ASSIGNMENT & RETURN ---
  async assignAsset(data: AssignAssetInput) {
    const asset = await prisma.asset.findUnique({ where: { id: data.assetId } });
    if (!asset) {
      throw new AppError(404, "Asset not found", undefined, "ASSET_NOT_FOUND");
    }

    const employee = await prisma.user.findUnique({ where: { id: data.employeeId } });
    if (!employee) {
      throw new AppError(404, "Employee not found", undefined, "USER_NOT_FOUND");
    }

    const assignDate = data.assignedDate ? new Date(data.assignedDate) : new Date();

    // Close any prior active assignment for this asset
    await prisma.assetAssignment.updateMany({
      where: { assetId: data.assetId, status: AssignmentStatus.ACTIVE },
      data: { status: AssignmentStatus.RETURNED, returnedDate: assignDate },
    });

    const assignment = await prisma.assetAssignment.create({
      data: {
        assetId: data.assetId,
        employeeId: data.employeeId,
        assignedById: data.assignedById,
        assignedDate: assignDate,
        conditionOnAssign: data.conditionOnAssign || asset.condition,
        status: AssignmentStatus.ACTIVE,
        notes: data.notes || null,
      },
      include: {
        asset: { select: { id: true, assetTag: true, name: true } },
        employee: { select: { id: true, name: true, employeeId: true } },
      },
    });

    await prisma.asset.update({
      where: { id: data.assetId },
      data: {
        status: AssetStatus.ASSIGNED,
        assignedToId: data.employeeId,
        assignedDate: assignDate,
        condition: data.conditionOnAssign || asset.condition,
      },
    });

    return assignment;
  },

  async returnAsset(assetId: string, data: ReturnAssetInput) {
    const asset = await prisma.asset.findUnique({ where: { id: assetId } });
    if (!asset) {
      throw new AppError(404, "Asset not found", undefined, "ASSET_NOT_FOUND");
    }

    const returnDate = data.returnedDate ? new Date(data.returnedDate) : new Date();
    const returnCondition = data.conditionOnReturn || asset.condition;
    const nextStatus = data.targetStatus || (returnCondition === AssetCondition.DAMAGED ? AssetStatus.UNDER_MAINTENANCE : AssetStatus.AVAILABLE);

    await prisma.assetAssignment.updateMany({
      where: { assetId, status: AssignmentStatus.ACTIVE },
      data: {
        status: AssignmentStatus.RETURNED,
        returnedDate: returnDate,
        conditionOnReturn: returnCondition,
        notes: data.notes ? `Returned: ${data.notes}` : undefined,
      },
    });

    return prisma.asset.update({
      where: { id: assetId },
      data: {
        status: nextStatus,
        assignedToId: null,
        assignedDate: null,
        condition: returnCondition,
        notes: data.notes ? `Last return note: ${data.notes}` : asset.notes,
      },
      include: {
        category: { select: { id: true, name: true, code: true } },
      },
    });
  },

  async getEmployeeAssets(employeeId: string) {
    return prisma.asset.findMany({
      where: { assignedToId: employeeId },
      include: {
        category: { select: { id: true, name: true, code: true } },
      },
      orderBy: { assignedDate: "desc" },
    });
  },

  // --- ANALYTICS ---
  async getAssetAnalytics() {
    const totalAssets = await prisma.asset.count();
    const availableAssets = await prisma.asset.count({ where: { status: AssetStatus.AVAILABLE } });
    const assignedAssets = await prisma.asset.count({ where: { status: AssetStatus.ASSIGNED } });
    const maintenanceAssets = await prisma.asset.count({ where: { status: AssetStatus.UNDER_MAINTENANCE } });
    const lostAssets = await prisma.asset.count({ where: { status: AssetStatus.LOST } });

    const assets = await prisma.asset.findMany({ select: { purchaseCost: true } });
    const totalValuation = assets.reduce((sum, a) => sum + (a.purchaseCost ? Number(a.purchaseCost) : 0), 0);

    const categories = await prisma.assetCategory.findMany({
      include: {
        _count: { select: { assets: true } },
      },
    });

    const categoryBreakdown = categories.map((cat) => ({
      categoryId: cat.id,
      categoryName: cat.name,
      count: cat._count.assets,
    }));

    const assignmentPercentage = totalAssets ? Math.round((assignedAssets / totalAssets) * 100) : 0;

    return {
      totalAssets,
      availableAssets,
      assignedAssets,
      maintenanceAssets,
      lostAssets,
      totalValuation: Math.round(totalValuation * 100) / 100,
      assignmentPercentage,
      categoryBreakdown,
    };
  },
};
