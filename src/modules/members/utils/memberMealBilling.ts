import type { MealBillingType } from '@/shared/types/member';

export type MemberMealBillingSelection = MealBillingType | 'DEFAULT';

export function resolveEffectiveMemberMealBilling(
  selection: MemberMealBillingSelection,
  spaceDefault: MealBillingType,
): MealBillingType {
  return selection === 'DEFAULT' ? spaceDefault : selection;
}

export function isSubscriptionBilling(
  selection: MemberMealBillingSelection,
  spaceDefault: MealBillingType,
): boolean {
  return resolveEffectiveMemberMealBilling(selection, spaceDefault) === 'PREPAID_BALANCE';
}

/** End of current calendar month (YYYY-MM-DD) — matches mobile. */
export function defaultSubscriptionValidTillIso(reference = new Date()): string {
  const end = new Date(reference.getFullYear(), reference.getMonth() + 1, 0);
  return end.toISOString().slice(0, 10);
}

export function parseValidTillInput(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }
  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return parsed.toISOString().slice(0, 10);
}
