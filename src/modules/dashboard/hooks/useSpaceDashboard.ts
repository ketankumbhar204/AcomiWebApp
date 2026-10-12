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

/**
 * Payment Summary for a month other than the live dashboard month.
 * Property and meal sections stay on the current month.
 */
export function useDashboardMonthFinancial(
  spaceId: string | undefined,
  spaceType: SpaceType | undefined,
  month: string,
  enabled: boolean,
) {
  const current = currentMonthKey();
  const active = Boolean(enabled && spaceId && spaceType && month !== current);
  const query = useQuery({
    queryKey: ['dashboard-summary', spaceId, month],
    queryFn: () => dashboardApi.getDashboardSummary(spaceId!, spaceType!, month),
    enabled: active,
    staleTime: 15_000,
  });

  return {
    active,
    loading: active && (query.isLoading || query.isFetching),
    error: active && query.isError,
    financial: active ? (query.data?.financial ?? null) : null,
    reload: () => void query.refetch(),
  };
}
