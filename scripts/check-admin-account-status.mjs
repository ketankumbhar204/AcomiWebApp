import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  describeAdminAccountActivity,
  formatActivityFact,
} from '../src/modules/admin/utils/adminAccountStatus.ts';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const page = readFileSync(
  join(root, 'src/modules/admin/pages/AdminRegisteredUserDetailPage.tsx'),
  'utf8',
);
const labels = {
  never: 'Never',
  unknown: 'Not recorded',
  justNow: 'Just now',
  minutesAgo: (count) => `${count} min ago`,
  hoursAgo: (count) => `${count} hr ago`,
  daysAgo: (count) => `${count} days ago`,
};
const now = new Date('2026-10-17T18:16:00+05:30');

const deactivated = describeAdminAccountActivity({
  active: false,
  activityTracked: true,
  lastActiveAt: null,
  lastLoginAt: null,
  now,
});
assert.equal(deactivated.status, 'deactivated');
assert.equal(formatActivityFact(deactivated.lastActive, labels), 'Never');
assert.equal(formatActivityFact(deactivated.lastLogin, labels), 'Never');

const unknown = describeAdminAccountActivity({
  active: true,
  activityTracked: false,
  now,
});
assert.equal(formatActivityFact(unknown.lastActive, labels), 'Not recorded');
assert.equal(formatActivityFact(unknown.lastLogin, labels), 'Not recorded');
assert.equal(
  describeAdminAccountActivity({ active: undefined, activityTracked: true, now }).status,
  'unknown',
);

const recorded = describeAdminAccountActivity({
  active: true,
  activityTracked: true,
  lastLoginAt: '2026-10-17T17:16:00+05:30',
  lastActiveAt: '2026-10-17T17:16:00+05:30',
  now,
});
assert.equal(
  formatActivityFact(recorded.lastActive, labels),
  '1 hr ago\n17 Oct 2026, 5:16 pm GMT+5:30',
);
assert.equal(JSON.stringify(recorded).includes('online'), false);

const usedWithoutLogin = describeAdminAccountActivity({
  active: true,
  activityTracked: true,
  lastActiveAt: '2026-10-17T18:15:30+05:30',
  lastLoginAt: null,
  now,
});
assert.equal(formatActivityFact(usedWithoutLogin.lastLogin, labels), 'Not recorded');
assert.equal(usedWithoutLogin.lastActive.presence, 'timestamp');

assert.match(page, /describeAdminAccountActivity/);
assert.match(page, /accountStatusSection/);
assert.match(page, /lastActive/);
assert.match(page, /lastLogin/);
assert.doesNotMatch(page, /currently online|isOnline|currentSession/i);

console.log('admin account status checks passed');
