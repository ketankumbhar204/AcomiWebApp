import type { DashboardFinancialSummary } from './dashboard';
import type { SpaceType } from './space';
import type { PagedResponse } from './api';

export type UniversalPaymentType =
  | 'MEAL'
  | 'RENT'
  | 'DEPOSIT'
  | 'MAINTENANCE'
  | 'UTILITY'
  | 'SERVICE'
  | 'PENALTY'
  | 'OTHER';

export type UniversalPaymentMethod = 'UPI' | 'BANK_TRANSFER' | 'CASH' | 'CHEQUE' | 'OTHER';

export type UniversalPaymentStatus =
  | 'PENDING'
  | 'PROOF_UPLOADED'
  | 'UNDER_REVIEW'
  | 'PAID'
  | 'REJECTED'
  | 'UPDATE_REQUESTED'
  | 'CANCELLED'
  | 'REFUNDED';

export type PaymentSettlementAction =
  | 'CANCEL_UNPAID'
  | 'FULL_REFUND'
  | 'PARTIAL_REFUND'
  | 'RETAIN';

export type PaymentFinancialDisposition =
  | 'OPEN'
  | 'CANCELLED_UNPAID'
  | 'COLLECTED_UNSETTLED'
  | 'FULLY_REFUNDED'
  | 'PARTIALLY_REFUNDED'
  | 'FULLY_RETAINED';

export interface SettleSpacePaymentRequest {
  action: Exclude<PaymentSettlementAction, 'CANCEL_UNPAID'>;
  refundAmount?: number | null;
  retainedAmount?: number | null;
  reason?: string | null;
  refundMethod?: UniversalPaymentMethod | null;
  refundDate?: string | null;
  refundReference?: string | null;
}

export interface CancelSpacePaymentRequest {
  reason?: string | null;
}

export interface PaymentSettlementResponse {
  settlementId: string;
  paymentId: string;
  occupancyId?: string | null;
  action: PaymentSettlementAction;
  refundAmount: number;
  retainedAmount: number;
  reason?: string | null;
  refundPaymentId?: string | null;
  performedBy?: string | null;
  performedAt?: string | null;
}

export type PaymentCategory =
  | 'MONTHLY'
  | 'DAILY'
  | 'EXTRA'
  | 'ADVANCE'
  | 'SECURITY'
  | 'REFUND'
  | 'ELECTRICITY'
  | 'WATER'
  | 'GAS'
  | 'INTERNET'
  | 'OTHER';

export interface CreateSpacePaymentRequest {
  memberId: string;
  paymentType: UniversalPaymentType;
  paymentCategory: PaymentCategory;
  amount: number;
  month?: string;
  dueDate?: string;
  title?: string;
  description?: string;
  remarks?: string;
  confirmDuplicateDeposit?: boolean;
}

export type PaymentRejectionReason =
  | 'PAYMENT_AMOUNT_MISMATCH'
  | 'WRONG_SCREENSHOT'
  | 'INVALID_UTR'
  | 'OTHER';

export type PaymentTimelineEventType =
  | 'CREATED'
  | 'PROOF_UPLOADED'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'RESUBMITTED'
  | 'PAID'
  | 'REFUNDED'
  | 'UPDATE_REQUESTED'
  | 'CANCELLED'
  | 'RETAINED'
  | 'REMINDER_SENT'
  | 'REMINDER_FAILED';

export type PaymentReviewAction = 'APPROVE' | 'REJECT' | 'REQUEST_UPDATE';

export type PriceTaxMode = 'EXCLUSIVE' | 'INCLUSIVE';

export type PaymentsReviewQueueParam =
  | 'SUBMITTED'
  | 'NEEDS_UPDATE'
  | 'PENDING_REVIEW'
  | 'PAID'
  | 'REJECTED'
  | 'REFUNDED'
  | 'CANCELLED'
  | 'HISTORY';

export type MemberPaymentStatus =
  | 'PAID'
  | 'PARTIAL'
  | 'PENDING'
  | 'UNDER_REVIEW'
  | 'UPDATE_REQUESTED'
  | 'REJECTED'
  | 'NONE';

