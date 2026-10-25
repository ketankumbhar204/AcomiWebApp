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
  OwnerContactResponse,
  EnquiryInboxResponse,
  ReceivedEnquiry,
  ReceivedEnquirySummary,
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

  deliverContactByEmail: async (enquiryId: string, email: string): Promise<SpaceEnquiryResponse> =>
    unwrapApiResponse(
      apiClient.post<ApiResponse<SpaceEnquiryResponse>>(`/enquiries/${enquiryId}/email-contact`, {
        email,
      }),
    ),

  requestPhotos: async (spaceId: string) =>
    unwrapApiResponse(
      apiClient.post<
        ApiResponse<{
          notificationPersisted: boolean;
          notificationDuplicate: boolean;
          fcmQueued: boolean;
          phoneAvailable: boolean;
          internationalPhone?: string | null;
        }>
      >(`/spaces/${spaceId}/photo-requests`),
    ),

  sendAgain: async (spaceId: string): Promise<SpaceEnquiryResponse> =>
    unwrapApiResponse(
      apiClient.post<ApiResponse<SpaceEnquiryResponse>>(`/spaces/${spaceId}/enquiries/send-again`),
    ),

  listInquiredListingIds: async (): Promise<
    Array<{
      id: string;
      sentVia: 'EMAIL' | 'APP' | 'BOTH' | null;
      sentToEmail: string | null;
      sentAt: string | null;
      contactViewed: boolean;
    }>
  > => {
    const data = await unwrapApiResponse(
      apiClient.get<ApiResponse<{
        inquiredListingIds?: string[];
        inquiries?: {
          listingId?: string;
          sentVia?: string;
          sentToEmail?: string | null;
          sentAt?: string | null;
          contactViewed?: boolean;
        }[];
      }>>('/enquiries/me/listing-ids'),
    );
    const asVia = (value: string | undefined): 'EMAIL' | 'APP' | 'BOTH' | null =>
      value === 'EMAIL' || value === 'APP' || value === 'BOTH' ? value : null;
    if (data.inquiries?.length) {
      return data.inquiries.flatMap((row) => {
        const id = row.listingId?.trim();
        if (!id) return [];
        return [{
          id,
          sentVia: asVia(row.sentVia),
          sentToEmail: row.sentToEmail?.trim() || null,
          sentAt: row.sentAt?.trim() || null,
          contactViewed: row.contactViewed === true,
        }];
      });
    }
    return (data.inquiredListingIds ?? []).map((id) => ({
      id,
      sentVia: null,
      sentToEmail: null,
      sentAt: null,
      contactViewed: false,
    }));
  },

  revealedContact: async (spaceId: string): Promise<OwnerContactResponse | null> => {
    try {
      return await unwrapApiResponse(
        apiClient.get<ApiResponse<OwnerContactResponse>>(`/spaces/${spaceId}/revealed-contact`),
      );
    } catch {
      return null;
    }
  },

  inbox: async (): Promise<EnquiryInboxResponse> =>
    unwrapApiResponse(apiClient.get<ApiResponse<EnquiryInboxResponse>>('/enquiries/inbox')),

  listReceived: async (params?: {
    spaceId?: string;
    status?: SpaceEnquiryStatus;
    from?: string;
    to?: string;
    q?: string;
    page?: number;
    size?: number;
  }): Promise<PagedResponse<ReceivedEnquiry>> =>
    unwrapApiResponse(
      apiClient.get<ApiResponse<PagedResponse<ReceivedEnquiry>>>('/enquiries/received', { params }),
    ),

  receivedSummary: async (spaceId?: string): Promise<ReceivedEnquirySummary> =>
    unwrapApiResponse(
      apiClient.get<ApiResponse<ReceivedEnquirySummary>>('/enquiries/received/summary', {
        params: spaceId ? { spaceId } : undefined,
      }),
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
