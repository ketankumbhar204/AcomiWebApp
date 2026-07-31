import type { MemberMealActivityDay, MealPollPaymentStatus } from '@/shared/types/meals';
import { normalizeActivityDate } from './memberMealActivityCalendar';

export type ActivityHistoryFilter = 'ALL' | 'PAID' | 'PENDING' | 'SKIPPED';

export type ActivityPaymentDisplay =
  | 'PAID'
  | 'IN_REVIEW'
  | 'PENDING'
  | 'OVERDUE'
  | 'REJECTED'
  | 'NONE';

const MEAL_PREFIX: Record<string, string> = {
  BREAKFAST: 'B',
  LUNCH: 'L',
  DINNER: 'D',
};

export function formatActivityListDate(isoDate: string, locale?: string): string {
  const normalized = normalizeActivityDate(isoDate) ?? isoDate;
  const [year, month, day] = normalized.split('-').map(Number);
  const date = new Date(year ?? 1970, (month ?? 1) - 1, day ?? 1);
  const weekday = date.toLocaleDateString(locale, { weekday: 'short' });
  const monthDay = date.toLocaleDateString(locale, { day: 'numeric', month: 'short' });
  return `${monthDay} (${weekday})`;
}

export function mealSlotPrefix(mealType: string): string {
  return MEAL_PREFIX[mealType] ?? mealType.slice(0, 1);
}

export function dayHasListActivity(day: MemberMealActivityDay): boolean {
  const slots = day.slots ?? [];
  return slots.some(
    (slot) =>
      slot.status === 'ACCEPTED' ||
      slot.status === 'PENDING' ||
      slot.status === 'SKIPPED',
  );
}

export function resolveActivityPaymentDisplay(
  day: MemberMealActivityDay,
  todayIso: string,
): ActivityPaymentDisplay {
  const total = day.dayTotal != null ? Number(day.dayTotal) : 0;
  if (total <= 0) return 'NONE';
  const status = day.paymentStatus as MealPollPaymentStatus | null | undefined;
  if (status === 'PAID') return 'PAID';
  if (status === 'PENDING_APPROVAL') return 'IN_REVIEW';
  if (status === 'REJECTED') return 'REJECTED';
  const dateKey = normalizeActivityDate(day.date) ?? day.date;
  if (dateKey < todayIso) return 'OVERDUE';
  return 'PENDING';
}

export function dayMatchesActivityFilter(
  day: MemberMealActivityDay,
  filter: ActivityHistoryFilter,
  todayIso: string,
): boolean {
  if (filter === 'ALL') return dayHasListActivity(day);
  if (filter === 'SKIPPED') {
    return (day.slots ?? []).some((slot) => slot.status === 'SKIPPED');
  }
  const display = resolveActivityPaymentDisplay(day, todayIso);
  if (filter === 'PAID') return display === 'PAID';
  if (filter === 'PENDING') {
    return display === 'PENDING' || display === 'IN_REVIEW' || display === 'OVERDUE';
  }
  return true;
}

export function sortActivityDays(
  days: MemberMealActivityDay[],
  order: 'asc' | 'desc' = 'desc',
): MemberMealActivityDay[] {
  return [...days].sort((a, b) => {
    const left = normalizeActivityDate(a.date) ?? a.date;
    const right = normalizeActivityDate(b.date) ?? b.date;
    return order === 'asc' ? left.localeCompare(right) : right.localeCompare(left);
  });
}
