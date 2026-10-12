import { useQuery, type QueryClient } from '@tanstack/react-query';
import { enquiryApi } from '@/shared/api/enquiryApi';
import { useAuthStore } from '@/store/authStore';

export const INQUIRED_LISTING_IDS_KEY = ['inquired-listing-ids'] as const;

export type InquirySentVia = 'EMAIL' | 'APP' | 'BOTH';

export type InquiryRecord = {
  sentVia: InquirySentVia | null;
  sentToEmail: string | null;
  sentAt: string | null;
  contactViewed: boolean;
};

type InquiredListingState = {
  ids: Set<string>;
  records: Map<string, InquiryRecord>;
};

function inquiredQueryOptions(enabled: boolean) {
  return {
    queryKey: INQUIRED_LISTING_IDS_KEY,
    queryFn: async (): Promise<InquiredListingState> => {
      const rows = await enquiryApi.listInquiredListingIds();
      const ids = new Set<string>();
      const records = new Map<string, InquiryRecord>();
      for (const row of rows) {
        records.set(row.id, {
          sentVia: row.sentVia,
          sentToEmail: row.sentToEmail,
          sentAt: row.sentAt,
          contactViewed: row.contactViewed,
        });
        if (row.sentVia) {
          ids.add(row.id);
        }
      }
      return { ids, records };
    },
    enabled,
    staleTime: 0,
    refetchOnMount: 'always' as const,
  };
}

export function useAlreadyInquired(spaceId?: string | null): boolean {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const query = useQuery(inquiredQueryOptions(isAuthenticated));
  return Boolean(spaceId && query.data?.ids.has(spaceId));
}

export function useInquiryRecord(spaceId?: string | null): InquiryRecord | null {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const query = useQuery(inquiredQueryOptions(isAuthenticated));
  if (!spaceId) return null;
  return query.data?.records.get(spaceId) ?? null;
}

export function useInquirySentVia(spaceId?: string | null): InquirySentVia | null {
  return useInquiryRecord(spaceId)?.sentVia ?? null;
}

export function useContactViewed(spaceId?: string | null): boolean {
  return useInquiryRecord(spaceId)?.contactViewed === true;
}

export function inquirySentViaFromEnquiry(enquiry: {
  clientChannel?: string | null;
  contactDelivery?: string | null;
  contactEmailSent?: boolean;
  deliveryChannel?: string | null;
  appDeliveredAt?: string | null;
  emailDeliveredAt?: string | null;
} | null | undefined): InquirySentVia {
  const email = enquiry?.clientChannel !== 'ANDROID'
    || Boolean(enquiry?.contactEmailSent)
    || enquiry?.contactDelivery === 'EMAIL'
    || enquiry?.deliveryChannel === 'EMAIL'
    || Boolean(enquiry?.emailDeliveredAt);
  const app = enquiry?.clientChannel === 'ANDROID'
    || enquiry?.contactDelivery === 'IN_APP'
    || enquiry?.deliveryChannel === 'APP'
    || Boolean(enquiry?.appDeliveredAt);
  if (email && app) return 'BOTH';
  if (app) return 'APP';
  return 'EMAIL';
}

export function markInquiredListing(
  queryClient: QueryClient,
  spaceId: string,
  sentVia: InquirySentVia = 'EMAIL',
  details?: { sentToEmail?: string | null; sentAt?: string | null },
): void {
  const id = spaceId.trim();
  if (!id) return;
  queryClient.setQueryData<InquiredListingState>(INQUIRED_LISTING_IDS_KEY, (current) => {
    const ids = new Set(current?.ids);
    const records = new Map(current?.records);
    const previous = records.get(id);
    if (sentVia) {
      ids.add(id);
    }
    records.set(id, {
      sentVia: sentVia ?? previous?.sentVia ?? null,
      sentToEmail: details?.sentToEmail ?? previous?.sentToEmail ?? null,
      sentAt: details?.sentAt ?? previous?.sentAt ?? null,
      contactViewed: previous?.contactViewed ?? false,
    });
    return { ids, records };
  });
}

export function markContactViewed(
  queryClient: QueryClient,
  spaceId: string,
  sentAt?: string | null,
): void {
  const id = spaceId.trim();
  if (!id) return;
  queryClient.setQueryData<InquiredListingState>(INQUIRED_LISTING_IDS_KEY, (current) => {
    const records = new Map(current?.records);
    const previous = records.get(id);
    records.set(id, {
      sentVia: previous?.sentVia ?? null,
      sentToEmail: previous?.sentToEmail ?? null,
      sentAt: sentAt ?? previous?.sentAt ?? null,
      contactViewed: true,
    });
    return { ids: new Set(current?.ids), records };
  });
}
