import assert from 'node:assert/strict';
import {
  buildReviseOpenEndedRentRequest,
  defaultRentEffectiveFromYmd,
  previousRateThroughYmd,
} from '../src/modules/accommodation/utils/reviseOpenEndedRent.ts';

assert.equal(defaultRentEffectiveFromYmd('2026-11-06'), '2026-11-07');
assert.equal(defaultRentEffectiveFromYmd('2026-11-30'), '2026-12-01');
assert.equal(previousRateThroughYmd('2026-11-10'), '2026-11-09');

const body = buildReviseOpenEndedRentRequest({
  currentDailyRent: 1000,
  newDailyRent: '1200',
  effectiveFrom: '2026-11-10',
  reasonCode: 'RENT_REVISION',
  reasonOther: '',
  idempotencyKey: 'key-1',
});
assert.deepEqual(body, {
  idempotencyKey: 'key-1',
  rentSnapshot: 1200,
  rentEffectiveMonth: '2026-11-10',
  reason: 'Rent revision',
});
assert.equal(Object.hasOwn(body, 'expectedExitDate'), false);
assert.equal(Object.hasOwn(body, 'additionalAmount'), false);

assert.throws(
  () =>
    buildReviseOpenEndedRentRequest({
      currentDailyRent: 1000,
      newDailyRent: '1000',
      effectiveFrom: '2026-11-10',
      reasonCode: '',
      reasonOther: '',
      idempotencyKey: 'key-1',
    }),
  /RENT_UNCHANGED/,
);

assert.throws(
  () =>
    buildReviseOpenEndedRentRequest({
      currentDailyRent: null,
      newDailyRent: '1200',
      effectiveFrom: '2026-11-10',
      reasonCode: '',
      reasonOther: '',
      idempotencyKey: 'key-1',
    }),
  /CURRENT_RENT_MISSING/,
);

console.log('revise open-ended rent request builder checks passed');
