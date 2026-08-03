import type { MembershipRole } from './space';
import type { PrepaidBalanceUnit } from './dashboard';

export type MealBillingType = 'PAY_PER_MEAL' | 'PREPAID_BALANCE';

export type MealPlanCode =
  | 'NONE'
  | 'BREAKFAST'
  | 'LUNCH'
  | 'DINNER'
  | 'FULL'
  | 'CUSTOM';

export type MealParticipationStatus = 'ACTIVE' | 'PAUSED' | 'STOPPED';

export type MealType = 'BREAKFAST' | 'LUNCH' | 'DINNER';

export type DailyMenuStatus = 'DRAFT' | 'PUBLISHED' | 'MODIFIED';

export type DailyMenuEntryType = 'COMBO' | 'ITEM' | 'PACKAGE';

export interface MealPlanResponse {
  mealPlanId: string;
  code: MealPlanCode;
  name: string;
  breakfastIncluded: boolean;
  lunchIncluded: boolean;
  dinnerIncluded: boolean;
  isActive: boolean;
}

export interface MealParticipationResponse {
  participationId: string;
  memberId: string;
  memberName: string;
  memberRole: MembershipRole;
  mealPlanId: string;
  mealPlanCode: MealPlanCode;
  mealPlanName: string;
  status: MealParticipationStatus;
  effectiveFrom: string;
  effectiveTo?: string | null;
  sourceOccupancyId?: string | null;
  defaultDeliveryLocationId?: string | null;
  defaultDeliveryLocationName?: string | null;
}

export type FoodCatalogScope = 'GLOBAL' | 'SPACE';

export type FoodType = 'VEG' | 'NON_VEG' | 'EGG';

export interface FoodCategoryResponse {
  categoryId: string;
  name: string;
  sortOrder: number;
  scope: FoodCatalogScope;
  isActive: boolean;
  itemCount?: number;
}

export interface FoodItemResponse {
  itemId: string;
  categoryId: string;
  categoryName?: string;
  name: string;
  scope: FoodCatalogScope;
  isCustom: boolean;
  isActive: boolean;
  foodType?: FoodType;
  defaultPrice?: number | null;
  currencyCode?: string | null;
  /** Mess Menu Library: item can be enabled as a meal extra. */
  isExtra?: boolean;
}

export interface UpdateFoodItemDefaultPriceRequest {
  price: number;
  currencyCode?: string | null;
}

export interface CreateFoodCategoryRequest {
  name: string;
}

export interface CreateFoodItemRequest {
  categoryId: string;
  name: string;
  foodType?: FoodType;
  /** Mess-only: create already marked as a library extra. */
  isExtra?: boolean;
}

export interface UpdateFoodItemRequest {
  categoryId?: string;
  name?: string;
  foodType?: FoodType;
}

export interface UpdateFoodItemExtraRequest {
  isExtra: boolean;
}

export interface CreateMealComboRequest {
  name: string;
  description?: string | null;
  itemIds: string[];
  /** Mess-only optional quantities; missing items default to 1. */
  itemQuantities?: Array<{ itemId: string; quantity: number }>;
  price?: number | null;
  currencyCode?: string | null;
  foodType?: FoodType;
}

export interface UpdateMealComboRequest {
  name?: string;
  description?: string | null;
  itemIds?: string[];
  /** Mess-only optional quantities; missing items default to 1. */
  itemQuantities?: Array<{ itemId: string; quantity: number }>;
  price?: number | null;
  currencyCode?: string | null;
  foodType?: FoodType;
}

export interface MealComboResponse {
  comboId: string;
  name: string;
  description?: string | null;
  scope?: FoodCatalogScope;
  isActive: boolean;
  price?: number | null;
  currencyCode?: string | null;
  foodType?: FoodType;
  items?: Array<{ itemId: string; name: string; foodType?: FoodType; quantity?: number }>;
}

export type MenuHistoryEntryType = 'COMBO' | 'ITEM';

