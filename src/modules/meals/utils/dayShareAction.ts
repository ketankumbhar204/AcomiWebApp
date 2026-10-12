export type DayShareVisual = 'not_shared' | 'shared' | 'updated' | 'failed';

export function resolveDayShareVisual(
  summary: PlannedDayCounts,
  options?: { shareFailed?: boolean },
): DayShareVisual {
  if (summary.modified > 0) {
    return options?.shareFailed ? 'failed' : 'updated';
  }
  if (summary.published > 0 && summary.draft === 0) {
    return 'shared';
  }
  return options?.shareFailed ? 'failed' : 'not_shared';
}

export type DayPollControl = 'hidden' | 'open' | 'closed';

export function resolveDayPollControl(
  statuses: ReadonlyArray<'OPEN' | 'CLOSED'>,
): DayPollControl {
  if (statuses.length === 0) {
    return 'hidden';
  }
  if (statuses.some((status) => status === 'OPEN')) {
    return 'open';
  }
  return 'closed';
}

export function isMealPlanned(
  menu?: { options?: Array<{ isAvailable?: boolean }> | null } | null,
): boolean {
  return (menu?.options?.filter((option) => option.isAvailable) ?? []).length > 0;
}

export type DayShareAction = 'hidden' | 'share' | 'reshare';

export type PlannedDayCounts = {
  published: number;
  modified: number;
  draft: number;
};

/**
 * Share publishes drafts and opens polls.
 * Reshare is external sharing of a day whose planned meals are already published.
 * An edit (MODIFIED) returns to Share so the updated menu is published again.
 */
export function resolveDayShareAction(summary: PlannedDayCounts): DayShareAction {
  const planned = summary.published + summary.modified + summary.draft;
  if (planned <= 0) {
    return 'hidden';
  }
  if (summary.draft === 0 && summary.modified === 0 && summary.published > 0) {
    return 'reshare';
  }
  return 'share';
}
