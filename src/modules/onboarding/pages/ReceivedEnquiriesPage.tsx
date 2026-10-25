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
import { Building2, Clock, Mail, MapPin, MessageCircle, Phone, Search, UserRound } from 'lucide-react';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { displayPhone, mailtoHref, telHref } from '@/modules/serviceContacts/utils/serviceContactLinks';
import { spaceTypeLabelKey } from '@/modules/onboarding/components/createSpace/createSpaceVisuals';
import { RequesterNotificationBell } from '@/modules/onboarding/components/RequesterNotificationBell';
import { DASHBOARD_UX, dashSurfaces } from '@/modules/dashboard/theme/dashboardUx';
import { spaceDetailsPath } from '@/routes/paths';
import { enquiryApi } from '@/shared/api/enquiryApi';
import { AppDrawer } from '@/shared/components/AppDrawer';
import { EmptyState } from '@/shared/components/EmptyState';
import { PageContainer } from '@/shared/components/PageContainer';
import { PageHeader } from '@/shared/components/PageHeader';
import { colors } from '@/shared/theme/colors';
import { dashContainedButtonSx, dashOutlinedButtonSx } from '@/shared/theme/dashButtonSx';
import type { EnquiryInboxListing, ReceivedEnquiry, ReceivedEnquirySummary, SpaceEnquiryStatus } from '@/shared/types/enquiry';

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
  const [search, setSearch] = useState('');
  const [queryText, setQueryText] = useState('');
  const [pageSize, setPageSize] = useState(20);
  const [selectedId, setSelectedId] = useState<string | null>(highlightId ?? null);

  useEffect(() => {
    const timer = window.setTimeout(() => setQueryText(search.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setPageSize(20);
  }, [spaceId, status, from, to, queryText]);

  const query = useQuery({
    queryKey: ['received-enquiries', spaceId, status, from, to, queryText, pageSize],
    queryFn: () =>
      enquiryApi.listReceived({
        spaceId: spaceId || undefined,
        status: status || undefined,
        from: from || undefined,
        to: to || undefined,
        q: queryText || undefined,
        size: pageSize,
      }),
  });

  const summary = useQuery({
    queryKey: ['received-enquiries-summary', spaceId],
    queryFn: () => enquiryApi.receivedSummary(spaceId || undefined),
  });

  const rows = useMemo(() => query.data?.content ?? [], [query.data?.content]);
  const filtersActive = Boolean(spaceId || status || from || to || queryText);
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
            defaultValue: 'Manage enquiries for your properties and mess services',
          })}
          actions={<RequesterNotificationBell />}
        />
        <SummaryRow
          summary={summary.data}
          status={status}
          onStatus={setStatus}
        />
        <TextField
          size="small"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={t('spaces.enquiries.searchPlaceholder', {
            defaultValue: 'Search by name, property, or email...',
          })}
          slotProps={{
            input: {
              startAdornment: <Search size={16} style={{ marginRight: 8 }} />,
            },
          }}
          sx={{ maxWidth: 560 }}
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
                <Box sx={{ minWidth: 0 }}>
                  <Typography noWrap sx={{ fontWeight: 700 }}>{listing.name}</Typography>
                  <Typography variant="caption" color="text.secondary" noWrap>
                    {[listing.spaceType, listing.locationLabel].filter(Boolean).join(' · ')}
                  </Typography>
                </Box>
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
            <MenuItem value="">{t('spaces.enquiries.filterAll', { defaultValue: 'All enquiries' })}</MenuItem>
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
          {filtersActive ? (
            <Button
              onClick={() => {
                setSpaceId('');
                setStatus('');
                setFrom('');
                setTo('');
                setSearch('');
                setQueryText('');
              }}
              sx={dashOutlinedButtonSx}
            >
              {t('spaces.enquiries.clearFilters', { defaultValue: 'Clear filters' })}
            </Button>
          ) : null}
        </Stack>
        {!query.isLoading && !query.isError ? (
          <Typography variant="body2" color="text.secondary">
            {t('spaces.enquiries.resultCount', {
              count: query.data?.totalElements ?? rows.length,
              defaultValue: '{{count}} enquiries',
            })}
          </Typography>
        ) : null}

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
            title={filtersActive
              ? t('spaces.enquiries.noMatchesTitle', { defaultValue: 'No matching enquiries' })
              : t('spaces.enquiries.receivedEmptyTitle', { defaultValue: 'No enquiries received' })}
            description={filtersActive
              ? t('spaces.enquiries.noMatches', { defaultValue: 'Try another listing, status, or search.' })
              : t('spaces.enquiries.receivedEmpty', {
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
                const initials = member.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part.charAt(0).toUpperCase()).join('');
                const context = (row.spaceType === 'MESS' ? row.foodIncludedLabel : row.sharingNotes)?.trim();
                const typeLabel = row.spaceType
                  ? t(spaceTypeLabelKey(row.spaceType), { defaultValue: row.spaceType === 'MESS' ? 'Mess' : row.spaceType })
                  : null;
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
                          borderRadius: '20px',
                          bgcolor: colors.mintSubtle,
                          color: colors.tealDark,
                          display: 'grid',
                          placeItems: 'center',
                          flexShrink: 0,
                          fontWeight: 800,
                          fontSize: 13,
                        }}
                      >
                        {initials || <UserRound size={16} />}
                      </Box>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                          <Typography sx={{ fontWeight: 800, flex: 1 }} noWrap>
                            {member}
                          </Typography>
                          <Chip
                            size="small"
                            label={t(`spaces.enquiries.status.${row.status}`, { defaultValue: row.status })}
                            sx={{ bgcolor: tone.bg, color: tone.fg, fontWeight: 700 }}
                          />
                          <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
                            {formatRequestedDate(row.requestedAt)}
                          </Typography>
                        </Stack>
                        {context ? (
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }} noWrap>
                            {context}
                          </Typography>
                        ) : null}
                        <SenderSummary enquiry={row} />
                        <Stack direction="row" spacing={1} sx={{ mt: 1.25, alignItems: 'center' }}>
                          <Box sx={{ minWidth: 0, flex: 1 }}>
                            <Typography sx={{ fontWeight: 700 }} noWrap>{row.spaceName}</Typography>
                            {row.locationLabel ? (
                              <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center', color: 'text.secondary' }}>
                                <MapPin size={12} />
                                <Typography variant="caption" noWrap>{row.locationLabel}</Typography>
                              </Stack>
                            ) : null}
                            {row.listingAvailable === false ? (
                              <Typography variant="caption" color="text.secondary">
                                {t('spaces.enquiries.listingUnavailable', { defaultValue: 'This listing is no longer available.' })}
                              </Typography>
                            ) : null}
                            {typeLabel ? (
                              <Chip size="small" label={typeLabel} sx={{ mt: 0.5, bgcolor: colors.mintSubtle, fontWeight: 700 }} />
                            ) : null}
                          </Box>
                          <Typography sx={{ color: colors.tealDark, fontWeight: 800, fontSize: 13, whiteSpace: 'nowrap' }}>
                            {t('spaces.enquiries.viewEnquiry', { defaultValue: 'View enquiry' })}
                          </Typography>
                        </Stack>
                      </Box>
                    </Stack>
                  </Box>
                );
              })}
              {query.data && !query.data.last ? (
                <Button onClick={() => setPageSize((size) => size + 20)} sx={dashOutlinedButtonSx}>
                  {t('spaces.enquiries.loadMore', { defaultValue: 'Load more' })}
                </Button>
              ) : null}
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
                  maxHeight: 'calc(100vh - 120px)',
                  overflow: 'auto',
                }}
              >
                {detail}
              </Box>
            ) : null}
          </Box>
        )}
      </Stack>
      <AppDrawer open={Boolean(selectedId) && isLgDown} onClose={() => setSelectedId(null)} width={400}>
        <Box sx={{ height: '100%', overflow: 'auto' }}>{detail}</Box>
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
      <SenderDetails enquiry={enquiry} />
      <Typography sx={{ mt: 1.5, fontWeight: 700 }}>{enquiry.spaceName}</Typography>
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
      {(enquiry.spaceType === 'MESS' ? enquiry.foodIncludedLabel : enquiry.sharingNotes)?.trim() ? (
        <Typography variant="body2" sx={{ mt: 1 }}>
          {(enquiry.spaceType === 'MESS' ? enquiry.foodIncludedLabel : enquiry.sharingNotes)?.trim()}
        </Typography>
      ) : null}
      {enquiry.listingAvailable === false ? (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          {t('spaces.enquiries.listingUnavailable', { defaultValue: 'This listing is no longer available.' })}
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
        <Button onClick={onOpenListing} startIcon={<Building2 size={16} />} sx={dashOutlinedButtonSx}>
          {t('spaces.enquiries.openListing', { defaultValue: 'Open listing' })}
        </Button>
      </Stack>
    </Box>
  );
}

