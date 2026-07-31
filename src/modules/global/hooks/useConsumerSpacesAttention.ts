import { useQueries } from '@tanstack/react-query';
import { useMemo } from 'react';
import { notificationsApi } from '@/modules/dashboard/api/notificationsApi';
import { isConsumerMembershipRole } from '@/modules/onboarding/utils/profileCompletion';
import type { MembershipRole } from '@/shared/types/space';
import { currentMonthKey } from '@/shared/utils/dashboardFinancial';
import { filterTenantVisiblePendingActions } from '@/shared/utils/ownerOnlyNotifications';
import {
  buildSpaceAttentionSummary,
  type SpaceAttentionSummary,
} from '@/shared/utils/spaceAttentionSummary';

type SpaceRef = {
  spaceId: string;
  membershipRole: MembershipRole;
};

/**
 * Loads tenant-visible pending-action summaries for customer/tenant spaces only.
 * Mirrors mobile `useConsumerSpacesAttention`.
 */
export function useConsumerSpacesAttention(spaces: SpaceRef[], enabled: boolean) {
  const month = currentMonthKey();
  const consumerSpaceIds = useMemo(
    () =>
      spaces
        .filter((space) => isConsumerMembershipRole(space.membershipRole))
        .map((space) => space.spaceId),
    [spaces],
  );

  const queries = useQueries({
    queries: consumerSpaceIds.map((spaceId) => ({
      queryKey: ['consumer-attention', spaceId, month],
      queryFn: async () => {
        const raw = await notificationsApi.getPendingActions(spaceId, month);
        const filtered = filterTenantVisiblePendingActions(raw);
        return buildSpaceAttentionSummary(filtered);
      },
      enabled: enabled && consumerSpaceIds.length > 0,
      staleTime: 30_000,
    })),
  });

  const bySpaceId = useMemo(() => {
    const next: Record<string, SpaceAttentionSummary> = {};
    consumerSpaceIds.forEach((spaceId, index) => {
      next[spaceId] =
        queries[index]?.data ??
        ({ totalCount: 0, items: [], primary: null, moreCount: 0 } satisfies SpaceAttentionSummary);
    });
    return next;
  }, [consumerSpaceIds, queries]);

  return {
    bySpaceId,
    loading: queries.some((q) => q.isLoading || q.isFetching),
    hasConsumerSpaces: consumerSpaceIds.length > 0,
    reload: () => Promise.all(queries.map((q) => q.refetch())),
  };
}
