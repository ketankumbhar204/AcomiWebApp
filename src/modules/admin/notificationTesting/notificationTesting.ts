import type {
  AdminNotificationTestAttempt,
  AdminNotificationTestPage,
  AdminNotificationTestType,
} from '@/modules/admin/api/adminNotificationTestApi';

export const HARMLESS_TEST_TITLE = 'ACOMI FCM Test';
export const HARMLESS_TEST_BODY = 'Local Firebase push notification test.';

export type DiagnosticTone = 'ready' | 'warning' | 'blocked' | 'failed';

export type StatusRow = {
  label: string;
  value: string;
  tone: DiagnosticTone;
};

export type TestSendBody = {
  notificationType: string;
  testMode: true;
  channel: 'PUSH' | 'IN_APP';
  title: string;
  body: string;
  deviceTokenIds?: string[];
  clientRequestId: string;
};

export function diagnosticTone(page: AdminNotificationTestPage): DiagnosticTone {
  if (page.reasonCode === 'INIT_FAILED' || page.reasonCode === 'INVALID_CREDENTIAL_JSON') {
    return 'failed';
  }
  if (
    !page.pushEnabled
    || !page.credentialReadable
    || page.projectStatus === 'MISMATCH'
    || !page.firebaseReady
  ) {
    return 'blocked';
  }
  if (!page.fcmSendPossible) {
    return 'warning';
  }
  return 'ready';
}

export function diagnosticRows(page: AdminNotificationTestPage): StatusRow[] {
  const tone = diagnosticTone(page);
  return [
    {
      label: 'Push',
      value: page.pushEnabled ? 'Enabled' : 'Disabled',
      tone: page.pushEnabled ? 'ready' : 'blocked',
    },
    {
      label: 'Credentials',
      value: credentialLabel(page),
      tone: page.credentialReadable && page.projectStatus !== 'MISMATCH' ? 'ready' : tone,
    },
    {
      label: 'Firebase project',
      value: projectLabel(page.projectStatus),
      tone: page.projectStatus === 'MATCH' ? 'ready' : page.projectStatus === 'MISMATCH' ? 'failed' : 'blocked',
    },
    {
      label: 'Firebase Admin',
      value: page.firebaseReady ? 'Initialized' : 'Not initialized',
      tone: page.firebaseReady ? 'ready' : tone === 'failed' ? 'failed' : 'blocked',
    },
    {
      label: 'Admin devices',
      value: String(page.registrations.length),
      tone: page.registrations.length > 0 ? 'ready' : 'warning',
    },
    {
      label: 'FCM send',
      value: page.fcmSendPossible ? 'Can be attempted' : 'Cannot be attempted',
      tone: page.fcmSendPossible ? 'ready' : tone,
    },
  ];
}

export function credentialLabel(page: Pick<AdminNotificationTestPage, 'credentialReadable' | 'reasonCode' | 'projectStatus'>): string {
  if (page.reasonCode === 'INVALID_CREDENTIAL_JSON') return 'Invalid';
  if (page.projectStatus === 'MISMATCH') return 'Wrong Firebase project';
  if (!page.credentialReadable) return 'Missing';
  return 'Configured';
}

export function projectLabel(projectStatus: string | null | undefined): string {
  if (projectStatus === 'MATCH') return 'Matches acomi-270d0';
  if (projectStatus === 'MISMATCH') return 'Does not match acomi-270d0';
  return 'Unknown';
}

export function canAttemptPush(page: AdminNotificationTestPage | null, channel: 'PUSH' | 'IN_APP'): boolean {
  if (channel === 'IN_APP') return true;
  return Boolean(page?.fcmSendPossible);
}

export function validateTestSend(input: {
  notificationType: string;
  safeToTest: boolean;
  title: string;
  body: string;
  channel: 'PUSH' | 'IN_APP';
  page: AdminNotificationTestPage | null;
  deviceIds: string[];
  target: 'ACCOUNT' | 'DEVICES';
}): string | null {
  if (!input.notificationType || !input.safeToTest) {
    return 'Choose a notification type the backend marks as testable.';
  }
  if (!input.title.trim() || !input.body.trim()) {
    return 'Enter a title and body. No business record is created.';
  }
  if (input.channel === 'PUSH' && !canAttemptPush(input.page, 'PUSH')) {
    return input.page?.pushHint || 'FCM cannot be attempted until push, credentials, and an admin device are ready.';
  }
  if (input.target === 'DEVICES' && input.deviceIds.length === 0) {
    return 'Select one of this admin account’s registered devices, or choose My admin account.';
  }
  return null;
}

export function buildTestRequest(input: {
  notificationType: string;
  channel: 'PUSH' | 'IN_APP';
  title: string;
  body: string;
  deviceIds: string[];
  target: 'ACCOUNT' | 'DEVICES';
  clientRequestId: string;
}): TestSendBody {
  const request: TestSendBody = {
    notificationType: input.notificationType,
    testMode: true,
    channel: input.channel,
    title: input.title.trim(),
    body: input.body.trim(),
    clientRequestId: input.clientRequestId,
  };
  if (input.target === 'DEVICES') {
    request.deviceTokenIds = input.deviceIds;
  }
  return request;
}

