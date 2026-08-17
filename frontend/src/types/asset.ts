export type AssetStatus = "AVAILABLE" | "ASSIGNED" | "UNDER_MAINTENANCE" | "DISPOSED" | "LOST";

export type AssetCondition = "NEW" | "EXCELLENT" | "GOOD" | "FAIR" | "DAMAGED";

export type AssignmentStatus = "ACTIVE" | "RETURNED";

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
