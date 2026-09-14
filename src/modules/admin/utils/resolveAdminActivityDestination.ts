import type { AdminActivityItem, AdminActivityType } from '@/shared/types/admin';
import {
  adminEnquiryDetailPath,
  adminMessDetailPath,
  adminMessPath,
  adminPropertyDetailPath,
  adminPropertiesPath,
  adminRegisteredUserDetailPath,
  adminSavedAddressesPath,
} from '@/routes/paths';

/**
 * Central mapping from Admin activity → existing Admin route.
 */
export function resolveAdminActivityDestination(activity: AdminActivityItem): string {
  switch (activity.type) {
    case 'NEW_ENQUIRY':
    case 'ENQUIRY_SHARED':
    case 'ENQUIRY_REJECTED':
      return adminEnquiryDetailPath(activity.targetId);
    case 'NEW_PROPERTY_REGISTRATION':
    case 'LEAD_CLAIMED_PROPERTY':
      return adminPropertyDetailPath(activity.targetId);
    case 'NEW_MESS_REGISTRATION':
    case 'LEAD_CLAIMED_MESS':
      return adminMessDetailPath(activity.targetId);
    case 'NEW_USER_REGISTRATION':
      return adminRegisteredUserDetailPath(activity.targetId);
    case 'NEW_PROPERTY_LISTED':
      if (activity.targetType === 'PROPERTY_REGISTRATION') {
        return adminPropertyDetailPath(activity.targetId);
      }
      return adminPropertiesPath({ tab: 'active' });
    case 'NEW_MESS_LISTED':
      if (activity.targetType === 'MESS_REGISTRATION') {
        return adminMessDetailPath(activity.targetId);
      }
      return adminMessPath({ tab: 'active' });
    case 'ADDRESS_SAVED':
      return adminSavedAddressesPath({ highlight: activity.targetId });
  }
}

export function isAdminActivityType(value: string | null | undefined): value is AdminActivityType {
  if (!value) return false;
  return (
    value === 'NEW_ENQUIRY' ||
    value === 'NEW_PROPERTY_REGISTRATION' ||
    value === 'NEW_MESS_REGISTRATION' ||
    value === 'NEW_USER_REGISTRATION' ||
    value === 'NEW_PROPERTY_LISTED' ||
    value === 'NEW_MESS_LISTED' ||
    value === 'LEAD_CLAIMED_PROPERTY' ||
    value === 'LEAD_CLAIMED_MESS' ||
    value === 'ENQUIRY_SHARED' ||
    value === 'ENQUIRY_REJECTED' ||
    value === 'ADDRESS_SAVED'
  );
}
