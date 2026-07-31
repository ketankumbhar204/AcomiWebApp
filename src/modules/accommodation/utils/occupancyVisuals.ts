/** Occupancy presentation helpers — match Accommodation Figma accents. */

export function occupancyRatio(occupied: number, total: number): number {
  if (total <= 0) return 0;
  return Math.min(1, Math.max(0, occupied / total));
}

/** Top-border / progress accent for entity cards. */
export function occupancyAccent(occupied: number, total: number): string {
  if (total <= 0) return '#94A3B8';
  const ratio = occupied / total;
  if (ratio >= 1) return '#F59E0B'; // full — amber
  if (ratio >= 0.5) return '#3B82F6'; // partial — blue
  if (occupied > 0) return '#3B82F6';
  return '#10B981'; // available — green
}

export function occupancyDotColor(available: number, total: number): string {
  if (total <= 0) return '#94A3B8';
  const occupied = total - available;
  return occupancyAccent(occupied, total);
}
