import apiClient from '@/shared/api/client';
import { unwrapApiResponse } from '@/shared/api/apiRequest';
import type { ApiResponse, PagedResponse } from '@/shared/types/api';
import type {
  DiscoverSpaceCardResponse,
  DiscoverSpaceDetailResponse,
  SpaceType,
} from '@/shared/types/space';

export type DiscoverSpacesParams = {
  search?: string;
  type?: SpaceType;
  page?: number;
  size?: number;
  sort?: string;
};

export const spaceDiscoverApi = {
  discoverSpaces: async (
    params: DiscoverSpacesParams = {},
  ): Promise<PagedResponse<DiscoverSpaceCardResponse>> => {
    const { search, type, page = 0, size = 12, sort = 'newest' } = params;
    const trimmed = search?.trim();
    return unwrapApiResponse(
      apiClient.get<ApiResponse<PagedResponse<DiscoverSpaceCardResponse>>>('/spaces/discover', {
        params: {
          ...(trimmed ? { search: trimmed } : {}),
          ...(type ? { type } : {}),
          page,
          size,
          sort,
        },
      }),
    );
  },

  getDiscoverSpaceDetail: async (spaceId: string): Promise<DiscoverSpaceDetailResponse> => {
    return unwrapApiResponse(
      apiClient.get<ApiResponse<DiscoverSpaceDetailResponse>>(`/spaces/discover/${spaceId}`),
    );
  },
};
