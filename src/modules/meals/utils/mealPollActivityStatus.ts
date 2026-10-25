export type ActivityPollSlot = {
  status: 'ACCEPTED' | 'PENDING' | 'SKIPPED' | 'NO_MENU' | 'CLOSED' | 'INACTIVE';
  pollStatus?: 'OPEN' | 'CLOSED' | null;
};

export function normalizeActivityPollStatus(value: unknown): 'OPEN' | 'CLOSED' | null {
  const raw = String(value ?? '').toUpperCase();
  if (raw === 'OPEN' || raw === 'CLOSED') return raw;
  return null;
}

/** Menu was planned, nothing was chosen, and the poll is no longer open. */
export function isUnansweredClosedPoll(slot: ActivityPollSlot): boolean {
  return slot.status === 'PENDING' && slot.pollStatus === 'CLOSED';
}

/** True when at least one published meal can still be chosen. */
export function canChooseActivityMeals(slots: ActivityPollSlot[]): boolean {
  return slots.some((slot) => slot.status === 'PENDING' && slot.pollStatus !== 'CLOSED');
}

/** True when every visible meal on the day is on a closed poll. */
export function activityDayPollClosed(slots: ActivityPollSlot[]): boolean {
  const visible = slots.filter((slot) => slot.status !== 'INACTIVE' && slot.status !== 'NO_MENU');
  return visible.length > 0 && visible.every((slot) => slot.pollStatus === 'CLOSED');
}
