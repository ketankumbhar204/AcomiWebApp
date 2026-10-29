import type { MealType } from '@/shared/types/meals';

export const MEAL_TYPES: MealType[] = ['BREAKFAST', 'LUNCH', 'DINNER'];

export function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export function addDaysIso(isoDate: string, days: number): string {
  const d = new Date(`${isoDate}T12:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Daily-menu list endpoint rejects ranges longer than this, counting both ends. */
export const MAX_MENU_RANGE_DAYS = 31;

/** Splits an inclusive calendar range into windows the daily-menu API accepts. */
export function splitMenuDateRange(
  from: string,
  to: string,
  maxInclusiveDays = MAX_MENU_RANGE_DAYS,
): Array<{ from: string; to: string }> {
  if (!from || !to || from > to || maxInclusiveDays < 1) {
    return [{ from, to }];
  }
  const windows: Array<{ from: string; to: string }> = [];
  let cursor = from;
  while (cursor <= to) {
    const windowEnd = addDaysIso(cursor, maxInclusiveDays - 1);
    const end = windowEnd < to ? windowEnd : to;
    windows.push({ from: cursor, to: end });
    if (end >= to) {
      break;
    }
    cursor = addDaysIso(end, 1);
  }
  return windows;
}

export function formatMenuDateLabel(isoDate: string, locale?: string): string {
  try {
    return new Date(`${isoDate}T12:00:00`).toLocaleDateString(locale, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return isoDate;
  }
}

/** Matches mobile `isPastMenuDate` — past calendar days are read-only. */
export function isPastMenuDate(isoDate: string): boolean {
  return isoDate < todayIsoDate();
}
