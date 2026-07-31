/** Inventory domain — backend `/spaces/{id}/inventory` is source of truth. */

export type InventoryUnit =
  | 'KG'
  | 'LITRE'
  | 'PIECE'
  | 'PACKET'
  | 'DOZEN'
  | 'METRE'
  | 'SET'
  | 'OTHER';

export type InventoryStockStatus =
  | 'HEALTHY'
  | 'LOW'
  | 'CRITICAL'
  | 'OUT_OF_STOCK'
  | 'DISCONTINUED'
  | 'INACTIVE';

export type InventoryTxnType =
  | 'STOCK_IN'
  | 'STOCK_OUT'
  | 'ADJUSTMENT'
  | 'TRANSFER'
  | 'PURCHASE'
  | 'CONSUMPTION';

export type InventoryProfileKind = 'FOOD' | 'ASSET' | 'FURNITURE';

export type InventoryCategory = {
  categoryId: string;
  spaceId: string;
  name: string;
  code: string;
  iconKey: string;
  sortOrder: number;
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
};

export type InventorySupplier = {
  supplierId: string;
  spaceId: string;
  name: string;
  phone?: string | null;
  address?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type InventoryItem = {
  itemId: string;
  spaceId: string;
  name: string;
  categoryId: string;
  unit: InventoryUnit;
  currentStock: number;
  reservedStock: number;
  minimumStock: number;
  location?: string | null;
  supplierId?: string | null;
  purchasePrice?: number | null;
  averagePrice?: number | null;
  barcode?: string | null;
  notes?: string | null;
  statusOverride?: InventoryStockStatus | null;
  imageUri?: string | null;
  expiresAt?: string | null;
  warrantyUntil?: string | null;
  assignedEntityType?: 'ROOM' | 'BED' | 'MEMBER' | 'UNIT' | null;
  assignedEntityId?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type InventoryTransaction = {
  transactionId: string;
  spaceId: string;
  itemId: string;
  itemName: string;
  type: InventoryTxnType;
  quantity: number;
  unit: InventoryUnit;
  reason?: string | null;
  reference?: string | null;
  supplierId?: string | null;
  supplierName?: string | null;
  amount?: number | null;
  actorName?: string | null;
  createdAt: string;
};

export type InventoryDashboardSummary = {
  totalItems: number;
  inventoryValue: number;
  lowStockCount: number;
  outOfStockCount: number;
  supplierCount: number;
  recentPurchases: InventoryTransaction[];
  recentConsumption: InventoryTransaction[];
  criticalItems: InventoryItem[];
};

export type CreateInventoryItemRequest = {
  name: string;
  categoryId: string;
  unit: InventoryUnit;
  openingStock: number;
  minimumStock: number;
  location?: string | null;
  supplierId?: string | null;
  purchasePrice?: number | null;
  barcode?: string | null;
  notes?: string | null;
};

export type UpdateInventoryItemRequest = {
  name?: string;
  categoryId?: string;
  unit?: InventoryUnit;
  minimumStock?: number;
  location?: string | null;
  supplierId?: string | null;
  purchasePrice?: number | null;
  averagePrice?: number | null;
  barcode?: string | null;
  notes?: string | null;
  statusOverride?: InventoryStockStatus | null;
};

export type InventoryStockMoveRequest = {
  type: InventoryTxnType;
  quantity: number;
  reason?: string | null;
  reference?: string | null;
  supplierId?: string | null;
  amount?: number | null;
  setAbsoluteStock?: number | null;
  actorName?: string | null;
};

export type CreateInventoryCategoryRequest = {
  name: string;
  iconKey?: string;
};

export type CreateInventorySupplierRequest = {
  name: string;
  phone?: string | null;
  address?: string | null;
  notes?: string | null;
};

export type InventoryItemListFilter =
  | 'ALL'
  | 'LOW'
  | 'CRITICAL'
  | 'OUT_OF_STOCK'
  | 'HEALTHY'
  | 'ATTENTION';
