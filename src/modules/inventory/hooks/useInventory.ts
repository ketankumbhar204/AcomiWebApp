import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { inventoryApi } from '../api/inventoryApi';
import type {
  CreateInventoryCategoryRequest,
  CreateInventoryItemRequest,
  CreateInventorySupplierRequest,
  InventoryStockMoveRequest,
  UpdateInventoryItemRequest,
} from '@/shared/types/inventory';

export function useInventoryDashboard(spaceId: string | undefined, enabled = true) {
  const query = useQuery({
    queryKey: ['inventory-dashboard', spaceId],
    queryFn: () => inventoryApi.getDashboard(spaceId!),
    enabled: Boolean(enabled && spaceId),
    staleTime: 20_000,
  });
  return {
    dashboard: query.data ?? null,
    loading: query.isLoading || query.isFetching,
    error: query.error,
    reload: () => query.refetch(),
  };
}

export function useInventoryItems(
  spaceId: string | undefined,
  categoryId?: string,
  enabled = true,
) {
  const query = useQuery({
    queryKey: ['inventory-items', spaceId, categoryId ?? null],
    queryFn: () => inventoryApi.listItems(spaceId!, categoryId),
    enabled: Boolean(enabled && spaceId),
    staleTime: 15_000,
  });
  return {
    items: query.data ?? [],
    loading: query.isLoading || query.isFetching,
    error: query.error,
    reload: () => query.refetch(),
  };
}

export function useInventoryItem(
  spaceId: string | undefined,
  itemId: string | undefined,
  enabled = true,
) {
  const query = useQuery({
    queryKey: ['inventory-item', spaceId, itemId],
    queryFn: () => inventoryApi.getItem(spaceId!, itemId!),
    enabled: Boolean(enabled && spaceId && itemId),
    staleTime: 10_000,
  });
  return {
    item: query.data ?? null,
    loading: query.isLoading || query.isFetching,
    error: query.error,
    reload: () => query.refetch(),
  };
}

export function useInventoryCategories(spaceId: string | undefined, enabled = true) {
  const query = useQuery({
    queryKey: ['inventory-categories', spaceId],
    queryFn: () => inventoryApi.listCategories(spaceId!),
    enabled: Boolean(enabled && spaceId),
    staleTime: 30_000,
  });
  return {
    categories: query.data ?? [],
    loading: query.isLoading || query.isFetching,
    error: query.error,
    reload: () => query.refetch(),
  };
}

export function useInventorySuppliers(spaceId: string | undefined, enabled = true) {
  const query = useQuery({
    queryKey: ['inventory-suppliers', spaceId],
    queryFn: () => inventoryApi.listSuppliers(spaceId!),
    enabled: Boolean(enabled && spaceId),
    staleTime: 30_000,
  });
  return {
    suppliers: query.data ?? [],
    loading: query.isLoading || query.isFetching,
    error: query.error,
    reload: () => query.refetch(),
  };
}

export function useInventoryTransactions(
  spaceId: string | undefined,
  itemId?: string,
  enabled = true,
) {
  const query = useQuery({
    queryKey: ['inventory-transactions', spaceId, itemId ?? null],
    queryFn: () => inventoryApi.listTransactions(spaceId!, itemId),
    enabled: Boolean(enabled && spaceId),
    staleTime: 15_000,
  });
  return {
    transactions: query.data ?? [],
    loading: query.isLoading || query.isFetching,
    error: query.error,
    reload: () => query.refetch(),
  };
}

export function useInventoryMutations(spaceId: string | undefined) {
  const queryClient = useQueryClient();

  const invalidate = async () => {
    await queryClient.invalidateQueries({
      predicate: (q) => String(q.queryKey[0]).includes('inventory'),
    });
  };

  return {
    createItem: useMutation({
      mutationFn: (body: CreateInventoryItemRequest) => inventoryApi.createItem(spaceId!, body),
      onSuccess: invalidate,
    }),
    updateItem: useMutation({
      mutationFn: ({ itemId, body }: { itemId: string; body: UpdateInventoryItemRequest }) =>
        inventoryApi.updateItem(spaceId!, itemId, body),
      onSuccess: invalidate,
    }),
    deleteItem: useMutation({
      mutationFn: (itemId: string) => inventoryApi.deleteItem(spaceId!, itemId),
      onSuccess: invalidate,
    }),
    stockMove: useMutation({
      mutationFn: ({ itemId, body }: { itemId: string; body: InventoryStockMoveRequest }) =>
        inventoryApi.stockMove(spaceId!, itemId, body),
      onSuccess: invalidate,
    }),
    createCategory: useMutation({
      mutationFn: (body: CreateInventoryCategoryRequest) =>
        inventoryApi.createCategory(spaceId!, body),
      onSuccess: invalidate,
    }),
    deleteCategory: useMutation({
      mutationFn: (categoryId: string) => inventoryApi.deleteCategory(spaceId!, categoryId),
      onSuccess: invalidate,
    }),
    createSupplier: useMutation({
      mutationFn: (body: CreateInventorySupplierRequest) =>
        inventoryApi.createSupplier(spaceId!, body),
      onSuccess: invalidate,
    }),
  };
}
