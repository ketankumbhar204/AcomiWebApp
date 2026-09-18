import type { SpaceEnquiryResponse } from '@/shared/types/enquiry';

/** True when owner contact was delivered by email (authoritative API fields). */
export function contactWasEmailed(enquiry: SpaceEnquiryResponse | null | undefined): boolean {
  if (!enquiry || enquiry.status !== 'SHARED') {
    return false;
  }
  if (typeof enquiry.contactEmailSent === 'boolean') {
    return enquiry.contactEmailSent;
  }
  if (enquiry.contactDelivery === 'EMAIL') {
    return true;
  }
  if (enquiry.contactDelivery === 'IN_APP') {
    return false;
  }
  if (enquiry.clientChannel === 'ANDROID') {
    return false;
  }
  // Legacy SHARED rows without channel fields were email-delivered.
  return true;
}
