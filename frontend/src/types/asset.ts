export type AssetStatus = "AVAILABLE" | "ASSIGNED" | "UNDER_MAINTENANCE" | "DISPOSED" | "LOST";

export type AssetCondition = "NEW" | "EXCELLENT" | "GOOD" | "FAIR" | "DAMAGED";

export type AssignmentStatus = "ACTIVE" | "RETURN_PENDING" | "RETURNED";

export type AssetReturnRequestStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface AssetCategory {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: {
    assets: number;
  };
}

export interface AssetReturnRequest {
  id: string;
  assignmentId: string;
  assetId: string;
  requestedById: string;
  requestedAt: string;
  returnCondition: AssetCondition;
  employeeComment?: string | null;
  status: AssetReturnRequestStatus;
  verifiedCondition?: AssetCondition | null;
  adminComment?: string | null;
  approvedById?: string | null;
  approvedAt?: string | null;
  rejectedById?: string | null;
  rejectedAt?: string | null;
  rejectedReason?: string | null;
  createdAt: string;
  updatedAt: string;
  asset?: Asset;
  assignment?: AssetAssignment;
  requestedBy?: {
    id: string;
    name: string;
    employeeId: string;
    department?: string | null;
    position?: { title: string } | null;
  };
  approvedBy?: {
    id: string;
    name: string;
  } | null;
  rejectedBy?: {
    id: string;
    name: string;
  } | null;
}

export interface AssetAssignment {
  id: string;
  assetId: string;
  employeeId: string;
  assignedById: string;
  assignedDate: string;
  returnedDate?: string | null;
  conditionOnAssign: AssetCondition;
  conditionOnReturn?: AssetCondition | null;
  status: AssignmentStatus;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  employee?: {
    id: string;
    name: string;
    employeeId: string;
  };
  assigner?: {
    id: string;
    name: string;
  };
  asset?: {
    id: string;
    assetTag: string;
    name: string;
    condition?: AssetCondition;
    serialNumber?: string | null;
  };
  returnRequests?: AssetReturnRequest[];
}

export interface Asset {
  id: string;
  assetTag: string;
  name: string;
  categoryId: string;
  brand?: string | null;
  model?: string | null;
  serialNumber?: string | null;
  purchaseDate?: string | null;
  purchaseCost?: number | null;
  warrantyExpiry?: string | null;
  status: AssetStatus;
  condition: AssetCondition;
  assignedToId?: string | null;
  assignedDate?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  category?: AssetCategory;
  assignedTo?: {
    id: string;
    name: string;
    employeeId: string;
    department?: string | null;
  } | null;
  assignments?: AssetAssignment[];
  returnRequests?: AssetReturnRequest[];
}

export interface CategoryBreakdown {
  categoryId: string;
  categoryName: string;
  count: number;
}

export interface AssetAnalytics {
  totalAssets: number;
  availableAssets: number;
  assignedAssets: number;
  maintenanceAssets: number;
  lostAssets: number;
  totalValuation: number;
  assignmentPercentage: number;
  categoryBreakdown: CategoryBreakdown[];
}
