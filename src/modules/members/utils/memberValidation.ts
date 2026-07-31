import { isValidIndianMobile, normalizeIndianMobileDigits } from '@/shared/utils/indianMobile';
import type { MealBillingType } from '@/shared/types/member';

export type NewMemberFieldErrors = {
  fullName?: string;
  mobileNumber?: string;
  role?: string;
  gender?: string;
};

export function validateNewMemberFields(
  fullName: string,
  mobileNumber: string,
  messages: { fullNameRequired: string; mobileRequired: string; mobileInvalid: string },
): NewMemberFieldErrors {
  const errors: NewMemberFieldErrors = {};
  const digits = normalizeIndianMobileDigits(mobileNumber);

  if (!fullName.trim()) {
    errors.fullName = messages.fullNameRequired;
  }
  if (!mobileNumber.trim()) {
    errors.mobileNumber = messages.mobileRequired;
  } else if (!isValidIndianMobile(digits)) {
    errors.mobileNumber = messages.mobileInvalid;
  }
  return errors;
}

export function buildSubscriptionPurchasePayload(
  mealQty: string,
  subscriptionPrice: string,
  unit: 'MEALS' | 'CURRENCY',
): { amount: number; paidAmount: number; remarks?: string } | null {
  const qty = Number(mealQty.trim());
  const price = Number(subscriptionPrice.trim());

  if (unit === 'CURRENCY') {
    if (!Number.isFinite(price) || price <= 0) {
      return null;
    }
    return { amount: price, paidAmount: price };
  }

  if (!Number.isFinite(qty) || qty <= 0) {
    return null;
  }
  if (!Number.isFinite(price) || price <= 0) {
    return null;
  }

  return {
    amount: qty,
    paidAmount: price,
  };
}

export function resolveMemberEffectiveMealBilling(
  member: {
    mealBillingType?: MealBillingType | null;
    effectiveMealBillingType?: MealBillingType | null;
  },
  spaceDefault: MealBillingType = 'PAY_PER_MEAL',
): MealBillingType {
  return member.effectiveMealBillingType ?? member.mealBillingType ?? spaceDefault;
}

export function validateDeposit(amount: number, paid: number, refunded: number): string | null {
  if (amount < 0 || paid < 0 || refunded < 0) {
    return 'negative';
  }
  if (paid > amount) {
    return 'paidExceedsAmount';
  }
  if (refunded > paid) {
    return 'refundExceedsPaid';
  }
  return null;
}
