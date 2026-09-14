import type { PagedResponse } from './api';
import type { SpaceType } from './space';

export type SystemRole = 'USER' | 'ADMIN';

export type RegistrationSource = 'PUBLIC_WEBSITE' | 'ADMIN';

export type RegistrationStatus =
  | 'PENDING'
  | 'IN_REVIEW'
  | 'CONTACTED'
  | 'CONVERTED'
  | 'REJECTED'
  | 'DUPLICATE';

export interface AdminDashboardSummary {
  propertyRegistrationCount: number;
  messRegistrationCount: number;
  adminPropertyLeads: number;
  adminMessLeads: number;
  websitePropertyLeads: number;
  websiteMessLeads: number;
  unclaimedAdminPropertyLeads: number;
  unclaimedAdminMessLeads: number;
  claimedPropertyLeads: number;
  claimedMessLeads: number;
  activePropertySpaces: number;
  activeMessSpaces: number;
  registeredUsersCount?: number;
  totalEnquiriesCount?: number;
  ownersCount?: number;
  savedAddressesCount?: number;
  registeredUsersDeltaPercent?: number | null;
  totalEnquiriesDeltaPercent?: number | null;
  propertySpacesDeltaPercent?: number | null;
  messSpacesDeltaPercent?: number | null;
  ownersDeltaPercent?: number | null;
  savedAddressesDeltaPercent?: number | null;
}

export type AdminActivityType =
  | 'NEW_ENQUIRY'
  | 'NEW_PROPERTY_REGISTRATION'
  | 'NEW_MESS_REGISTRATION'
  | 'NEW_USER_REGISTRATION'
  | 'NEW_PROPERTY_LISTED'
  | 'NEW_MESS_LISTED'
  | 'LEAD_CLAIMED_PROPERTY'
  | 'LEAD_CLAIMED_MESS'
  | 'ENQUIRY_SHARED'
  | 'ENQUIRY_REJECTED'
  | 'ADDRESS_SAVED';

export type AdminActivityTargetType =
  | 'ENQUIRY'
  | 'PROPERTY_REGISTRATION'
  | 'MESS_REGISTRATION'
  | 'USER'
  | 'SPACE'
  | 'SAVED_ADDRESS';

export interface AdminActivityItem {
  id: string;
  type: AdminActivityType;
  title: string;
  description: string;
  timestamp: string;
  targetType: AdminActivityTargetType;
  targetId: string;
  secondaryTargetType?: AdminActivityTargetType | null;
  secondaryTargetId?: string | null;
}

export interface AdminEnquiriesTrendPoint {
  date: string;
  count: number;
}

export interface AdminEnquiriesTrend {
  from: string;
  to: string;
  points: AdminEnquiriesTrendPoint[];
  total: number;
}

export interface AdminUserRegistrationBreakdownSlice {
  role: string;
  label: string;
  count: number;
}

export interface AdminUserRegistrationBreakdown {
  total: number;
  slices: AdminUserRegistrationBreakdownSlice[];
}

export interface AdminActiveSpace {
  id: string;
  name: string;
  type: SpaceType;
  address?: string | null;
  contactNumber?: string | null;
  ownerId: string;
  ownerName: string;
  ownerMobile: string;
  createdAt: string;
  source?: RegistrationSource | null;
  testLead?: boolean;
  registrationId?: string | null;
}

export interface PropertyRegistrationListItem {
  id: string;
  reference: string;
  propertyType: SpaceType;
  propertyName: string;
  ownerName: string;
  mobileNumber: string;
  alternateMobileNumber?: string | null;
  city: string;
  state: string;
  pincode: string;
  status: RegistrationStatus;
  source: RegistrationSource;
  claimedAt?: string | null;
  createdAt: string;
  testLead: boolean;
}

export interface PropertyRegistrationDetail extends PropertyRegistrationListItem {
  mobileVerifiedAt?: string | null;
  description?: string | null;
  addressLine: string;
  mapUrl?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  startingPrice: number;
  priceBasis: string;
  capacityEstimate?: number | null;
  convertedSpaceId?: string | null;
  linkedOwnerUserId?: string | null;
  linkedOwnerName?: string | null;
  linkedOwnerMobile?: string | null;
  ownershipStatus?: 'NOT_LINKED' | 'LINKED' | null;
  autoShareEligible?: boolean | null;
  autoShareReason?: string | null;
  additionalMobileNumber?: string | null;
  sharingNotes?: string | null;
  foodIncludedListing?: boolean | null;
  genderPolicy?: 'MALE' | 'FEMALE' | 'MIXED' | null;
  unmappedAmenities?: string | null;
  reviewNotes?: string | null;
  claimedVia?: string | null;
  updatedAt: string;
  amenities: Array<{ code: string; customLabel?: string | null; displayOrder: number }>;
}

export interface MessRegistrationListItem {
  id: string;
  reference: string;
  messName: string;
  ownerName: string;
  mobileNumber: string;
  alternateMobileNumber?: string | null;
  city: string;
  state: string;
  pincode: string;
  status: RegistrationStatus;
  source: RegistrationSource;
  claimedAt?: string | null;
  createdAt: string;
  testLead: boolean;
}

