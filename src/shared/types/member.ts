import type { MembershipRole } from './space';
import type { MemberGender } from './auth';
import type { MealBillingType, PrepaidBalanceUnit } from './dashboard';

export type { MemberGender, MealBillingType, PrepaidBalanceUnit };

export type MemberStatus = 'ACTIVE' | 'VACATED' | 'SUSPENDED' | 'BLACKLISTED';
export type MemberOccupancyStatus = 'ALLOCATED' | 'RESERVED' | 'VACATED';
export type InvitationStatus = 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'CANCELLED' | 'REJECTED';
export type MemberDocumentType =
  | 'AADHAAR'
  | 'PAN'
  | 'PASSPORT'
  | 'DRIVING_LICENSE'
  | 'STUDENT_ID'
  | 'OTHER';
export type DocumentVerificationStatus = 'PENDING' | 'VERIFIED' | 'REJECTED';
export type MemberHistoryAction =
  | 'STATUS_CHANGED'
  | 'DEPOSIT_UPDATED'
  | 'EMERGENCY_CONTACT_UPDATED';

export type MemberSearchParams = {
  search?: string;
  occupancyStatus?: MemberOccupancyStatus;
};

export type CreateMemberRequest = {
  fullName: string;
  mobileNumber: string;
  role: MembershipRole;
  gender?: MemberGender | null;
  mealBillingType?: MealBillingType | null;
};

export type UpdateMemberRequest = CreateMemberRequest;

export type UpdateMemberStatusRequest = {
  status: MemberStatus;
};

export type UpdateEmergencyContactRequest = {
  emergencyContactName: string;
  emergencyContactRelation: string;
  emergencyContactMobile: string;
};

export type UpdateDepositRequest = {
  depositAmount: number;
  depositPaid: number;
  depositRefunded: number;
};

export type CreateMemberDocumentRequest = {
  documentType: MemberDocumentType;
  documentNumber: string;
  fileUrl: string;
};

export type CreateMemberNoteRequest = {
  note: string;
};

export type ImportMemberRequest = {
  sourceMemberId: string;
};

export type CreateInvitationRequest = {
  spaceId: string;
  invitedByUserId: string;
  mobileNumber: string;
  role: MembershipRole;
};

export type MemberResponse = {
  memberId: string;
  fullName: string;
  mobileNumber: string;
  role: MembershipRole;
  linkedUser: boolean;
  linkedUserId?: string | null;
  membershipId?: string | null;
  status: MemberStatus;
  occupancyStatus?: MemberOccupancyStatus | null;
  gender?: MemberGender | null;
  createdAt: string;
};

export type CurrentOccupancySummary = {
  occupancyId?: string | null;
  occupancyStatus?: string | null;
  targetType?: string;
  buildingId?: string;
  buildingName?: string | null;
  floorId?: string | null;
  floorName?: string | null;
  unitId?: string | null;
  unitName?: string | null;
  roomId?: string | null;
  roomName?: string | null;
  bedId?: string | null;
  bedName?: string | null;
  moveInDate?: string | null;
};

export type MemberMealParticipationSummary = {
  participationId?: string;
  mealPlanCode?: string | null;
  mealPlanName?: string | null;
  status?: string | null;
  effectiveFrom?: string | null;
  effectiveTo?: string | null;
  defaultDeliveryLocationId?: string | null;
  defaultDeliveryLocationName?: string | null;
};

export type MemberDetailsResponse = {
  memberId: string;
  spaceId: string;
  fullName: string;
  mobileNumber: string;
  role: MembershipRole;
  linkedUser: boolean;
  linkedUserId?: string | null;
  membershipId?: string | null;
  active: boolean;
  status: MemberStatus;
  occupancyStatus?: MemberOccupancyStatus | null;
  gender?: MemberGender | null;
  currentOccupancy?: CurrentOccupancySummary | null;
  statusUpdatedAt?: string | null;
  emergencyContactName?: string | null;
  emergencyContactRelation?: string | null;
  emergencyContactMobile?: string | null;
  depositAmount: number;
  depositPaid: number;
  depositRefunded: number;
  depositBalance: number;
  mealParticipation?: MemberMealParticipationSummary | null;
  mealBillingType?: MealBillingType | null;
  effectiveMealBillingType?: MealBillingType | null;
  assignedAmenities?: { code: string; label: string }[] | null;
  createdAt: string;
  updatedAt?: string;
};

