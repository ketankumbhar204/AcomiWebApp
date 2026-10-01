import { useQuery, type QueryClient } from '@tanstack/react-query';
import { enquiryApi } from '@/shared/api/enquiryApi';
import { useAuthStore } from '@/store/authStore';

export const INQUIRED_LISTING_IDS_KEY = ['inquired-listing-ids'] as const;

export type InquirySentVia = 'EMAIL' | 'APP' | 'BOTH';

type InquiredListingState = {
  ids: Set<string>;
  sentVia: Map<string, InquirySentVia>;
};

function inquiredQueryOptions(enabled: boolean) {
  return {
    queryKey: INQUIRED_LISTING_IDS_KEY,
    queryFn: async (): Promise<InquiredListingState> => {
      const rows = await enquiryApi.listInquiredListingIds();
      const ids = new Set<string>();
      const sentVia = new Map<string, InquirySentVia>();
      for (const row of rows) {
        ids.add(row.id);
        if (row.sentVia) sentVia.set(row.id, row.sentVia);
      }
      return { ids, sentVia };
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

export function useInquirySentVia(spaceId?: string | null): InquirySentVia | null {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const query = useQuery(inquiredQueryOptions(isAuthenticated));
  if (!spaceId) return null;
  return query.data?.sentVia.get(spaceId) ?? null;
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
): void {
  const id = spaceId.trim();
  if (!id) return;
  queryClient.setQueryData<InquiredListingState>(INQUIRED_LISTING_IDS_KEY, (current) => {
    const ids = new Set(current?.ids);
    const nextVia = new Map(current?.sentVia);
    ids.add(id);
    nextVia.set(id, sentVia);
    return { ids, sentVia: nextVia };
  });
}
