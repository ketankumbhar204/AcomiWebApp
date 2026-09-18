import apiClient from '@/shared/api/client';
import { unwrapApiResponse } from '@/shared/api/apiRequest';
import type { ApiResponse, PagedResponse } from '@/shared/types/api';
import type {
  AdminInquiryPurchaseSummary,
  InquiryPackage,
  InquiryPaymentConfig,
  InquiryPurchaseResponse,
  InquiryPurchaseStatus,
  UpdateInquiryPackageRequest,
  UpdateInquiryPaymentConfigRequest,
} from '@/shared/types/inquiryCredits';

const BASE = '/admin/inquiry-credits';

export const inquiryCreditsAdminApi = {
  getPaymentConfig: (): Promise<InquiryPaymentConfig> =>
    unwrapApiResponse(
      apiClient.get<ApiResponse<InquiryPaymentConfig>>(`${BASE}/payment-config`),
    ),

  updatePaymentConfig: (body: UpdateInquiryPaymentConfigRequest): Promise<InquiryPaymentConfig> =>
    unwrapApiResponse(
      apiClient.put<ApiResponse<InquiryPaymentConfig>>(`${BASE}/payment-config`, body),
    ),

  listPackages: (): Promise<InquiryPackage[]> =>
    unwrapApiResponse(apiClient.get<ApiResponse<InquiryPackage[]>>(`${BASE}/packages`)),

  updatePackage: (id: string, body: UpdateInquiryPackageRequest): Promise<InquiryPackage> =>
    unwrapApiResponse(
      apiClient.put<ApiResponse<InquiryPackage>>(`${BASE}/packages/${id}`, body),
    ),

  getPurchasesSummary: (): Promise<AdminInquiryPurchaseSummary> =>
    unwrapApiResponse(
      apiClient.get<ApiResponse<AdminInquiryPurchaseSummary>>(`${BASE}/summary`),
    ),

  listPurchases: (params?: {
    status?: InquiryPurchaseStatus | '';
    page?: number;
    size?: number;
  }): Promise<PagedResponse<InquiryPurchaseResponse>> =>
    unwrapApiResponse(
      apiClient.get<ApiResponse<PagedResponse<InquiryPurchaseResponse>>>(
        `${BASE}/purchase-requests`,
        { params },
      ),
    ),

  approvePurchase: (purchaseId: string): Promise<InquiryPurchaseResponse> =>
    unwrapApiResponse(
      apiClient.post<ApiResponse<InquiryPurchaseResponse>>(
        `${BASE}/purchase-requests/${purchaseId}/approve`,
      ),
    ),

  rejectPurchase: (purchaseId: string, reason?: string): Promise<InquiryPurchaseResponse> =>
    unwrapApiResponse(
      apiClient.post<ApiResponse<InquiryPurchaseResponse>>(
        `${BASE}/purchase-requests/${purchaseId}/reject`,
        { reason },
      ),
    ),
};
