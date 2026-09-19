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
import { useQuery } from '@tanstack/react-query';
import {
  Building2,
  ChevronRight,
  Mail,
  MessageCircle,
  Phone,
  RefreshCw,
  UserRound,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { contactWasEmailed } from '@/modules/onboarding/utils/enquiryContactDelivery';
import { DASHBOARD_UX, dashSurfaces } from '@/modules/dashboard/theme/dashboardUx';
import { ROUTES } from '@/routes/paths';
import { enquiryApi } from '@/shared/api/enquiryApi';
import { AppDrawer } from '@/shared/components/AppDrawer';
import { EmptyState } from '@/shared/components/EmptyState';
import { PageContainer } from '@/shared/components/PageContainer';
import { PageHeader } from '@/shared/components/PageHeader';
import { colors } from '@/shared/theme/colors';
import { dashContainedButtonSx, dashOutlinedButtonSx } from '@/shared/theme/dashButtonSx';
import type {
  OwnerContactResponse,
  SpaceEnquiryResponse,
  SpaceEnquiryStatus,
} from '@/shared/types/enquiry';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function statusKey(status: SpaceEnquiryStatus): string {
  return `spaces.enquiries.status.${status}`;
}

function hintKey(enquiry: SpaceEnquiryResponse): string | null {
  if (enquiry.status === 'SHARED') {
    return contactWasEmailed(enquiry)
      ? 'spaces.enquiries.sharedHint'
      : canShowOwnerContact(enquiry)
        ? 'spaces.enquiries.ownerContactReady'
        : 'spaces.enquiries.sharedInAppHint';
  }
  if (enquiry.status === 'PENDING') return 'spaces.enquiries.pendingHint';
  if (enquiry.status === 'REJECTED') return 'spaces.enquiries.rejectedHint';
  if (enquiry.status === 'EXPIRED') return 'spaces.enquiries.expiredHint';
  return null;
}

function canShowOwnerContact(item: SpaceEnquiryResponse): boolean {
  return (
    item.status === 'SHARED' &&
    !contactWasEmailed(item) &&
    Boolean(item.ownerContact?.available)
  );
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

function contactMobiles(contact: OwnerContactResponse): string[] {
  return [contact.mobileNumber, contact.alternateMobileNumber, contact.additionalMobileNumber]
    .map((v) => v?.trim())
    .filter((v): v is string => Boolean(v));
}

function EnquiryInspector({
  enquiry,
  framed,
  onClose,
}: {
  enquiry: SpaceEnquiryResponse | null;
  framed: boolean;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const s = dashSurfaces();

  if (!enquiry) {
    return (
      <Box
        sx={{
          height: '100%',
          borderRadius: framed ? `${DASHBOARD_UX.cardRadius}px` : 0,
          border: framed ? `1px solid ${s.border}` : 'none',
          bgcolor: s.surface,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 3,
        }}
      >
        <Typography color="text.secondary" sx={{ textAlign: 'center', fontSize: 14 }}>
          {t('spaces.enquiries.selectHint', {
            defaultValue: 'Select an enquiry to see status and owner contact details.',
          })}
        </Typography>
      </Box>
    );
  }

  const hint = hintKey(enquiry);
  const tone = statusTone(enquiry.status);
  const showContact = canShowOwnerContact(enquiry);
  const contact = enquiry.ownerContact;
  const mobiles = contact ? contactMobiles(contact) : [];

  return (
    <Box
      sx={{
        height: '100%',
        borderRadius: framed ? `${DASHBOARD_UX.cardRadius}px` : 0,
        border: framed ? `1px solid ${s.border}` : 'none',
        bgcolor: s.surface,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <Box
        sx={{
          px: 2.5,
          pt: 2.5,
          pb: 1.5,
          borderBottom: `1px solid ${s.border}`,
          display: 'flex',
          alignItems: 'flex-start',
          gap: 1,
        }}
      >
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontWeight: 800, fontSize: '1.05rem', lineHeight: 1.3 }}>
            {enquiry.spaceName}
          </Typography>
          <Typography sx={{ mt: 0.5, fontSize: 12, color: 'text.secondary' }}>
            {formatRequestedDate(enquiry.requestedAt)}
          </Typography>
        </Box>
        <IconButton size="small" onClick={onClose} aria-label={t('common.close')}>
          <X size={16} />
        </IconButton>
      </Box>

      <Box sx={{ flex: 1, overflow: 'auto', p: 2.5 }}>
        <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: 'wrap' }}>
          <Chip
            size="small"
            label={t(statusKey(enquiry.status))}
            sx={{ bgcolor: tone.bg, color: tone.fg, fontWeight: 700 }}
          />
          {enquiry.locationLabel ? (
            <Chip size="small" variant="outlined" label={enquiry.locationLabel} />
          ) : null}
        </Stack>

        {hint ? (
          <Box
            sx={{
              mb: 2,
              px: 1.5,
              py: 1.25,
              borderRadius: 2,
              bgcolor: colors.mintSubtle,
              color: colors.tealDark,
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            {t(hint)}
          </Box>
        ) : null}

        {showContact && contact ? (
          <Stack spacing={1.5}>
            <Typography sx={{ fontWeight: 800, fontSize: 14 }}>
              {t('spaces.enquiries.contactDetails', { defaultValue: 'Owner contact' })}
            </Typography>

            {contact.ownerName?.trim() ? (
              <ContactRow
                icon={<UserRound size={16} />}
                label={t('spaces.enquiries.ownerName', { defaultValue: 'Name' })}
                value={contact.ownerName.trim()}
              />
            ) : null}

            {mobiles.map((mobile, index) => (
              <ContactRow
                key={`${mobile}-${index}`}
                icon={<Phone size={16} />}
                label={
                  index === 0
                    ? t('spaces.enquiries.mobile', { defaultValue: 'Mobile' })
                    : t('spaces.enquiries.alternateMobile', { defaultValue: 'Alternate mobile' })
                }
                value={mobile}
                action={
                  <Button
                    size="small"
                    href={`tel:${mobile}`}
                    sx={{ ...dashContainedButtonSx, minWidth: 72 }}
                  >
                    {t('spaces.enquiries.callOwner', { defaultValue: 'Call' })}
                  </Button>
                }
              />
            ))}

            {mobiles[0] ? (
              <ContactRow
                icon={<MessageCircle size={16} />}
                label={t('spaces.enquiries.messageOwner', { defaultValue: 'Message' })}
                value={t('spaces.enquiries.messageOwnerHint', {
                  defaultValue: 'Open your messaging app',
                })}
                action={
                  <Button
                    size="small"
                    href={`sms:${mobiles[0]}`}
                    sx={{ ...dashOutlinedButtonSx, minWidth: 88 }}
                  >
                    {t('spaces.enquiries.messageOwner', { defaultValue: 'Message' })}
                  </Button>
                }
              />
            ) : null}

            {contact.email?.trim() ? (
              <ContactRow
                icon={<Mail size={16} />}
                label={t('spaces.enquiries.ownerEmail', { defaultValue: 'Email' })}
                value={contact.email.trim()}
                action={
                  <Button
                    size="small"
                    href={`mailto:${contact.email.trim()}`}
                    sx={{ ...dashOutlinedButtonSx, minWidth: 72 }}
                  >
                    {t('spaces.enquiries.emailOwner', { defaultValue: 'Email' })}
                  </Button>
                }
              />
            ) : null}
          </Stack>
        ) : enquiry.status === 'SHARED' && contactWasEmailed(enquiry) ? (
          <Typography color="text.secondary" sx={{ fontSize: 13 }}>
            {t('spaces.enquiries.sharedHint')}
          </Typography>
        ) : null}
      </Box>
    </Box>
  );
}

function ContactRow({
  icon,
  label,
  value,
  action,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  action?: ReactNode;
}) {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.25,
        p: 1.25,
        borderRadius: 2,
        border: `1px solid ${colors.border}`,
        bgcolor: colors.surfaceSecondary,
      }}
    >
      <Box
        sx={{
          width: 32,
          height: 32,
          borderRadius: '10px',
          bgcolor: colors.mintSubtle,
          color: colors.tealDark,
          display: 'grid',
          placeItems: 'center',
          flexShrink: 0,
        }}
      >
        {icon}
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography sx={{ fontSize: 11, fontWeight: 700, color: 'text.secondary' }}>
          {label}
        </Typography>
        <Typography sx={{ fontSize: 13, fontWeight: 700, wordBreak: 'break-word' }}>
          {value}
        </Typography>
      </Box>
      {action}
    </Box>
  );
}

