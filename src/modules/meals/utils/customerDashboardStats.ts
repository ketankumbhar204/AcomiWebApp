import type { MealPollSlot, MemberMealActivityDay, MemberMealActivityMonth } from '@/shared/types/meals';
import { dayHasActivity } from './memberMealActivityCalendar';

export {
  remainingPayable,
  summarizeMemberDashboardLedger,
  type MemberDashboardLedgerPayment,
  type MemberDashboardLedgerStats,
} from './memberDashboardLedgerStats';

/** Count published menu entries (combos/items) across B/L/D polls for the day. */
export function countMenuItemsFromPolls(polls: MealPollSlot[]): number {
  return polls.reduce((sum, poll) => {
    const entries = poll.options.filter((option) => option.optionType === 'MENU_ENTRY');
    return sum + entries.length;
  }, 0);
}

export type CustomerRecentOrderRow = {
  date: string;
  itemCount: number;
  amount: number | null;
  currencyCode: string;
  paymentStatus: string | null;
};

function slotItemCount(day: MemberMealActivityDay): number {
  return (day.slots ?? []).reduce((sum, slot) => {
    if (slot.status !== 'ACCEPTED' && slot.status !== 'PENDING') {
      return sum;
    }
    const qty =
      'quantity' in slot && typeof slot.quantity === 'number' && slot.quantity > 0
        ? slot.quantity
        : 1;
    return sum + qty;
  }, 0);
}

/** Latest activity days with orders — from month payload already used on Meals tab. */
export function buildRecentOrdersFromActivity(
  activity: MemberMealActivityMonth | null | undefined,
  limit = 4,
): CustomerRecentOrderRow[] {
  if (!activity?.days?.length) {
    return [];
  }

  return [...activity.days]
    .filter((day) => dayHasActivity(day) && slotItemCount(day) > 0)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, limit)
    .map((day) => ({
      date: day.date,
      itemCount: slotItemCount(day),
      amount: day.dayTotal != null ? Number(day.dayTotal) : null,
      currencyCode: day.currencyCode || activity.summary?.currencyCode || 'INR',
      paymentStatus: day.paymentStatus ?? null,
    }));
}

function isUnpaidMealDay(status: string | null | undefined): boolean {
  return (
    status === 'PENDING' ||
    status === 'PENDING_APPROVAL' ||
    status === 'REJECTED' ||
    status === 'UPDATE_REQUESTED'
  );
}

/**
 * Unpaid meal days. When `todayIso` is set, only days after today count —
 * overdue and due-today obligations stay out of "upcoming".
 * Keep in sync with mobile `src/utils/customerDashboardStats.ts`.
 */
export function countUpcomingPayments(
  activity: MemberMealActivityMonth | null | undefined,
  todayIso?: string,
): number {
  if (!activity?.days?.length) {
    return 0;
  }
  return activity.days.filter((day) => {
    if (!isUnpaidMealDay(day.paymentStatus)) {
      return false;
    }
    if (todayIso && day.date <= todayIso) {
      return false;
    }
    return true;
  }).length;
}

/** Unpaid meal days the member still needs to settle, including overdue. */
export function countOpenMealPayments(
  activity: MemberMealActivityMonth | null | undefined,
): number {
  if (!activity?.days?.length) {
    return 0;
  }
  return activity.days.filter((day) => isUnpaidMealDay(day.paymentStatus)).length;
}
