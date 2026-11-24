import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { memberApi } from '../api/memberApi';
import type { MemberDirectorySearchParams } from '@/shared/types/member';

export const MEMBER_DIRECTORY_DEBOUNCE_MS = 300;

export function memberDirectoryQueryKey(params: MemberDirectorySearchParams) {
  return [
    'member-directory',
    params.search?.trim() ?? '',
    params.page ?? 0,
    params.size ?? 20,
    params.spaceId ?? '',
    params.spaceType ?? '',
    params.status ?? '',
  ] as const;
}

/**
 * Owner-level unique member directory (GET /members/directory).
 * `search` is debounced; changing any filter is expected to reset `page` in the caller.
 */
export function useMemberDirectory(params: MemberDirectorySearchParams, enabled = true) {
  const [debouncedSearch, setDebouncedSearch] = useState(params.search ?? '');

  useEffect(() => {
    const id = window.setTimeout(
      () => setDebouncedSearch(params.search ?? ''),
      MEMBER_DIRECTORY_DEBOUNCE_MS,
    );
    return () => window.clearTimeout(id);
  }, [params.search]);

  const effective: MemberDirectorySearchParams = { ...params, search: debouncedSearch };

  const query = useQuery({
    queryKey: memberDirectoryQueryKey(effective),
    queryFn: () => memberApi.getDirectory(effective),
    enabled,
    staleTime: 15_000,
    placeholderData: keepPreviousData,
  });

  return {
    people: query.data?.content ?? [],
    page: query.data?.page ?? params.page ?? 0,
    size: query.data?.size ?? params.size ?? 20,
    totalElements: query.data?.totalElements ?? 0,
    totalPages: query.data?.totalPages ?? 0,
    loading: query.isLoading || query.isFetching,
    error: query.error,
    reload: () => query.refetch(),
  };
}
