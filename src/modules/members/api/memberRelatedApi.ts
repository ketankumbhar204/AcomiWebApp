import apiClient from '@/shared/api/client';
import { unwrapApiResponse } from '@/shared/api/apiRequest';
import type { ApiResponse } from '@/shared/types/api';
import type { MemberOccupancyListResponse, SpacePaymentListResponse } from '@/shared/types/member';
import { currentMonthKey } from '@/shared/utils/dashboardFinancial';

export const memberRelatedApi = {
  getMemberOccupancies: async (
    spaceId: string,
    memberId: string,
  ): Promise<MemberOccupancyListResponse> => {
    return unwrapApiResponse(
      apiClient.get<ApiResponse<MemberOccupancyListResponse>>(
        `/spaces/${spaceId}/members/${memberId}/occupancies`,
      ),
    );
  },

  listMemberPayments: async (
    spaceId: string,
    memberId: string,
    month = currentMonthKey(),
  ): Promise<SpacePaymentListResponse> => {
    return unwrapApiResponse(
      apiClient.get<ApiResponse<SpacePaymentListResponse>>(`/spaces/${spaceId}/payments`, {
        params: { memberId, month },
      }),
    );
  },
};
