import apiClient from '@/shared/api/client';
import { unwrapApiResponse, unwrapVoidResponse } from '@/shared/api/apiRequest';
import type { ApiResponse } from '@/shared/types/api';
import type {
  CreateSubscriptionActivationRequest,
  CreateSubscriptionPlanRequest,
  CustomerSubscriptionStatusResponse,
  SubscriptionActivationRequestResponse,
  SubscriptionPlanResponse,
  UpdateSubscriptionPlanRequest,
} from '@/shared/types/subscription';
import { ensureUploadedFileId } from '@/shared/services/fileUploadService';

export const subscriptionPlansApi = {
  listPlans: (spaceId: string, options?: { includeInactive?: boolean }) => {
    const query = options?.includeInactive ? '?includeInactive=true' : '';
    return unwrapApiResponse(
      apiClient.get<ApiResponse<SubscriptionPlanResponse[]>>(
        `/spaces/${spaceId}/subscription-plans${query}`,
      ),
    );
  },

  createPlan: (spaceId: string, payload: CreateSubscriptionPlanRequest) =>
    unwrapApiResponse(
      apiClient.post<ApiResponse<SubscriptionPlanResponse>>(
        `/spaces/${spaceId}/subscription-plans`,
        payload,
      ),
    ),

  updatePlan: (spaceId: string, planId: string, payload: UpdateSubscriptionPlanRequest) =>
    unwrapApiResponse(
      apiClient.put<ApiResponse<SubscriptionPlanResponse>>(
        `/spaces/${spaceId}/subscription-plans/${planId}`,
        payload,
      ),
    ),

  deactivatePlan: async (spaceId: string, planId: string) => {
    await unwrapVoidResponse(
      apiClient.post(`/spaces/${spaceId}/subscription-plans/${planId}/deactivate`),
    );
  },

  getCustomerStatus: (spaceId: string, memberId: string) =>
    unwrapApiResponse(
      apiClient.get<ApiResponse<CustomerSubscriptionStatusResponse>>(
        `/spaces/${spaceId}/members/${memberId}/subscription-status`,
      ),
    ),

  getMyCustomerStatus: (spaceId: string) =>
    unwrapApiResponse(
      apiClient.get<ApiResponse<CustomerSubscriptionStatusResponse>>(
        `/spaces/${spaceId}/members/me/subscription-status`,
      ),
    ),

  listPendingRequests: (spaceId: string) =>
    unwrapApiResponse(
      apiClient.get<ApiResponse<SubscriptionActivationRequestResponse[]>>(
        `/spaces/${spaceId}/subscription-activation-requests/pending`,
      ),
    ),

  createActivationRequest: async (
    spaceId: string,
    memberId: string,
    payload: CreateSubscriptionActivationRequest & { localFile?: File },
  ) => {
    const proofFileId = await ensureUploadedFileId(payload.proofFileId, payload.localFile, {
      purpose: 'SUBSCRIPTION_PAYMENT_PROOF',
      spaceId,
      memberId,
    });
    const { localFile: _ignored, ...rest } = payload;
    return unwrapApiResponse(
      apiClient.post<ApiResponse<SubscriptionActivationRequestResponse>>(
        `/spaces/${spaceId}/members/${memberId}/subscription-activation-requests`,
        { ...rest, proofFileId },
      ),
    );
  },

  approveActivationRequest: (spaceId: string, requestId: string, ownerNotes?: string) =>
    unwrapApiResponse(
      apiClient.post<ApiResponse<SubscriptionActivationRequestResponse>>(
        `/spaces/${spaceId}/subscription-activation-requests/${requestId}/approve`,
        ownerNotes ? { ownerNotes } : {},
      ),
    ),

  rejectActivationRequest: (spaceId: string, requestId: string, ownerNotes?: string) =>
    unwrapApiResponse(
      apiClient.post<ApiResponse<SubscriptionActivationRequestResponse>>(
        `/spaces/${spaceId}/subscription-activation-requests/${requestId}/reject`,
        ownerNotes ? { ownerNotes } : {},
      ),
    ),
};
