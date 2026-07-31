import apiClient from '@/shared/api/client';
import { unwrapApiResponse, unwrapVoidResponse } from '@/shared/api/apiRequest';
import type { ApiResponse } from '@/shared/types/api';
import type {
  CreateSpaceRequest,
  SpaceDetailsResponse,
  SpaceResponse,
  UpdateSpaceRequest,
} from '@/shared/types/space';

export const spaceApi = {
  createSpace: (payload: CreateSpaceRequest) =>
    unwrapApiResponse(apiClient.post<ApiResponse<SpaceResponse>>('/spaces', payload)),

  getSpaceById: (spaceId: string) =>
    unwrapApiResponse(
      apiClient.get<ApiResponse<SpaceDetailsResponse>>(`/spaces/${spaceId}`),
    ),

  updateSpace: (spaceId: string, payload: UpdateSpaceRequest) =>
    unwrapApiResponse(
      apiClient.put<ApiResponse<SpaceDetailsResponse>>(`/spaces/${spaceId}`, payload),
    ),

  deactivateSpace: (spaceId: string) =>
    unwrapVoidResponse(apiClient.delete(`/spaces/${spaceId}`)),
};
