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

export const createDocumentSchema = z.object({
  documentNo: z.string().min(2, "Document number is required").max(50),
  title: z.string().min(2, "Document title is required").max(150),
  categoryId: z.string().min(1, "Category ID is required"),
  type: z.enum(["PERSONAL", "COMPANY_POLICY"]).optional().default("PERSONAL"),
  fileUrl: z.string().min(1, "File URL is required"),
  fileType: z.string().optional(),
  fileSize: z.number().optional(),
  ownerId: z.string().optional(),
  departmentId: z.string().optional(),
  issueDate: z.string().optional(),
  expiryDate: z.string().optional(),
  status: z.enum(["ACTIVE", "EXPIRING_SOON", "EXPIRED", "ARCHIVED"]).optional().default("ACTIVE"),
  notes: z.string().optional(),
});

export const updateDocumentSchema = z.object({
  documentNo: z.string().min(2).max(50).optional(),
  title: z.string().min(2).max(150).optional(),
  categoryId: z.string().optional(),
  type: z.enum(["PERSONAL", "COMPANY_POLICY"]).optional(),
  fileUrl: z.string().optional(),
  fileType: z.string().optional(),
  fileSize: z.number().optional(),
  ownerId: z.string().optional(),
  departmentId: z.string().optional(),
  issueDate: z.string().optional(),
  expiryDate: z.string().optional(),
  status: z.enum(["ACTIVE", "EXPIRING_SOON", "EXPIRED", "ARCHIVED"]).optional(),
  notes: z.string().optional(),
});
