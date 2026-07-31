import { useQuery, useQueryClient } from '@tanstack/react-query';
import { dashboardApi } from '@/modules/dashboard/api/dashboardApi';
import { currentMonthKey } from '@/shared/utils/dashboardFinancial';

/**
 * Cross-space Action Center for My Spaces / global lists.
 * Mirrors mobile `useGlobalDashboard` (unsynced snapshot + background sync).
 */
export function useGlobalDashboard(enabled: boolean) {
  const month = currentMonthKey();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['global-dashboard', month],
    queryFn: async () => {
      const snapshot = await dashboardApi.getGlobalDashboard(month, false);
      void dashboardApi.getGlobalDashboard(month, true).then((synced) => {
        queryClient.setQueryData(['global-dashboard', month], synced);
      });
      return snapshot;
    },
    enabled,
    staleTime: 30_000,
  });

  return {
    data: query.data ?? null,
    loading: query.isLoading,
    error: query.error,
    reload: async () => {
      const data = await dashboardApi.getGlobalDashboard(month, true);
      queryClient.setQueryData(['global-dashboard', month], data);
      return data;
    },
  };
}
