/**
 * Member outstanding dues from the payment-month ledger.
 * Pending is the residual the Payments summary already uses
 * (expected − collected − under review). Contract rent is not a balance.
 * A missing ledger row is unknown, not proof that dues are ₹0.
 */

export type MemberDuesSnapshot = {
  pending: number | null;
  underReview?: number | null;
  expectedCharges: number | null;
  currencyCode?: string | null;
};

export type MemberDuesCue =
  | { kind: 'due'; amount: number }
  | { kind: 'review'; amount: number }
  | { kind: 'clear' };

export type MemberPaymentDuesFilter = 'all' | 'pending' | 'clear';

const MONEY_EPSILON = 0.009;

function positive(amount: number | null | undefined): number | null {
  if (amount == null || Number.isNaN(amount) || amount <= MONEY_EPSILON) {
    return null;
  }
  return amount;
}

export function memberDuesCue(
  row: MemberDuesSnapshot | null | undefined,
): MemberDuesCue | null {
  if (!row) {
    return null;
  }
  const pending = positive(row.pending);
  if (pending != null) {
    return { kind: 'due', amount: pending };
  }
  const underReview = positive(row.underReview);
  if (underReview != null) {
    return { kind: 'review', amount: underReview };
  }
  if (positive(row.expectedCharges) != null) {
    return { kind: 'clear' };
  }
  return null;
}

/**
 * OPEN_ENDED (DAILY_RATE) rent is billed only after the period closes or on vacate.
 * Until a RENT row exists the stay is accrued only: not billed, so not outstanding and not "settled".
 */
export function isOpenEndedRentUnbilled(
  stay: { stayKind?: string | null; pricingBasis?: string | null } | null | undefined,
  payments: ReadonlyArray<{ paymentType?: string | null }>,
): boolean {
  if (!stay || (stay.stayKind !== 'OPEN_ENDED' && stay.pricingBasis !== 'DAILY_RATE')) {
    return false;
  }
  return !payments.some((payment) => payment.paymentType === 'RENT');
}

export function matchesPaymentDuesFilter(
  cue: MemberDuesCue | null,
  filter: MemberPaymentDuesFilter | undefined,
): boolean {
  if (!filter || filter === 'all') {
    return true;
  }
  if (filter === 'pending') {
    return cue?.kind === 'due';
  }
  return cue?.kind === 'clear';
}

export function formatDuesAmount(amount: number, currencyCode = 'INR'): string {
  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currencyCode || 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return currencyCode === 'INR' ? `₹${Math.round(amount)}` : `${Math.round(amount)} ${currencyCode}`;
  }
}
