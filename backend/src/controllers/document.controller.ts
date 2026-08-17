import { Response } from "express";
import { AuthRequest } from "../types";
import { documentService } from "../services/document.service";
import { asyncHandler, sendSuccess } from "../utils/response";
import {
  createCategorySchema,
  updateCategorySchema,
  createDocumentSchema,
  updateDocumentSchema,
} from "../validators/document.validator";
import { DocumentType, DocumentStatus } from "@prisma/client";

// --- CATEGORIES ---
export const createCategory = asyncHandler(async (req: AuthRequest, res: Response) => {
  const validated = createCategorySchema.parse(req.body);
  const category = await documentService.createCategory(validated);
  sendSuccess(res, category, "Document category created successfully", 201);
});

export const getCategories = asyncHandler(async (_req: AuthRequest, res: Response) => {
  const categories = await documentService.getCategories();
  sendSuccess(res, categories, "Document categories retrieved");
});

export const updateCategory = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { categoryId } = req.params;
  const validated = updateCategorySchema.parse(req.body);
  const category = await documentService.updateCategory(categoryId, validated);
  sendSuccess(res, category, "Document category updated successfully");
});

export const deleteCategory = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { categoryId } = req.params;
  await documentService.deleteCategory(categoryId);
  sendSuccess(res, null, "Document category deleted successfully");
});

// --- DOCUMENTS ---
export const createDocument = asyncHandler(async (req: AuthRequest, res: Response) => {
  const validated = createDocumentSchema.parse(req.body);
  const document = await documentService.createDocument(validated);
  sendSuccess(res, document, "Document uploaded/registered successfully", 201);
});

export const updateDocument = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { documentId } = req.params;
  const validated = updateDocumentSchema.parse(req.body);
  const document = await documentService.updateDocument(documentId, validated);
  sendSuccess(res, document, "Document details updated successfully");
});

export const deleteDocument = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { documentId } = req.params;
  await documentService.deleteDocument(documentId);
  sendSuccess(res, null, "Document deleted successfully");
});

export const getDocuments = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { type, categoryId, status, ownerId, search } = req.query;
  const documents = await documentService.getDocuments({
    type: type as DocumentType | undefined,
    categoryId: categoryId as string | undefined,
    status: status as DocumentStatus | undefined,
    ownerId: ownerId as string | undefined,
    search: search as string | undefined,
  });
  sendSuccess(res, documents, "Documents retrieved");
});

export const getDocumentById = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { documentId } = req.params;
  const document = await documentService.getDocumentById(documentId);
  sendSuccess(res, document, "Document details retrieved");
});

// --- EMPLOYEE VAULT & POLICIES ---
export const getEmployeeDocuments = asyncHandler(async (req: AuthRequest, res: Response) => {
  const targetUserId = req.user?.role === "EMPLOYEE" ? req.user.userId : (req.query.employeeId as string) || req.user!.userId;
  const documents = await documentService.getEmployeeDocuments(targetUserId);
  sendSuccess(res, documents, "Employee vault documents retrieved");
});

export const getCompanyPolicies = asyncHandler(async (_req: AuthRequest, res: Response) => {
  const policies = await documentService.getCompanyPolicies();
  sendSuccess(res, policies, "Company policy handbooks retrieved");
});

// --- ANALYTICS ---
export const getDocumentAnalytics = asyncHandler(async (_req: AuthRequest, res: Response) => {
  const analytics = await documentService.getDocumentAnalytics();
  sendSuccess(res, analytics, "Document analytics retrieved");
});
