import { useQuery } from '@tanstack/react-query';
import { notificationsApi } from '../api/notificationsApi';
import { currentMonthKey } from '@/shared/utils/dashboardFinancial';

export function usePendingActions(spaceId: string | undefined, enabled: boolean) {
  const month = currentMonthKey();

  const query = useQuery({
    queryKey: ['pending-actions', spaceId, month],
    queryFn: () => notificationsApi.getPendingActions(spaceId!, month),
    enabled: Boolean(enabled && spaceId),
    staleTime: 30_000,
  });

  return {
    loading: query.isLoading || query.isFetching,
    error: query.error,
    summary: query.data ?? null,
    totalCount: query.data?.totalCount ?? 0,
    groups: query.data?.groups ?? [],
    reload: () => query.refetch(),
  };
}
