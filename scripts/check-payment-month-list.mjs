import assert from 'node:assert/strict';
import { paymentListEmptyKind, shouldShowMonthPayments } from '../src/modules/payments/utils/paymentMonthList.ts';

assert.equal(
  paymentListEmptyKind({
    selectedMonth: '2026-09',
    loadedMonth: '2026-09',
    pendingAmount: 3166.67,
    recordCount: 1,
    visibleCount: 1,
    preset: 'pending',
  }),
  'none',
);

assert.equal(
  paymentListEmptyKind({
    selectedMonth: '2026-10',
    loadedMonth: '2026-10',
    pendingAmount: 5000,
    recordCount: 0,
    visibleCount: 0,
    preset: 'pending',
  }),
  'mismatch',
);

assert.equal(
  paymentListEmptyKind({
    selectedMonth: '2026-11',
    loadedMonth: '2026-11',
    pendingAmount: 0,
    recordCount: 0,
    visibleCount: 0,
    preset: 'pending',
  }),
  'pending',
);

assert.equal(shouldShowMonthPayments('2026-10', '2026-09'), false);
assert.equal(
  paymentListEmptyKind({
    selectedMonth: '2026-10',
    loadedMonth: '2026-09',
    pendingAmount: 3166.67,
    recordCount: 1,
    visibleCount: 1,
    preset: 'pending',
  }),
  'loading',
);

console.log('payment month list ok');
