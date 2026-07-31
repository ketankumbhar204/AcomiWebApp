import apiClient from '@/shared/api/client';
import { unwrapApiResponse } from '@/shared/api/apiRequest';
import type { ApiResponse } from '@/shared/types/api';
import type {
  DashboardSummaryResponse,
  GlobalDashboardResponse,
} from '@/shared/types/dashboard';
import type { SpaceType } from '@/shared/types/space';
import { currentMonthKey } from '@/shared/utils/dashboardFinancial';

const DASHBOARD_SUMMARY_TIMEOUT_MS = 120_000;
const GLOBAL_DASHBOARD_TIMEOUT_MS = 120_000;

function normalizeDashboardSummary(response: DashboardSummaryResponse): DashboardSummaryResponse {
  return {
    ...response,
    financial: {
      ...response.financial,
      currencyCode: response.financial?.currencyCode || 'INR',
      underReview: response.financial?.underReview ?? null,
      pending: response.financial?.pending ?? null,
    },
    pendingActions: response.pendingActions ?? { totalCount: 0, groups: [] },
    attention: response.attention ?? [],
  };
}

export const dashboardApi = {
  getDashboardSummary: async (
    spaceId: string,
    _spaceType: SpaceType,
    month = currentMonthKey(),
  ): Promise<DashboardSummaryResponse> => {
    const path = `/spaces/${spaceId}/dashboard-summary?month=${month}`;
    const response = await unwrapApiResponse(
      apiClient.get<ApiResponse<DashboardSummaryResponse>>(path, {
        timeout: DASHBOARD_SUMMARY_TIMEOUT_MS,
      }),
    );
    return normalizeDashboardSummary(response);
  },

  getGlobalDashboard: async (
    month = currentMonthKey(),
    sync = true,
  ): Promise<GlobalDashboardResponse> => {
    const path = `/dashboard/global?month=${encodeURIComponent(month)}&sync=${sync}`;
    const response = await unwrapApiResponse(
      apiClient.get<ApiResponse<GlobalDashboardResponse>>(path, {
        timeout: GLOBAL_DASHBOARD_TIMEOUT_MS,
      }),
    );
    return {
      totalAttentionCount: response.totalAttentionCount ?? 0,
      unreadNotificationCount: response.unreadNotificationCount ?? 0,
      attentionRequired: response.attentionRequired ?? [],
      attentionHasMore: response.attentionHasMore ?? false,
      recentActivity: response.recentActivity ?? [],
      activityHasMore: response.activityHasMore ?? false,
      spaceSummaries: response.spaceSummaries ?? [],
    };
  },
};
