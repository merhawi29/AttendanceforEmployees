export type DocumentType = "PERSONAL" | "COMPANY_POLICY";

export type DocumentStatus = "ACTIVE" | "EXPIRING_SOON" | "EXPIRED" | "ARCHIVED";

export interface DocumentCategory {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: {
    documents: number;
  };
}

export interface Document {
  id: string;
  documentNo: string;
  title: string;
  categoryId: string;
  type: DocumentType;
  fileUrl: string;
  fileType?: string | null;
  fileSize?: number | null;
  ownerId?: string | null;
  departmentId?: string | null;
  issueDate?: string | null;
  expiryDate?: string | null;
  status: DocumentStatus;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  category?: DocumentCategory;
  owner?: {
    id: string;
    name: string;
    employeeId: string;
    email?: string;
    department?: string | null;
  } | null;
  department?: {
    id: string;
    name: string;
    code: string;
  } | null;
}

export interface DocumentCategoryBreakdown {
  categoryId: string;
  categoryName: string;
  count: number;
}

export interface DocumentAnalytics {
  totalDocuments: number;
  companyPoliciesCount: number;
  personalDocumentsCount: number;
  expiringSoonCount: number;
  expiredCount: number;
  categoryBreakdown: DocumentCategoryBreakdown[];
}
