import type {
  PendingActionGroup,
  PendingActionsSummary,
} from '@/shared/types/dashboard';

/**
 * Operator meal attention types — hide client-side when meal caps are HIDDEN
 * (e.g. RENTAL), even if the API still returns them.
 */
export const MEAL_PENDING_ACTION_TYPES: ReadonlySet<string> = new Set([
  'MENU_NOT_PLANNED',
  'MENU_DRAFT_PENDING_PUBLISH',
  'MEAL_POLL_NOT_PUBLISHED',
  'MEAL_RESPONSES_BELOW_THRESHOLD',
  'MEAL_POLL_PUBLISHED',
  'MEAL_POLL_REMINDER',
  'SUBSCRIPTION_ACTIVATION_PENDING',
]);

export function isMealPendingActionType(actionType: string | undefined): boolean {
  if (!actionType) {
    return false;
  }
  if (MEAL_PENDING_ACTION_TYPES.has(actionType)) {
    return true;
  }
  return actionType.startsWith('MEAL_') || actionType.startsWith('MENU_');
}

/**
 * Defense in depth: strip meal pending groups when both meal capabilities are HIDDEN.
 */
export function filterPendingGroupsWhenMealsHidden(
  groups: PendingActionGroup[] | null | undefined,
  mealsHidden: boolean,
): PendingActionGroup[] {
  const list = groups ?? [];
  if (!mealsHidden) {
    return list;
  }
  return list.filter((group) => !isMealPendingActionType(group.actionType));
}

export function filterPendingSummaryWhenMealsHidden(
  summary: PendingActionsSummary | null | undefined,
  mealsHidden: boolean,
): PendingActionsSummary | null {
  if (!summary) {
    return null;
  }
  if (!mealsHidden) {
    return summary;
  }
  const groups = filterPendingGroupsWhenMealsHidden(summary.groups, true);
  const totalCount = groups.reduce((sum, g) => sum + g.count, 0);
  return { totalCount, groups };
}
