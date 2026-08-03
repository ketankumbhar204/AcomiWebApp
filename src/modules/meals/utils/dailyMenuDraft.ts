/**
 * Daily menu draft helpers — parity with mobile `utils/dailyMenuDraft.ts`.
 */
import type {
  DailyMenuOptionResponse,
  DailyMenuResponse,
  MealComboResponse,
  UpsertDailyMenuRequest,
} from '@/shared/types/meals';

export type MenuSelectionItemPackage = {
  itemId: string;
  name: string;
  price: number | null;
  currencyCode?: string | null;
  foodType?: string | null;
};

export type MenuDraftOption = {
  optionId?: string | null;
  entryType: 'COMBO' | 'ITEM' | 'PACKAGE';
  comboId?: string | null;
  itemId?: string | null;
  itemIds?: string[] | null;
  label: string;
  sortOrder: number;
  isAvailable: boolean;
  isExtra?: boolean;
  price?: number | null;
  currencyCode?: string | null;
  foodType?: string | null;
};

function inferEntryType(option: DailyMenuOptionResponse): 'COMBO' | 'ITEM' | 'PACKAGE' {
  if (option.entryType === 'COMBO' || option.entryType === 'ITEM' || option.entryType === 'PACKAGE') {
    return option.entryType;
  }
  if (option.itemId) return 'ITEM';
  return 'COMBO';
}

export function toMenuDraftOption(
  option: DailyMenuOptionResponse,
  index: number,
): MenuDraftOption {
  const entryType = inferEntryType(option);
  const packageItemIds =
    entryType === 'PACKAGE'
      ? (option.packageItems?.map((pi) => pi.itemId) ??
        (option.itemId ? [option.itemId] : null))
      : null;
  return {
    optionId: option.optionId ?? null,
    entryType,
    comboId: entryType === 'COMBO' ? option.comboId : null,
    itemId: entryType === 'ITEM' ? option.itemId : null,
    itemIds: packageItemIds,
    label: option.label,
    sortOrder: option.sortOrder ?? index + 1,
    isAvailable: option.isAvailable,
    isExtra: option.isExtra === true,
    price: option.price ?? null,
    currencyCode: option.currencyCode ?? 'INR',
  };
}

export function optionsFromMenu(menu?: DailyMenuResponse | null): MenuDraftOption[] {
  return (menu?.options ?? []).map(toMenuDraftOption);
}

/** Mobile upsert shape: COMBO prices null; PACKAGE carries price + isExtra. */
export function toUpsertOptions(options: MenuDraftOption[]): UpsertDailyMenuRequest['options'] {
  return options.map((option) => ({
    optionId: option.optionId ?? undefined,
    entryType: option.entryType,
    comboId: option.entryType === 'COMBO' ? option.comboId : null,
    itemId: option.entryType === 'ITEM' ? option.itemId : null,
    itemIds: option.entryType === 'PACKAGE' ? (option.itemIds ?? []) : null,
    label: option.label,
    sortOrder: option.sortOrder,
    isAvailable: option.isAvailable,
    isExtra: option.entryType === 'PACKAGE' ? option.isExtra === true : false,
    price: option.entryType === 'PACKAGE' ? (option.price ?? null) : null,
    currencyCode: option.entryType === 'PACKAGE' ? (option.currencyCode ?? 'INR') : null,
  }));
}

export function reindexMenuOptions(options: MenuDraftOption[]): MenuDraftOption[] {
  return options.map((option, index) => ({ ...option, sortOrder: index + 1 }));
}

export function optionKey(option: MenuDraftOption): string {
  if (option.entryType === 'COMBO' && option.comboId) return `COMBO:${option.comboId}`;
  if (option.entryType === 'PACKAGE' && option.isExtra && option.itemIds?.[0]) {
    return `EXTRA:${option.itemIds[0]}`;
  }
  if (option.entryType === 'PACKAGE' && option.itemIds?.length === 1) {
    return `PKG:${option.itemIds[0]}`;
  }
  if (option.entryType === 'PACKAGE' && (option.itemIds?.length ?? 0) > 1) {
    return `ADHOC:${option.label}`;
  }
  if (option.entryType === 'ITEM' && option.itemId) return `ITEM:${option.itemId}`;
  return `ROW:${option.label}:${option.sortOrder}`;
}

