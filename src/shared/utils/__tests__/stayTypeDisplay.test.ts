import { describe, expect, it } from 'vitest';
import {
  buildStayTypeChipModel,
  hasExplicitStayKind,
  resolveStayTypeForDisplay,
  stayTypeDefaultLabel,
  stayTypeSupportingText,
} from '../stayTypeDisplay';

describe('stayTypeDisplay', () => {
  it('maps enums to approved owner-facing labels', () => {
    expect(stayTypeDefaultLabel('MONTHLY')).toBe('Monthly');
    expect(stayTypeDefaultLabel('SHORT')).toBe('Daily');
    expect(stayTypeDefaultLabel('OPEN_ENDED')).toBe('No Fixed Move-Out Date');
  });

  it('does not invent a stay type when stayKind and pricingBasis are both missing', () => {
    expect(resolveStayTypeForDisplay({})).toBeNull();
    expect(hasExplicitStayKind({})).toBe(false);
    expect(buildStayTypeChipModel({}, { requireExplicitStayKind: true })).toBeNull();
  });

  it('builds SHORT chip with daily rate and checkout support text', () => {
    const chip = buildStayTypeChipModel({
      stayKind: 'SHORT',
      rentSnapshot: 1000,
      agreedTotal: 7000,
      moveInDate: '2026-11-05',
      expectedExitDate: '2026-11-12',
    });
    expect(chip?.labelDefault).toBe('Daily');
    expect(chip?.supportingText).toContain('/ night');
    expect(chip?.supportingText).toContain('Checkout 2026-11-12');
  });

  it('builds OPEN_ENDED chip with daily pricing and move-out not fixed', () => {
    const chip = buildStayTypeChipModel({
      stayKind: 'OPEN_ENDED',
      pricingBasis: 'DAILY_RATE',
      rentSnapshot: 400,
    });
    expect(chip?.labelDefault).toBe('No Fixed Move-Out Date');
    expect(chip?.supportingText).toContain('/ day');
    expect(chip?.supportingText).toContain('Move-out not fixed');
    expect(stayTypeSupportingText({ stayKind: 'OPEN_ENDED', rentSnapshot: 400 })).not.toMatch(
      /month/i,
    );
  });

  it('builds MONTHLY chip with monthly rent support text', () => {
    const chip = buildStayTypeChipModel({
      stayKind: 'MONTHLY',
      rentSnapshot: 8000,
    });
    expect(chip?.labelDefault).toBe('Monthly');
    expect(chip?.supportingText).toContain('₹8,000');
    expect(chip?.supportingText).toContain('/month');
  });
});
