import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  buildTestRequest,
  canAttemptPush,
  credentialLabel,
  diagnosticTone,
  HARMLESS_TEST_BODY,
  HARMLESS_TEST_TITLE,
  historyPlatform,
  nextSendAllowed,
  previewTypes,
  resultMessage,
  resultTone,
  statusChecks,
  statusHeading,
  validateTestSend,
  type TestSendBody,
} from '../src/modules/admin/notificationTesting/notificationTesting.ts';
import type { AdminNotificationTestPage } from '../src/modules/admin/api/adminNotificationTestApi.ts';

const pageSource = readFileSync(new URL('../src/modules/admin/pages/AdminNotificationTestingPage.tsx', import.meta.url), 'utf8');
const apiSource = readFileSync(new URL('../src/modules/admin/api/adminNotificationTestApi.ts', import.meta.url), 'utf8');
const routesSource = readFileSync(new URL('../src/app/router/routes.tsx', import.meta.url), 'utf8');
const layoutSource = readFileSync(new URL('../src/modules/admin/layouts/AdminLayout.tsx', import.meta.url), 'utf8');
const adminRouteSource = readFileSync(new URL('../src/modules/admin/components/AdminRoute.tsx', import.meta.url), 'utf8');

assert.match(routesSource, /path: ROUTES\.adminNotificationTesting/);
assert.match(routesSource, /element: <AdminRoute \/>/);
assert.ok(routesSource.indexOf('element: <AdminRoute />') < routesSource.indexOf('ROUTES.adminNotificationTesting'));
assert.match(adminRouteSource, /isPlatformAdmin/);
assert.match(layoutSource, /ROUTES\.adminNotificationTesting/);
assert.match(layoutSource, /Notification Testing/);
assert.match(pageSource, /Refresh status/);
assert.match(pageSource, /adminNotificationTestApi\.page\(\)/);
assert.match(pageSource, /Send Test Notification/);
assert.match(pageSource, /Browser push is not implemented/);
assert.match(pageSource, /gridTemplateColumns: \{ xs: '1fr', sm: '1fr 1fr'/);
assert.doesNotMatch(pageSource, /userId/);
assert.doesNotMatch(apiSource, /userId/);
assert.doesNotMatch(pageSource, /192\.168|firebase-admin|private_key|BEGIN PRIVATE KEY/);
assert.doesNotMatch(pageSource, /useEffect\(\(\) => \{\s*send\(/);
assert.match(pageSource, /nextSendAllowed\(sendingRef\.current\)/);
assert.match(pageSource, /selected\.defaultTitle/);
assert.match(pageSource, /Show less/);
assert.match(pageSource, /Clear all test notifications\?/);
assert.match(pageSource, /adminNotificationTestApi\.deleteAll\(\)/);
assert.match(pageSource, /adminNotificationTestApi\.deleteOne\(/);
assert.doesNotMatch(pageSource, /deleteAllNotifications|space_notifications/);

const ready: AdminNotificationTestPage = {
  pushEnabled: true,
  firebaseReady: true,
  browserPushImplemented: false,
  credentialReadable: true,
  credentialSource: 'PATH',
  projectStatus: 'MATCH',
  fcmSendPossible: true,
  reasonCode: 'READY',
  pushHint: 'ready',
  types: [],
  registrations: [
    { deviceTokenId: 'device-1', deviceId: 'phone', platform: 'ANDROID', active: true },
  ],
  history: [],
};

assert.equal(diagnosticTone(ready), 'ready');
assert.equal(statusHeading('ready'), 'Ready');
assert.equal(statusChecks(ready).find((row) => row.label === 'Project')?.value, 'acomi-270d0');
assert.equal(previewTypes(['a', 'b', 'c', 'd', 'e', 'f'], false).length, 5);
assert.equal(previewTypes(['a', 'b', 'c', 'd', 'e', 'f'], true).length, 6);
assert.equal(credentialLabel(ready), 'Configured');
assert.equal(canAttemptPush(ready, 'PUSH'), true);

const noDevice = { ...ready, fcmSendPossible: false, registrations: [] };
assert.equal(diagnosticTone(noDevice), 'warning');
assert.equal(
  validateTestSend({
    notificationType: 'PAYMENT_REMINDER_SENT',
    safeToTest: true,
    title: HARMLESS_TEST_TITLE,
    body: HARMLESS_TEST_BODY,
    channel: 'PUSH',
    page: noDevice,
    deviceIds: [],
    target: 'ACCOUNT',
  }),
  noDevice.pushHint,
);

const disabled = { ...ready, pushEnabled: false, firebaseReady: false, fcmSendPossible: false, reasonCode: 'PUSH_DISABLED', credentialReadable: false, projectStatus: 'UNKNOWN' };
assert.equal(diagnosticTone(disabled), 'blocked');
assert.equal(credentialLabel({ ...disabled, reasonCode: 'CREDENTIAL_FILE_MISSING', credentialReadable: false, projectStatus: 'UNKNOWN' }), 'Missing');

const invalid = { ...ready, firebaseReady: false, fcmSendPossible: false, reasonCode: 'INVALID_CREDENTIAL_JSON', credentialReadable: false };
assert.equal(diagnosticTone(invalid), 'failed');

const request = buildTestRequest({
  notificationType: 'PHOTO_REQUEST_RECEIVED',
  channel: 'PUSH',
  title: `  ${HARMLESS_TEST_TITLE}  `,
  body: HARMLESS_TEST_BODY,
  deviceIds: ['device-1'],
  target: 'ACCOUNT',
  clientRequestId: 'once',
});
assert.equal(request.testMode, true);
assert.equal(request.title, HARMLESS_TEST_TITLE);
assert.equal(request.deviceTokenIds, undefined);
assert.equal((request as TestSendBody & { userId?: string }).userId, undefined);
assert.deepEqual(Object.keys(request).sort(), ['body', 'channel', 'clientRequestId', 'notificationType', 'testMode', 'title']);

const selectedDevices = buildTestRequest({
  notificationType: 'PHOTO_REQUEST_RECEIVED',
  channel: 'PUSH',
  title: HARMLESS_TEST_TITLE,
  body: HARMLESS_TEST_BODY,
  deviceIds: ['device-1'],
  target: 'DEVICES',
  clientRequestId: 'once',
});
assert.deepEqual(selectedDevices.deviceTokenIds, ['device-1']);

assert.equal(nextSendAllowed(false), true);
assert.equal(nextSendAllowed(true), false);

const accepted = {
  attemptId: '1',
  notificationType: 'PHOTO_REQUEST_RECEIVED',
  channel: 'PUSH',
  status: 'FCM_ACCEPTED',
  targetedCount: 1,
  acceptedCount: 1,
  failedCount: 0,
  fcmAttempted: true,
  fcmAccepted: true,
  clientReceiptObserved: false,
  devices: [{ deviceTokenId: 'device-1', deviceId: 'phone', platform: 'ANDROID', outcome: 'ACCEPTED' }],
};
assert.equal(resultTone(accepted.status), 'warning');
assert.match(resultMessage(accepted), /does not|not the same as the notification being displayed/);
assert.equal(historyPlatform(accepted), 'ANDROID');
assert.doesNotMatch(resultMessage(accepted), /private_key|BEGIN PRIVATE KEY/);

const partial = { ...accepted, status: 'PARTIAL_SUCCESS', acceptedCount: 1, failedCount: 1, targetedCount: 2 };
assert.equal(resultTone(partial.status), 'warning');
assert.match(resultMessage(partial), /rejected 1/);

const failed = { ...accepted, status: 'FAILED', fcmAccepted: false, acceptedCount: 0, failedCount: 1, errorCode: 'UNREGISTERED', errorDetail: 'FCM rejected the token.' };
assert.equal(resultTone(failed.status), 'failed');
assert.match(resultMessage(failed), /FCM rejected the token/);
assert.doesNotMatch(resultMessage(failed), /fcmToken|private_key/);

const blocked = { ...accepted, status: 'BLOCKED', fcmAttempted: false, fcmAccepted: false, acceptedCount: 0, errorCode: 'NO_REGISTRATION', errorDetail: null };
assert.equal(resultTone(blocked.status), 'blocked');
assert.match(resultMessage(blocked), /admin account/);

console.log('admin notification testing checks passed');
