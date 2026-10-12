import apiClient from '@/shared/api/client';
import { unwrapApiResponse } from '@/shared/api/apiRequest';
import type { ApiResponse } from '@/shared/types/api';
import type { DiscoverSpaceCardResponse } from '@/shared/types/space';

export type FavoriteStateResponse = {
  spaceId: string;
  favorited: boolean;
};

export const favoritesApi = {
  list: async (): Promise<DiscoverSpaceCardResponse[]> => {
    return unwrapApiResponse(
      apiClient.get<ApiResponse<DiscoverSpaceCardResponse[]>>('/me/favorites'),
    );
  },

  ids: async (): Promise<string[]> => {
    return unwrapApiResponse(apiClient.get<ApiResponse<string[]>>('/me/favorites/ids'));
  },

  add: async (spaceId: string): Promise<FavoriteStateResponse> => {
    return unwrapApiResponse(
      apiClient.put<ApiResponse<FavoriteStateResponse>>(`/me/favorites/${spaceId}`),
    );
  },

  remove: async (spaceId: string): Promise<FavoriteStateResponse> => {
    return unwrapApiResponse(
      apiClient.delete<ApiResponse<FavoriteStateResponse>>(`/me/favorites/${spaceId}`),
    );
  },
};
