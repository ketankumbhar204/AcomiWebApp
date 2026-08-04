import type { MealDeliveryLocation } from '@/shared/types/meals';

/**
 * Prefer last selected when still active; otherwise first active catalog location.
 * Mobile SoT: `mealPollDeliveryLocations.resolvePreferredDeliveryLocationId`.
 */
export function resolvePreferredDeliveryLocationId(
  locations: MealDeliveryLocation[],
  lastSelectedId?: string | null,
): string | undefined {
  const active = locations.filter((location) => location.active);
  const catalog = active.length > 0 ? active : locations;
  if (!catalog.length) return undefined;
  if (lastSelectedId && catalog.some((location) => location.id === lastSelectedId)) {
    return lastSelectedId;
  }
  return catalog[0]?.id;
}
