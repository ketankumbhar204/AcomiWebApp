import type { SpacePaymentResponse } from '@/shared/types/payments';
import { formatPaymentListTitle } from './paymentRefundDisplay';

type PaymentTitleSource = Pick<
  SpacePaymentResponse,
  'title' | 'month' | 'paymentType' | 'paymentCategory'
>;

function formatInrAmount(amount: number, currencyCode = 'INR'): string {
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

type PaymentBreakdownSource = Pick<
  SpacePaymentResponse,
  | 'paymentType'
  | 'amount'
  | 'baseAmount'
  | 'currencyCode'
  | 'billableDays'
  | 'daysInMonth'
  | 'isProrated'
  | 'configuredMonthlyAmount'
  | 'billingPeriodStart'
  | 'billingPeriodEnd'
>;

const AMOUNT_EPSILON = 0.05;

/**
 * Display title for payment cards/inspector.
 * Backend already encodes the month in titles like "Rent — November 2026".
 * Never append a second period label (avoids "Rent — November 2026 · Nov 2026").
 */
export function paymentDisplayTitle(payment: PaymentTitleSource): string {
  return formatPaymentListTitle(payment);
}

function shortDayMonth(iso: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!match) {
    return iso;
  }
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  if (Number.isNaN(date.getTime())) {
    return iso;
  }
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function formatPeriodRange(
  start: string | null | undefined,
  end: string | null | undefined,
): string | null {
  if (!start || !end) {
    return null;
  }
  return `${shortDayMonth(start)}–${shortDayMonth(end)}`;
}

/**
 * Resolve daily rate from persisted RENT snapshot fields for breakdown display.
 * Backend OPEN_ENDED stores configuredMonthlyAmount as daily × daysInMonth, then
 * prorates to daily × billableDays. Full-month MONTHLY and full-month OPEN_ENDED
 * look identical without stayKind on the payment DTO — so full months omit breakdown
 * unless configured itself equals a per-day rate × days.
 */
export function resolvePersistedDailyRate(payment: PaymentBreakdownSource): number | null {
  if (payment.paymentType !== 'RENT') {
    return null;
  }
  const days = payment.billableDays;
  const amount = payment.baseAmount ?? payment.amount;
  const configured = payment.configuredMonthlyAmount;
  const daysInMonth = payment.daysInMonth;
  if (days == null || days <= 0 || amount == null) {
    return null;
  }
  // Configured value is already the daily rate (configured × days = amount).
  if (configured != null && Math.abs(configured * days - amount) <= AMOUNT_EPSILON) {
    return configured;
  }
  // Partial / prorated period: derive daily from amount ÷ days (OPEN_ENDED mid-month/vacate).
  // Do not use configured/daysInMonth here — that also matches full-month MONTHLY rent.
  const showPartial =
    payment.isProrated === true ||
    (daysInMonth != null && days !== daysInMonth);
  if (!showPartial) {
    return null;
  }
  return amount / days;
}

/** @deprecated Prefer resolvePersistedDailyRate — kept for existing tests. */
export function isDailyRateRentSnapshot(payment: PaymentBreakdownSource): boolean {
  return resolvePersistedDailyRate(payment) != null;
}

/**
 * API-backed breakdown, e.g. "₹1,000 × 26 days (5–30 Nov) = ₹26,000".
 * Returns null when fields are insufficient — never invents amounts or days.
 */
export function formatPersistedRentBreakdown(payment: PaymentBreakdownSource): string | null {
  if (payment.paymentType !== 'RENT') {
    return null;
  }
  const days = payment.billableDays;
  if (days == null || days <= 0) {
    return null;
  }
  const amount = payment.baseAmount ?? payment.amount;
  if (amount == null) {
    return null;
  }
  const daily = resolvePersistedDailyRate(payment);
  if (daily == null) {
    return null;
  }
  const currency = payment.currencyCode || 'INR';
  const period = formatPeriodRange(payment.billingPeriodStart, payment.billingPeriodEnd);
  const periodSuffix = period ? ` (${period})` : '';
  return `${formatInrAmount(daily, currency)} × ${days} days${periodSuffix} = ${formatInrAmount(amount, currency)}`;
}
