import { z } from "zod";

export const createCategorySchema = z.object({
  code: z.string().min(2, "Category code is required").max(50),
  name: z.string().min(2, "Category name is required").max(100),
  description: z.string().optional(),
});

export const updateCategorySchema = z.object({
  code: z.string().min(2).max(50).optional(),
  name: z.string().min(2).max(100).optional(),
  description: z.string().optional(),
});

export const createAssetSchema = z.object({
  assetTag: z.string().min(2, "Asset Tag is required").max(50),
  name: z.string().min(2, "Asset name is required").max(150),
  categoryId: z.string().min(1, "Category ID is required"),
  brand: z.string().optional(),
  model: z.string().optional(),
  serialNumber: z.string().optional(),
  purchaseDate: z.string().optional(),
  purchaseCost: z.number().min(0).optional(),
  warrantyExpiry: z.string().optional(),
  status: z.enum(["AVAILABLE", "ASSIGNED", "UNDER_MAINTENANCE", "DISPOSED", "LOST"]).optional().default("AVAILABLE"),
  condition: z.enum(["NEW", "EXCELLENT", "GOOD", "FAIR", "DAMAGED"]).optional().default("EXCELLENT"),
  assignedToId: z.string().optional(),
  notes: z.string().optional(),
});

export const updateAssetSchema = z.object({
  assetTag: z.string().min(2).max(50).optional(),
  name: z.string().min(2).max(150).optional(),
  categoryId: z.string().optional(),
  brand: z.string().optional(),
  model: z.string().optional(),
  serialNumber: z.string().optional(),
  purchaseDate: z.string().optional(),
  purchaseCost: z.number().min(0).optional(),
  warrantyExpiry: z.string().optional(),
  status: z.enum(["AVAILABLE", "ASSIGNED", "UNDER_MAINTENANCE", "DISPOSED", "LOST"]).optional(),
  condition: z.enum(["NEW", "EXCELLENT", "GOOD", "FAIR", "DAMAGED"]).optional(),
  notes: z.string().optional(),
});

export const assignAssetSchema = z.object({
  assetId: z.string().min(1, "Asset ID is required"),
  employeeId: z.string().min(1, "Employee ID is required"),
  assignedDate: z.string().optional(),
  conditionOnAssign: z.enum(["NEW", "EXCELLENT", "GOOD", "FAIR", "DAMAGED"]).optional().default("EXCELLENT"),
  notes: z.string().optional(),
});

export const returnAssetSchema = z.object({
  returnedDate: z.string().optional(),
  conditionOnReturn: z.enum(["NEW", "EXCELLENT", "GOOD", "FAIR", "DAMAGED"]).optional().default("GOOD"),
  targetStatus: z.enum(["AVAILABLE", "UNDER_MAINTENANCE", "DISPOSED", "LOST"]).optional().default("AVAILABLE"),
  notes: z.string().optional(),
});
