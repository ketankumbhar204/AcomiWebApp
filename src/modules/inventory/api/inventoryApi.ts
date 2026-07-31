import apiClient from '@/shared/api/client';
import { unwrapApiResponse, unwrapVoidResponse } from '@/shared/api/apiRequest';
import type { ApiResponse } from '@/shared/types/api';
import type {
  CreateInventoryCategoryRequest,
  CreateInventoryItemRequest,
  CreateInventorySupplierRequest,
  InventoryCategory,
  InventoryDashboardSummary,
  InventoryItem,
  InventoryStockMoveRequest,
  InventorySupplier,
  InventoryTransaction,
  UpdateInventoryItemRequest,
} from '@/shared/types/inventory';

function toNumber(value: unknown, fallback = 0): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
}

function normalizeItem(raw: InventoryItem): InventoryItem {
  return {
    ...raw,
    currentStock: toNumber(raw.currentStock),
    reservedStock: toNumber(raw.reservedStock),
    minimumStock: toNumber(raw.minimumStock),
    purchasePrice: raw.purchasePrice == null ? null : toNumber(raw.purchasePrice),
    averagePrice: raw.averagePrice == null ? null : toNumber(raw.averagePrice),
  };
}

function normalizeTransaction(raw: InventoryTransaction): InventoryTransaction {
  return {
    ...raw,
    quantity: toNumber(raw.quantity),
    amount: raw.amount == null ? null : toNumber(raw.amount),
  };
}

function normalizeDashboard(raw: InventoryDashboardSummary): InventoryDashboardSummary {
  return {
    ...raw,
    totalItems: toNumber(raw.totalItems),
    inventoryValue: toNumber(raw.inventoryValue),
    lowStockCount: toNumber(raw.lowStockCount),
    outOfStockCount: toNumber(raw.outOfStockCount),
    supplierCount: toNumber(raw.supplierCount),
    recentPurchases: (raw.recentPurchases ?? []).map(normalizeTransaction),
    recentConsumption: (raw.recentConsumption ?? []).map(normalizeTransaction),
    criticalItems: (raw.criticalItems ?? []).map(normalizeItem),
  };
}

export const inventoryApi = {
  getDashboard: async (spaceId: string) => {
    const raw = await unwrapApiResponse(
      apiClient.get<ApiResponse<InventoryDashboardSummary>>(
        `/spaces/${spaceId}/inventory/dashboard`,
      ),
    );
    return normalizeDashboard(raw);
  },

  listItems: async (spaceId: string, categoryId?: string) => {
    const raw = await unwrapApiResponse(
      apiClient.get<ApiResponse<InventoryItem[]>>(`/spaces/${spaceId}/inventory/items`, {
        params: categoryId ? { categoryId } : undefined,
      }),
    );
    return raw.map(normalizeItem).sort((a, b) => a.name.localeCompare(b.name));
  },

  getItem: async (spaceId: string, itemId: string) => {
    const raw = await unwrapApiResponse(
      apiClient.get<ApiResponse<InventoryItem>>(
        `/spaces/${spaceId}/inventory/items/${itemId}`,
      ),
    );
    return normalizeItem(raw);
  },

  createItem: (spaceId: string, body: CreateInventoryItemRequest) =>
    unwrapApiResponse(
      apiClient.post<ApiResponse<InventoryItem>>(`/spaces/${spaceId}/inventory/items`, body),
    ).then(normalizeItem),

  updateItem: (spaceId: string, itemId: string, body: UpdateInventoryItemRequest) =>
    unwrapApiResponse(
      apiClient.put<ApiResponse<InventoryItem>>(
        `/spaces/${spaceId}/inventory/items/${itemId}`,
        body,
      ),
    ).then(normalizeItem),

  deleteItem: (spaceId: string, itemId: string) =>
    unwrapVoidResponse(
      apiClient.delete(`/spaces/${spaceId}/inventory/items/${itemId}`),
    ),

  stockMove: (spaceId: string, itemId: string, body: InventoryStockMoveRequest) =>
    unwrapApiResponse(
      apiClient.post<ApiResponse<InventoryItem>>(
        `/spaces/${spaceId}/inventory/items/${itemId}/stock-moves`,
        body,
      ),
    ).then(normalizeItem),

  listTransactions: async (spaceId: string, itemId?: string) => {
    const raw = await unwrapApiResponse(
      apiClient.get<ApiResponse<InventoryTransaction[]>>(
        `/spaces/${spaceId}/inventory/transactions`,
        { params: itemId ? { itemId } : undefined },
      ),
    );
    return raw.map(normalizeTransaction);
  },

  listCategories: async (spaceId: string) => {
    const raw = await unwrapApiResponse(
      apiClient.get<ApiResponse<InventoryCategory[]>>(
        `/spaces/${spaceId}/inventory/categories`,
      ),
    );
    return [...raw].sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
  },

  createCategory: (spaceId: string, body: CreateInventoryCategoryRequest) =>
    unwrapApiResponse(
      apiClient.post<ApiResponse<InventoryCategory>>(
        `/spaces/${spaceId}/inventory/categories`,
        body,
      ),
    ),

  deleteCategory: (spaceId: string, categoryId: string) =>
    unwrapVoidResponse(
      apiClient.delete(`/spaces/${spaceId}/inventory/categories/${categoryId}`),
    ),

  listSuppliers: async (spaceId: string) => {
    const raw = await unwrapApiResponse(
      apiClient.get<ApiResponse<InventorySupplier[]>>(
        `/spaces/${spaceId}/inventory/suppliers`,
      ),
    );
    return [...raw].sort((a, b) => a.name.localeCompare(b.name));
  },

  createSupplier: (spaceId: string, body: CreateInventorySupplierRequest) =>
    unwrapApiResponse(
      apiClient.post<ApiResponse<InventorySupplier>>(
        `/spaces/${spaceId}/inventory/suppliers`,
        body,
      ),
    ),
};
