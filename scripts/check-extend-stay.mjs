import assert from 'node:assert/strict';
import { buildExtendStayRequest } from '../src/modules/accommodation/utils/extendStay.ts';

const paid = buildExtendStayRequest({
  expectedExitDate: '2026-11-10',
  additionalAmount: '1600',
  rentSnapshot: '',
  rentEffectiveMonth: '',
  idempotencyKey: 'key-1',
});
assert.deepEqual(paid, {
  expectedExitDate: '2026-11-10',
  additionalAmount: 1600,
  idempotencyKey: 'key-1',
});

const free = buildExtendStayRequest({
  expectedExitDate: '2026-11-10',
  additionalAmount: '',
  rentSnapshot: '  ',
  rentEffectiveMonth: '',
  idempotencyKey: 'key-2',
});
assert.equal(free.additionalAmount, undefined);
assert.equal(free.rentSnapshot, undefined);

const rent = buildExtendStayRequest({
  expectedExitDate: '2026-11-30',
  additionalAmount: '0',
  rentSnapshot: '11000',
  rentEffectiveMonth: '2026-11',
  idempotencyKey: 'key-3',
});
assert.equal(rent.additionalAmount, 0);
assert.equal(rent.rentSnapshot, 11000);
assert.equal(rent.rentEffectiveMonth, '2026-11-01');

assert.throws(
  () =>
    buildExtendStayRequest({
      expectedExitDate: '2026-11-30',
      additionalAmount: '',
      rentSnapshot: '11000',
      rentEffectiveMonth: '',
      idempotencyKey: 'key-4',
    }),
  /RENT_FIELDS/,
);

console.log('extend stay request builder checks passed');
