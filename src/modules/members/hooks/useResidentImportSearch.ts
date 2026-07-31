import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { memberApi } from '../api/memberApi';
import type { MemberImportCandidateResponse } from '@/shared/types/member';

export type ResidentPickerItem = MemberImportCandidateResponse & {
  needsImport: boolean;
};

function toPickerItem(candidate: MemberImportCandidateResponse): ResidentPickerItem {
  return {
    ...candidate,
    needsImport: !candidate.alreadyInTargetSpace,
  };
}

/**
 * Cross-space eligible resident search.
 * Mirrors mobile `useResidentImportSearch` (GET import-candidates).
 */
export function useResidentImportSearch(spaceId: string | undefined, query: string, enabled = true) {
  const [debounced, setDebounced] = useState(query);

  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(query), 300);
    return () => window.clearTimeout(id);
  }, [query]);

  const searchQuery = useQuery({
    queryKey: ['import-candidates', spaceId, debounced.trim()],
    queryFn: async () => {
      const data = await memberApi.searchImportCandidates(
        spaceId!,
        debounced.trim() || undefined,
      );
      return data.filter((item) => item.availableForMoveIn).map(toPickerItem);
    },
    enabled: Boolean(enabled && spaceId),
    staleTime: 15_000,
  });

  return {
    members: searchQuery.data ?? [],
    loading: searchQuery.isLoading || searchQuery.isFetching,
    error: searchQuery.error,
    refetch: () => searchQuery.refetch(),
  };
}
