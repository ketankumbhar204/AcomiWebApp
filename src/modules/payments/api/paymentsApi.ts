import apiClient from '@/shared/api/client';
import { unwrapApiResponse } from '@/shared/api/apiRequest';
import type { ApiResponse } from '@/shared/types/api';
import type {
  ListSpacePaymentsParams,
  PaymentsCardsPageResponse,
  PaymentsMembersPageResponse,
  PaymentsReviewQueueParam,
  PaymentsSummaryResponse,
  PaymentTimelineResponse,
  ReviewPaymentRequest,
  SpacePaymentListResponse,
  SpacePaymentResponse,
  SubmitPaymentProofRequest,
} from '@/shared/types/payments';

const OWNER_MONTH_TIMEOUT_MS = 120_000;

export const paymentsApi = {
  listPayments: (spaceId: string, params?: ListSpacePaymentsParams) =>
    unwrapApiResponse(
      apiClient.get<ApiResponse<SpacePaymentListResponse>>(`/spaces/${spaceId}/payments`, {
        params,
      }),
    ),

  getPayment: (spaceId: string, paymentId: string) =>
    unwrapApiResponse(
      apiClient.get<ApiResponse<SpacePaymentResponse>>(
        `/spaces/${spaceId}/payments/${paymentId}`,
      ),
    ),

  submitProof: (spaceId: string, paymentId: string, body: SubmitPaymentProofRequest) =>
    unwrapApiResponse(
      apiClient.post<ApiResponse<SpacePaymentResponse>>(
        `/spaces/${spaceId}/payments/${paymentId}/proof`,
        body,
      ),
    ),

  reviewPayment: (spaceId: string, paymentId: string, body: ReviewPaymentRequest) =>
    unwrapApiResponse(
      apiClient.post<ApiResponse<SpacePaymentResponse>>(
        `/spaces/${spaceId}/payments/${paymentId}/review`,
        body,
      ),
    ),

  getPaymentTimeline: (spaceId: string, paymentId: string) =>
    unwrapApiResponse(
      apiClient.get<ApiResponse<PaymentTimelineResponse>>(
        `/spaces/${spaceId}/payments/${paymentId}/timeline`,
      ),
    ),

  getPaymentsSummary: (spaceId: string, month: string) =>
    unwrapApiResponse(
      apiClient.get<ApiResponse<PaymentsSummaryResponse>>(
        `/spaces/${spaceId}/payments/summary`,
        { params: { month }, timeout: OWNER_MONTH_TIMEOUT_MS },
      ),
    ),

  getPaymentsMembers: (
    spaceId: string,
    params: {
      month: string;
      page?: number;
      size?: number;
      q?: string;
      status?: string;
      sort?: string;
    },
  ) =>
    unwrapApiResponse(
      apiClient.get<ApiResponse<PaymentsMembersPageResponse>>(
        `/spaces/${spaceId}/payments/members`,
        { params, timeout: OWNER_MONTH_TIMEOUT_MS },
      ),
    ),

  getPaymentsReview: (
    spaceId: string,
    params: {
      month: string;
      queue?: PaymentsReviewQueueParam;
      page?: number;
      size?: number;
    },
  ) =>
    unwrapApiResponse(
      apiClient.get<ApiResponse<PaymentsCardsPageResponse>>(
        `/spaces/${spaceId}/payments/review`,
        { params },
      ),
    ),

  getPaymentsHistory: (
    spaceId: string,
    params: {
      month: string;
      queue?: PaymentsReviewQueueParam;
      page?: number;
      size?: number;
    },
  ) =>
    unwrapApiResponse(
      apiClient.get<ApiResponse<PaymentsCardsPageResponse>>(
        `/spaces/${spaceId}/payments/history`,
        { params },
      ),
    ),

  syncPaymentsMonth: async (spaceId: string, month: string) => {
    await unwrapApiResponse(
      apiClient.post<ApiResponse<Record<string, string>>>(
        `/spaces/${spaceId}/payments/sync`,
        {},
        { params: { month } },
      ),
    );
  },
};
