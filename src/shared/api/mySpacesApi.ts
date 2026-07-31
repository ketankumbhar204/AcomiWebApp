import apiClient from '@/shared/api/client';
import { unwrapApiResponse } from '@/shared/api/apiRequest';
import type { ApiResponse } from '@/shared/types/api';
import { ApiError } from '@/shared/api/errors';
import type {
  DefaultSpaceResponse,
  MySpaceResponse,
  SetDefaultSpaceResponse,
} from '@/shared/types/space';

export const mySpacesApi = {
  getMySpaces: async (): Promise<MySpaceResponse[]> => {
    return unwrapApiResponse(apiClient.get<ApiResponse<MySpaceResponse[]>>('/spaces/my'));
  },

  searchMySpaces: async (query: string): Promise<MySpaceResponse[]> => {
    const trimmed = query.trim();
    return unwrapApiResponse(
      apiClient.get<ApiResponse<MySpaceResponse[]>>('/spaces/my', {
        params: { search: trimmed },
      }),
    );
  },

  getDefaultSpace: async (): Promise<DefaultSpaceResponse | null> => {
    try {
      return await unwrapApiResponse(
        apiClient.get<ApiResponse<DefaultSpaceResponse>>('/spaces/default'),
      );
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        return null;
      }
      throw err;
    }
  },

  setDefaultSpace: async (spaceId: string): Promise<SetDefaultSpaceResponse> => {
    return unwrapApiResponse(
      apiClient.put<ApiResponse<SetDefaultSpaceResponse>>(`/spaces/${spaceId}/default`),
    );
  },
};