export function nextSendAllowed(inFlight: boolean): boolean {
  return !inFlight;
}

export function resultTone(status: string): DiagnosticTone {
  if (status === 'IN_APP_SAVED') return 'ready';
  if (status === 'FCM_ACCEPTED' || status === 'PARTIAL_SUCCESS') return 'warning';
  if (status === 'FAILED') return 'failed';
  return 'blocked';
}

export function resultMessage(attempt: AdminNotificationTestAttempt): string {
  if (attempt.clientReceiptObserved) {
    return 'The device confirmed that it received this notification.';
  }
  if (attempt.status === 'FCM_ACCEPTED') {
    return 'FCM accepted the send. Check your phone\'s notification bar. This does not confirm that the phone displayed it.';
  }
  if (attempt.status === 'PARTIAL_SUCCESS') {
    return `FCM accepted ${attempt.acceptedCount} and rejected ${attempt.failedCount}. Check the phone for the accepted device only.`;
  }
  if (attempt.status === 'FAILED') {
    return attempt.errorDetail || attempt.errorCode || 'FCM rejected the request. No delivery is confirmed.';
  }
  if (attempt.status === 'IN_APP_SAVED') {
    return 'The in-app row was saved. No FCM request was sent.';
  }
  return attempt.errorDetail || pushHintFallback(attempt);
}

function pushHintFallback(attempt: AdminNotificationTestAttempt): string {
  if (attempt.errorCode === 'NO_REGISTRATION') {
    return 'No active registration belongs to this admin account. Sign in on the ACOMI Android app and allow notifications.';
  }
  return attempt.errorCode || 'The test was blocked. No FCM request was sent.';
}

export function typeLabel(types: AdminNotificationTestType[], notificationType: string): string {
  return types.find((item) => item.notificationType === notificationType)?.name || notificationType;
}

export function channelLabel(channel: string): string {
  if (channel === 'PUSH') return 'FCM mobile push';
  if (channel === 'IN_APP') return 'In-app';
  if (channel === 'BROWSER') return 'Browser push';
  return channel;
}

export function historyPlatform(attempt: AdminNotificationTestAttempt): string {
  const platforms = [...new Set((attempt.devices ?? []).map((device) => device.platform).filter(Boolean))];
  if (platforms.length > 0) return platforms.join(', ');
  if (attempt.channel === 'PUSH') return 'Mobile (FCM)';
  if (attempt.channel === 'IN_APP') return 'In-app';
  if (attempt.channel === 'BROWSER') return 'Browser (not implemented)';
  return attempt.channel || '—';
}

export const TYPE_PREVIEW_COUNT = 5;

export function previewTypes<T>(items: T[], expanded: boolean): T[] {
  if (expanded || items.length <= TYPE_PREVIEW_COUNT) {
    return items;
  }
  return items.slice(0, TYPE_PREVIEW_COUNT);
}

export function statusHeading(tone: DiagnosticTone): string {
  if (tone === 'ready') return 'Ready';
  if (tone === 'warning') return 'Warning';
  if (tone === 'failed') return 'Failed';
  return 'Blocked';
}

export function statusChecks(page: AdminNotificationTestPage): Array<{ label: string; value: string; ok: boolean }> {
  return [
    { label: 'Push enabled', value: page.pushEnabled ? 'Yes' : 'No', ok: page.pushEnabled },
    {
      label: 'Firebase credentials',
      value: page.credentialReadable && page.projectStatus !== 'MISMATCH' && page.reasonCode !== 'INVALID_CREDENTIAL_JSON'
        ? 'Readable'
        : credentialLabel(page),
      ok: Boolean(page.credentialReadable) && page.projectStatus !== 'MISMATCH' && page.reasonCode !== 'INVALID_CREDENTIAL_JSON',
    },
    { label: 'Project', value: page.projectStatus === 'MATCH' ? 'acomi-270d0' : projectLabel(page.projectStatus), ok: page.projectStatus === 'MATCH' },
    { label: 'Firebase initialized', value: page.firebaseReady ? 'Yes' : 'No', ok: page.firebaseReady },
    {
      label: 'Registered devices (this admin)',
      value: `${page.registrations.length} device${page.registrations.length === 1 ? '' : 's'}`,
      ok: page.registrations.length > 0,
    },
    { label: 'FCM send possible', value: page.fcmSendPossible ? 'Yes' : 'No', ok: Boolean(page.fcmSendPossible) },
  ];
}

export function toneColor(tone: DiagnosticTone): 'success' | 'warning' | 'error' | 'info' {
  if (tone === 'ready') return 'success';
  if (tone === 'warning') return 'warning';
  if (tone === 'failed') return 'error';
  return 'info';
}
