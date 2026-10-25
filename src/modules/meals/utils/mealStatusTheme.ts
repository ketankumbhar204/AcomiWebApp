import type { DailyMenuResponse, MealPollSlot } from '@/shared/types/meals';

/**
 * Primary meal-card status = menu publication only.
 * Poll open/closed is secondary metadata shown under the badge.
 * Matches mobile `mealStatusTheme`.
 */
export type MealStatusKind = 'empty' | 'draft' | 'shared' | 'needs_reshare';

export type MealStatusTheme = {
  color: string;
  background: string;
  labelKey: string;
};

/** Blue accent for poll-response secondary lines (not a menu status). */
export const MENU_PLANNING_POLL_OPEN_COLOR = '#2563EB';

export const MEAL_STATUS_THEME: Record<MealStatusKind, MealStatusTheme> = {
  empty: {
    color: '#C2410C',
    background: '#FFF8E8',
    labelKey: 'meals.status.empty',
  },
  draft: {
    color: '#D97706',
    background: '#FFF8E8',
    labelKey: 'meals.status.notShared',
  },
  shared: {
    color: '#059669',
    background: '#E8F8EF',
    labelKey: 'meals.status.shared',
  },
  needs_reshare: {
    color: '#B45309',
    background: '#FFF8E8',
    labelKey: 'meals.status.needsReshare',
  },
};

function hasPlannedMenu(menu?: DailyMenuResponse | null): boolean {
  return (menu?.options?.filter((option) => option.isAvailable) ?? []).length > 0;
}

/**
 * Resolve primary menu publication status for badges.
 * Poll state must not replace Shared — use secondary hint lines instead.
 */
export function resolveMealStatusKind(
  menu?: DailyMenuResponse | null,
  _poll?: Pick<MealPollSlot, 'status'> | null,
): MealStatusKind {
  if (!menu || !hasPlannedMenu(menu)) {
    return 'empty';
  }
  if (menu.status === 'MODIFIED') {
    return 'needs_reshare';
  }
  if (menu.status === 'PUBLISHED') {
    return 'shared';
  }
  return 'draft';
}

export function mealStatusTheme(kind: MealStatusKind): MealStatusTheme {
  return MEAL_STATUS_THEME[kind];
}