export interface MessRegistrationDetail extends MessRegistrationListItem {
  mobileVerifiedAt?: string | null;
  description?: string | null;
  addressLine: string;
  mapUrl?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  monthlyPrice: number;
  mealPrice: number;
  capacityEstimate?: number | null;
  convertedSpaceId?: string | null;
  linkedOwnerUserId?: string | null;
  linkedOwnerName?: string | null;
  linkedOwnerMobile?: string | null;
  ownershipStatus?: 'NOT_LINKED' | 'LINKED' | null;
  autoShareEligible?: boolean | null;
  autoShareReason?: string | null;
  additionalMobileNumber?: string | null;
  sharingNotes?: string | null;
  foodIncludedListing?: boolean | null;
  genderPolicy?: 'MALE' | 'FEMALE' | 'MIXED' | null;
  unmappedAmenities?: string | null;
  reviewNotes?: string | null;
  claimedVia?: string | null;
  updatedAt: string;
}

export interface AdminLinkOwnerRequest {
  userId: string;
}

export interface AdminRegistrationConvertResponse {
  registrationId: string;
  reference: string;
  spaceId: string;
  spaceName: string;
  discoverable: boolean;
}

export interface AdminCreatePropertyRegistrationRequest {
  propertyType?: Exclude<SpaceType, 'MESS'>;
  propertyName?: string;
  ownerName?: string;
  description?: string;
  mobileNumber?: string;
  alternateMobileNumber?: string | null;
  addressLine?: string;
  city?: string;
  state?: string;
  pincode?: string;
  mapUrl?: string;
  startingPrice?: number;
  capacityEstimate?: number;
  testLead?: boolean;
}

export interface AdminUpdateRegistrationContactRequest {
  ownerName?: string;
  mobileNumber?: string;
  alternateMobileNumber?: string | null;
}

export interface AdminCreateMessRegistrationRequest {
  messName?: string;
  ownerName?: string;
  description?: string;
  mobileNumber?: string;
  alternateMobileNumber?: string | null;
  addressLine?: string;
  city?: string;
  state?: string;
  pincode?: string;
  mapUrl?: string;
  monthlyPrice?: number;
  mealPrice?: number;
  capacityEstimate?: number;
  testLead?: boolean;
}

export interface PropertyRegistrationResponse {
  id: string;
  reference: string;
  status: RegistrationStatus;
  source: RegistrationSource;
}

export interface MessRegistrationResponse {
  id: string;
  reference: string;
  status: RegistrationStatus;
  source: RegistrationSource;
}

export type AdminUserSelectedRole = 'NOT_SELECTED' | 'OWNER' | 'MEMBER' | 'OWNER_AND_MEMBER';

export type AdminUserOnboardingStatus = 'INCOMPLETE' | 'COMPLETE';

export interface AdminRegisteredUserSpace {
  id: string;
  name: string;
  type: SpaceType;
  membershipRole: string;
}

export interface AdminRegisteredUser {
  id: string;
  fullName?: string | null;
  mobileNumber: string;
  email?: string | null;
  mobileVerified: boolean;
  mobileVerifiedAt?: string | null;
  registeredAt: string;
  updatedAt?: string | null;
  selectedRole: AdminUserSelectedRole;
  onboardingStatus: AdminUserOnboardingStatus;
  profileCompleted: boolean;
  spaces: AdminRegisteredUserSpace[];
  systemRole?: SystemRole | string | null;
  active?: boolean;
  /** Admin-marked test account. */
  testUser?: boolean;
}

export type AdminRegisteredUserPage = PagedResponse<AdminRegisteredUser>;

export interface AdminRegisteredUsersSummary {
  totalUsers: number;
  verifiedUsers: number;
  newUsersLast30Days: number;
  withSpaceAssociation: number;
  totalUsersDeltaPercent?: number | null;
  verifiedUsersDeltaPercent?: number | null;
  newUsersDeltaPercent?: number | null;
  withSpaceDeltaPercent?: number | null;
}

export interface AdminPropertyRegistrationsSummary {
  totalProperties: number;
  leads: number;
  activeProperties: number;
  registeredByOwners: number;
  totalPropertiesDeltaPercent?: number | null;
  leadsDeltaPercent?: number | null;
  activePropertiesDeltaPercent?: number | null;
  registeredByOwnersDeltaPercent?: number | null;
}

export interface AdminMessRegistrationsSummary {
  totalMess: number;
  leads: number;
  activeMess: number;
  registeredByVendors: number;
  totalMessDeltaPercent?: number | null;
  leadsDeltaPercent?: number | null;
  activeMessDeltaPercent?: number | null;
  registeredByVendorsDeltaPercent?: number | null;
}

export interface SavedAddress {
  id: string;
  addressLine: string;
  city: string;
  state: string;
  pincode: string;
  mapUrl?: string | null;
  usageCount: number;
  propertyUsageCount?: number;
  messUsageCount?: number;
  lastUsedAt?: string | null;
  createdAt: string;
}

export interface AdminSavedAddressesSummary {
  totalAddresses: number;
  usedForProperties: number;
  usedForMesses: number;
  sharedAddresses: number;
  cities: string[];
  states: string[];
}

export interface SavedAddressRequest {
  addressLine: string;
  city: string;
  state: string;
  pincode: string;
  mapUrl?: string;
}

export type SavedAddressPage = PagedResponse<SavedAddress>;
