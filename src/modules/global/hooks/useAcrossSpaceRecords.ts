import { useQueries } from '@tanstack/react-query';
import { useMemo } from 'react';
import type { MySpaceResponse } from '@/shared/types/space';

/**
 * Fetches a list per space and flattens the results.
 * Per-space failures (403/404/network) are skipped so one space cannot blank the page.
 */
export function useAcrossSpaceRecords<T>(
  spaces: MySpaceResponse[],
  queryKey: string,
  fetchForSpace: (space: MySpaceResponse) => Promise<T[]>,
) {
  const queries = useQueries({
    queries: spaces.map((space) => ({
      queryKey: ['global-directory', queryKey, space.spaceId],
      queryFn: async (): Promise<T[]> => {
        try {
          return await fetchForSpace(space);
        } catch {
          return [];
        }
      },
      enabled: spaces.length > 0,
      staleTime: 20_000,
    })),
  });

  const rows = useMemo(
    () => queries.flatMap((query) => query.data ?? []),
    [queries],
  );

  const loading = spaces.length > 0 && queries.some((query) => query.isLoading || query.isFetching);

  return {
    rows,
    loading,
    reload: () => Promise.all(queries.map((query) => query.refetch())),
  };
}
