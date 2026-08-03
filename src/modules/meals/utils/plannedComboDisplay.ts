import type { DailyMenuOptionResponse, MealComboResponse } from '@/shared/types/meals';

function inferOptionEntryType(
  option: DailyMenuOptionResponse,
): 'COMBO' | 'ITEM' | 'PACKAGE' {
  if (option.entryType === 'COMBO' || option.entryType === 'ITEM' || option.entryType === 'PACKAGE') {
    return option.entryType;
  }
  if (option.comboId) {
    return 'COMBO';
  }
  if (option.itemId) {
    return 'ITEM';
  }
  return 'PACKAGE';
}

/** Item names under a menu option — used for draft share-preview enrichment. */
export function getMenuOptionItemNames(
  option: DailyMenuOptionResponse,
  comboById: Map<string, MealComboResponse>,
): string[] {
  if (option.packageItems?.length) {
    return option.packageItems.map((item) => item.name).filter(Boolean);
  }
  if (option.comboId) {
    const combo = comboById.get(option.comboId);
    return (
      combo?.items
        ?.map((item) => item.name)
        .filter(Boolean) ?? []
    );
  }
  const entryType = inferOptionEntryType(option);
  if ((entryType === 'ITEM' || entryType === 'PACKAGE') && option.label.trim()) {
    return [option.label.trim()];
  }
  return [];
}
