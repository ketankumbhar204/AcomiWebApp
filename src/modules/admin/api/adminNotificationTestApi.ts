import apiClient from '@/shared/api/client';
import { unwrapApiResponse } from '@/shared/api/apiRequest';
import type { ApiResponse } from '@/shared/types/api';

export type AdminNotificationTestType = {
  notificationType: string;
  name: string;
  description: string;
  category: string;
  channels: string[];
  implementationStatus: string;
  safeToTest: boolean;
  defaultTitle: string;
  defaultBody: string;
  productionActionRoute: string;
};

export type AdminNotificationRegistration = {
  deviceTokenId: string;
  deviceId: string;
  platform: string;
  appVersion?: string | null;
  active: boolean;
  lastSeenAt?: string | null;
};

export type AdminNotificationTestAttempt = {
  attemptId: string;
  notificationType: string;
  channel: string;
  status: string;
  targetedCount: number;
  acceptedCount: number;
  failedCount: number;
  errorCode?: string | null;
  errorDetail?: string | null;
  createdAt?: string | null;
  payloadConstructed?: boolean;
  notificationPersisted?: boolean;
  fcmAttempted?: boolean;
  fcmAccepted?: boolean;
  clientReceiptObserved?: boolean;
  devices?: Array<{
    deviceTokenId: string;
    deviceId: string;
    platform: string;
    outcome: string;
    errorCode?: string | null;
  }>;
};

export type AdminNotificationTestPage = {
  pushEnabled: boolean;
  firebaseReady: boolean;
  browserPushImplemented: boolean;
  credentialSource?: string | null;
  credentialReadable?: boolean;
  projectStatus?: string | null;
  fcmSendPossible?: boolean;
  reasonCode?: string | null;
  pushHint?: string | null;
  types: AdminNotificationTestType[];
  registrations: AdminNotificationRegistration[];
  history: AdminNotificationTestAttempt[];
};

export const adminNotificationTestApi = {
  page: () =>
    unwrapApiResponse(
      apiClient.get<ApiResponse<AdminNotificationTestPage>>('/admin/notifications/test'),
    ),
  send: (body: {
    notificationType: string;
    testMode: true;
    channel: 'PUSH' | 'IN_APP';
    title: string;
    body: string;
    deviceTokenIds?: string[];
    clientRequestId: string;
  }) =>
    unwrapApiResponse(
      apiClient.post<ApiResponse<AdminNotificationTestAttempt>>('/admin/notifications/test', body),
    ),
  deleteOne: (attemptId: string) =>
    unwrapApiResponse(
      apiClient.delete<ApiResponse<{ deletedCount: number }>>(`/admin/notifications/test/${attemptId}`),
    ),
  deleteAll: () =>
    unwrapApiResponse(
      apiClient.delete<ApiResponse<{ deletedCount: number }>>('/admin/notifications/test'),
    ),
};