function SenderSummary({ enquiry }: { enquiry: ReceivedEnquiry }) {
  const phone = displayPhone(enquiry.requesterMobile) || enquiry.requesterMobile?.trim();
  const email = enquiry.requesterEmail?.trim();
  const line = [phone, email].filter(Boolean).join(' · ');
  if (!line) return null;
  return (
    <Typography variant="body2" sx={{ mt: 0.5, fontWeight: 600 }} noWrap>
      {line}
    </Typography>
  );
}

function SenderDetails({ enquiry }: { enquiry: ReceivedEnquiry }) {
  const { t } = useTranslation();
  const unavailable = t('spaces.enquiries.senderUnavailable', { defaultValue: 'Not available' });
  const name = enquiry.requesterName?.trim();
  const mobile = displayPhone(enquiry.requesterMobile) || enquiry.requesterMobile?.trim() || '';
  const email = enquiry.requesterEmail?.trim() || '';
  const tel = telHref(enquiry.requesterMobile);
  const mail = mailtoHref(email);
  const sms = tel ? tel.replace(/^tel:/, 'sms:') : null;
  const account = enquiry.requesterType
    ? t(`spaces.enquiries.requesterType.${enquiry.requesterType}`, {
        defaultValue: enquiry.requesterType === 'OWNER' ? 'Lists a property' : 'Member',
      })
    : '';

  return (
    <Box sx={{ mt: 2, p: 1.5, borderRadius: '16px', bgcolor: colors.mintSubtle }}>
      <Typography sx={{ mb: 1, fontSize: 12, fontWeight: 800, color: colors.tealDark }}>
        {t('spaces.enquiries.senderDetails', { defaultValue: 'Sender details' })}
      </Typography>
      <Stack spacing={1.25}>
        <SenderRow
          icon={<UserRound size={16} />}
          label={t('spaces.enquiries.ownerName', { defaultValue: 'Name' })}
          value={name || unavailable}
        />
        <SenderRow
          icon={<Phone size={16} />}
          label={t('spaces.enquiries.mobile', { defaultValue: 'Mobile' })}
          value={mobile || unavailable}
        />
        <SenderRow
          icon={<Mail size={16} />}
          label={t('spaces.enquiries.ownerEmail', { defaultValue: 'Email' })}
          value={email || unavailable}
        />
        {account ? (
          <SenderRow
            icon={<UserRound size={16} />}
            label={t('spaces.enquiries.senderAccount', { defaultValue: 'Account' })}
            value={account}
          />
        ) : null}
      </Stack>
      {tel || mail ? (
        <Stack direction="row" spacing={0.75} useFlexGap sx={{ mt: 1.5, flexWrap: 'wrap' }}>
          {tel ? (
            <Button href={tel} size="small" sx={dashContainedButtonSx}>
              {t('spaces.enquiries.callOwner', { defaultValue: 'Call' })}
            </Button>
          ) : null}
          {sms ? (
            <Button href={sms} size="small" sx={dashOutlinedButtonSx}>
              {t('spaces.enquiries.messageOwner', { defaultValue: 'Message' })}
            </Button>
          ) : null}
          {mail ? (
            <Button href={mail} size="small" sx={dashOutlinedButtonSx}>
              {t('spaces.enquiries.emailOwner', { defaultValue: 'Email' })}
            </Button>
          ) : null}
        </Stack>
      ) : null}
    </Box>
  );
}

