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
