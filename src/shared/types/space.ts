import type { MealBillingType, PrepaidBalanceUnit } from './dashboard';

export type SpaceType = 'PG' | 'MESS' | 'HOSTEL' | 'CO_LIVING' | 'RENTAL';

export type MembershipRole = 'OWNER' | 'MANAGER' | 'TENANT' | 'CUSTOMER' | 'STAFF';

export type GenderPolicy = 'MALE' | 'FEMALE' | 'MIXED';

export type AmenityAssignment = {
  code: string;
  label: string;
};

/** Public discovery card — GET /spaces/discover */
export interface DiscoverSpaceCardResponse {
  spaceId: string;
  name: string;
  type: SpaceType;
  address?: string | null;
  amenityCodes?: string[];
  amenityLabels?: string[];
  foodIncludedInRent: boolean;
  genderPolicy?: GenderPolicy | null;
  alreadyMember: boolean;
  /** Converted from a test-lead registration (shown in local discovery). */
  testSpace?: boolean;
}

export type ListingPriceBasis = 'PER_BED' | 'PER_ROOM' | 'PER_UNIT';

/** Public discovery detail — GET /spaces/discover/{spaceId} */
export interface DiscoverSpaceDetailResponse extends DiscoverSpaceCardResponse {
  amenities?: AmenityAssignment[];
  ownedByCurrentUser?: boolean;
  addressLine?: string | null;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
  latitude?: number | string | null;
  longitude?: number | string | null;
  mapUrl?: string | null;
  description?: string | null;
  startingPrice?: number | string | null;
  priceBasis?: ListingPriceBasis | null;
  monthlyPrice?: number | string | null;
  mealPrice?: number | string | null;
  sharingNotes?: string | null;
}

export type PollCloseDayOffset = 'SAME_DAY' | 'PREVIOUS_DAY';

export interface SpacePermissionsResponse {
  canViewAccommodation: boolean;
  canManageAccommodation: boolean;
  canDeactivateAccommodation: boolean;
  canManageOccupancy: boolean;
  canViewSpaceOccupancies: boolean;
  canManageMembers: boolean;
  canRemoveMember: boolean;
  canManageMeals?: boolean;
  canViewMeals?: boolean;
  canManageMealParticipation?: boolean;
  canViewOwnMealParticipation?: boolean;
  canRaiseComplaint?: boolean;
  canViewAllComplaints?: boolean;
  canManageComplaints?: boolean;
  canViewInventory?: boolean;
  canManageInventory?: boolean;
}

export interface MySpaceResponse {
  spaceId: string;
  spaceName: string;
  spaceType: SpaceType;
  membershipRole: MembershipRole;
  isDefault: boolean;
  joinedAt: string;
  address?: string | null;
  ownerId?: string | null;
  permissions?: SpacePermissionsResponse;
}

export interface DefaultSpaceResponse {
  spaceId: string;
  spaceName: string;
  spaceType: SpaceType;
}

export interface SetDefaultSpaceResponse {
  spaceId: string;
  spaceName: string;
  isDefault: boolean;
}

export interface SpaceResponse {
  id: string;
  name: string;
  type: SpaceType;
  address?: string;
  contactNumber?: string;
  isActive: boolean;
  discoverable?: boolean;
  ownerId: string;
  ownerName: string;
  createdAt: string;
}

export interface SpaceDetailsResponse {
  id: string;
  name: string;
  type: SpaceType;
  address?: string;
  contactNumber?: string;
  ownerId: string;
  foodIncludedInRent?: boolean;
  defaultFoodCharge?: number | null;
  mealBillingType?: MealBillingType;
  prepaidBalanceUnit?: PrepaidBalanceUnit | null;
  prepaidFallbackToPayPerMeal?: boolean;
  genderPolicy?: GenderPolicy | null;
  amenities?: AmenityAssignment[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateSpaceRequest {
  name: string;
  type: SpaceType;
  address?: string;
  contactNumber?: string;
  ownerId: string;
  genderPolicy?: GenderPolicy | null;
  amenities?: AmenityAssignment[];
}

export interface UpdateSpaceRequest {
  name?: string;
  address?: string;
  contactNumber?: string;
  genderPolicy?: GenderPolicy | null;
  amenities?: AmenityAssignment[];
}

export interface MyInvitationResponse {
  invitationId: string;
  spaceId: string;
  spaceName: string;
  spaceType: SpaceType;
  role: MembershipRole;
  invitedBy: string;
  createdAt: string;
  expiresAt: string;
}

export interface AcceptInvitationRequest {
  userId: string;
}

export interface SpaceMembershipResponse {
  id: string;
  spaceId: string;
  spaceName: string;
  userId: string;
  role: MembershipRole;
  status: string;
  joinedAt?: string;
}

export interface MealBillingSettings {
  billingType: MealBillingType;
  prepaidBalanceUnit?: PrepaidBalanceUnit | null;
  fallbackToPayPerMeal: boolean;
}

export interface UpdateMealBillingSettingsRequest {
  billingType: MealBillingType;
  prepaidBalanceUnit?: PrepaidBalanceUnit | null;
  fallbackToPayPerMeal?: boolean;
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
