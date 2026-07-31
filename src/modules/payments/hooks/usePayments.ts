import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { paymentsApi } from '../api/paymentsApi';
import type {
  ListSpacePaymentsParams,
  PaymentsReviewQueueParam,
  ReviewPaymentRequest,
  SubmitPaymentProofRequest,
} from '@/shared/types/payments';
import { currentMonthKey } from '@/shared/utils/dashboardFinancial';

export function usePaymentsSummary(
  spaceId: string | undefined,
  month: string,
  enabled = true,
) {
  const query = useQuery({
    queryKey: ['payments-summary', spaceId, month],
    queryFn: () => paymentsApi.getPaymentsSummary(spaceId!, month),
    enabled: Boolean(enabled && spaceId && month),
    staleTime: 20_000,
  });
  return {
    summary: query.data ?? null,
    loading: query.isLoading || query.isFetching,
    error: query.error,
    reload: () => query.refetch(),
  };
}

export function usePaymentsMembers(
  spaceId: string | undefined,
  params: {
    month: string;
    page?: number;
    size?: number;
    q?: string;
    status?: string;
  },
  enabled = true,
) {
  const query = useQuery({
    queryKey: ['payments-members', spaceId, params],
    queryFn: () => paymentsApi.getPaymentsMembers(spaceId!, params),
    enabled: Boolean(enabled && spaceId && params.month),
    staleTime: 15_000,
  });
  return {
    data: query.data ?? null,
    members: query.data?.page.content ?? [],
    page: query.data?.page,
    loading: query.isLoading || query.isFetching,
    error: query.error,
    reload: () => query.refetch(),
  };
}

export function usePaymentsReview(
  spaceId: string | undefined,
  params: {
    month: string;
    queue?: PaymentsReviewQueueParam;
    page?: number;
    size?: number;
  },
  enabled = true,
) {
  const query = useQuery({
    queryKey: ['payments-review', spaceId, params],
    queryFn: () => paymentsApi.getPaymentsReview(spaceId!, params),
    enabled: Boolean(enabled && spaceId && params.month),
    staleTime: 10_000,
  });
  return {
    payments: query.data?.page.content ?? [],
    page: query.data?.page,
    loading: query.isLoading || query.isFetching,
    error: query.error,
    reload: () => query.refetch(),
  };
}

export function usePaymentsHistory(
  spaceId: string | undefined,
  params: {
    month: string;
    queue?: PaymentsReviewQueueParam;
    page?: number;
    size?: number;
  },
  enabled = true,
) {
  const query = useQuery({
    queryKey: ['payments-history', spaceId, params],
    queryFn: () => paymentsApi.getPaymentsHistory(spaceId!, params),
    enabled: Boolean(enabled && spaceId && params.month),
    staleTime: 15_000,
  });
  return {
    payments: query.data?.page.content ?? [],
    page: query.data?.page,
    loading: query.isLoading || query.isFetching,
    error: query.error,
    reload: () => query.refetch(),
  };
}

export function useSpacePaymentsList(
  spaceId: string | undefined,
  params?: ListSpacePaymentsParams,
  enabled = true,
) {
  const month = params?.month ?? currentMonthKey();
  const query = useQuery({
    queryKey: ['payments-list', spaceId, { ...params, month }],
    queryFn: () => paymentsApi.listPayments(spaceId!, { ...params, month }),
    enabled: Boolean(enabled && spaceId),
    staleTime: 10_000,
  });
  return {
    month: query.data?.month ?? month,
    payments: query.data?.payments ?? [],
    loading: query.isLoading || query.isFetching,
    error: query.error,
    reload: () => query.refetch(),
  };
}

export function usePaymentDetail(
  spaceId: string | undefined,
  paymentId: string | undefined,
  enabled = true,
) {
  const query = useQuery({
    queryKey: ['payment', spaceId, paymentId],
    queryFn: () => paymentsApi.getPayment(spaceId!, paymentId!),
    enabled: Boolean(enabled && spaceId && paymentId),
    staleTime: 10_000,
  });
  return {
    payment: query.data ?? null,
    loading: query.isLoading || query.isFetching,
    error: query.error,
    reload: () => query.refetch(),
  };
}

export function usePaymentTimeline(
  spaceId: string | undefined,
  paymentId: string | undefined,
  enabled = true,
) {
  const query = useQuery({
    queryKey: ['payment-timeline', spaceId, paymentId],
    queryFn: () => paymentsApi.getPaymentTimeline(spaceId!, paymentId!),
    enabled: Boolean(enabled && spaceId && paymentId),
    staleTime: 15_000,
  });
  return {
    timeline: query.data ?? null,
    events: query.data?.events ?? [],
    loading: query.isLoading || query.isFetching,
    reload: () => query.refetch(),
  };
}

export function usePaymentMutations(spaceId: string | undefined) {
  const queryClient = useQueryClient();

  const invalidate = async () => {
    await queryClient.invalidateQueries({
      predicate: (q) => String(q.queryKey[0]).includes('payment'),
    });
  };

  return {
    submitProof: useMutation({
      mutationFn: ({
        paymentId,
        body,
      }: {
        paymentId: string;
        body: SubmitPaymentProofRequest;
      }) => paymentsApi.submitProof(spaceId!, paymentId, body),
      onSuccess: invalidate,
    }),
    reviewPayment: useMutation({
      mutationFn: ({
        paymentId,
        body,
      }: {
        paymentId: string;
        body: ReviewPaymentRequest;
      }) => paymentsApi.reviewPayment(spaceId!, paymentId, body),
      onSuccess: invalidate,
    }),
    syncMonth: useMutation({
      mutationFn: (month: string) => paymentsApi.syncPaymentsMonth(spaceId!, month),
      onSuccess: invalidate,
    }),
  };
}
