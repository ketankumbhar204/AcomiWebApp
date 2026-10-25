import {
  Box,
  Button,
  Chip,
  CircularProgress,
  IconButton,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { useQueries, useQuery } from '@tanstack/react-query';
import { MessageCircle, RefreshCw } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { DiscoverSpaceCard } from '@/modules/onboarding/components/DiscoverSpaceCard';
import { DiscoverSpaceDetailDrawer } from '@/modules/onboarding/components/DiscoverSpaceDetailDrawer';
import { DASHBOARD_UX, dashSurfaces } from '@/modules/dashboard/theme/dashboardUx';
import { ROUTES } from '@/routes/paths';
import { ReferenceCode } from '@/shared/components/ReferenceCode';
import { enquiryApi } from '@/shared/api/enquiryApi';
import { spaceDiscoverApi } from '@/shared/api/spaceDiscoverApi';
import { EmptyState } from '@/shared/components/EmptyState';
import { PageContainer } from '@/shared/components/PageContainer';
import { PageHeader } from '@/shared/components/PageHeader';
import { colors } from '@/shared/theme/colors';
import { dashContainedButtonSx, dashOutlinedButtonSx } from '@/shared/theme/dashButtonSx';
import { ReceivedEnquiriesPage } from '@/modules/onboarding/pages/ReceivedEnquiriesPage';
import type { SpaceEnquiryResponse, SpaceEnquiryStatus } from '@/shared/types/enquiry';
import type { DiscoverSpaceCardResponse } from '@/shared/types/space';
import type { ListingSection } from '@/shared/utils/listingInfo';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function statusKey(status: SpaceEnquiryStatus): string {
  return `spaces.enquiries.status.${status}`;
}

function statusTone(status: SpaceEnquiryStatus): { bg: string; fg: string } {
  switch (status) {
    case 'SHARED':
      return { bg: colors.mintSubtle, fg: colors.tealDark };
    case 'PENDING':
      return { bg: '#FEF3C7', fg: '#B45309' };
    case 'EXPIRED':
    case 'CANCELLED':
      return { bg: '#F1F5F9', fg: colors.textSecondary };
    case 'REJECTED':
      return { bg: '#FEE2E2', fg: '#B91C1C' };
    default:
      return { bg: colors.surfaceSecondary, fg: colors.textSecondary };
  }
}

function formatRequestedDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch {
    return new Date(iso).toLocaleString();
  }
}

function cardFromEnquiry(row: SpaceEnquiryResponse): DiscoverSpaceCardResponse {
  return {
    spaceId: row.spaceId,
    name: row.spaceName,
    type: row.spaceType ?? 'PG',
    address: row.locationLabel,
    amenityLabels: row.amenityLabels ?? [],
    sharingNotes: row.sharingNotes,
    foodIncludedInRent: Boolean(row.foodIncludedInRent),
    alreadyMember: false,
  };
}

function MemberEnquiriesPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const theme = useTheme();
  const isLgDown = useMediaQuery(theme.breakpoints.down('lg'));
  const s = dashSurfaces(theme.palette.mode);
  const [params] = useSearchParams();
  const highlightId = UUID_RE.test(params.get('id') ?? '') ? params.get('id') : null;
  const [detailSpaceId, setDetailSpaceId] = useState<string | null>(null);
  const [focusSection, setFocusSection] = useState<ListingSection | null>(null);
  const [focusNonce, setFocusNonce] = useState(0);
  const openedInitialDetail = useRef(false);

  const query = useQuery({
    queryKey: ['my-enquiries'],
    queryFn: () => enquiryApi.listMine({ size: 50 }),
  });

  const rows = useMemo(() => {
    const list = [...(query.data?.content ?? [])].sort(
      (a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime(),
    );
    if (!highlightId) return list;
    return list.sort(
      (a, b) => Number(b.enquiryId === highlightId) - Number(a.enquiryId === highlightId),
    );
  }, [highlightId, query.data?.content]);

  const detailQueries = useQueries({
    queries: rows.map((row) => ({
      queryKey: ['spaces-discover-detail', row.spaceId],
      queryFn: () => spaceDiscoverApi.getDiscoverSpaceDetail(row.spaceId),
      staleTime: 60_000,
    })),
  });

  useEffect(() => {
    if (openedInitialDetail.current || isLgDown || rows.length === 0) return;
    openedInitialDetail.current = true;
    const highlighted = rows.find((row) => row.enquiryId === highlightId);
    setDetailSpaceId((highlighted ?? rows[0])!.spaceId);
  }, [highlightId, isLgDown, rows]);

  useEffect(() => {
    document.title = `${t('spaces.enquiries.title')} · ${t('common.appName')}`;
  }, [t]);

  return (
    <PageContainer gap={0}>
      <Stack spacing={`${DASHBOARD_UX.sectionGap}px`} sx={{ width: '100%' }}>
        <PageHeader
          title={t('spaces.enquiries.title')}
          description={t('spaces.enquiries.subtitle')}
          actions={
            <Stack direction="row" spacing={1}>
              <IconButton
                onClick={() => void query.refetch()}
                aria-label={t('common.refresh', { defaultValue: 'Refresh' })}
                size="small"
                sx={{
                  width: DASHBOARD_UX.buttonHeight,
                  height: DASHBOARD_UX.buttonHeight,
                  border: `1px solid ${s.border}`,
                  borderRadius: `${DASHBOARD_UX.buttonRadius}px`,
                  bgcolor: s.surface,
                }}
              >
                <RefreshCw size={14} />
              </IconButton>
              <Button
                onClick={() => navigate(ROUTES.findAPlace)}
                sx={{ ...dashContainedButtonSx, display: { xs: 'none', sm: 'inline-flex' } }}
              >
                {t('spaces.findPlace.ctaFindPlace')}
              </Button>
            </Stack>
          }
        />

        {query.isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : rows.length === 0 ? (
          <EmptyState
            icon={<MessageCircle />}
            title={t('spaces.enquiries.emptyTitle', { defaultValue: 'No enquiries yet' })}
            description={t('spaces.enquiries.empty')}
            action={
              <Button onClick={() => navigate(ROUTES.findAPlace)} sx={dashContainedButtonSx}>
                {t('spaces.findPlace.ctaFindPlace')}
              </Button>
            }
          />
        ) : (
          <Box
            sx={{
              display: 'grid',
              gap: 1.5,
              gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 19.25rem), 1fr))',
            }}
          >
            {rows.map((row, index) => {
              const detail = detailQueries[index]?.data;
              const space = detail ?? cardFromEnquiry(row);
              const tone = statusTone(row.status);
              return (
                <Stack key={row.enquiryId} id={`enquiry-${row.enquiryId}`} spacing={0.75}>
                  <Stack direction="row" spacing={1} sx={{ alignItems: 'center', minWidth: 0 }}>
                    <Chip
                      size="small"
                      label={t(statusKey(row.status))}
                      sx={{ bgcolor: tone.bg, color: tone.fg, fontWeight: 700 }}
                    />
                    <Typography variant="body2" color="text.secondary" noWrap>
                      {t('spaces.enquiries.requestedDot', {
                        date: formatRequestedDate(row.requestedAt),
                        defaultValue: 'Requested · {{date}}',
                      })}
                    </Typography>
                    <ReferenceCode value={row.referenceCode} />
                  </Stack>
                  <DiscoverSpaceCard
                    space={space}
                    onViewDetails={(spaceId, section) => {
                      setFocusSection(section ?? null);
                      setFocusNonce((value) => value + 1);
                      setDetailSpaceId(spaceId);
                    }}
                  />
                </Stack>
              );
            })}
          </Box>
        )}
      </Stack>

      <DiscoverSpaceDetailDrawer
        spaceId={detailSpaceId}
        open={Boolean(detailSpaceId)}
        focusSection={focusSection}
        focusNonce={focusNonce}
        onClose={() => {
          setDetailSpaceId(null);
          setFocusSection(null);
        }}
      />
    </PageContainer>
  );
}

export function MyEnquiriesPage() {
  const { t } = useTranslation();
  const [params] = useSearchParams();
  const inbox = useQuery({
    queryKey: ['enquiry-inbox'],
    queryFn: () => enquiryApi.inbox(),
  });

  if (inbox.isLoading) {
    return (
      <PageContainer>
        <Typography color="text.secondary">{t('common.loading', { defaultValue: 'Loading…' })}</Typography>
      </PageContainer>
    );
  }
  if (inbox.isError || !inbox.data) {
    return (
      <PageContainer>
        <Stack spacing={1}>
          <Typography color="text.secondary">
            {t('spaces.enquiries.receivedError', {
              defaultValue: 'Enquiries could not be loaded.',
            })}
          </Typography>
          <Button onClick={() => void inbox.refetch()} sx={dashOutlinedButtonSx}>
            {t('common.retry', { defaultValue: 'Try again' })}
          </Button>
        </Stack>
      </PageContainer>
    );
  }
  if (inbox.data.mode === 'RECEIVED') {
    const highlightId = params.get('id');
    return (
      <ReceivedEnquiriesPage
        listings={inbox.data.listings ?? []}
        highlightId={highlightId}
      />
    );
  }
  return <MemberEnquiriesPage />;
}