export function mergeSelectionIntoOptions(
  prev: MenuDraftOption[],
  combos: Array<{
    comboId: string;
    name: string;
    price?: number | null;
    currencyCode?: string | null;
  }>,
  itemPackages: MenuSelectionItemPackage[],
  adHocPackages: Array<{
    label: string;
    itemIds: string[];
    price?: number | null;
    currencyCode?: string | null;
  }> = [],
  extraPackages: MenuSelectionItemPackage[] = [],
): MenuDraftOption[] {
  const comboOptions: MenuDraftOption[] = combos.map((combo) => ({
    optionId:
      prev.find((o) => o.entryType === 'COMBO' && o.comboId === combo.comboId)?.optionId ?? null,
    entryType: 'COMBO',
    comboId: combo.comboId,
    itemId: null,
    label: combo.name,
    sortOrder: 0,
    isAvailable: true,
    isExtra: false,
    price: combo.price ?? null,
    currencyCode: combo.currencyCode ?? 'INR',
  }));

  const singleItemPackages: MenuDraftOption[] = itemPackages.map((item) => ({
    optionId:
      prev.find(
        (o) =>
          o.entryType === 'PACKAGE' &&
          o.isExtra !== true &&
          o.itemIds?.length === 1 &&
          o.itemIds[0] === item.itemId,
      )?.optionId ?? null,
    entryType: 'PACKAGE',
    comboId: null,
    itemId: null,
    itemIds: [item.itemId],
    label: item.name,
    sortOrder: 0,
    isAvailable: true,
    isExtra: false,
    price: item.price,
    currencyCode: item.currencyCode ?? 'INR',
    foodType: item.foodType ?? null,
  }));

  const extraItemPackages: MenuDraftOption[] = extraPackages.map((item) => ({
    optionId:
      prev.find(
        (o) =>
          o.entryType === 'PACKAGE' &&
          o.isExtra === true &&
          o.itemIds?.length === 1 &&
          o.itemIds[0] === item.itemId,
      )?.optionId ?? null,
    entryType: 'PACKAGE',
    comboId: null,
    itemId: null,
    itemIds: [item.itemId],
    label: item.name,
    sortOrder: 0,
    isAvailable: true,
    isExtra: true,
    price: item.price,
    currencyCode: item.currencyCode ?? 'INR',
    foodType: item.foodType ?? null,
  }));

  const multiItemPackages: MenuDraftOption[] = adHocPackages.map((pkg) => ({
    optionId:
      prev.find(
        (o) =>
          o.entryType === 'PACKAGE' &&
          o.isExtra !== true &&
          (o.itemIds?.length ?? 0) > 1 &&
          o.label === pkg.label,
      )?.optionId ?? null,
    entryType: 'PACKAGE',
    comboId: null,
    itemId: null,
    itemIds: pkg.itemIds,
    label: pkg.label,
    sortOrder: 0,
    isAvailable: true,
    isExtra: false,
    price: pkg.price ?? null,
    currencyCode: pkg.currencyCode ?? 'INR',
  }));

  return reindexMenuOptions([
    ...comboOptions,
    ...multiItemPackages,
    ...singleItemPackages,
    ...extraItemPackages,
  ]);
}

export function countPlannedEntries(options: MenuDraftOption[]): {
  combos: number;
  items: number;
  total: number;
} {
  let combos = 0;
  let items = 0;
  for (const option of options) {
    if (option.isExtra === true) continue;
    if (option.entryType === 'COMBO') {
      combos += 1;
    } else {
      items += 1;
    }
  }
  return { combos, items, total: combos + items };
}

export function plannedSummaryI18nKey(counts: { combos: number; items: number }): string {
  if (counts.combos === 0 && counts.items > 0) return 'meals.menu.plannedSummaryItems';
  if (counts.items === 0 && counts.combos > 0) return 'meals.menu.plannedSummaryCombos';
  if (counts.combos === 0 && counts.items === 0) return 'meals.menu.plannedSummaryEmpty';
  return 'meals.menu.plannedSummaryMixed';
}

export function formatComboIncludeLine(name: string, quantity?: number | null): string {
  if (quantity != null && quantity > 1) return `${name} ×${quantity}`;
  return name;
}

export function getDraftOptionItemNames(
  option: MenuDraftOption,
  comboById: Map<string, MealComboResponse>,
): string[] {
  if (option.entryType === 'COMBO' && option.comboId) {
    return (
      comboById
        .get(option.comboId)
        ?.items?.map((item) => formatComboIncludeLine(item.name, item.quantity))
        .filter(Boolean) ?? []
    );
  }
  return [];
}