export interface MenuHistoryItemResponse {
  historyId: string;
  type: MenuHistoryEntryType;
  mealType: MealType;
  name: string;
  thumbnailUrl?: string | null;
  foodType?: FoodType | null;
  summary?: string | null;
  lastUsedAt: string;
  lastUsedMenuDate?: string | null;
  usageCount: number;
  price?: number | null;
  currencyCode?: string | null;
  comboId?: string | null;
  itemId?: string | null;
  itemIds?: string[] | null;
}

export interface MenuHistoryPageResponse {
  items: MenuHistoryItemResponse[];
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
}

export interface DailyMenuOptionResponse {
  optionId?: string;
  entryType?: DailyMenuEntryType;
  comboId?: string | null;
  itemId?: string | null;
  label: string;
  sortOrder: number;
  isAvailable: boolean;
  /** Mess-only add-on; same catalog item may also appear as a main dish. */
  isExtra?: boolean;
  price?: number | null;
  currencyCode?: string | null;
  packageItems?: Array<{ itemId: string; name: string }> | null;
}

export interface DailyMenuResponse {
  dailyMenuId?: string;
  menuDate: string;
  mealType: MealType;
  status: DailyMenuStatus;
  publishedAt?: string | null;
  notes?: string | null;
  options: DailyMenuOptionResponse[];
}

export interface UpsertDailyMenuRequest {
  options: Array<{
    optionId?: string;
    entryType?: DailyMenuEntryType;
    comboId?: string | null;
    itemId?: string | null;
    /** Required when entryType = 'PACKAGE' */
    itemIds?: string[] | null;
    label: string;
    sortOrder: number;
    isAvailable: boolean;
    /** Mess-only add-on flag for PACKAGE entries. */
    isExtra?: boolean;
    price?: number | null;
    currencyCode?: string | null;
  }>;
  notes?: string | null;
}

export interface CreateMealPlanRequest {
  name: string;
  breakfastIncluded: boolean;
  lunchIncluded: boolean;
  dinnerIncluded: boolean;
}

export interface CreateMealParticipationRequest {
  memberId: string;
  mealPlanId: string;
  effectiveFrom: string;
  effectiveTo?: string | null;
  defaultDeliveryLocationId?: string | null;
}

export interface UpdateMealParticipationRequest {
  mealPlanId?: string;
  status?: MealParticipationStatus;
  defaultDeliveryLocationId?: string | null;
}

export interface MealParticipationSearchParams {
  status?: MealParticipationStatus;
  mealPlanCode?: MealPlanCode;
  search?: string;
}

export interface MealEligibilitySummaryResponse {
  date: string;
  distinctEligibleMemberCount: number;
  slots: Array<{
    mealType: MealType;
    eligibleCount: number;
    published: boolean;
    pausedCount?: number;
  }>;
}

export interface MealEligibleParticipantResponse {
  memberId: string;
  memberName: string;
  mobileNumber?: string | null;
  mealPlanCode: MealPlanCode;
  mealPlanName?: string;
}

export interface CopyDailyMenuRequest {
  force?: boolean;
  publish?: boolean;
}

export interface MealSharePreviewLine {
  label: string;
  detail?: string | null;
  price?: number | null;
  currencyCode?: string | null;
}

export interface MealSharePreviewSlot {
  mealType: MealType;
  lines: MealSharePreviewLine[];
}

export interface MealSharePreviewResponse {
  date: string;
  messageText: string;
  slots: MealSharePreviewSlot[];
}

export type MealPollStatus = 'OPEN' | 'CLOSED';
export type MealPollOptionType = 'MENU_ENTRY' | 'NOT_AVAILABLE';

export interface MealPollOption {
  id: string;
  optionType: MealPollOptionType;
  sortOrder: number;
  label: string;
  detail?: string | null;
  dailyMenuEntryId?: string | null;
  price?: number | null;
  currencyCode?: string | null;
  foodType?: FoodType | null;
  /** Mess-only add-on from daily menu extras. */
  isExtra?: boolean;
}

export type MealPollCloseSource = 'MANUAL' | 'AUTOMATIC';
export type PollCloseDayOffset = 'PREVIOUS_DAY' | 'SAME_DAY';

