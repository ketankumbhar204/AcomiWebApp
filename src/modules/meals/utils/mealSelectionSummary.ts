import type { MealPollSlot, MealType } from '@/shared/types/meals';
import { MEAL_TYPES } from './mealDates';

export type MealSummaryLineItem = {
  label: string;
  quantity: number;
  unitPrice?: number | null;
  lineAmount?: number | null;
  currencyCode?: string | null;
};

export type MealSummarySection = {
  mealType: MealType;
  items: MealSummaryLineItem[];
  subtotal?: number | null;
  currencyCode?: string | null;
};

export type MealSelectionSummaryModel = {
  sections: MealSummarySection[];
  totalPlates: number;
  totalAmount: number;
  currencyCode: string;
  selectedMealTypes: MealType[];
};

/** Build summary from open/display poll slots (dashboard customer card). */
export function buildMealSummaryFromPolls(
  polls: MealPollSlot[],
  multiQuantity: boolean,
): MealSelectionSummaryModel {
  const byType = new Map(polls.map((poll) => [poll.mealType, poll]));
  const sections: MealSummarySection[] = [];
  let totalPlates = 0;
  let totalAmount = 0;
  let currencyCode = 'INR';
  const selectedMealTypes: MealType[] = [];

  for (const mealType of MEAL_TYPES) {
    const poll = byType.get(mealType);
    if (!poll) continue;

    const items: MealSummaryLineItem[] = [];
    if (multiQuantity) {
      for (const selection of poll.mySelections ?? []) {
        if (selection.quantity <= 0) continue;
        const option = poll.options.find((row) => row.id === selection.optionId);
        if (!option || option.optionType !== 'MENU_ENTRY') continue;
        const unit = option.price != null ? Number(option.price) : null;
        const line = unit != null ? unit * selection.quantity : null;
        if (option.currencyCode) currencyCode = option.currencyCode;
        items.push({
          label: option.label,
          quantity: selection.quantity,
          unitPrice: unit,
          lineAmount: line,
          currencyCode: option.currencyCode,
        });
      }
    } else if (poll.mySelectedOptionId) {
      const option = poll.options.find((row) => row.id === poll.mySelectedOptionId);
      if (option && option.optionType === 'MENU_ENTRY') {
        const unit = option.price != null ? Number(option.price) : null;
        if (option.currencyCode) currencyCode = option.currencyCode;
        items.push({
          label: option.label,
          quantity: 1,
          unitPrice: unit,
          lineAmount: unit,
          currencyCode: option.currencyCode,
        });
      }
    }

    if (items.length === 0) continue;

    const subtotal = items.reduce((sum, item) => sum + (item.lineAmount ?? 0), 0);
    const plates = items.reduce((sum, item) => sum + item.quantity, 0);
    totalPlates += plates;
    totalAmount += subtotal;
    selectedMealTypes.push(mealType);
    sections.push({
      mealType,
      items,
      subtotal,
      currencyCode,
    });
  }

  return { sections, totalPlates, totalAmount, currencyCode, selectedMealTypes };
}
