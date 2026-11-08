import { describe, expect, it } from 'vitest';
import { isOpenEndedRentUnbilled } from '../memberDues';
import { stayMonthlyTotal } from '../memberStayDisplay';

describe('OPEN_ENDED end-of-period billing (Web)', () => {
  it('never treats a daily rentSnapshot as a monthly total', () => {
    expect(stayMonthlyTotal({ stayKind: 'OPEN_ENDED', rentSnapshot: 500 })).toBeNull();
    expect(stayMonthlyTotal({ pricingBasis: 'DAILY_RATE', rentSnapshot: 500 })).toBeNull();
  });

  it('keeps MONTHLY totals unchanged', () => {
    expect(stayMonthlyTotal({ stayKind: 'MONTHLY', rentSnapshot: 9000 })).toBe(9000);
    expect(
      stayMonthlyTotal({
        stayKind: 'MONTHLY',
        rentSnapshot: 9000,
        foodEnabled: true,
        foodIncludedInRent: false,
        foodChargeSnapshot: 500,
      }),
    ).toBe(9500);
  });

  it('flags an open OPEN_ENDED stay with no RENT row as not yet billed', () => {
    expect(isOpenEndedRentUnbilled({ stayKind: 'OPEN_ENDED' }, [])).toBe(true);
    expect(isOpenEndedRentUnbilled({ stayKind: 'OPEN_ENDED' }, [{ paymentType: 'DEPOSIT' }])).toBe(
      true,
    );
  });

  it('does not treat deposit-only lists as rent outstanding (accrued ≠ payable)', () => {
    expect(
      isOpenEndedRentUnbilled({ stayKind: 'OPEN_ENDED', pricingBasis: 'DAILY_RATE' }, [
        { paymentType: 'DEPOSIT' },
      ]),
    ).toBe(true);
  });

  it('treats a backend-generated RENT row as billed', () => {
    expect(isOpenEndedRentUnbilled({ stayKind: 'OPEN_ENDED' }, [{ paymentType: 'RENT' }])).toBe(
      false,
    );
  });

  it('does not flag MONTHLY or SHORT empty lists as open-ended unbilled', () => {
    expect(isOpenEndedRentUnbilled({ stayKind: 'MONTHLY' }, [])).toBe(false);
    expect(isOpenEndedRentUnbilled({ stayKind: 'SHORT' }, [])).toBe(false);
    expect(isOpenEndedRentUnbilled(null, [])).toBe(false);
  });
});
