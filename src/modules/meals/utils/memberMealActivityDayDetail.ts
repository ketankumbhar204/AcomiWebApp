import type {
  MealPollPaymentChoice,
  MealPollPaymentStatus,
  MealPollStatus,
  MealType,
  MemberMealActivityDayDetail,
  MemberMealActivityDayPayment,
  MemberMealActivitySelection,
  MemberMealActivitySlotDetail,
  MemberMealActivitySlotStatus,
} from '@/shared/types/meals';
import { normalizeActivityDate } from './memberMealActivityCalendar';

function normalizeMealType(value: unknown): MealType {
  const raw = String(value ?? 'BREAKFAST').toUpperCase();
  if (raw === 'BREAKFAST' || raw === 'LUNCH' || raw === 'DINNER') return raw;
  return 'BREAKFAST';
}

function normalizeSlotStatus(value: unknown): MemberMealActivitySlotStatus {
  const raw = String(value ?? 'INACTIVE').toUpperCase();
  switch (raw) {
    case 'ACCEPTED':
    case 'PENDING':
    case 'SKIPPED':
    case 'NO_MENU':
    case 'CLOSED':
    case 'INACTIVE':
      return raw;
    default:
      return 'INACTIVE';
  }
}

function normalizeSelection(row: Record<string, unknown>): MemberMealActivitySelection {
  return {
    label: String(row.label ?? ''),
    price: row.price != null ? Number(row.price) : null,
    currencyCode:
      (row.currencyCode as string | null | undefined) ??
      (row.currency_code as string | null | undefined) ??
      null,
    quantity: Number(row.quantity ?? 0),
    itemDetail:
      (row.itemDetail as string | null | undefined) ??
      (row.item_detail as string | null | undefined) ??
      null,
    lineTotal:
      row.lineTotal != null
        ? Number(row.lineTotal)
        : row.line_total != null
          ? Number(row.line_total)
          : null,
  };
}

function normalizeSlot(raw: Record<string, unknown>): MemberMealActivitySlotDetail {
  const selections = Array.isArray(raw.selections) ? raw.selections : [];
  return {
    mealType: normalizeMealType(raw.mealType ?? raw.meal_type),
    status: normalizeSlotStatus(raw.status),
    menuPublished: Boolean(raw.menuPublished ?? raw.menu_published),
    pollStatus: (raw.pollStatus ?? raw.poll_status ?? null) as MealPollStatus | null,
    deliveryLocationName:
      (raw.deliveryLocationName as string | null | undefined) ??
      (raw.delivery_location_name as string | null | undefined) ??
      null,
    deliveryLocationDescription:
      (raw.deliveryLocationDescription as string | null | undefined) ??
      (raw.delivery_location_description as string | null | undefined) ??
      null,
    respondedAt:
      typeof (raw.respondedAt ?? raw.responded_at) === 'string'
        ? String(raw.respondedAt ?? raw.responded_at)
        : null,
    slotTotal:
      raw.slotTotal != null
        ? Number(raw.slotTotal)
        : raw.slot_total != null
          ? Number(raw.slot_total)
          : null,
    selections: selections.map((row) => normalizeSelection(row as Record<string, unknown>)),
  };
}

function normalizePayment(paymentRaw: Record<string, unknown>): MemberMealActivityDayPayment {
  return {
    id: (paymentRaw.id as string | null | undefined) ?? null,
    pollDate: normalizeActivityDate(paymentRaw.pollDate ?? paymentRaw.poll_date),
    paymentChoice: (paymentRaw.paymentChoice ??
      paymentRaw.payment_choice ??
      null) as MealPollPaymentChoice | null,
    paymentStatus: (paymentRaw.paymentStatus ??
      paymentRaw.payment_status ??
      null) as MealPollPaymentStatus | null,
    chargedAmount:
      paymentRaw.chargedAmount != null
        ? Number(paymentRaw.chargedAmount)
        : paymentRaw.charged_amount != null
          ? Number(paymentRaw.charged_amount)
          : null,
    paymentBatchId:
      (paymentRaw.paymentBatchId as string | null | undefined) ??
      (paymentRaw.payment_batch_id as string | null | undefined) ??
      null,
    paymentReference:
      (paymentRaw.paymentReference as string | null | undefined) ??
      (paymentRaw.payment_reference as string | null | undefined) ??
      null,
    proofImageUrl:
      (paymentRaw.proofImageUrl as string | null | undefined) ??
      (paymentRaw.proof_image_url as string | null | undefined) ??
      null,
    referenceNumber:
      (paymentRaw.referenceNumber as string | null | undefined) ??
      (paymentRaw.reference_number as string | null | undefined) ??
      null,
    remarks: (paymentRaw.remarks as string | null | undefined) ?? null,
    rejectionReason:
      (paymentRaw.rejectionReason as string | null | undefined) ??
      (paymentRaw.rejection_reason as string | null | undefined) ??
      null,
    proofSubmittedAt:
      typeof (paymentRaw.proofSubmittedAt ?? paymentRaw.proof_submitted_at) === 'string'
        ? String(paymentRaw.proofSubmittedAt ?? paymentRaw.proof_submitted_at)
        : null,
    proofReviewedAt:
      typeof (paymentRaw.proofReviewedAt ?? paymentRaw.proof_reviewed_at) === 'string'
        ? String(paymentRaw.proofReviewedAt ?? paymentRaw.proof_reviewed_at)
        : null,
    prepaidOverflowAmount:
      paymentRaw.prepaidOverflowAmount != null
        ? Number(paymentRaw.prepaidOverflowAmount)
        : paymentRaw.prepaid_overflow_amount != null
          ? Number(paymentRaw.prepaid_overflow_amount)
          : null,
    prepaidDebitedAmount:
      paymentRaw.prepaidDebitedAmount != null
        ? Number(paymentRaw.prepaidDebitedAmount)
        : paymentRaw.prepaid_debited_amount != null
          ? Number(paymentRaw.prepaid_debited_amount)
          : null,
    prepaidOverflowPayment: Boolean(
      paymentRaw.prepaidOverflowPayment ?? paymentRaw.prepaid_overflow_payment,
    ),
  };
}

/** Normalize day-detail API payload (selections, totals) — parity with mobile. */
export function normalizeMemberMealActivityDayDetail(
  raw: Record<string, unknown> | MemberMealActivityDayDetail,
): MemberMealActivityDayDetail {
  const record = raw as Record<string, unknown>;
  const date = normalizeActivityDate(record.date) ?? String(record.date ?? '');
  const slots = (Array.isArray(record.slots) ? record.slots : []).map((row) =>
    normalizeSlot(row as Record<string, unknown>),
  );
  const paymentRaw = (record.payment ?? null) as Record<string, unknown> | null;
  const payment = paymentRaw ? normalizePayment(paymentRaw) : null;

  return {
    date,
    memberName:
      (record.memberName as string | null | undefined) ??
      (record.member_name as string | null | undefined) ??
      null,
    dayTotal:
      record.dayTotal != null
        ? Number(record.dayTotal)
        : record.day_total != null
          ? Number(record.day_total)
          : null,
    currencyCode:
      (record.currencyCode as string | null | undefined) ??
      (record.currency_code as string | null | undefined) ??
      null,
    paymentStatus:
      ((record.paymentStatus ?? record.payment_status) as MealPollPaymentStatus | null) ??
      payment?.paymentStatus ??
      null,
    payment,
    notes: (record.notes as string | null | undefined) ?? null,
    slots,
  };
}
