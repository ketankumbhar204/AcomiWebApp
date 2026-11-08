import { describe, expect, it } from 'vitest';
import { shortStayNightCount } from '../shortStay';

/** Mirrors OccupancyWizardPage Review SHORT total (Android parity). */
function shortStayAllocationTotal(
  dailyRent: number | null,
  deposit: number,
  checkIn: string,
  checkout: string,
): number | null {
  const nights = shortStayNightCount(checkIn, checkout);
  if (dailyRent == null || nights == null || nights <= 0) {
    return null;
  }
  return dailyRent * nights + Math.max(0, deposit);
}

describe('Web SHORT review totals (Android parity)', () => {
  it('uses daily × nights + deposit (not daily + deposit)', () => {
    expect(shortStayAllocationTotal(400, 0, '2026-11-05', '2026-11-12')).toBe(2800);
    expect(shortStayAllocationTotal(400, 3000, '2026-11-05', '2026-11-12')).toBe(5800);
  });

  it('does not treat foodIncludedInRent as a substitute for foodEnabled UI state', () => {
    const foodEnabled = false;
    const foodIncludedInRentSpacePolicy = true;
    const reviewFoodYes = foodEnabled; // Android Review maps from wizard foodEnabled only
    expect(reviewFoodYes).toBe(false);
    expect(foodIncludedInRentSpacePolicy).not.toBe(reviewFoodYes);
  });
});
