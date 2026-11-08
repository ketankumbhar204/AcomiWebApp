import type { PaymentTimelineEventResponse } from '@/shared/types/payments';

export type PaymentTimelineAmountInfo = {
  amount: number | null;
  note: string | null;
};

const SETTLEMENT_AMOUNT =
  /^(Refunded|Retained)\s+([0-9]+(?:\.[0-9]+)?)\s*(?:[—–\-]\s*)?(.*)$/i;

const AMOUNT_EVENTS = new Set([
  'CREATED',
  'PAID',
  'APPROVED',
  'PROOF_UPLOADED',
  'UNDER_REVIEW',
  'RESUBMITTED',
  'REFUNDED',
  'RETAINED',
  'CANCELLED',
]);

export function paymentTimelineAmountInfo(
  event: Pick<PaymentTimelineEventResponse, 'eventType' | 'remarks'>,
  paymentAmount?: number | null,
): PaymentTimelineAmountInfo {
  const remarks = event.remarks?.trim() ?? '';
  const settlement = SETTLEMENT_AMOUNT.exec(remarks);
  if (settlement) {
    const parsed = Number(settlement[2]);
    const note = (settlement[3] ?? '').trim();
    return {
      amount: Number.isFinite(parsed) ? parsed : null,
      note: note || null,
    };
  }

  if (AMOUNT_EVENTS.has(event.eventType) && paymentAmount != null && Number.isFinite(Number(paymentAmount))) {
    return {
      amount: Number(paymentAmount),
      note: remarks || null,
    };
  }

  return { amount: null, note: remarks || null };
}
