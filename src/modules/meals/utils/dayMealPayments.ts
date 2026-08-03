import type {
  MealPollPaymentStatus,
  MealType,
  MemberMealActivityDay,
  MemberMealActivityMonth,
} from '@/shared/types/meals';
import { MEAL_TYPES } from './mealDates';
import { normalizeActivityDate, todayIsoDate } from './memberMealActivityCalendar';

export type DayMealPaymentDisplayStatus =
  | 'PENDING'
  | 'OVERDUE'
  | 'PENDING_APPROVAL'
  | 'PAID'
  | 'REJECTED';

export type DayMealPaymentListItem = {
  date: string;
  amount: number;
  currencyCode: string;
  paymentStatus: MealPollPaymentStatus | null;
  displayStatus: DayMealPaymentDisplayStatus;
  mealTypes: MealType[];
  paymentBatchId?: string | null;
  paymentReference?: string | null;
};

export type DayMealPaymentsSection = 'all' | 'actionNeeded' | 'underReview' | 'history';

function acceptedMealTypes(day: MemberMealActivityDay): MealType[] {
  const slots = Array.isArray(day.slots) ? day.slots : [];
  return MEAL_TYPES.filter((mealType) =>
    slots.some((slot) => slot.mealType === mealType && slot.status === 'ACCEPTED'),
  );
}

function normalizePaymentStatus(
  paymentStatus: string | null | undefined,
): MealPollPaymentStatus | null {
  if (paymentStatus == null || paymentStatus === '') return null;
  const normalized = String(paymentStatus).trim().toUpperCase();
  if (normalized === 'PAID') return 'PAID';
  if (normalized === 'REJECTED') return 'REJECTED';
  if (
    normalized === 'PENDING_APPROVAL' ||
    normalized === 'UNDER_REVIEW' ||
    normalized === 'PROOF_UPLOADED' ||
    normalized === 'PROOF_SUBMITTED'
  ) {
    return 'PENDING_APPROVAL';
  }
  if (normalized === 'UPDATE_REQUESTED' || normalized === 'NEEDS_UPDATE') {
    return 'REJECTED';
  }
  if (normalized === 'PENDING') return 'PENDING';
  return 'PENDING';
}

export function resolveDayMealPaymentDisplayStatus(
  paymentStatus: MealPollPaymentStatus | string | null | undefined,
  date: string,
  todayIso: string = todayIsoDate(),
): DayMealPaymentDisplayStatus {
  const status = normalizePaymentStatus(paymentStatus);
  if (status === 'PAID') return 'PAID';
  if (status === 'PENDING_APPROVAL') return 'PENDING_APPROVAL';
  if (status === 'REJECTED') return 'REJECTED';
  const dateKey = normalizeActivityDate(date) ?? date;
  if (dateKey < todayIso) return 'OVERDUE';
  return 'PENDING';
}

function normalizeActivityDay(day: MemberMealActivityDay): MemberMealActivityDay {
  const date = normalizeActivityDate(day.date) ?? String(day.date ?? '');
  const slots = Array.isArray(day.slots) ? day.slots : [];
  return {
    ...day,
    date,
    dayTotal: day.dayTotal != null ? Number(day.dayTotal) : null,
    paymentStatus: normalizePaymentStatus(day.paymentStatus),
    slots,
  };
}

export function buildDayMealPaymentListItems(
  activity: MemberMealActivityMonth | null | undefined,
  todayIso: string = todayIsoDate(),
): DayMealPaymentListItem[] {
  if (!activity?.days?.length) return [];

  return activity.days
    .map(normalizeActivityDay)
    .flatMap((day) => {
      if (!day.date) return [];
      const amount = day.dayTotal != null ? Number(day.dayTotal) : 0;
      const mealTypes = acceptedMealTypes(day);
      const hasCharge = amount > 0 || mealTypes.length > 0;
      if (!hasCharge && day.paymentStatus == null) return [];
      if (!hasCharge && day.paymentStatus === 'PAID') return [];
      if (amount <= 0 && mealTypes.length === 0) return [];

      const paymentStatus = day.paymentStatus ?? null;
      const item: DayMealPaymentListItem = {
        date: day.date,
        amount: amount > 0 ? amount : 0,
        currencyCode: day.currencyCode ?? activity.summary.currencyCode ?? 'INR',
        paymentStatus,
        displayStatus: resolveDayMealPaymentDisplayStatus(paymentStatus, day.date, todayIso),
        mealTypes,
        paymentBatchId: day.paymentBatchId ?? null,
        paymentReference: day.paymentReference ?? null,
      };
      return [item];
    })
    .sort((a, b) => b.date.localeCompare(a.date));
}

export function dayMealPaymentInSection(
  item: DayMealPaymentListItem,
  section: DayMealPaymentsSection,
): boolean {
  switch (section) {
    case 'all':
      return true;
    case 'actionNeeded':
      return (
        item.displayStatus === 'PENDING' ||
        item.displayStatus === 'OVERDUE' ||
        item.displayStatus === 'REJECTED'
      );
    case 'underReview':
      return item.displayStatus === 'PENDING_APPROVAL';
    case 'history':
      return item.displayStatus === 'PAID';
    default:
      return true;
  }
}

export function filterDayMealPaymentsInSection(
  items: DayMealPaymentListItem[],
  section: DayMealPaymentsSection,
): DayMealPaymentListItem[] {
  if (section === 'all') return items;
  return items.filter((item) => dayMealPaymentInSection(item, section));
}

export function countDayMealPaymentsInSection(
  items: DayMealPaymentListItem[],
  section: DayMealPaymentsSection,
): number {
  return filterDayMealPaymentsInSection(items, section).length;
}

/**
 * Prefer Action needed when it has rows; otherwise All when any records exist.
 * Keeps the current section if it still has rows (e.g. user picked History).
 */
export function resolvePreferredDayMealPaymentsSection(
  items: DayMealPaymentListItem[],
  current: DayMealPaymentsSection = 'actionNeeded',
): DayMealPaymentsSection {
  if (items.length === 0) return 'actionNeeded';
  if (countDayMealPaymentsInSection(items, current) > 0) return current;
  if (countDayMealPaymentsInSection(items, 'actionNeeded') > 0) return 'actionNeeded';
  return 'all';
}

export function summarizeDayMealPayments(items: DayMealPaymentListItem[]) {
  const currencyCode = items[0]?.currencyCode ?? 'INR';
  let pendingAmount = 0;
  let collectedAmount = 0;
  let reviewAmount = 0;
  let pendingCount = 0;
  for (const item of items) {
    if (
      item.displayStatus === 'PENDING' ||
      item.displayStatus === 'OVERDUE' ||
      item.displayStatus === 'REJECTED'
    ) {
      pendingAmount += item.amount;
      pendingCount += 1;
    } else if (item.displayStatus === 'PENDING_APPROVAL') {
      reviewAmount += item.amount;
      pendingAmount += item.amount;
    } else if (item.displayStatus === 'PAID') {
      collectedAmount += item.amount;
    }
  }
  return {
    pendingAmount,
    collectedAmount,
    totalAmount: pendingAmount + collectedAmount,
    pendingCount,
    reviewAmount,
    currencyCode,
  };
}

export function canSendPaymentReminder(status?: MealPollPaymentStatus | null): boolean {
  return status === 'PENDING' || status === 'REJECTED';
}
