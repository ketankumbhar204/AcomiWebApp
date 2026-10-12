import {
  Box,
  Button,
  Chip,
  CircularProgress,
  MenuItem,
  Stack,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { Building2, ChevronRight, Mail, Phone, UserRound } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { spaceTypeLabelKey } from '@/modules/onboarding/components/createSpace/createSpaceVisuals';
import { DASHBOARD_UX, dashSurfaces } from '@/modules/dashboard/theme/dashboardUx';
import { spaceDetailsPath } from '@/routes/paths';
import { enquiryApi } from '@/shared/api/enquiryApi';
import { AppDrawer } from '@/shared/components/AppDrawer';
import { EmptyState } from '@/shared/components/EmptyState';
import { PageContainer } from '@/shared/components/PageContainer';
import { PageHeader } from '@/shared/components/PageHeader';
import { colors } from '@/shared/theme/colors';
import { dashContainedButtonSx, dashOutlinedButtonSx } from '@/shared/theme/dashButtonSx';
import type { EnquiryInboxListing, ReceivedEnquiry, SpaceEnquiryStatus } from '@/shared/types/enquiry';

const STATUSES: SpaceEnquiryStatus[] = ['PENDING', 'SHARED', 'REJECTED', 'EXPIRED', 'CANCELLED'];

type ReceivedEnquiriesPageProps = {
  listings: EnquiryInboxListing[];
  highlightId?: string | null;
};

function statusTone(status: string): { bg: string; fg: string } {
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
    return iso;
  }
}

