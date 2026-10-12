import type { PagedResponse } from '@/shared/types/api';
import type { SpaceType } from '@/shared/types/space';

export type SpaceEnquiryStatus = 'PENDING' | 'SHARED' | 'REJECTED' | 'EXPIRED' | 'CANCELLED';

export type EnquiryRequesterType = 'MEMBER' | 'OWNER';

export interface SpaceEnquiryResponse {
  enquiryId: string;
  spaceId: string;
  spaceName: string;
  spaceType?: SpaceType | null;
  locationLabel?: string | null;
  sharingNotes?: string | null;
  amenityLabels?: string[] | null;
  foodIncludedInRent?: boolean | null;
  requesterType: EnquiryRequesterType;
  status: SpaceEnquiryStatus;
  requestedAt: string;
  expiresAt: string;
  sharedAt?: string | null;
  detailsShared: boolean;
  requesterEmail: string;
  clientChannel?: 'WEB' | 'ANDROID' | null;
  contactDelivery?: 'EMAIL' | 'IN_APP' | null;
  contactEmailSentAt?: string | null;
  contactEmailSent?: boolean;
  ownerContact?: OwnerContactResponse | null;
  reusedExisting?: boolean;
  deliveredAt?: string | null;
  emailDeliveredAt?: string | null;
  alreadyDelivered?: boolean;
  deliveryChannel?: EnquiryDeliveryChannel | null;
  appDeliveredAt?: string | null;
}

export interface OwnerContactResponse {
  ownerName?: string | null;
  mobileNumber?: string | null;
  alternateMobileNumber?: string | null;
  additionalMobileNumber?: string | null;
  email?: string | null;
  available: boolean;
}

export type EnquiryInboxMode = 'MINE' | 'RECEIVED';

export interface EnquiryInboxListing {
  spaceId: string;
  name: string;
  spaceType?: SpaceType | null;
}

export interface EnquiryInboxResponse {
  mode: EnquiryInboxMode;
  listings: EnquiryInboxListing[];
}

export interface ReceivedEnquiry {
  enquiryId: string;
  spaceId: string;
  spaceName: string;
  spaceType?: SpaceType | null;
  locationLabel?: string | null;
  requesterName?: string | null;
  requesterEmail?: string | null;
  requesterMobile?: string | null;
  status: SpaceEnquiryStatus;
  requestedAt: string;
  expiresAt?: string | null;
}

export type EnquiryDeliveryChannel = 'APP' | 'EMAIL' | 'VIEW_HERE';

export interface CreateSpaceEnquiryRequest {
  email?: string;
  deliveryChannel?: EnquiryDeliveryChannel;
}

export interface UserNotification {
  notificationId: string;
  spaceId: string;
  enquiryId?: string | null;
  notificationType: string;
  title: string;
  message?: string | null;
  actionLabel?: string | null;
  actionRoute?: string | null;
  read: boolean;
  createdAt: string;
}

export interface UserNotificationListResponse {
  notifications: UserNotification[];
  unreadCount: number;
  page?: number;
  size?: number;
  totalElements?: number;
  totalPages?: number;
}

export interface AdminSpaceEnquiryListItem {
  enquiryId: string;
  spaceId: string;
  spaceName: string;
  spaceType?: SpaceType | null;
  spaceAddress?: string | null;
  locationLabel?: string | null;
  requesterUserId: string;
  requesterName: string;
  requesterEmail?: string | null;
  requesterMobile?: string | null;
  requesterType: EnquiryRequesterType;
  status: SpaceEnquiryStatus;
  requestedAt: string;
  expiresAt: string;
  sharedAt?: string | null;
  /** True when the listing was converted from a test property/mess lead. */
  testLead?: boolean;
}

export interface AdminSpaceEnquiryDetail extends AdminSpaceEnquiryListItem {
  capacityLabel?: string | null;
  requesterEmail: string;
  reviewedAt?: string | null;
  sharedByAdminId?: string | null;
  automaticallyShared?: boolean;
  rejectedAt?: string | null;
  rejectionReason?: string | null;
  ownerContact: OwnerContactResponse;
  clientChannel?: 'WEB' | 'ANDROID' | null;
}

export interface AdminEnquirySummary {
  totalEnquiries: number;
  pendingCount: number;
  sharedCount: number;
  expiredCount: number;
  rejectedCount: number;
  cancelledCount: number;
}

export type AdminEnquiryListResponse = PagedResponse<AdminSpaceEnquiryListItem>;
export type MyEnquiryListResponse = PagedResponse<SpaceEnquiryResponse>;
