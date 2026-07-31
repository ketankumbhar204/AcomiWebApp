import { useQuery } from '@tanstack/react-query';
import { memberMealBalanceApi } from '../api/memberMealBalanceApi';
import { memberRelatedApi } from '../api/memberRelatedApi';
import { memberApi } from '../api/memberApi';
import { currentMonthKey } from '@/shared/utils/dashboardFinancial';

export function useMemberMealBalance(
  spaceId: string | undefined,
  memberId: string | undefined,
  enabled = true,
) {
  const query = useQuery({
    queryKey: ['member-meal-balance', spaceId, memberId],
    queryFn: () => memberMealBalanceApi.getBalance(spaceId!, memberId!),
    enabled: Boolean(enabled && spaceId && memberId),
    staleTime: 15_000,
  });

  return {
    balance: query.data ?? null,
    loading: query.isLoading || query.isFetching,
    error: query.error,
    reload: () => query.refetch(),
  };
}

export function useMemberSubscriptionHistory(
  spaceId: string | undefined,
  memberId: string | undefined,
  enabled = true,
) {
  const query = useQuery({
    queryKey: ['member-subscription-history', spaceId, memberId],
    queryFn: () => memberMealBalanceApi.getSubscriptionHistory(spaceId!, memberId!),
    enabled: Boolean(enabled && spaceId && memberId),
    staleTime: 30_000,
  });

  return {
    history: query.data ?? null,
    loading: query.isLoading || query.isFetching,
    error: query.error,
    reload: () => query.refetch(),
  };
}

export function useMemberOccupancies(
  spaceId: string | undefined,
  memberId: string | undefined,
  enabled = true,
) {
  const query = useQuery({
    queryKey: ['member-occupancies', spaceId, memberId],
    queryFn: () => memberRelatedApi.getMemberOccupancies(spaceId!, memberId!),
    enabled: Boolean(enabled && spaceId && memberId),
    staleTime: 30_000,
  });

  return {
    data: query.data ?? null,
    loading: query.isLoading || query.isFetching,
    error: query.error,
    reload: () => query.refetch(),
  };
}

export function useMemberPayments(
  spaceId: string | undefined,
  memberId: string | undefined,
  enabled = true,
) {
  const month = currentMonthKey();
  const query = useQuery({
    queryKey: ['member-payments', spaceId, memberId, month],
    queryFn: () => memberRelatedApi.listMemberPayments(spaceId!, memberId!, month),
    enabled: Boolean(enabled && spaceId && memberId),
    staleTime: 20_000,
  });

  return {
    payments: query.data?.payments ?? [],
    month: query.data?.month ?? month,
    loading: query.isLoading || query.isFetching,
    error: query.error,
    reload: () => query.refetch(),
  };
}

export function useMemberAuditHistory(
  spaceId: string | undefined,
  memberId: string | undefined,
  enabled = true,
) {
  const query = useQuery({
    queryKey: ['member-history', spaceId, memberId],
    queryFn: () => memberApi.getMemberHistory(spaceId!, memberId!),
    enabled: Boolean(enabled && spaceId && memberId),
    staleTime: 30_000,
  });

  return {
    history: query.data ?? [],
    loading: query.isLoading || query.isFetching,
    error: query.error,
    reload: () => query.refetch(),
  };
}

export function useMemberNotes(
  spaceId: string | undefined,
  memberId: string | undefined,
  enabled = true,
) {
  const query = useQuery({
    queryKey: ['member-notes', spaceId, memberId],
    queryFn: () => memberApi.getMemberNotes(spaceId!, memberId!),
    enabled: Boolean(enabled && spaceId && memberId),
    staleTime: 20_000,
  });

  return {
    notes: query.data ?? [],
    loading: query.isLoading || query.isFetching,
    error: query.error,
    reload: () => query.refetch(),
  };
}

export function useMemberDocuments(
  spaceId: string | undefined,
  memberId: string | undefined,
  enabled = true,
) {
  const query = useQuery({
    queryKey: ['member-documents', spaceId, memberId],
    queryFn: () => memberApi.getMemberDocuments(spaceId!, memberId!),
    enabled: Boolean(enabled && spaceId && memberId),
    staleTime: 20_000,
  });

  return {
    documents: query.data ?? [],
    loading: query.isLoading || query.isFetching,
    error: query.error,
    reload: () => query.refetch(),
  };
}
