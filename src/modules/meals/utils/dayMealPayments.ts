import type {
  MealPollPaymentStatus,
  MealType,
  MemberMealActivityDay,
  MemberMealActivityMonth,
} from '@/shared/types/meals';
import { MEAL_TYPES, todayIsoDate } from './mealDates';

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

export type DayMealPaymentsSection = 'actionNeeded' | 'underReview' | 'history';

function acceptedMealTypes(day: MemberMealActivityDay): MealType[] {
  return MEAL_TYPES.filter((mealType) =>
    day.slots.some((slot) => slot.mealType === mealType && slot.status === 'ACCEPTED'),
  );
}

export function resolveDayMealPaymentDisplayStatus(
  paymentStatus: MealPollPaymentStatus | null | undefined,
  date: string,
  todayIso: string = todayIsoDate(),
): DayMealPaymentDisplayStatus {
  if (paymentStatus === 'PAID') return 'PAID';
  if (paymentStatus === 'PENDING_APPROVAL') return 'PENDING_APPROVAL';
  if (paymentStatus === 'REJECTED') return 'REJECTED';
  if (date < todayIso) return 'OVERDUE';
  return 'PENDING';
}

export function buildDayMealPaymentListItems(
  activity: MemberMealActivityMonth | null | undefined,
  todayIso: string = todayIsoDate(),
): DayMealPaymentListItem[] {
  if (!activity?.days?.length) return [];

  return activity.days
    .flatMap((day) => {
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
      return false;
  }
}

export function filterDayMealPaymentsInSection(
  items: DayMealPaymentListItem[],
  section: DayMealPaymentsSection,
): DayMealPaymentListItem[] {
  return items.filter((item) => dayMealPaymentInSection(item, section));
}

export function summarizeDayMealPayments(items: DayMealPaymentListItem[]) {
  const currencyCode = items[0]?.currencyCode ?? 'INR';
  let pendingAmount = 0;
  let collectedAmount = 0;
  let pendingCount = 0;
  for (const item of items) {
    if (
      item.displayStatus === 'PENDING' ||
      item.displayStatus === 'OVERDUE' ||
      item.displayStatus === 'REJECTED' ||
      item.displayStatus === 'PENDING_APPROVAL'
    ) {
      pendingAmount += item.amount;
      if (item.displayStatus !== 'PENDING_APPROVAL') pendingCount += 1;
    }
    if (item.displayStatus === 'PAID') collectedAmount += item.amount;
  }
  return {
    pendingAmount,
    collectedAmount,
    totalAmount: pendingAmount + collectedAmount,
    pendingCount,
    currencyCode,
  };
}

export function canSendPaymentReminder(status?: MealPollPaymentStatus | null): boolean {
  return status === 'PENDING' || status === 'REJECTED';
}
