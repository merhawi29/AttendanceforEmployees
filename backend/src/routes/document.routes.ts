import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth.middleware";
import {
  createCategory,
  getCategories,
  updateCategory,
  deleteCategory,
  createDocument,
  updateDocument,
  deleteDocument,
  getDocuments,
  getDocumentById,
  getEmployeeDocuments,
  getCompanyPolicies,
  getDocumentAnalytics,
} from "../controllers/document.controller";
import { Role } from "../types";

const router = Router();

router.use(authenticate);

// Employee Portal Endpoints
router.get("/my-documents", getEmployeeDocuments);
router.get("/policies", getCompanyPolicies);

// Admin Management Routes
router.use(authorize(Role.ADMIN));

// Categories
router.get("/categories", getCategories);
router.post("/categories", createCategory);
router.patch("/categories/:categoryId", updateCategory);
router.delete("/categories/:categoryId", deleteCategory);

// Documents Repository
router.get("/", getDocuments);
router.get("/:documentId", getDocumentById);
router.post("/", createDocument);
router.patch("/:documentId", updateDocument);
router.delete("/:documentId", deleteDocument);

// Analytics
router.get("/analytics/dashboard", getDocumentAnalytics);

export default router;
