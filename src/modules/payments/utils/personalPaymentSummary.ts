import type { SpaceType } from '@/shared/types/space';
import type { SpacePaymentResponse } from '@/shared/types/payments';

/** Day-meal collection is a mess billing surface, not a lodging tenant dashboard. */
export function usesDayMealPayments(input: {
  spaceType?: SpaceType | null;
  prepaidBilling?: boolean | null;
  mealBillingType?: string | null;
}): boolean {
  if (input.spaceType !== 'MESS') {
    return false;
  }
  if (input.prepaidBilling) {
    return false;
  }
  return input.mealBillingType == null || input.mealBillingType === 'PAY_PER_MEAL';
}

export type PersonalPaymentSummary = {
  totalDue: number | null;
  amountPaid: number | null;
  outstanding: number | null;
  /** Charge amount submitted and waiting on owner review. Zero when the month has charges and none are in review. */
  underReviewAmount: number | null;
};

/** Summary cards on My payments. `due` is every charge that is not already paid. */
export type PersonalSummaryFilter = 'due' | 'paid' | 'outstanding' | 'underReview';

const UNDER_REVIEW = new Set(['UNDER_REVIEW', 'PROOF_UPLOADED']);

/** A charge belongs on the card that includes its amount. Paid charges are not amount due. */
export function matchesPersonalSummaryFilter(
  payment: SpacePaymentResponse,
  filter: PersonalSummaryFilter,
): boolean {
  switch (filter) {
    case 'due':
      return (payment.paymentStatus ?? payment.status) !== 'PAID';
    case 'paid': {
      if ((payment.paymentStatus ?? payment.status) === 'PAID') {
        return true;
      }
      const paid = asMoney(payment.paidAmount);
      return paid != null && paid > 0;
    }
    case 'outstanding': {
      const outstanding = asMoney(payment.outstandingAmount);
      if (outstanding != null) {
        return outstanding > 0;
      }
      return (payment.paymentStatus ?? payment.status) !== 'PAID';
    }
    case 'underReview':
      return UNDER_REVIEW.has(payment.paymentStatus ?? payment.status ?? '');
    default:
      return true;
  }
}

function asMoney(value: number | null | undefined): number | null {
  if (value == null || Number.isNaN(Number(value))) {
    return null;
  }
  return Number(value);
}

export function summarizePersonalPayments(
  payments: SpacePaymentResponse[],
): PersonalPaymentSummary {
  if (payments.length === 0) {
    return {
      totalDue: null,
      amountPaid: null,
      outstanding: null,
      underReviewAmount: null,
    };
  }

  let totalDue = 0;
  let sawDue = false;
  let amountPaid = 0;
  let sawPaid = false;
  let outstanding = 0;
  let sawOutstanding = false;
  let underReviewAmount = 0;

  for (const payment of payments) {
    const amount = asMoney(payment.amount);
    if (amount != null) {
      sawDue = true;
      if ((payment.paymentStatus ?? payment.status) !== 'PAID') {
        totalDue += amount;
      }
    }

    const recordedPaid = asMoney(payment.paidAmount);
    if (recordedPaid != null) {
      amountPaid += recordedPaid;
      sawPaid = true;
    } else if (payment.paymentStatus === 'PAID' && amount != null) {
      amountPaid += amount;
      sawPaid = true;
    }

    const recordedOutstanding = asMoney(payment.outstandingAmount);
    if (recordedOutstanding != null) {
      outstanding += recordedOutstanding;
      sawOutstanding = true;
    } else if (payment.paymentStatus === 'PAID') {
      sawOutstanding = true;
    }

    if (UNDER_REVIEW.has(payment.paymentStatus) && amount != null) {
      underReviewAmount += amount;
    }
  }

  return {
    totalDue: sawDue ? totalDue : null,
    amountPaid: sawPaid ? amountPaid : null,
    outstanding: sawOutstanding ? outstanding : null,
    underReviewAmount,
  };
}
