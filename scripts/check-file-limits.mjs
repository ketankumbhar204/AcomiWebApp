import assert from 'node:assert/strict';

const ABSOLUTE_MAX_BYTES = 5 * 1024 * 1024;

function purposeMaxBytes(purpose) {
  const map = {
    PROFILE_PHOTO: 2 * 1024 * 1024,
    IDENTITY_DOCUMENT: ABSOLUTE_MAX_BYTES,
    ADDRESS_PROOF: ABSOLUTE_MAX_BYTES,
    MEMBER_DOCUMENT: ABSOLUTE_MAX_BYTES,
    PAYMENT_PROOF: 4 * 1024 * 1024,
    MEAL_PAYMENT_PROOF: 4 * 1024 * 1024,
    SUBSCRIPTION_PAYMENT_PROOF: 4 * 1024 * 1024,
    COMPLAINT_ATTACHMENT: 4 * 1024 * 1024,
    BUILDING_PHOTO: ABSOLUTE_MAX_BYTES,
    FLOOR_PHOTO: ABSOLUTE_MAX_BYTES,
    UNIT_PHOTO: ABSOLUTE_MAX_BYTES,
    ROOM_PHOTO: ABSOLUTE_MAX_BYTES,
    BED_PHOTO: ABSOLUTE_MAX_BYTES,
    MENU_ITEM_PHOTO: ABSOLUTE_MAX_BYTES,
    COMBO_PHOTO: ABSOLUTE_MAX_BYTES,
    SPACE_PHOTO: ABSOLUTE_MAX_BYTES,
  };
  return Math.min(map[purpose] ?? ABSOLUTE_MAX_BYTES, ABSOLUTE_MAX_BYTES);
}

function computeTargetDimensions(width, height, maxDimension) {
  const longest = Math.max(width, height);
  if (longest <= maxDimension) {
    return { width, height };
  }
  const scale = maxDimension / longest;
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

assert.equal(purposeMaxBytes('MEMBER_DOCUMENT'), ABSOLUTE_MAX_BYTES);
assert.equal(purposeMaxBytes('IDENTITY_DOCUMENT'), ABSOLUTE_MAX_BYTES);
assert.ok(purposeMaxBytes('PROFILE_PHOTO') < ABSOLUTE_MAX_BYTES);
assert.equal(purposeMaxBytes('PAYMENT_PROOF'), 4 * 1024 * 1024);
assert.deepEqual(computeTargetDimensions(800, 600, 1800), { width: 800, height: 600 });
assert.deepEqual(computeTargetDimensions(4000, 3000, 1800), { width: 1800, height: 1350 });
assert.equal(purposeMaxBytes('BUILDING_PHOTO'), ABSOLUTE_MAX_BYTES);
assert.equal(purposeMaxBytes('MENU_ITEM_PHOTO'), ABSOLUTE_MAX_BYTES);

console.log('file-limits ok');
