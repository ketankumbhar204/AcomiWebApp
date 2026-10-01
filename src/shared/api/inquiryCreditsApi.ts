import apiClient from '@/shared/api/client';
import { unwrapApiResponse } from '@/shared/api/apiRequest';
import type { ApiResponse } from '@/shared/types/api';
import type {
  CreateInquiryPurchaseRequest,
  InquiryPaymentConfig,
  InquiryPurchaseResponse,
  InquiryQuota,
  InquiryWallet,
} from '@/shared/types/inquiryCredits';

export const inquiryCreditsApi = {
  getPaymentConfig: (): Promise<InquiryPaymentConfig> =>
    unwrapApiResponse(
      apiClient.get<ApiResponse<InquiryPaymentConfig>>('/inquiry-credits/payment-config'),
    ),

  getWallet: (): Promise<InquiryWallet> =>
    unwrapApiResponse(apiClient.get<ApiResponse<InquiryWallet>>('/inquiry-credits/wallet')),

  getQuota: (): Promise<InquiryQuota> =>
    unwrapApiResponse(apiClient.get<ApiResponse<InquiryQuota>>('/inquiry-credits/quota')),

  resetQuota: (): Promise<InquiryQuota> =>
    unwrapApiResponse(apiClient.post<ApiResponse<InquiryQuota>>('/inquiry-credits/quota/reset')),

  createPurchase: (body: CreateInquiryPurchaseRequest): Promise<InquiryPurchaseResponse> =>
    unwrapApiResponse(
      apiClient.post<ApiResponse<InquiryPurchaseResponse>>(
        '/inquiry-credits/purchase-requests',
        body,
      ),
    ),

  listMyPurchases: (): Promise<InquiryPurchaseResponse[]> =>
    unwrapApiResponse(
      apiClient.get<ApiResponse<InquiryPurchaseResponse[]>>('/inquiry-credits/purchase-requests/me'),
    ),
};

export function isUnlimitedQuota(quota: InquiryQuota | null | undefined): boolean {
  if (!quota) return false;
  return quota.unlimited === true || quota.purchasesEnabled === false;
}

export function paidCreditsOf(quota: InquiryQuota | null | undefined): number {
  const credits = Number(quota?.availableCredits ?? 0);
  return Number.isFinite(credits) && credits > 0 ? credits : 0;
}

export function canSendEmailEnquiry(quota: InquiryQuota | null | undefined): boolean {
  if (!quota || isUnlimitedQuota(quota)) return true;
  return Number(quota.freeRemainingToday) > 0 || paidCreditsOf(quota) > 0;
}

export function needsInquiryPayment(quota: InquiryQuota | null | undefined): boolean {
  return quota != null && !isUnlimitedQuota(quota) && !canSendEmailEnquiry(quota);
}
