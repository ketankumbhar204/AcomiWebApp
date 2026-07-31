import type { StatusChipTone } from '@/shared/components/StatusChip';
import type {
  MemberPaymentStatus,
  UniversalPaymentStatus,
} from '@/shared/types/payments';

export function paymentStatusLabelKey(status: UniversalPaymentStatus | string): string {
  return `paymentCollection.status.${status}`;
}

/** Presentation-only status → chip tone mapping (Dashboard palette). */
export function paymentStatusTone(
  status: UniversalPaymentStatus | string | undefined,
): StatusChipTone {
  switch (status) {
    case 'PAID':
      return 'success';
    case 'PENDING':
      return 'warning';
    case 'PROOF_UPLOADED':
    case 'UNDER_REVIEW':
    case 'UPDATE_REQUESTED':
      return 'info';
    case 'REJECTED':
      return 'error';
    default:
      return 'neutral';
  }
}

export function memberLedgerStatusTone(
  status: MemberPaymentStatus | string | undefined,
): StatusChipTone {
  switch (status) {
    case 'PAID':
      return 'success';
    case 'PENDING':
    case 'PARTIAL':
      return 'warning';
    case 'UNDER_REVIEW':
    case 'UPDATE_REQUESTED':
      return 'info';
    case 'REJECTED':
      return 'error';
    default:
      return 'neutral';
  }
}

export function canSubmitProof(status: UniversalPaymentStatus | string | undefined): boolean {
  return (
    status === 'PENDING' ||
    status === 'REJECTED' ||
    status === 'UPDATE_REQUESTED' ||
    status === 'UNDER_REVIEW' ||
    status === 'PROOF_UPLOADED'
  );
}

export function canReviewPayment(status: UniversalPaymentStatus | string | undefined): boolean {
  return (
    status === 'UNDER_REVIEW' ||
    status === 'PROOF_UPLOADED' ||
    status === 'UPDATE_REQUESTED' ||
    status === 'REJECTED'
  );
}

export function shiftMonth(monthKey: string, delta: number): string {
  const parts = monthKey.split('-').map(Number);
  const y = parts[0] ?? 1970;
  const m = parts[1] ?? 1;
  const date = new Date(y, m - 1 + delta, 1);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

export function formatMonthLabel(monthKey: string): string {
  const parts = monthKey.split('-').map(Number);
  const y = parts[0] ?? 1970;
  const m = parts[1] ?? 1;
  try {
    return new Date(y, m - 1, 1).toLocaleDateString(undefined, {
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return monthKey;
  }
}
