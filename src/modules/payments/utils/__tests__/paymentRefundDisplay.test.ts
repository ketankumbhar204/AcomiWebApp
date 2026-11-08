import { describe, expect, it } from 'vitest';
import {
  formatPaymentListTitle,
  matchesPaymentRecordStatusFilter,
  paymentListDisplayStatus,
  resolveSettlementAmounts,
} from '../paymentRefundDisplay';

describe('paymentRefundDisplay', () => {
  it('formats refund titles without duplicate Refund prefixes', () => {
    expect(
      formatPaymentListTitle({
        title: 'Refund – Refund – Rent – November 2026',
        paymentCategory: 'REFUND',
      }),
    ).toBe('Refund · Rent – November 2026');
  });

  it('maps REFUND child rows to Refunded badge status', () => {
    expect(
      paymentListDisplayStatus({
        paymentStatus: 'PAID',
        paymentCategory: 'REFUND',
      }),
    ).toBe('REFUNDED');
  });

  it('maps partial refunds to Partially Refunded', () => {
    expect(
      paymentListDisplayStatus({
        paymentStatus: 'PAID',
        paymentCategory: 'MONTHLY',
        refundedAmount: 1000,
      }),
    ).toBe('PARTIALLY_REFUNDED');
  });

  it('auto-calculates retained for partial refund from remaining refundable', () => {
    expect(resolveSettlementAmounts('PARTIAL_REFUND', 4500, 1200)).toEqual({
      refundAmount: 1200,
      retainedAmount: 3300,
    });
  });

  it('full refund and retain use remaining refundable only', () => {
    expect(resolveSettlementAmounts('FULL_REFUND', 4500)).toEqual({
      refundAmount: 4500,
      retainedAmount: 0,
    });
    expect(resolveSettlementAmounts('RETAIN', 4500)).toEqual({
      refundAmount: 0,
      retainedAmount: 4500,
    });
  });

  it('keeps Refunded and Cancelled filters separate', () => {
    expect(
      matchesPaymentRecordStatusFilter(
        { paymentStatus: 'PAID', paymentCategory: 'REFUND' },
        'REFUNDED',
      ),
    ).toBe(true);
    expect(
      matchesPaymentRecordStatusFilter(
        { paymentStatus: 'PAID', paymentCategory: 'REFUND' },
        'CANCELLED',
      ),
    ).toBe(false);
    expect(
      matchesPaymentRecordStatusFilter(
        { paymentStatus: 'CANCELLED', paymentCategory: 'MONTHLY' },
        'REFUNDED',
      ),
    ).toBe(false);
  });

  it('includes partially refunded originals in Refunded filter, not Paid', () => {
    const partial = {
      paymentStatus: 'PAID' as const,
      paymentCategory: 'MONTHLY' as const,
      partiallyRefunded: true,
      refundedAmount: 1200,
    };
    expect(matchesPaymentRecordStatusFilter(partial, 'REFUNDED')).toBe(true);
    expect(matchesPaymentRecordStatusFilter(partial, 'PAID')).toBe(false);
  });
});
