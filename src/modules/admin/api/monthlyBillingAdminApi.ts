import apiClient from '@/shared/api/client';
import { unwrapApiResponse } from '@/shared/api/apiRequest';
import type { ApiResponse } from '@/shared/types/api';

export type MonthlyBillingRun = {
  id: string;
  spaceId: string;
  billingMonth: string;
  businessTimezone: string;
  status: string;
  startedAt?: string | null;
  finishedAt?: string | null;
  eligibleAccommodation: number;
  eligibleMess: number;
  paymentsCreated: number;
  paymentsSkipped: number;
  paymentsFailed: number;
  notificationsQueued: number;
  skipSummary?: string | null;
  errorMessage?: string | null;
};

export type MonthlyBillingNotification = {
  id: string;
  spaceId: string;
  paymentId: string;
  recipientUserId?: string | null;
  billingMonth: string;
  status: string;
  attemptCount: number;
  lastAttemptAt?: string | null;
  lastError?: string | null;
  fcmAcceptedAt?: string | null;
};

export type MonthlyBillingMonitor = {
  lastSuccessfulFinishedAt?: string | null;
  notificationsPending: number;
  notificationsAcceptedByFirebase: number;
  notificationsFailed: number;
  notificationsSkipped: number;
  runs: MonthlyBillingRun[];
  recentNotifications: MonthlyBillingNotification[];
};

export const monthlyBillingAdminApi = {
  snapshot(): Promise<MonthlyBillingMonitor> {
    return unwrapApiResponse(
      apiClient.get<ApiResponse<MonthlyBillingMonitor>>('/admin/monthly-billing'),
    );
  },

  run(): Promise<MonthlyBillingMonitor> {
    return unwrapApiResponse(
      apiClient.post<ApiResponse<MonthlyBillingMonitor>>('/admin/monthly-billing/run'),
    );
  },

  retryFailed(): Promise<MonthlyBillingMonitor> {
    return unwrapApiResponse(
      apiClient.post<ApiResponse<MonthlyBillingMonitor>>(
        '/admin/monthly-billing/notifications/retry-failed',
      ),
    );
  },
};
