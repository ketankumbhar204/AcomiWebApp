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
  /** Outstanding currency for the day. Null when meal prices are not configured. */
  amount: number | null;
  amountKnown: boolean;
  currencyCode: string;
  paymentStatus: MealPollPaymentStatus | null;
  displayStatus: DayMealPaymentDisplayStatus;
  mealTypes: MealType[];
  paymentBatchId?: string | null;
  paymentReference?: string | null;
};

export type DayMealPaymentsSection = 'all' | 'actionNeeded' | 'underReview' | 'history';

function positiveAmount(value: number | null | undefined): number | null {
  if (value == null || Number.isNaN(Number(value))) return null;
  const amount = Number(value);
  return amount > 0 ? amount : null;
}

/** Payable amount for one activity day. A missing meal price stays unknown instead of becoming zero. */
export function resolveDayMealPayableAmount(day: MemberMealActivityDay): {
  amount: number | null;
  amountKnown: boolean;
} {
  if (day.amountKnown === false) {
    return { amount: null, amountKnown: false };
  }
  const live = positiveAmount(day.dayTotal);
  if (live != null) {
    return { amount: live, amountKnown: true };
  }
  const slots = Array.isArray(day.slots) ? day.slots : [];
  const accepted = slots.filter((slot) => slot.status === 'ACCEPTED');
  if (accepted.length === 0) {
    return { amount: 0, amountKnown: true };
  }
  const missingSlotPrice = accepted.some((slot) => positiveAmount(slot.slotAmount) == null);
  if (!missingSlotPrice) {
    const slotSum = accepted.reduce((sum, slot) => sum + (positiveAmount(slot.slotAmount) ?? 0), 0);
    return { amount: slotSum, amountKnown: true };
  }
  return { amount: null, amountKnown: false };
}

function sumKnownAmounts(items: DayMealPaymentListItem[]): number | null {
  if (items.some((item) => !item.amountKnown || item.amount == null)) return null;
  return items.reduce((sum, item) => sum + (item.amount ?? 0), 0);
}

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
      const payable = resolveDayMealPayableAmount(day);
      const amount = payable.amount;
      const mealTypes = acceptedMealTypes(day);
      const hasCharge = (amount != null && amount > 0) || mealTypes.length > 0 || !payable.amountKnown;
      if (!hasCharge && day.paymentStatus == null) return [];
      if (!hasCharge && day.paymentStatus === 'PAID') return [];
      if ((amount == null || amount <= 0) && mealTypes.length === 0 && payable.amountKnown) return [];

      const paymentStatus = day.paymentStatus ?? null;
      const item: DayMealPaymentListItem = {
        date: day.date,
        amount: payable.amountKnown ? amount : null,
        amountKnown: payable.amountKnown,
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
  const actionNeeded = items.filter(
    (item) =>
      item.displayStatus === 'PENDING' ||
      item.displayStatus === 'OVERDUE' ||
      item.displayStatus === 'REJECTED',
  );
  const underReview = items.filter((item) => item.displayStatus === 'PENDING_APPROVAL');
  const paid = items.filter((item) => item.displayStatus === 'PAID');
  const pendingAmount = sumKnownAmounts(actionNeeded);
  const collectedAmount = sumKnownAmounts(paid);
  const reviewAmount = sumKnownAmounts(underReview);
  return {
    pendingAmount,
    collectedAmount,
    totalAmount:
      pendingAmount == null || collectedAmount == null || reviewAmount == null
        ? null
        : pendingAmount + collectedAmount + reviewAmount,
    pendingCount: actionNeeded.length,
    reviewAmount,
    currencyCode,
  };
}

export function canSendPaymentReminder(status?: MealPollPaymentStatus | null): boolean {
  return status === 'PENDING' || status === 'REJECTED';
}
