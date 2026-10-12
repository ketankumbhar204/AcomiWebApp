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

export function canOwnerMarkPaymentReceived(
  status: UniversalPaymentStatus | string | null | undefined,
): boolean {
  return status === 'PENDING' || status === 'UNDER_REVIEW' || status === 'PROOF_UPLOADED';
}

export function canOwnerSendPaymentReminder(reminderEligible?: boolean | null): boolean {
  return Boolean(reminderEligible);
}

export function memberRowShowsReceived(
  status: MemberPaymentStatus | string | null | undefined,
): boolean {
  return status === 'PENDING' || status === 'UNDER_REVIEW';
}

export function memberRowShowsReminder(
  status: MemberPaymentStatus | string | null | undefined,
): boolean {
  return status === 'PENDING' || status === 'REJECTED' || status === 'UPDATE_REQUESTED';
}

export function memberRowShowsOwnerPaymentActions(
  status: MemberPaymentStatus | string | null | undefined,
): boolean {
  return memberRowShowsReceived(status) || memberRowShowsReminder(status);
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

export type IndividualPaymentListItem = {
  paymentId: string;
  memberId?: string | null;
  memberName?: string | null;
  memberMobile?: string | null;
  title?: string | null;
  description?: string | null;
  paymentType?: string | null;
  paymentStatus?: string | null;
  status?: string | null;
};

export function individualPaymentStatus(payment: IndividualPaymentListItem): string {
  return payment.paymentStatus || payment.status || 'PENDING';
}

/** Month list is complete, so search and status run on that full set. */
export function matchesIndividualPayment(
  payment: IndividualPaymentListItem,
  options: { status?: string; query?: string; memberId?: string },
): boolean {
  if (options.memberId && payment.memberId !== options.memberId) {
    return false;
  }
  const status = options.status?.trim();
  if (status) {
    const current = individualPaymentStatus(payment);
    if (status === 'UNDER_REVIEW') {
      if (current !== 'UNDER_REVIEW' && current !== 'PROOF_UPLOADED') {
        return false;
      }
    } else if (current !== status) {
      return false;
    }
  }
  const query = options.query?.trim().toLowerCase();
  if (!query) {
    return true;
  }
  const mobileDigits = (payment.memberMobile ?? '').replace(/\D/g, '');
  const haystack = [payment.memberName, payment.memberMobile, mobileDigits, payment.title, payment.description, payment.paymentType]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  if (haystack.includes(query)) {
    return true;
  }
  const queryDigits = query.replace(/\D/g, '');
  return queryDigits.length > 0 && mobileDigits.includes(queryDigits);
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
