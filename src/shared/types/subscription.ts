/** Commercial meal subscription plan catalog + activation (mobile subscriptionPlansApi DTOs). */

export type SubscriptionActivationRequestStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'CANCELLED';

export type CustomerSubscriptionLifecycleStatus =
  | 'none'
  | 'active'
  | 'expiring_soon'
  | 'expired'
  | 'ended'
  | 'pay_per_meal';

export interface SubscriptionPlanResponse {
  planId: string;
  name: string;
  mealsIncluded: number;
  price: number;
  currencyCode: string;
  validityDays: number;
  carryForwardUnused: boolean;
  description?: string | null;
  sortOrder: number;
  isActive: boolean;
}

export interface CreateSubscriptionPlanRequest {
  name: string;
  mealsIncluded: number;
  price: number;
  currencyCode?: string;
  validityDays: number;
  carryForwardUnused?: boolean;
  description?: string;
  sortOrder?: number;
}

export interface UpdateSubscriptionPlanRequest extends CreateSubscriptionPlanRequest {
  active?: boolean;
}

export interface SubscriptionActivationRequestResponse {
  requestId: string;
  memberId: string;
  memberName: string;
  planId: string;
  planName: string;
  status: SubscriptionActivationRequestStatus;
  paymentReference?: string | null;
  paymentProofImageUrl?: string | null;
  customerNotes?: string | null;
  ownerNotes?: string | null;
  createdAt: string;
  resolvedAt?: string | null;
}

export interface CreateSubscriptionActivationRequest {
  planId: string;
  paymentReference?: string;
  proofImageBase64?: string;
  customerNotes?: string;
}

export interface CustomerSubscriptionStatusResponse {
  mealBillingType?: 'PAY_PER_MEAL' | 'PREPAID_BALANCE';
  prepaidBilling: boolean;
  subscriptionActive: boolean;
  lifecycleStatus: CustomerSubscriptionLifecycleStatus;
  validTill?: string | null;
  endedAt?: string | null;
  mealsRemaining?: number | null;
  pendingActivationStatus?: SubscriptionActivationRequestStatus | null;
  pendingActivationRequestId?: string | null;
  pendingPlanName?: string | null;
}
