/**
 * Member dashboard payment figures.
 * Keep in sync with mobile `src/utils/customerDashboardStats.ts`.
 */

export type MemberDashboardLedgerPayment = {
  paymentStatus: string;
  amount?: number | null;
  outstandingAmount?: number | null;
  dueDate?: string | null;
  isOverdue?: boolean | null;
};

export type MemberDashboardLedgerStats = {
  /** Remaining payable. `0` when the month loaded and nothing is owed. `null` when amounts are unknown. */
  dueAmount: number | null;
  /** Unpaid obligations dated after today. Overdue rows are not included. */
  upcomingCount: number;
  /** Pending, rejected, or needs-update charges, including overdue. */
  openPaymentCount: number;
};

const ACTION_NEEDED = new Set(['PENDING', 'REJECTED', 'UPDATE_REQUESTED']);
const STILL_OWED = new Set([
  'PENDING',
  'REJECTED',
  'UPDATE_REQUESTED',
  'UNDER_REVIEW',
  'PROOF_UPLOADED',
]);

function asMoney(value: number | null | undefined): number | null {
  if (value == null || Number.isNaN(Number(value))) {
    return null;
  }
  return Number(value);
}

/** Remaining balance for one charge. Uses outstanding when present, otherwise the listed amount. */
export function remainingPayable(payment: MemberDashboardLedgerPayment): number | null {
  if (payment.paymentStatus === 'PAID') {
    const outstanding = asMoney(payment.outstandingAmount);
    return outstanding != null && outstanding > 0.009 ? outstanding : 0;
  }
  const outstanding = asMoney(payment.outstandingAmount);
  if (outstanding != null) {
    return outstanding;
  }
  if (STILL_OWED.has(payment.paymentStatus)) {
    return asMoney(payment.amount);
  }
  return null;
}

/**
 * Figures from the same charge rows My Payments lists.
 * Fully paid rows add nothing. A partial payment adds only what is still outstanding.
 */
export function summarizeMemberDashboardLedger(
  payments: MemberDashboardLedgerPayment[],
  todayIso: string,
): MemberDashboardLedgerStats {
  if (payments.length === 0) {
    return { dueAmount: 0, upcomingCount: 0, openPaymentCount: 0 };
  }

  let due = 0;
  let sawDue = false;
  let upcomingCount = 0;
  let openPaymentCount = 0;

  for (const payment of payments) {
    const remaining = remainingPayable(payment);
    if (remaining != null) {
      sawDue = true;
      if (remaining > 0.009 && payment.paymentStatus !== 'PAID') {
        due += remaining;
      }
    }

    const actionable =
      ACTION_NEEDED.has(payment.paymentStatus) && (remaining == null || remaining > 0.009);
    if (!actionable) {
      continue;
    }
    openPaymentCount += 1;
    const overdue =
      payment.isOverdue === true || (payment.dueDate != null && payment.dueDate < todayIso);
    if (!overdue && payment.dueDate != null && payment.dueDate > todayIso) {
      upcomingCount += 1;
    }
  }

  return {
    dueAmount: sawDue ? due : null,
    upcomingCount,
    openPaymentCount,
  };
}
