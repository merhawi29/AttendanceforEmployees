import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth.middleware";
import {
  createCategory,
  getCategories,
  updateCategory,
  deleteCategory,
  createAsset,
  updateAsset,
  deleteAsset,
  getAssets,
  getAssetById,
  assignAsset,
  returnAsset,
  getEmployeeAssets,
  getAssetAnalytics,
  createReturnRequest,
  getEmployeeReturnRequests,
  getReturnRequests,
  approveReturnRequest,
  rejectReturnRequest,
} from "../controllers/asset.controller";
import { Role } from "../types";

const router = Router();

router.use(authenticate);

// Employee self-service views & requests
router.get("/my-assets", getEmployeeAssets);
router.post("/return-requests", createReturnRequest);
router.get("/return-requests/my", getEmployeeReturnRequests);

// Admin Management Routes
router.use(authorize(Role.ADMIN));

// Categories
router.get("/categories", getCategories);
router.post("/categories", createCategory);
router.patch("/categories/:categoryId", updateCategory);
router.delete("/categories/:categoryId", deleteCategory);

// Assets
router.get("/", getAssets);
router.get("/:assetId", getAssetById);
router.post("/", createAsset);
router.patch("/:assetId", updateAsset);
router.delete("/:assetId", deleteAsset);

// Assignment & Return
router.post("/assign", assignAsset);
router.post("/:assetId/return", returnAsset);

// Admin Return Requests Review
router.get("/return-requests", getReturnRequests);
router.post("/return-requests/:requestId/approve", approveReturnRequest);
router.post("/return-requests/:requestId/reject", rejectReturnRequest);

// Analytics
router.get("/analytics/dashboard", getAssetAnalytics);

export default router;
