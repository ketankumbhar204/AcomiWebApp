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
import { ensureUploadedFileId } from '@/shared/services/fileUploadService';

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

  submitProof: async (
    spaceId: string,
    paymentId: string,
    body: SubmitPaymentProofRequest & { localFile?: File },
  ) => {
    const proofFileId = await ensureUploadedFileId(body.proofFileId, body.localFile, {
      purpose: 'PAYMENT_PROOF',
      spaceId,
      paymentId,
    });
    const { localFile: _ignored, ...rest } = body;
    return unwrapApiResponse(
      apiClient.post<ApiResponse<SpacePaymentResponse>>(
        `/spaces/${spaceId}/payments/${paymentId}/proof`,
        { ...rest, proofFileId },
      ),
    );
  },

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

  getOverduePayments: (
    spaceId: string,
    params?: {
      paymentType?: string;
      reminderEligibleOnly?: boolean;
      page?: number;
      size?: number;
    },
  ) =>
    unwrapApiResponse(
      apiClient.get<ApiResponse<unknown>>(`/spaces/${spaceId}/payments/overdue`, {
        params,
      }),
    ),

  processPaymentReminders: (spaceId: string) =>
    unwrapApiResponse(
      apiClient.post<ApiResponse<PaymentReminderProcessResult>>(
        `/spaces/${spaceId}/payments/reminders/process`,
      ),
    ),

  sendPaymentReminder: (spaceId: string, paymentId: string) =>
    unwrapApiResponse(
      apiClient.post<ApiResponse<PaymentReminderDeliveryResult>>(
        `/spaces/${spaceId}/payments/${paymentId}/reminders`,
      ),
    ),
};

export type PaymentReminderDeliveryResult = {
  deliveryId: string;
  paymentId: string;
  channel: string;
  deliveryStatus: 'PENDING' | 'SENT' | 'FAILED' | 'SKIPPED';
  businessDate?: string;
  providerMessageId?: string | null;
  failureReason?: string | null;
  failureCode?: string | null;
  providerConfigured: boolean;
  retryable?: boolean;
  sentAt?: string | null;
  lastAttemptAt?: string | null;
  attemptCount?: number;
};

export type PaymentReminderProcessResult = {
  businessDate: string;
  providerConfigured: boolean;
  providerMode?: string;
  candidatesFound: number;
  remindersCreated: number;
  remindersSkippedDuplicate: number;
  deliverySuccesses: number;
  deliveryFailures: number;
  deliveries?: PaymentReminderDeliveryResult[];
};
