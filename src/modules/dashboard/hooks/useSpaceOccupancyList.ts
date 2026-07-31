import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { dashboardDrilldownApi, type OccupancyListItem } from '../api/dashboardDrilldownApi';
import { currentMonthKey } from '@/shared/utils/dashboardFinancial';

export type DashboardOccupancyListMode = 'active' | 'moveInsThisMonth';

function occupancyMatchesQuery(occupancy: OccupancyListItem, query: string): boolean {
  const needle = query.trim().toLowerCase();
  if (!needle) {
    return true;
  }
  const haystack = [
    occupancy.memberName,
    occupancy.buildingName,
    occupancy.floorName,
    occupancy.unitName,
    occupancy.roomName,
    occupancy.bedName,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return haystack.includes(needle);
}

function occupancyMatchesMode(
  occupancy: OccupancyListItem,
  mode: DashboardOccupancyListMode,
): boolean {
  if (mode === 'active') {
    return occupancy.status === 'ACTIVE';
  }
  const month = currentMonthKey();
  const moveIn = occupancy.moveInDate ?? occupancy.actualMoveInAt?.slice(0, 10);
  return occupancy.status === 'ACTIVE' && moveIn?.startsWith(`${month}-`) === true;
}

export function useSpaceOccupancyList(
  spaceId: string | undefined,
  mode: DashboardOccupancyListMode,
  query = '',
  enabled = true,
) {
  const listQuery = useQuery({
    queryKey: ['occupancies', spaceId, 'ACTIVE'],
    queryFn: () => dashboardDrilldownApi.listOccupancies(spaceId!, { status: 'ACTIVE', size: 500 }),
    enabled: Boolean(enabled && spaceId),
    staleTime: 30_000,
  });

  const items = useMemo(() => {
    const rows = listQuery.data?.content ?? [];
    return rows.filter(
      (row) => occupancyMatchesMode(row, mode) && occupancyMatchesQuery(row, query),
    );
  }, [listQuery.data?.content, mode, query]);

  return {
    items,
    loading: listQuery.isLoading || listQuery.isFetching,
    error: listQuery.error,
    reload: () => listQuery.refetch(),
  };
}
