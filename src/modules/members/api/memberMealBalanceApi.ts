import apiClient from '@/shared/api/client';
import { unwrapApiResponse } from '@/shared/api/apiRequest';
import type { ApiResponse } from '@/shared/types/api';
import type {
  MemberMealBalance,
  MemberMealBalanceActivityEvent,
  MemberSubscriptionHistoryResponse,
  RecordMealBalancePurchaseRequest,
} from '@/shared/types/member';
import { normalizeSubscriptionHistoryResponse } from '@/modules/members/utils/subscriptionHistory';

export const memberMealBalanceApi = {
  getBalance: async (spaceId: string, memberId: string): Promise<MemberMealBalance> => {
    return unwrapApiResponse(
      apiClient.get<ApiResponse<MemberMealBalance>>(
        `/spaces/${spaceId}/members/${memberId}/meal-balance`,
      ),
    );
  },

  recordPurchase: async (
    spaceId: string,
    memberId: string,
    body: RecordMealBalancePurchaseRequest,
  ): Promise<MemberMealBalance> => {
    return unwrapApiResponse(
      apiClient.post<ApiResponse<MemberMealBalance>>(
        `/spaces/${spaceId}/members/${memberId}/meal-balance/purchases`,
        body,
      ),
    );
  },

  endSubscription: async (spaceId: string, memberId: string): Promise<MemberMealBalance> => {
    return unwrapApiResponse(
      apiClient.post<ApiResponse<MemberMealBalance>>(
        `/spaces/${spaceId}/members/${memberId}/meal-balance/end`,
      ),
    );
  },

  getSubscriptionHistory: async (
    spaceId: string,
    memberId: string,
  ): Promise<MemberSubscriptionHistoryResponse> => {
    const data = await unwrapApiResponse(
      apiClient.get<
        ApiResponse<MemberSubscriptionHistoryResponse | MemberMealBalanceActivityEvent[]>
      >(`/spaces/${spaceId}/members/${memberId}/meal-balance/subscription-history`),
    );
    return normalizeSubscriptionHistoryResponse(data);
  },
};
