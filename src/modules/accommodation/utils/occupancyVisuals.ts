import { occupancyColors } from '@/shared/theme/colors';

/** Occupancy presentation helpers — keep statuses distinguishable. */

export function occupancyRatio(occupied: number, total: number): number {
  if (total <= 0) return 0;
  return Math.min(1, Math.max(0, occupied / total));
}

/** Top-border / progress accent for entity cards. */
export function occupancyAccent(occupied: number, total: number): string {
  if (total <= 0) return occupancyColors.empty;
  const ratio = occupied / total;
  if (ratio >= 1) return occupancyColors.full;
  if (ratio >= 0.5) return occupancyColors.partial;
  if (occupied > 0) return occupancyColors.partial;
  return occupancyColors.vacant;
}

export function occupancyDotColor(available: number, total: number): string {
  if (total <= 0) return occupancyColors.empty;
  const occupied = total - available;
  return occupancyAccent(occupied, total);
}