export function MyEnquiriesPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const theme = useTheme();
  const isLgDown = useMediaQuery(theme.breakpoints.down('lg'));
  const s = dashSurfaces();
  const [params] = useSearchParams();
  const highlightId = UUID_RE.test(params.get('id') ?? '') ? params.get('id') : null;
  const [selectedId, setSelectedId] = useState<string | null>(highlightId);

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

  const selected = useMemo(
    () => rows.find((row) => row.enquiryId === selectedId) ?? null,
    [rows, selectedId],
  );

  useEffect(() => {
    if (highlightId) {
      setSelectedId(highlightId);
    }
  }, [highlightId]);

  useEffect(() => {
    if (!selectedId && !isLgDown && rows.length > 0) {
      setSelectedId(rows[0].enquiryId);
    }
  }, [isLgDown, rows, selectedId]);

  useEffect(() => {
    document.title = `${t('spaces.enquiries.title')} · ${t('common.appName')}`;
  }, [t]);

  const showDesktopPanel = !isLgDown;
  const inspector = (
    <EnquiryInspector
      enquiry={selected}
      framed={showDesktopPanel}
      onClose={() => setSelectedId(null)}
    />
  );

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
              gap: `${DASHBOARD_UX.cardGap}px`,
              gridTemplateColumns: showDesktopPanel
                ? 'minmax(0, 1.85fr) minmax(0, 0.95fr)'
                : '1fr',
              alignItems: 'start',
            }}
          >
            <Stack spacing={1.25} sx={{ minWidth: 0 }}>
              {rows.map((row) => {
                const hint = hintKey(row);
                const tone = statusTone(row.status);
                const selectedRow = selectedId === row.enquiryId;
                const showContact = canShowOwnerContact(row);
                return (
                  <Box
                    key={row.enquiryId}
                    id={`enquiry-${row.enquiryId}`}
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
                      borderRadius: `${DASHBOARD_UX.cardRadius}px`,
                      border: `1px solid ${selectedRow ? colors.primary : s.border}`,
                      bgcolor: selectedRow ? colors.mintSubtle : s.surface,
                      cursor: 'pointer',
                      '&:hover': { borderColor: colors.primary },
                    }}
                  >
                    <Stack direction="row" spacing={1.5} alignItems="flex-start">
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
                        <Building2 size={18} />
                      </Box>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography sx={{ fontWeight: 800 }} noWrap>
                          {row.spaceName}
                        </Typography>
                        {row.locationLabel ? (
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            noWrap
                            sx={{ mt: 0.25 }}
                          >
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
                          label={t(statusKey(row.status))}
                          sx={{ mt: 1, bgcolor: tone.bg, color: tone.fg, fontWeight: 700 }}
                        />
                        {hint ? (
                          <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>
                            {t(hint)}
                          </Typography>
                        ) : null}
                        {showContact ? (
                          <Stack
                            direction="row"
                            spacing={0.5}
                            alignItems="center"
                            sx={{ mt: 1.25, color: colors.primary, fontWeight: 700, fontSize: 13 }}
                          >
                            <span>
                              {t('spaces.enquiries.viewContactDetails', {
                                defaultValue: 'View contact details',
                              })}
                            </span>
                            <ChevronRight size={16} />
                          </Stack>
                        ) : null}
                      </Box>
                    </Stack>
                  </Box>
                );
              })}
            </Stack>

            {showDesktopPanel ? (
              <Box
                sx={{
                  position: 'sticky',
                  top: 12,
                  alignSelf: 'start',
                  height: 'calc(100vh - 112px)',
                  maxHeight: 'calc(100vh - 112px)',
                  minHeight: 360,
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                {inspector}
              </Box>
            ) : null}
          </Box>
        )}
      </Stack>

      <AppDrawer
        open={Boolean(selectedId) && isLgDown}
        onClose={() => setSelectedId(null)}
        width={400}
      >
        {inspector}
      </AppDrawer>
    </PageContainer>
  );
}