export interface MealPollSlot {
  id: string;
  pollDate: string;
  mealType: MealType;
  status: MealPollStatus;
  dailyMenuId: string;
  options: MealPollOption[];
  mySelectedOptionId?: string | null;
  mySelections?: MealPollMySelection[];
  multiQuantityEnabled?: boolean;
  responseCount: number;
  myDeliveryLocationId?: string | null;
  myDeliveryLocationName?: string | null;
  timezone?: string | null;
  pollCloseAt?: string | null;
  closedAt?: string | null;
  openedAt?: string | null;
  closeSource?: MealPollCloseSource | null;
}

export interface MealPollClosingSettings {
  timezone: string;
  breakfastDayOffset: PollCloseDayOffset;
  breakfastTime: string;
  lunchDayOffset: PollCloseDayOffset;
  lunchTime: string;
  dinnerDayOffset: PollCloseDayOffset;
  dinnerTime: string;
}

export interface UpdateMealPollClosingSettingsRequest {
  timezone: string;
  breakfastDayOffset: PollCloseDayOffset;
  breakfastTime: string;
  lunchDayOffset: PollCloseDayOffset;
  lunchTime: string;
  dinnerDayOffset: PollCloseDayOffset;
  dinnerTime: string;
}

export interface MealDeliveryLocation {
  id: string;
  name: string;
  description?: string | null;
  address?: string | null;
  active: boolean;
  sortOrder: number;
}

export interface MealPollMySelection {
  optionId: string;
  quantity: number;
}

export type MealPollPaymentChoice = 'MARK_AS_PAID' | 'PAY_LATER';
export type MealPollPaymentStatus = 'PENDING' | 'PENDING_APPROVAL' | 'PAID' | 'REJECTED';

export interface MealPollDayResponse {
  pollDate: string;
  polls: MealPollSlot[];
  myPaymentStatus?: MealPollPaymentStatus | null;
  myPaymentChoice?: MealPollPaymentChoice | null;
  myProofImageUrl?: string | null;
  myRejectionReason?: string | null;
  deliveryLocations?: MealDeliveryLocation[];
  myLastDeliveryLocationIds?: Partial<Record<MealType, string>>;
  myMealBillingType?: MealBillingType | null;
  myPrepaidOverflowAmount?: number | null;
  myPrepaidDebitedAmount?: number | null;
  myPrepaidOverflowPayment?: boolean | null;
  /** Persisted meal total for this member/day. */
  myPaymentChargedAmount?: number | null;
  /** Ephemeral delta from this submit only (Paid edits). Not stored. */
  myPaymentAdjustment?: number | null;
}

export type MealPollPaymentEventType =
  | 'PAY_LATER_SELECTED'
  | 'MARK_AS_PAID_SELECTED'
  | 'PROOF_SUBMITTED'
  | 'APPROVED'
  | 'REJECTED'
  | 'REMINDER_SENT'
  | 'PREPAID_OVERFLOW_PAY_LATER';

export interface MealPollPaymentEvent {
  eventId: string;
  pollDate: string;
  eventType: MealPollPaymentEventType;
  paymentStatus?: MealPollPaymentStatus | null;
  paymentChoice?: MealPollPaymentChoice | null;
  amount?: number | null;
  remarks?: string | null;
  actorId?: string | null;
  createdAt: string;
}

export interface SubmitMealPollOptionQuantity {
  optionId: string;
  quantity: number;
}

export interface SubmitMealPollSelection {
  mealType: MealType;
  selectedOptionId?: string;
  options?: SubmitMealPollOptionQuantity[];
  deliveryLocationId?: string;
}

export interface MealHeadcountMember {
  memberId: string;
  memberName: string;
  quantity?: number;
  paymentStatus?: MealPollPaymentStatus | null;
  paymentProofImageUrl?: string | null;
  deliveryLocationId?: string | null;
  deliveryLocationName?: string | null;
}

export interface MealHeadcountOption {
  optionId: string;
  optionType: MealPollOptionType;
  sortOrder: number;
  label: string;
  detail?: string | null;
  price?: number | null;
  currencyCode?: string | null;
  count: number;
  members: MealHeadcountMember[];
}

