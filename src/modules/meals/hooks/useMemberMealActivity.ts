import { useQuery } from '@tanstack/react-query';
import { useCallback, useState } from 'react';
import { mealsApi } from '../api/mealsApi';
import type { MemberMealActivityMonth } from '@/shared/types/meals';

function currentMonthKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export function shiftMonthKey(month: string, delta: number): string {
  const [year, monthNum] = month.split('-').map(Number);
  const date = new Date((year ?? 1970), (monthNum ?? 1) - 1 + delta, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function normalizeMonthActivity(data: MemberMealActivityMonth): MemberMealActivityMonth {
  const summary = data.summary ?? {
    acceptedMeals: 0,
    pendingResponses: 0,
    skippedMeals: 0,
    amountGenerated: null,
    paidAmount: null,
    pendingAmount: null,
    currencyCode: 'INR',
  };
  return {
    ...data,
    summary: {
      ...summary,
      amountGenerated:
        summary.amountGenerated != null ? Number(summary.amountGenerated) : null,
      paidAmount: summary.paidAmount != null ? Number(summary.paidAmount) : null,
      pendingAmount: summary.pendingAmount != null ? Number(summary.pendingAmount) : null,
      balanceRemaining:
        summary.balanceRemaining != null ? Number(summary.balanceRemaining) : null,
      balancePurchased:
        summary.balancePurchased != null ? Number(summary.balancePurchased) : null,
      balanceConsumed:
        summary.balanceConsumed != null ? Number(summary.balanceConsumed) : null,
      amountPaidThisMonth:
        summary.amountPaidThisMonth != null ? Number(summary.amountPaidThisMonth) : null,
    },
    days: data.days ?? [],
  };
}

/** Member meal activity month — parity with mobile `useMemberMealActivity`. */
export function useMemberMealActivity(
  spaceId: string | undefined,
  memberId: string | undefined,
  enabled = true,
) {
  const [month, setMonth] = useState(currentMonthKey);

  const query = useQuery({
    queryKey: ['member-meal-activity', spaceId, memberId, month],
    queryFn: async () => {
      const data = await mealsApi.getMemberMealActivity(spaceId!, memberId!, month);
      return normalizeMonthActivity(data);
    },
    enabled: Boolean(enabled && spaceId && memberId),
    staleTime: 15_000,
  });

  const goToPreviousMonth = useCallback(() => {
    setMonth((prev) => shiftMonthKey(prev, -1));
  }, []);

  const goToNextMonth = useCallback(() => {
    setMonth((prev) => shiftMonthKey(prev, 1));
  }, []);

  return {
    month,
    loading: query.isLoading || query.isFetching,
    error: query.error,
    activity: query.data ?? null,
    reload: () => query.refetch(),
    dataUpdatedAt: query.dataUpdatedAt,
    goToPreviousMonth,
    goToNextMonth,
  };
}

export function useMemberMealPaymentEvents(
  spaceId: string | undefined,
  memberId: string | undefined,
  month: string,
  enabled = true,
) {
  const query = useQuery({
    queryKey: ['member-meal-payment-events', spaceId, memberId, month],
    queryFn: () => mealsApi.getMemberMealPaymentEvents(spaceId!, memberId!, month),
    enabled: Boolean(enabled && spaceId && memberId && month),
    staleTime: 15_000,
  });

  return {
    events: query.data ?? [],
    loading: query.isLoading || query.isFetching,
    error: query.error,
    reload: () => query.refetch(),
  };
}

export function useMemberMealActivityDay(
  spaceId: string | undefined,
  memberId: string | undefined,
  date: string | null,
  enabled = true,
) {
  const query = useQuery({
    queryKey: ['member-meal-activity-day', spaceId, memberId, date],
    queryFn: () => mealsApi.getMemberMealActivityDay(spaceId!, memberId!, date!),
    enabled: Boolean(enabled && spaceId && memberId && date),
  });

  return {
    detail: query.data ?? null,
    loading: query.isLoading || query.isFetching,
    error: query.error,
    reload: () => query.refetch(),
  };
}
