import apiClient from '@/shared/api/client';
import { unwrapApiResponse } from '@/shared/api/apiRequest';
import type { ApiResponse } from '@/shared/types/api';
import type {
  NotificationListResponse,
  PendingActionsSummary,
  SpaceNotification,
} from '@/shared/types/dashboard';
import { currentMonthKey } from '@/shared/utils/dashboardFinancial';

export const notificationsApi = {
  getPendingActions: async (
    spaceId: string,
    month = currentMonthKey(),
  ): Promise<PendingActionsSummary> => {
    const path = `/spaces/${spaceId}/pending-actions?month=${month}`;
    const response = await unwrapApiResponse(
      apiClient.get<ApiResponse<PendingActionsSummary>>(path),
    );
    return {
      totalCount: response.totalCount ?? 0,
      groups: response.groups ?? [],
    };
  },

  listNotifications: async (
    spaceId: string,
    actionableOnly = false,
  ): Promise<NotificationListResponse> => {
    const path = `/spaces/${spaceId}/notifications?actionableOnly=${actionableOnly}`;
    const response = await unwrapApiResponse(
      apiClient.get<ApiResponse<NotificationListResponse>>(path),
    );
    return {
      notifications: response.notifications ?? [],
      unreadCount: response.unreadCount ?? 0,
    };
  },

  markRead: async (spaceId: string, notificationId: string): Promise<SpaceNotification> => {
    return unwrapApiResponse(
      apiClient.post<ApiResponse<SpaceNotification>>(
        `/spaces/${spaceId}/notifications/${notificationId}/read`,
      ),
    );
  },

  /** Present on backend/mobile API; unused in mobile UI — do not wire new web-only flows. */
  resolve: async (spaceId: string, notificationId: string): Promise<SpaceNotification> => {
    return unwrapApiResponse(
      apiClient.post<ApiResponse<SpaceNotification>>(
        `/spaces/${spaceId}/notifications/${notificationId}/resolve`,
      ),
    );
  },
};
