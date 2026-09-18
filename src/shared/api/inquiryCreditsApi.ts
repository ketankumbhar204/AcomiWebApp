import apiClient from '@/shared/api/client';
import { unwrapApiResponse } from '@/shared/api/apiRequest';
import type { ApiResponse } from '@/shared/types/api';
import type {
  CreateInquiryPurchaseRequest,
  InquiryPaymentConfig,
  InquiryPurchaseResponse,
  InquiryWallet,
} from '@/shared/types/inquiryCredits';

export const inquiryCreditsApi = {
  getPaymentConfig: (): Promise<InquiryPaymentConfig> =>
    unwrapApiResponse(
      apiClient.get<ApiResponse<InquiryPaymentConfig>>('/inquiry-credits/payment-config'),
    ),

  getWallet: (): Promise<InquiryWallet> =>
    unwrapApiResponse(apiClient.get<ApiResponse<InquiryWallet>>('/inquiry-credits/wallet')),

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
