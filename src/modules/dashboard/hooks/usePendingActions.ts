import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { notificationsApi } from '../api/notificationsApi';
import { currentMonthKey } from '@/shared/utils/dashboardFinancial';
import { filterTenantVisiblePendingActions } from '@/shared/utils/ownerOnlyNotifications';

/**
 * Pending actions for a space.
 * When `isOwnerOperator` is false (TENANT/CUSTOMER), owner-only Action Center
 * types are filtered — parity with mobile `usePendingActions(..., false)`.
 */
export function usePendingActions(
  spaceId: string | undefined,
  enabled: boolean,
  isOwnerOperator = true,
) {
  const month = currentMonthKey();

  const query = useQuery({
    queryKey: ['pending-actions', spaceId, month, isOwnerOperator ? 'ops' : 'tenant'],
    queryFn: () => notificationsApi.getPendingActions(spaceId!, month),
    enabled: Boolean(enabled && spaceId),
    staleTime: 30_000,
  });

  const summary = useMemo(() => {
    const raw = query.data ?? null;
    return isOwnerOperator ? raw : filterTenantVisiblePendingActions(raw);
  }, [isOwnerOperator, query.data]);

  return {
    loading: query.isLoading || query.isFetching,
    error: query.error,
    summary,
    totalCount: summary?.totalCount ?? 0,
    groups: summary?.groups ?? [],
    reload: () => query.refetch(),
  };
}
