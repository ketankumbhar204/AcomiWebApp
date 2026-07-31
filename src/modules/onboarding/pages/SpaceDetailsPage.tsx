import {
  Alert,
  Box,
  Button,
  IconButton,
  Link,
  Stack,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import {
  AlertTriangle,
  BedDouble,
  Building2,
  CalendarDays,
  Copy,
  ExternalLink,
  Home,
  IndianRupee,
  MapPin,
  Phone,
  Pencil,
  Trash2,
  Users,
  UtensilsCrossed,
  DoorOpen,
  type LucideIcon,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { IconBadge } from '@/modules/dashboard/components/IconBadge';
import { useSpaceDashboard } from '@/modules/dashboard/hooks/useSpaceDashboard';
import { DASHBOARD_UX, dashSurfaces } from '@/modules/dashboard/theme/dashboardUx';
import { spaceApi } from '@/modules/onboarding/api/spaceApi';
import { isSpaceOwner } from '@/modules/onboarding/utils/spaceOwnership';
import { ConfirmDialog } from '@/shared/components/ConfirmDialog';
import { ContentCard } from '@/shared/components/ContentCard';
import { LoadingState } from '@/shared/components/LoadingState';
import { PageContainer } from '@/shared/components/PageContainer';
import { PageHeader } from '@/shared/components/PageHeader';
import { StatusChip } from '@/shared/components/StatusChip';
import { colors } from '@/shared/theme/colors';
import { dashContainedButtonSx, dashOutlinedButtonSx } from '@/shared/theme/dashButtonSx';
import type { SpaceType } from '@/shared/types/space';
import { formatCurrency } from '@/shared/utils/dashboardFinancial';
import {
  ROUTES,
  spaceDashboardPath,
  spaceEditPath,
} from '@/routes/paths';
import { useAuthStore } from '@/store/authStore';
import { useSpaceStore } from '@/store/spaceStore';

function typeLabelKey(type: string): string {
  if (type === 'CO_LIVING') return 'spaces.types.coLiving.label';
  return `spaces.types.${type.toLowerCase()}.label`;
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function spaceTypeIcon(type: SpaceType): LucideIcon {
  switch (type) {
    case 'PG':
      return Home;
    case 'MESS':
      return UtensilsCrossed;
    case 'HOSTEL':
      return BedDouble;
    case 'RENTAL':
      return DoorOpen;
    case 'CO_LIVING':
    default:
      return Building2;
  }
}

function billingLabelKey(type: string | undefined): string | null {
  if (!type) return null;
  if (type === 'PAY_PER_MEAL') return 'spaces.mealBilling.types.PAY_PER_MEAL.label';
  if (type === 'PREPAID_BALANCE') return 'spaces.mealBilling.types.PREPAID_BALANCE.label';
  return null;
}

type MetricProps = {
  icon: LucideIcon;
  accent: string;
  label: string;
  value: string;
  hint: string;
  valueColor?: string;
};

function OverviewMetric({ icon: Icon, accent, label, value, hint, valueColor }: MetricProps) {
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);

  return (
    <Box
      sx={{
        minWidth: 0,
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: 0.75,
        px: { xs: 0, md: 1 },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
        <IconBadge accent={accent}>
          <Icon />
        </IconBadge>
        <Typography sx={{ ...DASHBOARD_UX.metricLabel, color: s.textSecondary }} noWrap>
          {label}
        </Typography>
      </Box>
      <Typography
        sx={{
          ...DASHBOARD_UX.largeNumber,
          color: valueColor ?? s.textPrimary,
          fontSize: '1.375rem',
          lineHeight: '1.75rem',
        }}
      >
        {value}
      </Typography>
      <Typography sx={{ ...DASHBOARD_UX.metricCaption, color: s.textMuted }}>{hint}</Typography>
    </Box>
  );
}

type DetailFieldProps = {
  icon: LucideIcon;
  label: string;
  value: string;
};

function DetailField({ icon: Icon, label, value }: DetailFieldProps) {
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);

  return (
    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.25, py: 0.85 }}>
      <IconBadge accent={colors.primaryDark}>
        <Icon />
      </IconBadge>
      <Box sx={{ minWidth: 0 }}>
        <Typography sx={{ ...DASHBOARD_UX.metricLabel, color: s.textMuted }}>{label}</Typography>
        <Typography sx={{ ...DASHBOARD_UX.cardTitle, color: s.textPrimary, fontWeight: 600 }}>
          {value}
        </Typography>
      </Box>
    </Box>
  );
}

export function SpaceDetailsPage() {
  const { t } = useTranslation();
  const { spaceId = '' } = useParams<{ spaceId: string }>();
  const navigate = useNavigate();
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);
  const { enqueueSnackbar } = useSnackbar();
  const userId = useAuthStore((state) => state.userId);
  const mySpace = useSpaceStore((state) =>
    state.mySpaces.find((space) => space.spaceId === spaceId),
  );
  const deactivateSpace = useSpaceStore((state) => state.deactivateSpace);
  const deactivating = useSpaceStore((state) => state.loading);
  const [deactivateOpen, setDeactivateOpen] = useState(false);

  const detailsQuery = useQuery({
    queryKey: ['space-details', spaceId],
    queryFn: () => spaceApi.getSpaceById(spaceId),
    enabled: Boolean(spaceId),
  });

  const details = detailsQuery.data;
  const spaceType = details?.type ?? mySpace?.spaceType;
  const dashboard = useSpaceDashboard(spaceId, spaceType, Boolean(spaceId && spaceType));

  useEffect(() => {
    document.title = `${t('spaces.details.heading')} · ${t('common.appName')}`;
  }, [t]);

  const owner = isSpaceOwner(
    {
      ownerId: details?.ownerId ?? mySpace?.ownerId,
      membershipRole: mySpace?.membershipRole,
    },
    userId,
  );

  const TypeIcon = spaceType ? spaceTypeIcon(spaceType) : Building2;
  const typeLabel = spaceType ? t(typeLabelKey(spaceType)) : '—';
  const roleLabel = mySpace?.membershipRole
    ? t(`spaces.roles.${mySpace.membershipRole}`)
    : owner
      ? t('spaces.roles.OWNER')
      : t('spaces.details.notProvided');

  const metrics = useMemo(() => {
    const fin = dashboard.financial;
    const acc = dashboard.accommodationOperations;
    const mess = dashboard.messOperations;
    const currency = fin?.currencyCode ?? 'INR';
    const totalBeds =
      acc != null ? acc.occupiedBeds + acc.vacantBeds : null;

    const membersValue =
      mess?.membersReceivingMeals != null
        ? String(mess.membersReceivingMeals)
        : totalBeds != null
          ? String(totalBeds)
          : '—';

    const second =
      acc != null
        ? {
            icon: BedDouble,
            accent: '#7C3AED',
            label: t('spaces.details.kpi.occupiedBeds'),
            value: String(acc.occupiedBeds),
            hint:
              totalBeds != null
                ? t('spaces.details.kpi.ofTotal', { total: totalBeds })
                : t('spaces.details.notProvided'),
          }
        : {
            icon: Users,
            accent: '#7C3AED',
            label: t('spaces.details.kpi.openPolls'),
            value: mess?.openPollsCount != null ? String(mess.openPollsCount) : '—',
            hint: t('spaces.details.kpi.pollsOpen'),
          };

    return [
      {
        icon: Users,
        accent: colors.primaryDark,
        label: mess ? t('spaces.details.kpi.mealMembers') : t('spaces.details.kpi.members'),
        value: membersValue,
        hint: mess ? t('spaces.details.kpi.receivingMeals') : t('spaces.details.kpi.totalMembers'),
        valueColor: undefined as string | undefined,
      },
      second,
      {
        icon: IndianRupee,
        accent: colors.success,
        label: t('spaces.details.kpi.collections'),
        value: formatCurrency(fin?.collected, currency),
        hint: t('spaces.details.kpi.totalCollected'),
        valueColor: colors.success,
      },
      {
        icon: AlertTriangle,
        accent: colors.warning,
        label: t('spaces.details.kpi.pendingPayments'),
        value: formatCurrency(fin?.pending, currency),
        hint: t('spaces.details.kpi.totalPending'),
        valueColor: colors.warning,
      },
    ];
  }, [dashboard.accommodationOperations, dashboard.financial, dashboard.messOperations, t]);

  const planKey = billingLabelKey(details?.mealBillingType);
  const planLabel = planKey ? t(planKey) : null;

  const copySpaceId = async () => {
    if (!details?.id) return;
    try {
      await navigator.clipboard.writeText(details.id);
      enqueueSnackbar(t('spaces.details.copied'), { variant: 'success' });
    } catch {
      enqueueSnackbar(t('common.errors.generic'), { variant: 'error' });
    }
  };

  if (detailsQuery.isLoading) {
    return (
      <PageContainer gap={0}>
        <LoadingState label={t('common.loading')} />
      </PageContainer>
    );
  }

  if (detailsQuery.isError || !details) {
    return (
      <PageContainer gap={0}>
        <Alert severity="error">{t('spaces.errors.loadDetails')}</Alert>
      </PageContainer>
    );
  }

  return (
    <PageContainer gap={0}>
      <Stack spacing={`${DASHBOARD_UX.sectionGap}px`} sx={{ width: '100%', maxWidth: 1100 }}>
        <PageHeader
          title={t('spaces.details.heading')}
          description={t('spaces.details.subheading')}
          actions={
            <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
              <Button
                variant="outlined"
                startIcon={<ExternalLink size={14} />}
                onClick={() => navigate(spaceDashboardPath(spaceId))}
                sx={dashOutlinedButtonSx}
              >
                {t('spaces.details.openDashboard')}
              </Button>
              {owner ? (
                <Button
                  variant="contained"
                  startIcon={<Pencil size={14} />}
                  onClick={() => navigate(spaceEditPath(spaceId))}
                  sx={dashContainedButtonSx}
                >
                  {t('spaces.details.edit')}
                </Button>
              ) : null}
            </Stack>
          }
        />

        {/* Overview hero + metrics */}
        <ContentCard>
          <Box
            sx={{
              display: 'grid',
              gap: `${DASHBOARD_UX.sectionGap}px`,
              gridTemplateColumns: {
                xs: '1fr',
                md: 'minmax(200px, 240px) 1fr',
              },
              alignItems: 'center',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, minWidth: 0 }}>
              <Box
                sx={{
                  width: 52,
                  height: 52,
                  borderRadius: '50%',
                  bgcolor: theme.palette.mode === 'dark' ? s.elevated : `${colors.primaryDark}14`,
                  color: colors.primaryDark,
                  display: 'grid',
                  placeItems: 'center',
                  flexShrink: 0,
                  border: `1px solid ${s.border}`,
                }}
              >
                <TypeIcon size={24} strokeWidth={2} />
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography
                  sx={{ ...DASHBOARD_UX.sectionHeading, color: s.textPrimary }}
                  noWrap
                >
                  {details.name}
                </Typography>
                <Typography sx={{ ...DASHBOARD_UX.body, color: s.textSecondary, mt: 0.25 }}>
                  {typeLabel} · {roleLabel}
                </Typography>
                <Box sx={{ mt: 0.75 }}>
                  <StatusChip label={t('spaces.details.active')} tone="success" />
                </Box>
              </Box>
            </Box>

            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: {
                  xs: '1fr 1fr',
                  lg: 'repeat(4, minmax(0, 1fr))',
                },
                gap: `${DASHBOARD_UX.cardGap}px`,
                pt: { xs: 0.5, md: 0 },
                borderTop: { xs: `1px solid ${s.border}`, md: 'none' },
                borderLeft: { xs: 'none', md: `1px solid ${s.border}` },
                pl: { xs: 0, md: `${DASHBOARD_UX.sectionPadding}px` },
              }}
            >
              {metrics.map((metric) => (
                <OverviewMetric key={metric.label} {...metric} />
              ))}
            </Box>
          </Box>
        </ContentCard>

        {/* Basic information */}
        <ContentCard>
          <Typography sx={{ ...DASHBOARD_UX.sectionHeading, color: s.textPrimary, mb: 1.5 }}>
            {t('spaces.details.basicInformation')}
          </Typography>
          <Box
            sx={{
              display: 'grid',
              gap: `${DASHBOARD_UX.sectionGap}px`,
              gridTemplateColumns: { xs: '1fr', md: '1.2fr 0.9fr' },
            }}
          >
            <Box>
              <DetailField icon={Building2} label={t('spaces.details.name')} value={details.name} />
              <DetailField icon={Home} label={t('spaces.details.type')} value={typeLabel} />
              <DetailField
                icon={MapPin}
                label={t('spaces.details.address')}
                value={details.address?.trim() || t('spaces.details.notProvided')}
              />
              <DetailField
                icon={Phone}
                label={t('spaces.details.contact')}
                value={details.contactNumber?.trim() || t('spaces.details.notProvided')}
              />
              <DetailField
                icon={CalendarDays}
                label={t('spaces.details.createdAt')}
                value={formatDate(details.createdAt)}
              />
              {details.genderPolicy ? (
                <DetailField
                  icon={Users}
                  label={t('spaces.propertyCategory.label')}
                  value={details.genderPolicy}
                />
              ) : null}
              {details.amenities?.length ? (
                <DetailField
                  icon={Building2}
                  label={t('spaces.amenities.title')}
                  value={details.amenities.map((a) => a.label || a.code).join(', ')}
                />
              ) : null}
            </Box>

            <Box
              sx={{
                p: `${DASHBOARD_UX.cardPadding}px`,
                borderRadius: `${DASHBOARD_UX.tileRadius}px`,
                bgcolor: s.elevated,
                border: `1px solid ${s.border}`,
                display: 'flex',
                flexDirection: 'column',
                gap: 1.5,
                height: 'fit-content',
              }}
            >
              <Box>
                <Typography sx={{ ...DASHBOARD_UX.metricLabel, color: s.textMuted }}>
                  {t('spaces.details.spaceId')}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.25 }}>
                  <Typography
                    sx={{
                      ...DASHBOARD_UX.cardTitle,
                      color: s.textPrimary,
                      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                      fontSize: '0.8125rem',
                      wordBreak: 'break-all',
                    }}
                  >
                    {details.id}
                  </Typography>
                  <Tooltip title={t('spaces.details.copyId')}>
                    <IconButton
                      size="small"
                      onClick={() => void copySpaceId()}
                      aria-label={t('spaces.details.copyId')}
                      sx={{ color: colors.primaryDark }}
                    >
                      <Copy size={14} />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>

              <Box>
                <Typography sx={{ ...DASHBOARD_UX.metricLabel, color: s.textMuted }}>
                  {t('spaces.details.status')}
                </Typography>
                <Box sx={{ mt: 0.5 }}>
                  <StatusChip label={t('spaces.details.active')} tone="success" />
                </Box>
              </Box>

              <Box>
                <Typography sx={{ ...DASHBOARD_UX.metricLabel, color: s.textMuted }}>
                  {t('spaces.details.owner')}
                </Typography>
                <Typography sx={{ ...DASHBOARD_UX.cardTitle, color: s.textPrimary, mt: 0.25 }}>
                  {roleLabel}
                </Typography>
              </Box>

              {planLabel ? (
                <Box>
                  <Typography sx={{ ...DASHBOARD_UX.metricLabel, color: s.textMuted }}>
                    {t('spaces.details.spacePlan')}
                  </Typography>
                  <Typography
                    sx={{
                      ...DASHBOARD_UX.cardTitle,
                      color: colors.primaryDark,
                      mt: 0.25,
                      fontWeight: 700,
                    }}
                  >
                    {planLabel}
                  </Typography>
                </Box>
              ) : null}
            </Box>
          </Box>
        </ContentCard>

        {/* Danger zone */}
        {owner ? (
          <ContentCard>
            <Box
              sx={{
                display: 'flex',
                alignItems: { xs: 'stretch', sm: 'center' },
                justifyContent: 'space-between',
                gap: 2,
                flexDirection: { xs: 'column', sm: 'row' },
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.25, minWidth: 0 }}>
                <IconBadge accent={colors.danger}>
                  <AlertTriangle />
                </IconBadge>
                <Box>
                  <Typography sx={{ ...DASHBOARD_UX.cardTitle, color: s.textPrimary }}>
                    {t('spaces.details.deactivateTitle')}
                  </Typography>
                  <Typography sx={{ ...DASHBOARD_UX.body, color: s.textSecondary, mt: 0.35 }}>
                    {t('spaces.details.deactivateMessage', { name: details.name })}
                  </Typography>
                </Box>
              </Box>
              <Button
                color="error"
                variant="outlined"
                startIcon={<Trash2 size={14} />}
                onClick={() => setDeactivateOpen(true)}
                aria-label={t('spaces.details.deactivate')}
                sx={{ ...dashOutlinedButtonSx, flexShrink: 0, alignSelf: { xs: 'stretch', sm: 'center' } }}
              >
                {t('spaces.details.deactivate')}
              </Button>
            </Box>
          </ContentCard>
        ) : null}

        {/* Help banner */}
        <Box
          sx={{
            display: 'flex',
            alignItems: { xs: 'stretch', md: 'center' },
            justifyContent: 'space-between',
            gap: 2,
            flexDirection: { xs: 'column', md: 'row' },
            p: `${DASHBOARD_UX.cardPadding}px`,
            borderRadius: `${DASHBOARD_UX.radius}px`,
            border: `1px solid ${s.border}`,
            bgcolor: theme.palette.mode === 'dark' ? s.elevated : `${colors.primaryDark}0F`,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, minWidth: 0 }}>
            <IconBadge accent={colors.primaryDark}>
              <Building2 />
            </IconBadge>
            <Typography sx={{ ...DASHBOARD_UX.body, color: s.textSecondary }}>
              {t('spaces.details.helpBanner')}
            </Typography>
          </Box>
          <Stack direction="row" spacing={2} useFlexGap sx={{ flexWrap: 'wrap', flexShrink: 0 }}>
            <Link
              href="https://countin.app/help"
              target="_blank"
              rel="noopener noreferrer"
              underline="hover"
              sx={{
                ...DASHBOARD_UX.link,
                color: colors.primaryDark,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.5,
              }}
            >
              {t('spaces.details.helpCenter')}
              <ExternalLink size={12} />
            </Link>
            <Link
              href="mailto:support@countin.app"
              underline="hover"
              sx={{
                ...DASHBOARD_UX.link,
                color: colors.primaryDark,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.5,
              }}
            >
              <Phone size={12} />
              {t('spaces.details.contactSupport')}
            </Link>
          </Stack>
        </Box>
      </Stack>

      <ConfirmDialog
        open={deactivateOpen}
        title={t('spaces.details.deactivateTitle')}
        description={t('spaces.details.deactivateMessage', { name: details.name })}
        confirmLabel={t('spaces.details.deactivateConfirm')}
        cancelLabel={t('common.cancel')}
        destructive
        confirming={deactivating}
        onClose={() => setDeactivateOpen(false)}
        onConfirm={() => {
          void deactivateSpace(spaceId).then((ok) => {
            setDeactivateOpen(false);
            if (ok) {
              enqueueSnackbar(t('spaces.details.deactivateSuccess'), { variant: 'success' });
              navigate(ROUTES.mySpaces);
            } else {
              enqueueSnackbar(t('common.errors.generic'), { variant: 'error' });
            }
          });
        }}
      />
    </PageContainer>
  );
}
