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

/** Same order as Android `moveInPickerRank`. Eligibility is `availableForMoveIn` only. */
export function moveInPickerRank(item: {
  availableForMoveIn?: boolean;
  alreadyInTargetSpace?: boolean;
  occupancyStatus?: string | null;
}): number {
  const available = item.availableForMoveIn === true;
  const inTarget = item.alreadyInTargetSpace === true;
  const stayElsewhere =
    !inTarget &&
    (item.occupancyStatus === 'ALLOCATED' || item.occupancyStatus === 'RESERVED');
  if (available && !inTarget && !stayElsewhere) {
    return 0;
  }
  if (available && inTarget) {
    return 1;
  }
  if (available && stayElsewhere) {
    return 2;
  }
  if (!available && inTarget) {
    return 3;
  }
  return 4;
}

function compareMoveInPickerItems(left: ResidentPickerItem, right: ResidentPickerItem): number {
  const rank = moveInPickerRank(left) - moveInPickerRank(right);
  if (rank !== 0) {
    return rank;
  }
  return (left.fullName ?? '').localeCompare(right.fullName ?? '', undefined, {
    sensitivity: 'base',
  });
}

export function importCandidatesQueryKey(spaceId: string, search = '') {
  return ['import-candidates', spaceId, search.trim()] as const;
}

/** Move-in search hides busy people. Import lists them, including people already here. */
export async function loadImportPickerItems(
  spaceId: string,
  search?: string,
  options?: { includeUnavailable?: boolean },
): Promise<ResidentPickerItem[]> {
  const data = await memberApi.searchImportCandidates(spaceId, search);
  const includeUnavailable = options?.includeUnavailable === true;
  return data
    .filter((item) => includeUnavailable || item.availableForMoveIn)
    .map(toPickerItem)
    .sort(compareMoveInPickerItems);
}

/**
 * Cross-space eligible resident search.
 * Mirrors mobile `useResidentImportSearch` (GET import-candidates).
 */
export function useResidentImportSearch(
  spaceId: string | undefined,
  query: string,
  enabled = true,
  includeUnavailable = false,
) {
  const [debounced, setDebounced] = useState(query);

  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(query), 300);
    return () => window.clearTimeout(id);
  }, [query]);

  const searchQuery = useQuery({
    queryKey: [...importCandidatesQueryKey(spaceId ?? '', debounced), includeUnavailable] as const,
    queryFn: () =>
      loadImportPickerItems(spaceId!, debounced.trim() || undefined, { includeUnavailable }),
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
