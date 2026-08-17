import prisma from "../config/database";
import { DocumentType, DocumentStatus, Prisma } from "@prisma/client";
import { AppError } from "../utils/response";

export interface CreateCategoryInput {
  code: string;
  name: string;
  description?: string;
}

export interface CreateDocumentInput {
  documentNo: string;
  title: string;
  categoryId: string;
  type?: DocumentType;
  fileUrl: string;
  fileType?: string;
  fileSize?: number;
  ownerId?: string;
  departmentId?: string;
  issueDate?: string;
  expiryDate?: string;
  status?: DocumentStatus;
  notes?: string;
}

export const documentService = {
  // --- CATEGORIES ---
  async createCategory(data: CreateCategoryInput) {
    const existing = await prisma.documentCategory.findFirst({
      where: { OR: [{ code: data.code }, { name: data.name }] },
    });
    if (existing) {
      throw new AppError(409, "Document Category code or name already exists", undefined, "DUPLICATE_CATEGORY");
    }

    return prisma.documentCategory.create({
      data: {
        code: data.code,
        name: data.name,
        description: data.description || null,
      },
      include: {
        _count: { select: { documents: true } },
      },
    });
  },

  async getCategories() {
    return prisma.documentCategory.findMany({
      include: {
        _count: { select: { documents: true } },
      },
      orderBy: { name: "asc" },
    });
  },

  async updateCategory(categoryId: string, data: Partial<CreateCategoryInput>) {
    const cat = await prisma.documentCategory.findUnique({ where: { id: categoryId } });
    if (!cat) {
      throw new AppError(404, "Document Category not found", undefined, "CATEGORY_NOT_FOUND");
    }

    return prisma.documentCategory.update({
      where: { id: categoryId },
      data: {
        code: data.code,
        name: data.name,
        description: data.description,
      },
      include: {
        _count: { select: { documents: true } },
      },
    });
  },

  async deleteCategory(categoryId: string) {
    const cat = await prisma.documentCategory.findUnique({ where: { id: categoryId } });
    if (!cat) {
      throw new AppError(404, "Document Category not found", undefined, "CATEGORY_NOT_FOUND");
    }
    return prisma.documentCategory.delete({ where: { id: categoryId } });
  },

  // --- DOCUMENTS ---
  async createDocument(data: CreateDocumentInput) {
    const existingNo = await prisma.document.findUnique({ where: { documentNo: data.documentNo } });
    if (existingNo) {
      throw new AppError(409, "Document Number already exists", undefined, "DUPLICATE_DOCUMENT_NO");
    }

    const category = await prisma.documentCategory.findUnique({ where: { id: data.categoryId } });
    if (!category) {
      throw new AppError(404, "Document Category not found", undefined, "CATEGORY_NOT_FOUND");
    }

    let status = data.status || DocumentStatus.ACTIVE;
    if (data.expiryDate) {
      const expiry = new Date(data.expiryDate);
      const now = new Date();
      const in30Days = new Date(now.getTime() + 30 * 86400000);
      if (expiry < now) {
        status = DocumentStatus.EXPIRED;
      } else if (expiry <= in30Days) {
        status = DocumentStatus.EXPIRING_SOON;
      }
    }

    return prisma.document.create({
      data: {
        documentNo: data.documentNo,
        title: data.title,
        categoryId: data.categoryId,
        type: data.type || DocumentType.PERSONAL,
        fileUrl: data.fileUrl,
        fileType: data.fileType || "application/pdf",
        fileSize: data.fileSize || 102400,
        ownerId: data.ownerId || null,
        departmentId: data.departmentId || null,
        issueDate: data.issueDate ? new Date(data.issueDate) : null,
        expiryDate: data.expiryDate ? new Date(data.expiryDate) : null,
        status,
        notes: data.notes || null,
      },
      include: {
        category: { select: { id: true, name: true, code: true } },
        owner: { select: { id: true, name: true, employeeId: true, email: true } },
        department: { select: { id: true, name: true, code: true } },
      },
    });
  },

  async updateDocument(documentId: string, data: Partial<CreateDocumentInput>) {
    const doc = await prisma.document.findUnique({ where: { id: documentId } });
    if (!doc) {
      throw new AppError(404, "Document not found", undefined, "DOCUMENT_NOT_FOUND");
    }

    const updateData: Prisma.DocumentUpdateInput = {};
    if (data.documentNo !== undefined) updateData.documentNo = data.documentNo;
    if (data.title !== undefined) updateData.title = data.title;
    if (data.categoryId !== undefined) updateData.category = { connect: { id: data.categoryId } };
    if (data.type !== undefined) updateData.type = data.type;
    if (data.fileUrl !== undefined) updateData.fileUrl = data.fileUrl;
    if (data.fileType !== undefined) updateData.fileType = data.fileType;
    if (data.fileSize !== undefined) updateData.fileSize = data.fileSize;
    if (data.ownerId !== undefined) updateData.owner = data.ownerId ? { connect: { id: data.ownerId } } : { disconnect: true };
    if (data.departmentId !== undefined) updateData.department = data.departmentId ? { connect: { id: data.departmentId } } : { disconnect: true };
    if (data.issueDate !== undefined) updateData.issueDate = new Date(data.issueDate);
    if (data.expiryDate !== undefined) {
      const expiry = new Date(data.expiryDate);
      const now = new Date();
      const in30Days = new Date(now.getTime() + 30 * 86400000);
      updateData.expiryDate = expiry;
      if (expiry < now) updateData.status = DocumentStatus.EXPIRED;
      else if (expiry <= in30Days) updateData.status = DocumentStatus.EXPIRING_SOON;
      else updateData.status = DocumentStatus.ACTIVE;
    }
    if (data.status !== undefined && !data.expiryDate) updateData.status = data.status;
    if (data.notes !== undefined) updateData.notes = data.notes;

    return prisma.document.update({
      where: { id: documentId },
      data: updateData,
      include: {
        category: { select: { id: true, name: true, code: true } },
        owner: { select: { id: true, name: true, employeeId: true, email: true } },
        department: { select: { id: true, name: true, code: true } },
      },
    });
  },

  async deleteDocument(documentId: string) {
    const doc = await prisma.document.findUnique({ where: { id: documentId } });
    if (!doc) {
      throw new AppError(404, "Document not found", undefined, "DOCUMENT_NOT_FOUND");
    }
    return prisma.document.delete({ where: { id: documentId } });
  },

  async getDocuments(query: { type?: DocumentType; categoryId?: string; status?: DocumentStatus; ownerId?: string; search?: string }) {
    const where: Prisma.DocumentWhereInput = {};
    if (query.type) where.type = query.type;
    if (query.categoryId) where.categoryId = query.categoryId;
    if (query.status) where.status = query.status;
    if (query.ownerId) where.ownerId = query.ownerId;
    if (query.search) {
      where.OR = [
        { documentNo: { contains: query.search } },
        { title: { contains: query.search } },
        { owner: { name: { contains: query.search } } },
      ];
    }

    return prisma.document.findMany({
      where,
      include: {
        category: { select: { id: true, name: true, code: true } },
        owner: { select: { id: true, name: true, employeeId: true, department: true } },
        department: { select: { id: true, name: true, code: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  },

  async getDocumentById(documentId: string) {
    const doc = await prisma.document.findUnique({
      where: { id: documentId },
      include: {
        category: true,
        owner: { select: { id: true, name: true, employeeId: true, email: true, department: true } },
        department: true,
      },
    });
    if (!doc) {
      throw new AppError(404, "Document not found", undefined, "DOCUMENT_NOT_FOUND");
    }
    return doc;
  },

  async getEmployeeDocuments(employeeId: string) {
    return prisma.document.findMany({
      where: { ownerId: employeeId, type: DocumentType.PERSONAL },
      include: {
        category: { select: { id: true, name: true, code: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  },

  async getCompanyPolicies() {
    return prisma.document.findMany({
      where: { type: DocumentType.COMPANY_POLICY },
      include: {
        category: { select: { id: true, name: true, code: true } },
        department: { select: { id: true, name: true, code: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  },

  // --- ANALYTICS ---
  async getDocumentAnalytics() {
    const totalDocuments = await prisma.document.count();
    const companyPoliciesCount = await prisma.document.count({ where: { type: DocumentType.COMPANY_POLICY } });
    const personalDocumentsCount = await prisma.document.count({ where: { type: DocumentType.PERSONAL } });
    const expiringSoonCount = await prisma.document.count({ where: { status: DocumentStatus.EXPIRING_SOON } });
    const expiredCount = await prisma.document.count({ where: { status: DocumentStatus.EXPIRED } });

    const categories = await prisma.documentCategory.findMany({
      include: {
        _count: { select: { documents: true } },
      },
    });

    const categoryBreakdown = categories.map((cat) => ({
      categoryId: cat.id,
      categoryName: cat.name,
      count: cat._count.documents,
    }));

    return {
      totalDocuments,
      companyPoliciesCount,
      personalDocumentsCount,
      expiringSoonCount,
      expiredCount,
      categoryBreakdown,
    };
  },
};
