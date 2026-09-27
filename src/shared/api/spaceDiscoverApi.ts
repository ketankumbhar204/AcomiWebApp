import apiClient from '@/shared/api/client';
import { unwrapApiResponse } from '@/shared/api/apiRequest';
import {
  DISCOVER_PAGE_SIZE,
  buildDiscoverSearchParams,
  type DiscoverSpacesParams,
} from '@/shared/api/discoverQuery';
import type { ApiResponse, PagedResponse } from '@/shared/types/api';
import type { DiscoverSpaceCardResponse, DiscoverSpaceDetailResponse } from '@/shared/types/space';

export type { DiscoverSpacesParams } from '@/shared/api/discoverQuery';

export const spaceDiscoverApi = {
  discoverSpaces: async (
    params: DiscoverSpacesParams = {},
  ): Promise<PagedResponse<DiscoverSpaceCardResponse>> => {
    const query = buildDiscoverSearchParams({
      ...params,
      size: params.size ?? DISCOVER_PAGE_SIZE,
    });
    return unwrapApiResponse(
      apiClient.get<ApiResponse<PagedResponse<DiscoverSpaceCardResponse>>>(
        `/spaces/discover?${query.toString()}`,
      ),
    );
  },

  getDiscoverSpaceDetail: async (spaceId: string): Promise<DiscoverSpaceDetailResponse> => {
    return unwrapApiResponse(
      apiClient.get<ApiResponse<DiscoverSpaceDetailResponse>>(`/spaces/discover/${spaceId}`),
    );
  },
};
