import apiClient from '@/shared/api/client';
import { unwrapApiResponse, unwrapVoidResponse } from '@/shared/api/apiRequest';
import type { ApiResponse, PagedResponse } from '@/shared/types/api';
import type { NotificationListResponse, SpaceNotification } from '@/shared/types/dashboard';
import type {
  AdminEnquirySummary,
  AdminSpaceEnquiryDetail,
  AdminSpaceEnquiryListItem,
  CreateSpaceEnquiryRequest,
  EnquiryRequesterType,
  SpaceEnquiryResponse,
  SpaceEnquiryStatus,
  UserNotification,
  UserNotificationListResponse,
} from '@/shared/types/enquiry';

export const enquiryApi = {
  create: async (spaceId: string, payload: CreateSpaceEnquiryRequest = {}): Promise<SpaceEnquiryResponse> =>
    unwrapApiResponse(
      apiClient.post<ApiResponse<SpaceEnquiryResponse>>(`/spaces/${spaceId}/enquiries`, payload),
    ),

  listMine: async (params?: { page?: number; size?: number }): Promise<PagedResponse<SpaceEnquiryResponse>> =>
    unwrapApiResponse(
      apiClient.get<ApiResponse<PagedResponse<SpaceEnquiryResponse>>>('/enquiries/me', { params }),
    ),

  listNotifications: async (params?: {
    page?: number;
    size?: number;
  }): Promise<UserNotificationListResponse> => {
    const response = await unwrapApiResponse(
      apiClient.get<ApiResponse<UserNotificationListResponse>>('/notifications/me', { params }),
    );
    return {
      notifications: response.notifications ?? [],
      unreadCount: response.unreadCount ?? 0,
      page: response.page,
      size: response.size,
      totalElements: response.totalElements,
      totalPages: response.totalPages,
    };
  },

  markNotificationRead: async (notificationId: string): Promise<UserNotification> =>
    unwrapApiResponse(
      apiClient.post<ApiResponse<UserNotification>>(`/notifications/${notificationId}/read`),
    ),
};

export const adminEnquiryApi = {
  summary: async (): Promise<AdminEnquirySummary> =>
    unwrapApiResponse(apiClient.get<ApiResponse<AdminEnquirySummary>>('/admin/enquiries/summary')),

  list: async (params?: {
    status?: SpaceEnquiryStatus;
    requesterType?: EnquiryRequesterType;
    q?: string;
    from?: string;
    to?: string;
    page?: number;
    size?: number;
  }): Promise<PagedResponse<AdminSpaceEnquiryListItem>> =>
    unwrapApiResponse(
      apiClient.get<ApiResponse<PagedResponse<AdminSpaceEnquiryListItem>>>('/admin/enquiries', {
        params,
      }),
    ),

  get: async (enquiryId: string): Promise<AdminSpaceEnquiryDetail> =>
    unwrapApiResponse(
      apiClient.get<ApiResponse<AdminSpaceEnquiryDetail>>(`/admin/enquiries/${enquiryId}`),
    ),

  share: async (enquiryId: string): Promise<AdminSpaceEnquiryDetail> =>
    unwrapApiResponse(
      apiClient.post<ApiResponse<AdminSpaceEnquiryDetail>>(`/admin/enquiries/${enquiryId}/share`),
    ),

  reject: async (enquiryId: string, reason?: string): Promise<AdminSpaceEnquiryDetail> =>
    unwrapApiResponse(
      apiClient.post<ApiResponse<AdminSpaceEnquiryDetail>>(`/admin/enquiries/${enquiryId}/reject`, {
        reason,
      }),
    ),

  expire: async (enquiryId: string): Promise<AdminSpaceEnquiryDetail> =>
    unwrapApiResponse(
      apiClient.post<ApiResponse<AdminSpaceEnquiryDetail>>(`/admin/enquiries/${enquiryId}/expire`),
    ),

  delete: async (enquiryId: string): Promise<void> =>
    unwrapVoidResponse(apiClient.delete(`/admin/enquiries/${enquiryId}`)),

  listNotifications: async (): Promise<NotificationListResponse> => {
    const response = await unwrapApiResponse(
      apiClient.get<ApiResponse<NotificationListResponse>>('/admin/notifications'),
    );
    return {
      notifications: response.notifications ?? [],
      unreadCount: response.unreadCount ?? 0,
    };
  },

  markNotificationRead: async (notificationId: string): Promise<SpaceNotification> =>
    unwrapApiResponse(
      apiClient.post<ApiResponse<SpaceNotification>>(`/admin/notifications/${notificationId}/read`),
    ),
};
