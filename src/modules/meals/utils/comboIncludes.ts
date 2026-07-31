/** Combo include / quantity helpers — parity with mobile `utils/comboIncludes.ts`. */

export function normalizeComboItemQuantity(quantity?: number | null): number {
  if (quantity == null || !Number.isFinite(quantity) || quantity < 1) {
    return 1;
  }
  return Math.floor(quantity);
}

export function buildItemQuantitiesPayload(
  itemIds: string[],
  quantities: Record<string, number>,
): Array<{ itemId: string; quantity: number }> {
  return itemIds.map((itemId) => ({
    itemId,
    quantity: normalizeComboItemQuantity(quantities[itemId]),
  }));
}

export function syncItemQuantities(
  prev: Record<string, number>,
  selectedIds: string[],
): Record<string, number> {
  const next: Record<string, number> = {};
  for (const id of selectedIds) {
    next[id] = normalizeComboItemQuantity(prev[id]);
  }
  return next;
}
