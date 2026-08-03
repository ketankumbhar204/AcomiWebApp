import { useQuery } from '@tanstack/react-query';
import { memberApi } from '@/modules/members/api/memberApi';
import { useAuthSession } from '@/shared/hooks/useAuthSession';
import type { MemberResponse } from '@/shared/types/member';

/**
 * Resolves the member record linked to the signed-in user within a space.
 * Parity with mobile `useLinkedMember` (TENANT / CUSTOMER flows).
 */
export function useLinkedMember(spaceId: string | null | undefined) {
  const { userId } = useAuthSession();

  const query = useQuery({
    queryKey: ['linked-member', spaceId, userId],
    queryFn: async (): Promise<MemberResponse | null> => {
      if (!spaceId || !userId) return null;
      try {
        return await memberApi.getMyLinkedMember(spaceId);
      } catch {
        try {
          const members = await memberApi.getMembers(spaceId);
          return members.find((item) => item.linkedUserId === userId) ?? null;
        } catch {
          return null;
        }
      }
    },
    enabled: Boolean(spaceId && userId),
    staleTime: 30_000,
  });

  return {
    member: query.data ?? null,
    memberId: query.data?.memberId ?? null,
    loading: query.isLoading || query.isFetching,
    refresh: () => query.refetch(),
  };
}
