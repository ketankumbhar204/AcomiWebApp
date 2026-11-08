import { describe, expect, it } from 'vitest';
import {
  buildStayFinancialPresentation,
  resolveOccupancyStayKind,
} from '../stayFinancialDisplay';

describe('stayFinancialDisplay (Web)', () => {
  it('shows Daily rent and stay total for SHORT — never Monthly total', () => {
    const presentation = buildStayFinancialPresentation({
      stayKind: 'SHORT',
      rentSnapshot: 400,
      agreedTotal: 2800,
      depositSnapshot: 0,
      foodEnabled: false,
      moveInDate: '2026-11-05',
      expectedExitDate: '2026-11-12',
    });
    expect(presentation.stayKind).toBe('SHORT');
    expect(presentation.rows.some((r) => r.labelDefault.includes('Monthly'))).toBe(false);
    expect(presentation.rows.find((r) => r.key === 'dailyRent')?.value).toContain('/ night');
    expect(presentation.rows.find((r) => r.key === 'stayRent')?.value).toContain('2,800');
  });

  it('maps stayKind through resolveOccupancyStayKind', () => {
    expect(resolveOccupancyStayKind({ stayKind: 'OPEN_ENDED' })).toBe('OPEN_ENDED');
    expect(resolveOccupancyStayKind({ pricingBasis: 'FIXED_TOTAL' })).toBe('SHORT');
  });

  it('shows OPEN_ENDED as No Fixed Move-Out Date with Daily pricing — never Monthly rent', () => {
    const presentation = buildStayFinancialPresentation({
      stayKind: 'OPEN_ENDED',
      pricingBasis: 'DAILY_RATE',
      rentSnapshot: 1000,
      depositSnapshot: 5000,
      foodEnabled: false,
      moveInDate: '2026-11-05',
    });
    expect(presentation.stayKind).toBe('OPEN_ENDED');
    expect(presentation.stayTypeLabelDefault).toBe('No Fixed Move-Out Date');
    expect(presentation.rows.find((r) => r.key === 'pricingBasis')?.value).toBe('Daily');
    expect(presentation.rows.find((r) => r.key === 'dailyRent')?.value).toContain('/ day');
    expect(presentation.rows.some((r) => r.labelDefault.includes('Monthly'))).toBe(false);
  });

  it('surfaces revised OPEN_ENDED rate effective date and prior daily rent', () => {
    const presentation = buildStayFinancialPresentation({
      stayKind: 'OPEN_ENDED',
      pricingBasis: 'DAILY_RATE',
      rentSnapshot: 1200,
      priorRentSnapshot: 1000,
      rentEffectiveMonth: '2026-11-10',
      depositSnapshot: 0,
      foodEnabled: false,
    });
    expect(presentation.rows.find((r) => r.key === 'dailyRent')?.value).toContain('1,200');
    expect(presentation.rows.find((r) => r.key === 'rentEffectiveFrom')?.value).toBe('2026-11-10');
    expect(presentation.rows.find((r) => r.key === 'priorDailyRent')?.value).toContain('1,000');
  });
});
