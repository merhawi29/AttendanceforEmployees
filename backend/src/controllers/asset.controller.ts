import { Response } from "express";
import { AuthRequest } from "../types";
import { assetService } from "../services/asset.service";
import { asyncHandler, sendSuccess, AppError } from "../utils/response";
import {
  createCategorySchema,
  updateCategorySchema,
  createAssetSchema,
  updateAssetSchema,
  assignAssetSchema,
  returnAssetSchema,
  createReturnRequestSchema,
  reviewReturnRequestSchema,
} from "../validators/asset.validator";
import { AssetStatus, AssetReturnRequestStatus } from "@prisma/client";

// --- CATEGORIES ---
export const createCategory = asyncHandler(async (req: AuthRequest, res: Response) => {
  const validated = createCategorySchema.parse(req.body);
  const category = await assetService.createCategory(validated);
  sendSuccess(res, category, "Asset category created successfully", 201);
});

export const getCategories = asyncHandler(async (_req: AuthRequest, res: Response) => {
  const categories = await assetService.getCategories();
  sendSuccess(res, categories, "Asset categories retrieved");
});

export const updateCategory = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { categoryId } = req.params;
  const validated = updateCategorySchema.parse(req.body);
  const category = await assetService.updateCategory(categoryId, validated);
  sendSuccess(res, category, "Asset category updated successfully");
});

export const deleteCategory = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { categoryId } = req.params;
  await assetService.deleteCategory(categoryId);
  sendSuccess(res, null, "Asset category deleted successfully");
});

// --- ASSETS ---
export const createAsset = asyncHandler(async (req: AuthRequest, res: Response) => {
  const validated = createAssetSchema.parse(req.body);
  const asset = await assetService.createAsset(validated);
  sendSuccess(res, asset, "Asset registered successfully", 201);
});

export const updateAsset = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { assetId } = req.params;
  const validated = updateAssetSchema.parse(req.body);
  const asset = await assetService.updateAsset(assetId, validated);
  sendSuccess(res, asset, "Asset details updated successfully");
});

export const deleteAsset = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { assetId } = req.params;
  await assetService.deleteAsset(assetId);
  sendSuccess(res, null, "Asset deleted successfully");
});

export const getAssets = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { categoryId, status, assignedToId, search } = req.query;
  const assets = await assetService.getAssets({
    categoryId: categoryId as string | undefined,
    status: status as AssetStatus | undefined,
    assignedToId: assignedToId as string | undefined,
    search: search as string | undefined,
  });
  sendSuccess(res, assets, "Assets retrieved");
});

export const getAssetById = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { assetId } = req.params;
  const asset = await assetService.getAssetById(assetId);
  sendSuccess(res, asset, "Asset details retrieved");
});

// --- ASSIGNMENT & RETURN ---
export const assignAsset = asyncHandler(async (req: AuthRequest, res: Response) => {
  const validated = assignAssetSchema.parse(req.body);
  const assignment = await assetService.assignAsset({
    ...validated,
    assignedById: req.user!.userId,
  });
  sendSuccess(res, assignment, "Asset assigned to employee successfully", 201);
});

export const returnAsset = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { assetId } = req.params;
  const validated = returnAssetSchema.parse(req.body);
  const asset = await assetService.returnAsset(assetId, validated);
  sendSuccess(res, asset, "Asset returned to inventory");
});

export const getEmployeeAssets = asyncHandler(async (req: AuthRequest, res: Response) => {
  const targetUserId = req.user?.role === "EMPLOYEE" ? req.user.userId : (req.query.employeeId as string) || req.user!.userId;
  const assets = await assetService.getEmployeeAssets(targetUserId);
  sendSuccess(res, assets, "Employee assigned assets retrieved");
});

// --- RETURN REQUESTS ---
export const createReturnRequest = asyncHandler(async (req: AuthRequest, res: Response) => {
  const validated = createReturnRequestSchema.parse(req.body);
  const returnRequest = await assetService.createReturnRequest(req.user!.userId, validated);
  sendSuccess(res, returnRequest, "Asset return request submitted successfully", 201);
});

export const getEmployeeReturnRequests = asyncHandler(async (req: AuthRequest, res: Response) => {
  const requests = await assetService.getEmployeeReturnRequests(req.user!.userId);
  sendSuccess(res, requests, "Employee return requests retrieved");
});

export const getReturnRequests = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { status } = req.query;
  const requests = await assetService.getAllReturnRequests(status as AssetReturnRequestStatus | undefined);
  sendSuccess(res, requests, "All return requests retrieved");
});

export const approveReturnRequest = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { requestId } = req.params;
  const validated = reviewReturnRequestSchema.parse(req.body);
  const request = await assetService.approveReturnRequest(requestId, req.user!.userId, validated);
  sendSuccess(res, request, "Asset return approved and asset marked available");
});

export const rejectReturnRequest = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { requestId } = req.params;
  const validated = reviewReturnRequestSchema.parse(req.body);
  if (!validated.rejectedReason || !validated.rejectedReason.trim()) {
    throw new AppError(400, "Rejection reason is mandatory when rejecting a return request.", undefined, "REASON_REQUIRED");
  }
  const request = await assetService.rejectReturnRequest(requestId, req.user!.userId, {
    rejectedReason: validated.rejectedReason,
    adminComment: validated.adminComment,
  });
  sendSuccess(res, request, "Asset return request rejected");
});

// --- ANALYTICS ---
export const getAssetAnalytics = asyncHandler(async (_req: AuthRequest, res: Response) => {
  const analytics = await assetService.getAssetAnalytics();
  sendSuccess(res, analytics, "Asset analytics retrieved");
});
