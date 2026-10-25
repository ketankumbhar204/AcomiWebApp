import assert from 'node:assert/strict';
import { summarizeMemberDashboardLedger } from '../src/modules/meals/utils/memberDashboardLedgerStats.ts';

const today = '2026-10-17';

const overdue = summarizeMemberDashboardLedger(
  [
    {
      paymentStatus: 'PENDING',
      amount: 6000,
      outstandingAmount: 6000,
      dueDate: '2026-10-07',
      isOverdue: true,
    },
    {
      paymentStatus: 'PENDING',
      amount: 1000,
      outstandingAmount: 1000,
      dueDate: '2026-10-10',
      isOverdue: true,
    },
  ],
  today,
);
assert.equal(overdue.dueAmount, 7000);
assert.equal(overdue.upcomingCount, 0);
assert.equal(overdue.openPaymentCount, 2);

const settled = summarizeMemberDashboardLedger(
  [
    {
      paymentStatus: 'PAID',
      amount: 6000,
      outstandingAmount: 0,
      dueDate: '2026-10-05',
    },
  ],
  today,
);
assert.deepEqual(settled, { dueAmount: 0, upcomingCount: 0, openPaymentCount: 0 });
assert.equal(summarizeMemberDashboardLedger([], today).dueAmount, 0);

const partial = summarizeMemberDashboardLedger(
  [
    {
      paymentStatus: 'PENDING',
      amount: 6000,
      outstandingAmount: 2000,
      dueDate: '2026-10-20',
    },
  ],
  today,
);
assert.equal(partial.dueAmount, 2000);
assert.equal(partial.upcomingCount, 1);

const mixed = summarizeMemberDashboardLedger(
  [
    {
      paymentStatus: 'PAID',
      amount: 6000,
      outstandingAmount: 0,
      dueDate: '2026-10-05',
    },
    {
      paymentStatus: 'PENDING',
      amount: 500,
      outstandingAmount: null,
      dueDate: '2026-10-28',
    },
  ],
  today,
);
assert.equal(mixed.dueAmount, 500);
assert.equal(mixed.upcomingCount, 1);
assert.equal(mixed.openPaymentCount, 1);

console.log('member dashboard stats ok');
