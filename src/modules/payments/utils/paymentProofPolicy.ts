import type { UniversalPaymentMethod } from '@/shared/types/payments';

export type PaymentProofRequirements = {
  screenshotRequired: boolean;
  utrRequired: boolean;
};

export const DEFAULT_PAYMENT_PROOF_REQUIREMENTS: PaymentProofRequirements = {
  screenshotRequired: false,
  utrRequired: false,
};

export type PaymentProofSubmission = {
  proofImageBase64?: string;
  referenceNumber?: string;
  remarks?: string;
  paymentMethod?: UniversalPaymentMethod;
};

export type PaymentProofValidationError =
  | 'screenshotRequired'
  | 'utrRequired'
  | 'proofOrReferenceRequired';

export const UNIVERSAL_PAYMENT_METHODS: UniversalPaymentMethod[] = [
  'UPI',
  'BANK_TRANSFER',
  'CASH',
  'CHEQUE',
  'OTHER',
];

export const EMPTY_PAYMENT_PROOF: PaymentProofSubmission = {
  paymentMethod: 'UPI',
  referenceNumber: '',
  remarks: '',
  proofImageBase64: undefined,
};

export function validatePaymentProofSubmission(
  payload: PaymentProofSubmission,
  requirements: PaymentProofRequirements = DEFAULT_PAYMENT_PROOF_REQUIREMENTS,
  options?: { requireProofOrReference?: boolean },
): PaymentProofValidationError | null {
  if (requirements.screenshotRequired && !payload.proofImageBase64?.trim()) {
    return 'screenshotRequired';
  }
  if (requirements.utrRequired && !payload.referenceNumber?.trim()) {
    return 'utrRequired';
  }
  if (
    options?.requireProofOrReference &&
    !payload.proofImageBase64?.trim() &&
    !payload.referenceNumber?.trim()
  ) {
    return 'proofOrReferenceRequired';
  }
  return null;
}

export function toSubmitPaymentProofBody(payload: PaymentProofSubmission) {
  return {
    proofImageBase64: payload.proofImageBase64?.trim() || undefined,
    referenceNumber: payload.referenceNumber?.trim() || undefined,
    remarks: payload.remarks?.trim() || undefined,
    paymentMethod: payload.paymentMethod,
  };
}
