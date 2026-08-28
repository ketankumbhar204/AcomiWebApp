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
}

export interface PropertyRegistrationListItem {
  id: string;
  reference: string;
  propertyType: SpaceType;
  propertyName: string;
  ownerName: string;
  mobileNumber: string;
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
  startingPrice: number;
  priceBasis: string;
  capacityEstimate?: number | null;
  convertedSpaceId?: string | null;
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
  monthlyPrice: number;
  mealPrice: number;
  capacityEstimate?: number | null;
  convertedSpaceId?: string | null;
  claimedVia?: string | null;
  updatedAt: string;
}

export interface AdminCreatePropertyRegistrationRequest {
  propertyType?: Exclude<SpaceType, 'MESS'>;
  propertyName?: string;
  ownerName?: string;
  description?: string;
  mobileNumber?: string;
  addressLine?: string;
  city?: string;
  state?: string;
  pincode?: string;
  mapUrl?: string;
  startingPrice?: number;
  capacityEstimate?: number;
  testLead?: boolean;
}

export interface AdminCreateMessRegistrationRequest {
  messName?: string;
  ownerName?: string;
  description?: string;
  mobileNumber?: string;
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

export type AdminPropertyRegistrationPage = PagedResponse<PropertyRegistrationListItem>;
export type AdminMessRegistrationPage = PagedResponse<MessRegistrationListItem>;
