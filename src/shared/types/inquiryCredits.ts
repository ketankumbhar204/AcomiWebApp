/**
 * Inquiry-credits types aligned with backend inquirycredit DTOs (Jackson camelCase).
 */

export type InquiryPackage = {
  id: string;
  name: string;
  priceAmount: number;
  currency: string;
  credits: number;
  enabled: boolean;
  displayOrder: number;
};

export type InquiryPaymentConfig = {
  configId?: string;
  enabled: boolean;
  upiId?: string | null;
  qrFileId?: string | null;
  qrUrl?: string | null;
  whatsappNumber?: string | null;
  instructions?: string | null;
  packages: InquiryPackage[];
};

export type InquiryWallet = {
  walletId: string;
  userId: string;
  availableCredits: number;
  lifetimeGranted: number;
  lifetimeUsed: number;
  updatedAt?: string;
};

/** WEB free daily enquiry quota + paid credits. */
export type InquiryQuota = {
  dailyFreeLimit: number;
  freeUsedToday: number;
  freeRemainingToday: number;
  availableCredits: number;
};

export type InquiryPurchaseStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export type InquiryPurchaseResponse = {
  id: string;
  userId: string;
  userFullName?: string | null;
  userMobileNumber?: string | null;
  packageId: string;
  amount: number;
  currency: string;
  credits: number;
  paymentMethod?: string;
  status: InquiryPurchaseStatus;
  utr?: string | null;
  requestedAt: string;
  verifiedAt?: string | null;
  verifiedByUserId?: string | null;
  rejectionReason?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type CreateInquiryPurchaseRequest = {
  packageId: string;
  utr?: string;
};

export type AdminInquiryPurchaseSummary = {
  pendingCount: number;
  approvedCount: number;
  rejectedCount: number;
};

export type UpdateInquiryPaymentConfigRequest = {
  enabled?: boolean;
  upiId?: string | null;
  whatsappNumber?: string | null;
  qrFileId?: string | null;
  instructions?: string | null;
};

export type UpdateInquiryPackageRequest = {
  name?: string;
  priceAmount?: number;
  currency?: string;
  credits?: number;
  enabled?: boolean;
  displayOrder?: number;
};
