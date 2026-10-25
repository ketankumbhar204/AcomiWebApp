import apiClient from '@/shared/api/client';
import { unwrapApiResponse, unwrapVoidResponse } from '@/shared/api/apiRequest';
import type { ApiResponse, PagedResponse } from '@/shared/types/api';
import type {
  SaveServiceContactBody,
  ServiceContact,
  ServiceContactCategoryOption,
  ServiceContactSort,
} from '../types';

export interface ServiceContactListParams {
  q?: string;
  category?: string;
  spaceId?: string;
  sort?: ServiceContactSort;
  page?: number;
  size?: number;
  includeArchived?: boolean;
}

export const serviceContactsApi = {
  categories: () =>
    unwrapApiResponse(
      apiClient.get<ApiResponse<ServiceContactCategoryOption[]>>('/service-contacts/categories'),
    ),

  list: (params: ServiceContactListParams) =>
    unwrapApiResponse(
      apiClient.get<ApiResponse<PagedResponse<ServiceContact>>>('/service-contacts', { params }),
    ),

  get: (contactId: string) =>
    unwrapApiResponse(
      apiClient.get<ApiResponse<ServiceContact>>(`/service-contacts/${contactId}`),
    ),

  create: (body: SaveServiceContactBody) =>
    unwrapApiResponse(
      apiClient.post<ApiResponse<ServiceContact>>('/service-contacts', body),
    ),

  update: (contactId: string, body: SaveServiceContactBody) =>
    unwrapApiResponse(
      apiClient.put<ApiResponse<ServiceContact>>(`/service-contacts/${contactId}`, body),
    ),

  archive: (contactId: string) =>
    unwrapVoidResponse(apiClient.post(`/service-contacts/${contactId}/archive`)),

  addSpace: (contactId: string, spaceId: string) =>
    unwrapApiResponse(
      apiClient.post<ApiResponse<ServiceContact>>(`/service-contacts/${contactId}/spaces/${spaceId}`),
    ),

  removeSpace: (contactId: string, spaceId: string) =>
    unwrapApiResponse(
      apiClient.delete<ApiResponse<ServiceContact>>(
        `/service-contacts/${contactId}/spaces/${spaceId}`,
      ),
    ),
};
