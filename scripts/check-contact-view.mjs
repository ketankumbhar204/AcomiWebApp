import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { canViewContactDirectly } from '../src/shared/utils/contactViewQuota.ts';

const base = {
  dailyFreeLimit: 5,
  freeUsedToday: 5,
  freeRemainingToday: 0,
  availableCredits: 0,
  viewHereDailyLimit: 5,
  viewHereUsedToday: 0,
  viewHereRemainingToday: 2,
};

assert.equal(canViewContactDirectly(base), true);
assert.equal(
  canViewContactDirectly({ ...base, viewHereRemainingToday: 0 }),
  false,
);
assert.equal(canViewContactDirectly({ ...base, viewHereDailyLimit: 0, viewHereRemainingToday: 0 }), false);
assert.equal(canViewContactDirectly(null), false);
assert.equal(canViewContactDirectly(undefined), false);

const dialog = readFileSync('src/modules/onboarding/components/EnquireDialog.tsx', 'utf8');
assert.match(dialog, /canViewContactDirectly\(quota\)/);
assert.match(dialog, /directViewRef/);
assert.match(dialog, /deliveryChannel: 'VIEW_HERE'/);
assert.doesNotMatch(dialog, /remainingExhausted/);

const admin = readFileSync('src/modules/admin/pages/AdminInquiryPaymentConfigPage.tsx', 'utf8');
const webStart = admin.indexOf('Email / Website / Web App');
const mobileStart = admin.indexOf('>Mobile App<');
assert.ok(webStart > 0 && mobileStart > webStart);
const webSection = admin.slice(webStart, mobileStart);
const mobileSection = admin.slice(mobileStart);
assert.match(admin, /function InstantContactFields/);
assert.match(admin, /Free contact viewing/);
assert.match(admin, /Free instant contact views per day/);
assert.ok(webSection.includes('InstantContactFields'));
assert.ok(webSection.includes('Free email enquiries per day'));
assert.ok(!webSection.includes('Hourly rate limit'));
assert.ok(!webSection.includes('Billing mode'));
assert.ok(mobileSection.includes('InstantContactFields'));
assert.ok(mobileSection.includes('Free mobile enquiries per day'));
assert.ok(mobileSection.includes('Hourly rate limit'));
assert.ok(mobileSection.includes('Billing mode'));