function SenderRow({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
      <Box
        sx={{
          width: 32,
          height: 32,
          borderRadius: '16px',
          bgcolor: '#fff',
          color: colors.tealDark,
          display: 'grid',
          placeItems: 'center',
          flexShrink: 0,
        }}
      >
        {icon}
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
          {label}
        </Typography>
        <Typography sx={{ fontWeight: 700, wordBreak: 'break-word' }}>{value}</Typography>
      </Box>
    </Stack>
  );
}

function SummaryRow({
  summary,
  status,
  onStatus,
}: {
  summary?: ReceivedEnquirySummary;
  status: SpaceEnquiryStatus | '';
  onStatus: (status: SpaceEnquiryStatus | '') => void;
}) {
  const { t } = useTranslation();
  const cards: Array<{
    key: string;
    label: string;
    value: number;
    selected: boolean;
    onClick: () => void;
    icon: ReactNode;
  }> = [
    {
      key: 'total',
      label: t('spaces.enquiries.summaryTotal', { defaultValue: 'Total enquiries' }),
      value: summary?.total ?? 0,
      selected: status === '',
      onClick: () => onStatus(''),
      icon: <Mail size={16} />,
    },
    {
      key: 'pending',
      label: t('spaces.enquiries.status.PENDING', { defaultValue: 'Pending' }),
      value: summary?.pending ?? 0,
      selected: status === 'PENDING',
      onClick: () => onStatus('PENDING'),
      icon: <Clock size={16} />,
    },
    {
      key: 'shared',
      label: t('spaces.enquiries.status.SHARED', { defaultValue: 'Shared' }),
      value: summary?.shared ?? 0,
      selected: status === 'SHARED',
      onClick: () => onStatus('SHARED'),
      icon: <MessageCircle size={16} />,
    },
    {
      key: 'closed',
      label: t('spaces.enquiries.summaryClosed', { defaultValue: 'Closed' }),
      value: summary?.closed ?? 0,
      selected: false,
      onClick: () => undefined,
      icon: <Clock size={16} />,
    },
  ];
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', sm: 'repeat(4, minmax(0, 1fr))' },
        gap: 1,
      }}
    >
      {cards.map((card) => (
        <Box
          key={card.key}
          component="button"
          type="button"
          onClick={card.onClick}
          aria-pressed={card.selected}
          sx={{
            textAlign: 'left',
            borderRadius: '16px',
            border: `1px solid ${card.selected ? colors.primary : 'rgba(15,23,42,0.08)'}`,
            bgcolor: card.selected ? colors.mintSubtle : '#fff',
            p: 1.25,
            cursor: 'pointer',
          }}
        >
          <Box sx={{ color: colors.tealDark }}>{card.icon}</Box>
          <Typography sx={{ fontWeight: 800, fontSize: 20 }}>{card.value}</Typography>
          <Typography variant="caption" color="text.secondary">{card.label}</Typography>
        </Box>
      ))}
    </Box>
  );
}
