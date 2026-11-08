import { describe, expect, it } from 'vitest';
import {
  formatPersistedRentBreakdown,
  isDailyRateRentSnapshot,
  paymentDisplayTitle,
} from '../paymentDisplay';

describe('paymentDisplayTitle', () => {
  it('returns the backend title without appending a second month label', () => {
    expect(
      paymentDisplayTitle({
        title: 'Rent — November 2026',
        month: '2026-11',
        paymentType: 'RENT',
      }),
    ).toBe('Rent — November 2026');
  });

  it('trims whitespace only', () => {
    expect(paymentDisplayTitle({ title: '  Deposit  ', month: '2026-11' })).toBe('Deposit');
  });

  it('normalizes duplicate Refund prefixes on REFUND rows', () => {
    expect(
      paymentDisplayTitle({
        title: 'Refund – Refund – Rent – November 2026',
        month: '2026-11',
        paymentType: 'RENT',
        paymentCategory: 'REFUND',
      }),
    ).toBe('Refund · Rent – November 2026');
  });
});

describe('formatPersistedRentBreakdown', () => {
  it('formats OPEN_ENDED mid-month from prorated amount ÷ billable days', () => {
    expect(
      formatPersistedRentBreakdown({
        paymentType: 'RENT',
        amount: 26000,
        baseAmount: 26000,
        currencyCode: 'INR',
        billableDays: 26,
        daysInMonth: 30,
        isProrated: true,
        // Backend stores daily × daysInMonth (not raw daily).
        configuredMonthlyAmount: 30000,
        billingPeriodStart: '2026-11-05',
        billingPeriodEnd: '2026-11-30',
      }),
    ).toBe('₹1,000 × 26 days (5 Nov–30 Nov) = ₹26,000');
  });

  it('omits full-month OPEN_ENDED breakdown without an explicit daily configured amount', () => {
    // Full-month OPEN_ENDED and MONTHLY look identical without stayKind on the payment DTO.
    const payment = {
      paymentType: 'RENT' as const,
      amount: 30000,
      baseAmount: 30000,
      currencyCode: 'INR',
      billableDays: 30,
      daysInMonth: 30,
      isProrated: false,
      configuredMonthlyAmount: 30000,
      billingPeriodStart: '2026-11-01',
      billingPeriodEnd: '2026-11-30',
    };
    expect(isDailyRateRentSnapshot(payment)).toBe(false);
    expect(formatPersistedRentBreakdown(payment)).toBeNull();
  });

  it('does not invent a daily breakdown for full-month MONTHLY rent', () => {
    expect(
      formatPersistedRentBreakdown({
        paymentType: 'RENT',
        amount: 10000,
        baseAmount: 10000,
        currencyCode: 'INR',
        billableDays: 30,
        daysInMonth: 30,
        isProrated: false,
        configuredMonthlyAmount: 10000,
        billingPeriodStart: '2026-11-01',
        billingPeriodEnd: '2026-11-30',
      }),
    ).toBeNull();
  });

  it('returns null when billable days are missing', () => {
    expect(
      formatPersistedRentBreakdown({
        paymentType: 'RENT',
        amount: 26000,
        currencyCode: 'INR',
        billableDays: null,
        configuredMonthlyAmount: 1000,
      }),
    ).toBeNull();
  });
});