export type MemberImportCandidateResponse = {
  memberId: string;
  fullName: string;
  mobileNumber: string;
  role: MembershipRole;
  status: MemberStatus;
  occupancyStatus?: MemberOccupancyStatus | null;
  gender?: MemberGender | null;
  createdAt: string;
  sourceSpaceId: string;
  sourceSpaceName: string;
  alreadyInTargetSpace: boolean;
  availableForMoveIn: boolean;
};

export type PendingInvitationResponse = {
  invitationId: string;
  mobileNumber: string;
  role: MembershipRole;
  status: InvitationStatus;
  invitedBy: string;
  createdAt: string;
};

export type InvitationResponse = {
  id: string;
  spaceId: string;
  spaceName: string;
  invitedByUserId: string;
  mobileNumber: string;
  role: MembershipRole;
  status: InvitationStatus;
  expiresAt: string;
  acceptedAt?: string | null;
  createdAt: string;
};

export type MemberDocumentResponse = {
  documentId: string;
  documentType: MemberDocumentType;
  documentNumber: string;
  fileUrl: string;
  verificationStatus: DocumentVerificationStatus;
  uploadedAt: string;
};

export type MemberNoteResponse = {
  noteId: string;
  note: string;
  createdBy: string;
  createdByName: string;
  createdAt: string;
};

export type MemberHistoryResponse = {
  historyId: string;
  action: MemberHistoryAction;
  oldValue?: string | null;
  newValue?: string | null;
  changedBy: string;
  changedByName: string;
  changedAt: string;
};

export type MemberMealBalance = {
  balance: number;
  unit: PrepaidBalanceUnit;
  currencyCode: string;
  purchasedThisMonth?: number | null;
  consumedThisMonth?: number | null;
  amountPaidThisMonth?: number | null;
  lastPurchaseMeals?: number | null;
  lastPurchasePaidAmount?: number | null;
  currentAmountPaid?: number | null;
  lastPurchaseAt?: string | null;
  mealsIncluded?: number | null;
  mealsUsed?: number | null;
  mealsRemaining?: number | null;
  validTill?: string | null;
  active?: boolean;
  endedAt?: string | null;
  endedBy?: string | null;
};

export type MealSubscriptionAction = 'CREATED' | 'UPDATED' | 'RENEWED' | 'MEALS_ADDED' | 'ENDED';
export type MemberMealBalanceActivityEventType = 'PURCHASE' | 'DEBIT' | 'ENDED';

export type MemberMealBalanceActivityEvent = {
  eventId: string;
  eventType: MemberMealBalanceActivityEventType;
  meals?: number | null;
  paidAmount?: number | null;
  mealType?: string | null;
  pollDate?: string | null;
  remarks?: string | null;
  balanceAfter?: number | null;
  createdAt: string;
  subscriptionAction?: MealSubscriptionAction | null;
};

export type MemberSubscriptionLifetimeSummary = {
  totalMealsPurchased?: number | null;
  totalMealsConsumed?: number | null;
  totalAmountPaid?: number | null;
  totalActivities?: number | null;
};

export type MemberSubscriptionHistoryResponse = {
  summary: MemberSubscriptionLifetimeSummary;
  events: MemberMealBalanceActivityEvent[];
};

export type RecordMealBalancePurchaseRequest = {
  amount: number;
  paidAmount?: number;
  remarks?: string;
  replaceBalance?: boolean;
  validTill?: string;
};

export type OccupancyHistoryEntry = {
  historyId: string;
  occupancyId: string;
  eventType: string;
  performedBy?: string;
  performedAt: string;
  remarks?: string | null;
};

export type MemberOccupancyListResponse = {
  currentOccupancy: Record<string, unknown> | null;
  reservedOccupancy: Record<string, unknown> | null;
  occupancies: Array<{
    occupancyId: string;
    status: string;
    memberId?: string;
    memberName?: string;
    buildingName?: string | null;
    floorName?: string | null;
    unitName?: string | null;
    roomName?: string | null;
    bedName?: string | null;
    moveInDate?: string | null;
    vacatedAt?: string | null;
  }>;
  history: OccupancyHistoryEntry[];
};

export type SpacePaymentResponse = {
  paymentId: string;
  memberId?: string;
  memberName?: string | null;
  amount: number;
  /** Prefer paymentStatus from payments module; status kept for legacy panels */
  status?: string;
  paymentStatus?: string;
  paymentCategory?: string | null;
  title?: string;
  currencyCode?: string;
  dueDate?: string;
  month?: string | null;
  createdAt: string;
  updatedAt?: string;
};

export type SpacePaymentListResponse = {
  month: string;
  payments: SpacePaymentResponse[];
};
