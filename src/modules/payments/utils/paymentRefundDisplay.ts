import type { SpacePaymentResponse, UniversalPaymentStatus } from '@/shared/types/payments';

/** REFUND-category child rows are cash-out records, not collections. */
export function isRefundTransaction(payment: {
  paymentCategory?: string | null;
}): boolean {
  return payment.paymentCategory === 'REFUND';
}

/**
 * Strip leading "Refund –" prefixes so titles never show "Refund – Refund – …".
 * For REFUND rows, re-apply a single "Refund · " prefix.
 */
export function formatPaymentListTitle(payment: {
  title?: string | null;
  paymentCategory?: string | null;
}): string {
  let base = (payment.title ?? '').replace(/\s+/g, ' ').trim();
  while (/^refund\s*[—–·\-]\s*/i.test(base)) {
    base = base.replace(/^refund\s*[—–·\-]\s*/i, '').trim();
  }
  if (isRefundTransaction(payment)) {
    return base ? `Refund · ${base}` : 'Refund';
  }
  return base;
}

export type PaymentListDisplayStatus =
  | UniversalPaymentStatus
  | 'OVERDUE'
  | 'PARTIALLY_REFUNDED';

/**
 * List/detail badge status. REFUND child rows always show as Refunded
 * even though the API stores them as PAID completed payouts.
 */
export function paymentListDisplayStatus(payment: {
  paymentStatus?: UniversalPaymentStatus | string | null;
  status?: string | null;
  paymentCategory?: string | null;
  partiallyRefunded?: boolean | null;
  refundedAmount?: number | null;
  isOverdue?: boolean | null;
}): PaymentListDisplayStatus {
  if (isRefundTransaction(payment)) {
    return 'REFUNDED';
  }
  const status = (payment.paymentStatus ?? payment.status ?? 'PENDING') as UniversalPaymentStatus;
  if (status === 'REFUNDED' || status === 'CANCELLED') {
    return status;
  }
  if (
    payment.partiallyRefunded === true ||
    (status === 'PAID' && Number(payment.refundedAmount ?? 0) > 0)
  ) {
    return 'PARTIALLY_REFUNDED';
  }
  if (status === 'UNDER_REVIEW' || status === 'PROOF_UPLOADED') {
    return status;
  }
  if (payment.isOverdue && status !== 'PAID') {
    return 'OVERDUE';
  }
  return status;
}

export function paymentListStatusLabelKey(status: PaymentListDisplayStatus): string {
  switch (status) {
    case 'PARTIALLY_REFUNDED':
      return 'paymentCollection.status.PARTIALLY_REFUNDED';
    case 'REFUNDED':
      return 'paymentCollection.status.REFUNDED';
    case 'CANCELLED':
      return 'paymentCollection.status.CANCELLED';
    case 'OVERDUE':
      return 'paymentCollection.overdue.badge';
    default:
      return `paymentCollection.status.${status}`;
  }
}

export type SettlementActionKind = 'FULL_REFUND' | 'PARTIAL_REFUND' | 'RETAIN';

/**
 * Settlement amounts from remaining refundable balance.
 * Partial refund closes the remaining balance: retained = remaining − refund.
 */
export function resolveSettlementAmounts(
  action: SettlementActionKind,
  remainingRefundable: number,
  refundInput?: string | number | null,
): { refundAmount: number; retainedAmount: number } {
  const remaining = Math.max(0, Number(remainingRefundable) || 0);
  if (action === 'FULL_REFUND') {
    return { refundAmount: remaining, retainedAmount: 0 };
  }
  if (action === 'RETAIN') {
    return { refundAmount: 0, retainedAmount: remaining };
  }
  const parsed = typeof refundInput === 'number' ? refundInput : Number(refundInput);
  const refund = Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
  const clamped = Math.min(refund, remaining);
  return {
    refundAmount: clamped,
    retainedAmount: Math.max(0, Math.round((remaining - clamped) * 100) / 100),
  };
}

/** True when any money was refunded (full, partial, or REFUND child row). */
export function isRefundRelatedPayment(payment: {
  paymentStatus?: string | null;
  status?: string | null;
  paymentCategory?: string | null;
  partiallyRefunded?: boolean | null;
  refundedAmount?: number | null;
}): boolean {
  if (isRefundTransaction(payment)) {
    return true;
  }
  const status = payment.paymentStatus || payment.status || 'PENDING';
  if (status === 'REFUNDED') {
    return true;
  }
  if (payment.partiallyRefunded === true) {
    return true;
  }
  return status === 'PAID' && Number(payment.refundedAmount ?? 0) > 0;
}

/** Pure collected payment with no refund activity. */
export function isPurePaidPayment(payment: {
  paymentStatus?: string | null;
  status?: string | null;
  paymentCategory?: string | null;
  partiallyRefunded?: boolean | null;
  refundedAmount?: number | null;
}): boolean {
  const status = payment.paymentStatus || payment.status || 'PENDING';
  return status === 'PAID' && !isRefundRelatedPayment(payment);
}

export function matchesPaymentRecordStatusFilter(
  payment: Pick<SpacePaymentResponse, 'paymentStatus' | 'paymentCategory'> & {
    status?: string | null;
    partiallyRefunded?: boolean | null;
    refundedAmount?: number | null;
  },
  filterStatus: string,
): boolean {
  const status = (payment.paymentStatus || payment.status || 'PENDING').trim();
  if (!filterStatus) {
    return true;
  }
  if (filterStatus === 'REFUNDED') {
    return isRefundRelatedPayment(payment);
  }
  if (filterStatus === 'PAID') {
    return isPurePaidPayment(payment);
  }
  if (isRefundTransaction(payment)) {
    return false;
  }
  if (filterStatus === 'UNDER_REVIEW') {
    return status === 'UNDER_REVIEW' || status === 'PROOF_UPLOADED';
  }
  return status === filterStatus;
}
