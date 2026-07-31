import type { DashboardFinancialSummary } from './dashboard';
import type { SpaceType } from './space';
import type { PagedResponse } from './api';

export type UniversalPaymentType = 'MEAL' | 'RENT' | 'DEPOSIT' | 'MAINTENANCE' | 'OTHER';

export type UniversalPaymentMethod = 'UPI' | 'BANK_TRANSFER' | 'CASH' | 'CHEQUE' | 'OTHER';

export type UniversalPaymentStatus =
  | 'PENDING'
  | 'PROOF_UPLOADED'
  | 'UNDER_REVIEW'
  | 'PAID'
  | 'REJECTED'
  | 'UPDATE_REQUESTED';

export type PaymentCategory =
  | 'MONTHLY'
  | 'DAILY'
  | 'EXTRA'
  | 'ADVANCE'
  | 'SECURITY'
  | 'REFUND'
  | 'ELECTRICITY'
  | 'WATER'
  | 'INTERNET'
  | 'OTHER';

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
  | 'UPDATE_REQUESTED';

export type PaymentReviewAction = 'APPROVE' | 'REJECT' | 'REQUEST_UPDATE';

export type PaymentsReviewQueueParam =
  | 'SUBMITTED'
  | 'NEEDS_UPDATE'
  | 'PENDING_REVIEW'
  | 'PAID'
  | 'REJECTED'
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
  occupancyId?: string | null;
  paymentType: UniversalPaymentType;
  paymentCategory: PaymentCategory;
  title: string;
  amount: number;
  currencyCode: string;
  dueDate: string;
  month: string;
  paymentMethod?: UniversalPaymentMethod | null;
  paymentStatus: UniversalPaymentStatus;
  /** Legacy alias some clients may still surface */
  status?: string;
  proofUrl?: string | null;
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
  referenceNumber?: string;
  remarks?: string;
  paymentMethod?: UniversalPaymentMethod;
};

export type ReviewPaymentRequest = {
  action: PaymentReviewAction;
  remarks?: string;
  rejectionCode?: PaymentRejectionReason;
};