export type SpacePaymentResponse = {
  paymentId: string;
  spaceId: string;
  memberId: string;
  memberName: string;
  memberMobile?: string | null;
  occupancyId?: string | null;
  /** From linked occupancy; null when unlinked or legacy null stay_kind. */
  stayKind?: 'MONTHLY' | 'SHORT' | 'OPEN_ENDED' | null;
  paymentType: UniversalPaymentType;
  paymentCategory: PaymentCategory;
  title: string;
  description?: string | null;
  amount: number;
  currencyCode: string;
  dueDate: string;
  month: string;
  paymentMethod?: UniversalPaymentMethod | null;
  paymentStatus: UniversalPaymentStatus;
  /** Legacy alias some clients may still surface */
  status?: string;
  proofUrl?: string | null;
  proofFileId?: string | null;
  referenceNumber?: string | null;
  remarks?: string | null;
  rejectionReason?: string | null;
  rejectionCode?: PaymentRejectionReason | null;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  paymentDate?: string | null;
  targetLabel?: string | null;
  paymentBatchId?: string | null;
  paymentReference?: string | null;
  mealDates?: string[] | null;
  createdAt: string;
  updatedAt: string;
  billingPeriodStart?: string | null;
  billingPeriodEnd?: string | null;
  billableDays?: number | null;
  daysInMonth?: number | null;
  isProrated?: boolean | null;
  configuredMonthlyAmount?: number | null;
  taxEnabled?: boolean | null;
  taxRatePercent?: number | null;
  priceTaxMode?: PriceTaxMode | null;
  baseAmount?: number | null;
  taxAmount?: number | null;
  paidAmount?: number | null;
  outstandingAmount?: number | null;
  isOverdue?: boolean | null;
  daysOverdue?: number | null;
  reminderEligible?: boolean | null;
  settlementStatus?: 'UNPAID' | 'PARTIALLY_PAID' | 'PAID' | null;
  refundedAmount?: number | null;
  retainedAmount?: number | null;
  netCollectedAmount?: number | null;
  partiallyRefunded?: boolean | null;
  financialDisposition?: PaymentFinancialDisposition | null;
};

export type SpaceBillingSettings = {
  taxEnabled: boolean;
  taxRatePercent?: number | null;
  priceTaxMode?: PriceTaxMode | null;
  gstin?: string | null;
  billingDueDay: number;
};

export type UpdateSpaceBillingSettingsRequest = {
  taxEnabled: boolean;
  taxRatePercent?: number | null;
  priceTaxMode?: PriceTaxMode | null;
  gstin?: string | null;
  billingDueDay?: number | null;
};

export type SpacePaymentListResponse = {
  month: string;
  payments: SpacePaymentResponse[];
};

export type OwnerPaymentsMonthCounts = {
  pendingReview: number;
  submitted: number;
  changesRequested: number;
  paid: number;
  rejected: number;
  refunded?: number;
  cancelled?: number;
  history: number;
  pendingMembers: number;
};

export type PaymentsSummaryResponse = {
  month: string;
  spaceType: SpaceType;
  financial: DashboardFinancialSummary;
  counts: OwnerPaymentsMonthCounts;
};

export type MemberPaymentLedgerRow = {
  memberId: string;
  memberName: string;
  expectedCharges: number | null;
  collected: number | null;
  underReview?: number | null;
  pending: number | null;
  currencyCode: string;
  status: MemberPaymentStatus;
  mealBillingType?: string;
  mealBalanceRemaining?: number | null;
};

export type PaymentsMembersPageResponse = {
  month: string;
  page: PagedResponse<MemberPaymentLedgerRow>;
};

export type PaymentsCardsPageResponse = {
  month: string;
  queue: PaymentsReviewQueueParam | string;
  page: PagedResponse<SpacePaymentResponse>;
};

export type PaymentTimelineEventResponse = {
  eventId: string;
  paymentId: string;
  eventType: PaymentTimelineEventType;
  performedAt: string;
  remarks?: string | null;
  performedBy?: string | null;
};

export type PaymentTimelineResponse = {
  paymentId: string;
  events: PaymentTimelineEventResponse[];
};

export type ListSpacePaymentsParams = {
  month?: string;
  status?: UniversalPaymentStatus;
  memberId?: string;
  paymentType?: UniversalPaymentType;
  paymentCategory?: PaymentCategory;
  sync?: boolean;
};

export type SubmitPaymentProofRequest = {
  proofImageBase64?: string;
  proofFileId?: string;
  referenceNumber?: string;
  remarks?: string;
  paymentMethod?: UniversalPaymentMethod;
};

export type ReviewPaymentRequest = {
  action: PaymentReviewAction;
  remarks?: string;
  rejectionCode?: PaymentRejectionReason;
};
