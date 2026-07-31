import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '../api/dashboardApi';
import type { SpaceType } from '@/shared/types/space';
import { currentMonthKey } from '@/shared/utils/dashboardFinancial';

export function useSpaceDashboard(spaceId: string | undefined, spaceType: SpaceType | undefined, enabled: boolean) {
  const month = currentMonthKey();

  const query = useQuery({
    queryKey: ['dashboard-summary', spaceId, month],
    queryFn: () => dashboardApi.getDashboardSummary(spaceId!, spaceType!, month),
    enabled: Boolean(enabled && spaceId && spaceType),
    staleTime: 30_000,
  });

  const summary = query.data ?? null;

  return {
    loading: query.isLoading || query.isFetching,
    error: query.error,
    summary,
    financial: summary?.financial ?? null,
    accommodationOperations: summary?.accommodationOperations ?? null,
    messOperations: summary?.messOperations ?? null,
    pendingActions: summary?.pendingActions ?? null,
    month,
    reload: () => query.refetch(),
  };
}