export function ReceivedEnquiriesPage({ listings, highlightId }: ReceivedEnquiriesPageProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const theme = useTheme();
  const isLgDown = useMediaQuery(theme.breakpoints.down('lg'));
  const s = dashSurfaces(theme.palette.mode);
  const [spaceId, setSpaceId] = useState('');
  const [status, setStatus] = useState<SpaceEnquiryStatus | ''>('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(highlightId ?? null);

  const query = useQuery({
    queryKey: ['received-enquiries', spaceId, status, from, to],
    queryFn: () =>
      enquiryApi.listReceived({
        spaceId: spaceId || undefined,
        status: status || undefined,
        from: from || undefined,
        to: to || undefined,
        size: 50,
      }),
  });

  const rows = useMemo(() => query.data?.content ?? [], [query.data?.content]);
  const selected = rows.find((row) => row.enquiryId === selectedId) ?? null;

  useEffect(() => {
    document.title = `${t('spaces.enquiries.receivedTitle', { defaultValue: 'Enquiries received' })} · ${t('common.appName')}`;
  }, [t]);

  useEffect(() => {
    if (highlightId) setSelectedId(highlightId);
  }, [highlightId]);

  useEffect(() => {
    if (!selectedId && !isLgDown && rows.length > 0) {
      setSelectedId(rows[0]!.enquiryId);
    }
  }, [isLgDown, rows, selectedId]);

  useEffect(() => {
    if (!selectedId) return;
    let cancelled = false;
    void enquiryApi.listNotifications({ size: 50 }).then(async (page) => {
      if (cancelled) return;
      const unread = (page.notifications ?? []).filter(
        (item) => !item.read && item.enquiryId === selectedId,
      );
      await Promise.all(unread.map((item) => enquiryApi.markNotificationRead(item.notificationId).catch(() => null)));
    });
    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  const detail = selected ? (
    <ReceivedDetail
      enquiry={selected}
      onOpenListing={() => navigate(spaceDetailsPath(selected.spaceId))}
    />
  ) : (
    <Box sx={{ p: 3 }}>
      <Typography color="text.secondary" sx={{ textAlign: 'center', fontSize: 14 }}>
        {t('spaces.enquiries.receivedSelectHint', {
          defaultValue: 'Select an enquiry to see the member and listing.',
        })}
      </Typography>
    </Box>
  );

  return (
    <PageContainer gap={0}>
      <Stack spacing={`${DASHBOARD_UX.sectionGap}px`} sx={{ width: '100%' }}>
        <PageHeader
          title={t('spaces.enquiries.receivedTitle', { defaultValue: 'Enquiries received' })}
          description={t('spaces.enquiries.receivedSubtitle', {
            defaultValue: 'Enquiries members sent for listings you own or manage.',
          })}
        />
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1}>
          <TextField
            select
            size="small"
            label={t('spaces.enquiries.filterListing', { defaultValue: 'Listing' })}
            value={spaceId}
            onChange={(event) => setSpaceId(event.target.value)}
            sx={{ minWidth: 200, flex: 1 }}
          >
            <MenuItem value="">{t('spaces.enquiries.filterAllListings', { defaultValue: 'All listings' })}</MenuItem>
            {listings.map((listing) => (
              <MenuItem key={listing.spaceId} value={listing.spaceId}>
                {listing.name}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            size="small"
            label={t('spaces.enquiries.filterStatus', { defaultValue: 'Status' })}
            value={status}
            onChange={(event) => setStatus(event.target.value as SpaceEnquiryStatus | '')}
            sx={{ minWidth: 160 }}
          >
            <MenuItem value="">{t('spaces.enquiries.filterAllStatuses', { defaultValue: 'All statuses' })}</MenuItem>
            {STATUSES.map((item) => (
              <MenuItem key={item} value={item}>
                {t(`spaces.enquiries.status.${item}`, { defaultValue: item })}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            size="small"
            type="date"
            label={t('spaces.enquiries.filterFrom', { defaultValue: 'From' })}
            value={from}
            onChange={(event) => setFrom(event.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <TextField
            size="small"
            type="date"
            label={t('spaces.enquiries.filterTo', { defaultValue: 'To' })}
            value={to}
            onChange={(event) => setTo(event.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
          />
        </Stack>

        {query.isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : query.isError ? (
          <EmptyState
            title={t('spaces.enquiries.receivedErrorTitle', { defaultValue: 'Could not load enquiries' })}
            description={t('spaces.enquiries.receivedError', {
              defaultValue: 'You can only see enquiries for listings you own or manage.',
            })}
            action={
              <Button onClick={() => void query.refetch()} sx={dashOutlinedButtonSx}>
                {t('common.retry', { defaultValue: 'Try again' })}
              </Button>
            }
          />
        ) : rows.length === 0 ? (
          <EmptyState
            icon={<Building2 />}
            title={t('spaces.enquiries.receivedEmptyTitle', { defaultValue: 'No enquiries received' })}
            description={t('spaces.enquiries.receivedEmpty', {
              defaultValue: 'When a member enquires about one of your listings, it will show up here.',
            })}
          />
        ) : (
          <Box
            sx={{
              display: 'grid',
              gap: `${DASHBOARD_UX.cardGap}px`,
              gridTemplateColumns: isLgDown ? '1fr' : 'minmax(0, 1.85fr) minmax(0, 0.95fr)',
              alignItems: 'start',
            }}
          >
            <Stack spacing={1.25} sx={{ minWidth: 0 }}>
              {rows.map((row) => {
                const tone = statusTone(row.status);
                const selectedRow = selectedId === row.enquiryId;
                const member = row.requesterName?.trim() || t('spaces.enquiries.member', { defaultValue: 'Member' });
                return (
                  <Box
                    key={row.enquiryId}
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelectedId(row.enquiryId)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        setSelectedId(row.enquiryId);
                      }
                    }}
                    sx={{
                      p: 2,
                      borderRadius: `${DASHBOARD_UX.radius}px`,
                      border: `1px solid ${selectedRow ? colors.primary : s.border}`,
                      bgcolor: row.status === 'EXPIRED' ? s.surface : selectedRow ? colors.mintSubtle : s.surface,
                      opacity: row.status === 'EXPIRED' ? 0.85 : 1,
                      cursor: 'pointer',
                      '&:hover': { borderColor: colors.primary },
                    }}
                  >
                    <Stack direction="row" spacing={1.5} sx={{ alignItems: 'flex-start' }}>
                      <Box
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: '12px',
                          bgcolor: colors.mintSubtle,
                          color: colors.primary,
                          display: 'grid',
                          placeItems: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <UserRound size={18} />
                      </Box>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography sx={{ fontWeight: 800 }} noWrap>
                          {member}
                        </Typography>
                        <Typography variant="body2" sx={{ mt: 0.25 }} noWrap>
                          {row.spaceName}
                        </Typography>
                        {row.locationLabel ? (
                          <Typography variant="body2" color="text.secondary" noWrap sx={{ mt: 0.25 }}>
                            {row.locationLabel}
                          </Typography>
                        ) : null}
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                          {t('spaces.enquiries.requestedDot', {
                            date: formatRequestedDate(row.requestedAt),
                            defaultValue: 'Requested · {{date}}',
                          })}
                        </Typography>
                        <Chip
                          size="small"
                          label={t(`spaces.enquiries.status.${row.status}`, { defaultValue: row.status })}
                          sx={{ mt: 1, bgcolor: tone.bg, color: tone.fg, fontWeight: 700 }}
                        />
                        <Stack
                          direction="row"
                          spacing={0.5}
                          sx={{ mt: 1.25, alignItems: 'center', color: colors.primary, fontWeight: 700, fontSize: 13 }}
                        >
                          <span>{t('spaces.enquiries.viewMember', { defaultValue: 'View member' })}</span>
                          <ChevronRight size={16} />
                        </Stack>
                      </Box>
                    </Stack>
                  </Box>
                );
              })}
            </Stack>
            {!isLgDown ? (
              <Box
                sx={{
                  position: 'sticky',
                  top: 12,
                  alignSelf: 'start',
                  borderRadius: `${DASHBOARD_UX.radius}px`,
                  border: `1px solid ${s.border}`,
                  bgcolor: s.surface,
                  minHeight: 280,
                }}
              >
                {detail}
              </Box>
            ) : null}
          </Box>
        )}
      </Stack>
      <AppDrawer open={Boolean(selectedId) && isLgDown} onClose={() => setSelectedId(null)} width={400}>
        {detail}
      </AppDrawer>
    </PageContainer>
  );
}

function ReceivedDetail({
  enquiry,
  onOpenListing,
}: {
  enquiry: ReceivedEnquiry;
  onOpenListing: () => void;
}) {
  const { t } = useTranslation();
  const tone = statusTone(enquiry.status);
  const member = enquiry.requesterName?.trim() || t('spaces.enquiries.member', { defaultValue: 'Member' });
  const typeLabel = enquiry.spaceType
    ? t(spaceTypeLabelKey(enquiry.spaceType), { defaultValue: enquiry.spaceType === 'MESS' ? 'Mess' : enquiry.spaceType })
    : null;

  return (
    <Box sx={{ p: 2.5 }}>
      <Typography sx={{ fontWeight: 800, fontSize: 18 }}>{member}</Typography>
      <Typography sx={{ mt: 0.5, fontWeight: 700 }}>{enquiry.spaceName}</Typography>
      {typeLabel ? (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
          {typeLabel}
        </Typography>
      ) : null}
      {enquiry.locationLabel ? (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
          {enquiry.locationLabel}
        </Typography>
      ) : null}
      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
        {t('spaces.enquiries.requestedDot', {
          date: formatRequestedDate(enquiry.requestedAt),
          defaultValue: 'Requested · {{date}}',
        })}
      </Typography>
      <Chip
        size="small"
        label={t(`spaces.enquiries.status.${enquiry.status}`, { defaultValue: enquiry.status })}
        sx={{ mt: 1.25, bgcolor: tone.bg, color: tone.fg, fontWeight: 700 }}
      />
      <Stack spacing={1} sx={{ mt: 2 }}>
        {enquiry.requesterMobile ? (
          <Button href={`tel:${enquiry.requesterMobile}`} startIcon={<Phone size={16} />} sx={dashContainedButtonSx}>
            {t('spaces.enquiries.callMember', { defaultValue: 'Call member' })}
          </Button>
        ) : null}
        {enquiry.requesterEmail ? (
          <Button href={`mailto:${enquiry.requesterEmail}`} startIcon={<Mail size={16} />} sx={dashOutlinedButtonSx}>
            {t('spaces.enquiries.emailMember', { defaultValue: 'Email member' })}
          </Button>
        ) : null}
        {!enquiry.requesterMobile && !enquiry.requesterEmail ? (
          <Typography color="text.secondary" sx={{ fontSize: 13 }}>
            {t('spaces.enquiries.memberContactUnavailable', { defaultValue: 'Member contact is not available.' })}
          </Typography>
        ) : null}
        <Button onClick={onOpenListing} startIcon={<Building2 size={16} />} sx={dashOutlinedButtonSx}>
          {t('spaces.enquiries.openListing', { defaultValue: 'Open listing' })}
        </Button>
      </Stack>
    </Box>
  );
}