export interface MealHeadcountSlot {
  mealType: MealType;
  pollId: string;
  pollStatus: MealPollStatus;
  mealsToPrepare: number;
}

export interface MealHeadcountDayResponse {
  date: string;
  slots: MealHeadcountSlot[];
}

export interface MealHeadcountDetailResponse {
  date: string;
  mealType: MealType;
  pollId: string;
  pollStatus: MealPollStatus;
  mealsToPrepare: number;
  eligibleCount: number;
  options: MealHeadcountOption[];
  noResponseMembers: MealHeadcountMember[];
  deliveryBreakdown?: MealHeadcountDeliveryLocation[];
}

export interface MealHeadcountDeliveryLocation {
  locationId: string;
  locationName: string;
  totalPlates: number;
}

export type MemberMealActivitySlotStatus =
  | 'ACCEPTED'
  | 'SKIPPED'
  | 'PENDING'
  | 'NO_MENU'
  | 'CLOSED'
  | 'INACTIVE';

export interface MemberMealActivitySlot {
  mealType: MealType;
  status: MemberMealActivitySlotStatus;
  slotAmount?: number | null;
  currencyCode?: string | null;
}

export interface MemberMealActivitySelection {
  label: string;
  price?: number | null;
  currencyCode?: string | null;
  quantity: number;
  itemDetail?: string | null;
  lineTotal?: number | null;
}

export interface MemberMealActivitySlotDetail {
  mealType: MealType;
  status: MemberMealActivitySlotStatus;
  menuPublished?: boolean;
  pollStatus?: MealPollStatus | null;
  deliveryLocationName?: string | null;
  deliveryLocationDescription?: string | null;
  respondedAt?: string | null;
  slotTotal?: number | null;
  selections: MemberMealActivitySelection[];
}

export interface MemberMealActivityDay {
  date: string;
  hasActivity?: boolean;
  dayTotal?: number | null;
  currencyCode?: string | null;
  paymentStatus?: MealPollPaymentStatus | null;
  paymentReference?: string | null;
  paymentBatchId?: string | null;
  slots: MemberMealActivitySlot[];
}

export interface MemberMealActivitySummary {
  acceptedMeals: number;
  pendingResponses: number;
  skippedMeals: number;
  amountGenerated?: number | null;
  paidAmount?: number | null;
  pendingAmount?: number | null;
  currencyCode?: string | null;
  balanceRemaining?: number | null;
  balancePurchased?: number | null;
  balanceConsumed?: number | null;
  amountPaidThisMonth?: number | null;
  balanceUnit?: PrepaidBalanceUnit | null;
}

export interface MemberMealActivityMonth {
  month: string;
  summary: MemberMealActivitySummary;
  days: MemberMealActivityDay[];
}

export interface MemberMealActivityDayPayment {
  id?: string | null;
  pollDate?: string | null;
  paymentChoice?: MealPollPaymentChoice | null;
  paymentStatus?: MealPollPaymentStatus | null;
  chargedAmount?: number | null;
  paymentBatchId?: string | null;
  paymentReference?: string | null;
  proofImageUrl?: string | null;
  referenceNumber?: string | null;
  remarks?: string | null;
  rejectionReason?: string | null;
  proofSubmittedAt?: string | null;
  proofReviewedAt?: string | null;
  prepaidOverflowAmount?: number | null;
  prepaidDebitedAmount?: number | null;
  prepaidOverflowPayment?: boolean;
}

export interface MemberMealActivityDayDetail {
  date: string;
  memberName?: string | null;
  dayTotal?: number | null;
  currencyCode?: string | null;
  paymentStatus?: MealPollPaymentStatus | null;
  payment?: MemberMealActivityDayPayment | null;
  notes?: string | null;
  /** Detail payload uses full slot rows with selections (mobile SoT). */
  slots?: MemberMealActivitySlotDetail[];
}

export interface BulkMealPollPaymentProofResponse {
  paymentBatchId: string;
  paymentReference?: string | null;
  dates: string[];
  updatedCount: number;
}

