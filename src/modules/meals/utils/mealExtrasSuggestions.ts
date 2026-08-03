/**
 * Extras suggestion buckets — parity with mobile `utils/mealExtrasSuggestions.ts`.
 */
import type { FoodItemResponse, MealComboResponse } from '@/shared/types/meals';
import type { MenuDraftOption } from './dailyMenuDraft';

export type MealExtraSuggestionBuckets = {
  relevant: FoodItemResponse[];
  related: FoodItemResponse[];
  other: FoodItemResponse[];
  missing: FoodItemResponse[];
};

export function collectSelectedMealItemIds(
  options: MenuDraftOption[],
  comboById: Map<string, MealComboResponse>,
): Set<string> {
  const ids = new Set<string>();
  for (const option of options) {
    if (option.isExtra === true) continue;
    if (option.entryType === 'COMBO' && option.comboId) {
      const combo = comboById.get(option.comboId);
      for (const item of combo?.items ?? []) {
        if (item.itemId) ids.add(item.itemId);
      }
    }
  }
  return ids;
}

export function collectMealExtraCategorySeedIds(
  options: MenuDraftOption[],
  comboById: Map<string, MealComboResponse>,
): Set<string> {
  const ids = collectSelectedMealItemIds(options, comboById);
  for (const option of options) {
    if (option.isExtra === true || option.entryType !== 'PACKAGE') continue;
    for (const itemId of option.itemIds ?? []) ids.add(itemId);
  }
  return ids;
}

export function buildMealExtraSuggestionBuckets(
  catalogItems: FoodItemResponse[],
  selectedMealItemIds: Set<string>,
  categorySeedItemIds: Set<string> = selectedMealItemIds,
): MealExtraSuggestionBuckets {
  const active = catalogItems.filter((item) => item.isActive);
  const byId = new Map(active.map((item) => [item.itemId, item]));

  const libraryExtras: FoodItemResponse[] = [];
  const libraryExtraIds = new Set<string>();
  for (const item of active) {
    if (item.isExtra === true) {
      libraryExtras.push(item);
      libraryExtraIds.add(item.itemId);
    }
  }

  const selectedCategoryIds = new Set<string>();
  for (const itemId of categorySeedItemIds) {
    const item = byId.get(itemId);
    if (item?.categoryId) selectedCategoryIds.add(item.categoryId);
  }

  const relevant: FoodItemResponse[] = [];
  const related: FoodItemResponse[] = [];
  const other: FoodItemResponse[] = [];
  const relevantIds = new Set<string>();

  for (const extra of libraryExtras) {
    if (selectedMealItemIds.has(extra.itemId)) {
      relevant.push(extra);
      relevantIds.add(extra.itemId);
    }
  }

  for (const extra of libraryExtras) {
    if (relevantIds.has(extra.itemId)) continue;
    if (categorySeedItemIds.has(extra.itemId) && !selectedMealItemIds.has(extra.itemId)) {
      other.push(extra);
      continue;
    }
    if (extra.categoryId && selectedCategoryIds.has(extra.categoryId)) {
      related.push(extra);
    } else {
      other.push(extra);
    }
  }

  const missing: FoodItemResponse[] = [];
  for (const itemId of selectedMealItemIds) {
    if (libraryExtraIds.has(itemId)) continue;
    const item = byId.get(itemId);
    if (item) missing.push(item);
  }

  const byName = (a: FoodItemResponse, b: FoodItemResponse) => a.name.localeCompare(b.name);
  relevant.sort(byName);
  related.sort(byName);
  other.sort(byName);
  missing.sort(byName);

  return { relevant, related, other, missing };
}

export function toExtraPackage(item: FoodItemResponse) {
  const price =
    item.defaultPrice != null &&
    !Number.isNaN(Number(item.defaultPrice)) &&
    Number(item.defaultPrice) > 0
      ? Number(item.defaultPrice)
      : null;
  return {
    itemId: item.itemId,
    name: item.name,
    price,
    currencyCode: item.currencyCode ?? 'INR',
    foodType: item.foodType ?? null,
  };
}
