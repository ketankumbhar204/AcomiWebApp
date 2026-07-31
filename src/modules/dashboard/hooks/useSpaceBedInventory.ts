import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { accommodationApi } from '@/modules/accommodation/api/accommodationApi';
import type { AccommodationStatus } from '@/shared/types/accommodation';
import type { BedSpaceListItem } from '../api/dashboardDrilldownApi';

export type BedInventoryFilters = {
  buildingId?: string;
  floorId?: string;
  unitId?: string;
};

export function useSpaceBedInventory(
  spaceId: string | undefined,
  status: string | undefined,
  query = '',
  enabled = true,
  filters: BedInventoryFilters = {},
) {
  const apiStatus =
    status && status !== 'ALL' ? (status as AccommodationStatus) : undefined;

  const listQuery = useQuery({
    queryKey: [
      'beds',
      spaceId,
      status ?? 'ALL',
      filters.buildingId ?? null,
      filters.floorId ?? null,
      filters.unitId ?? null,
      query.trim() || null,
    ],
    queryFn: () =>
      accommodationApi.searchBeds(spaceId!, {
        status: apiStatus,
        query: query.trim() || undefined,
        buildingId: filters.buildingId,
        floorId: filters.floorId,
        unitId: filters.unitId,
        size: 500,
      }),
    enabled: Boolean(enabled && spaceId),
    staleTime: 30_000,
  });

  const items: BedSpaceListItem[] = useMemo(
    () =>
      (listQuery.data?.content ?? []).map((bed) => ({
        bedId: bed.bedId,
        label: bed.label,
        status: bed.status,
        buildingId: bed.buildingId,
        buildingName: bed.buildingName,
        floorId: bed.floorId,
        floorName: bed.floorName,
        unitId: bed.unitId,
        unitName: bed.unitName,
        roomId: bed.roomId,
        roomName: bed.roomName,
      })),
    [listQuery.data?.content],
  );

  return {
    items,
    loading: listQuery.isLoading || listQuery.isFetching,
    error: listQuery.error,
    totalElements: listQuery.data?.totalElements ?? items.length,
    reload: () => listQuery.refetch(),
  };
}
