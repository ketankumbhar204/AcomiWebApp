import { useQuery } from '@tanstack/react-query';
import { subscriptionPlansApi } from '../api/subscriptionPlansApi';

/** Parity with mobile `useCustomerSubscriptionStatus`. */
export function useCustomerSubscriptionStatus(
  spaceId: string | null | undefined,
  memberId?: string | null,
) {
  const query = useQuery({
    queryKey: ['customer-subscription-status', spaceId, memberId ?? 'me'],
    queryFn: async () => {
      if (!spaceId) return null;
      try {
        return memberId
          ? await subscriptionPlansApi.getCustomerStatus(spaceId, memberId)
          : await subscriptionPlansApi.getMyCustomerStatus(spaceId);
      } catch {
        return null;
      }
    },
    enabled: Boolean(spaceId),
    staleTime: 15_000,
  });

  return {
    status: query.data ?? null,
    loading: query.isLoading || query.isFetching,
    reload: () => query.refetch(),
  };
}
