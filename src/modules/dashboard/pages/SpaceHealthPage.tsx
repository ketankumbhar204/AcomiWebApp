import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Typography,
  useTheme,
} from '@mui/material';
import {
  Bell,
  Building2,
  CheckCircle2,
  ChevronRight,
  Lightbulb,
  Settings2,
  TriangleAlert,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { HealthScoreRing } from '@/modules/dashboard/components/HealthScoreRing';
import { usePendingActions } from '@/modules/dashboard/hooks/usePendingActions';
import { useSpaceDashboard } from '@/modules/dashboard/hooks/useSpaceDashboard';
import { useSpaceLifecycleSignals } from '@/modules/dashboard/hooks/useSpaceLifecycleSignals';
import { DASHBOARD_UX, dashSurfaces } from '@/modules/dashboard/theme/dashboardUx';
import { EmptyState } from '@/shared/components/EmptyState';
import { PageContainer } from '@/shared/components/PageContainer';
import { PageHeader } from '@/shared/components/PageHeader';
import { dashContainedButtonSx, dashOutlinedButtonSx } from '@/shared/theme/dashButtonSx';
import { useSpacePermissions } from '@/shared/hooks/useSpacePermissions';
import { canManageNotifications } from '@/shared/utils/spaceOperator';
import { ROUTES, spaceDashboardPath } from '@/routes/paths';
import {
  bandAccent,
  categoryAccent,
  navigateHealthAction,
  resolveHealthBand,
  resolveHealthFactorAction,
  useSpaceHealth,
  useSpaceLifecycle,
  type HealthCategoryBreakdown,
  type HealthCategoryId,
  type HealthFactor,
  type HealthNavAction,
  type RecommendedAction,
} from '@/spaceLifecycle';

const CATEGORY_TITLE: Record<HealthCategoryId, string> = {
  setup: 'dashboard.health.categories.setup',
  operations: 'dashboard.health.categories.operations',
  attention: 'dashboard.health.categories.attention',
};

const CATEGORY_SHORT: Record<HealthCategoryId, string> = {
  setup: 'dashboard.health.categoriesShort.setup',
  operations: 'dashboard.health.categoriesShort.operations',
  attention: 'dashboard.health.categoriesShort.attention',
};

const CATEGORY_EXPLAIN: Record<HealthCategoryId, string> = {
  setup: 'dashboard.health.weightsInfo.setupExplain',
  operations: 'dashboard.health.weightsInfo.operationsExplain',
  attention: 'dashboard.health.weightsInfo.attentionExplain',
};

const CATEGORY_ICON: Record<HealthCategoryId, LucideIcon> = {
  setup: Settings2,
  operations: Building2,
  attention: Bell,
};

function formatPercent(score: number): string {
  return `${Math.round(score)}%`;
}

/**
 * Dedicated Space Health breakdown — parity with mobile DashboardSpaceHealthScreen.
 */
export function SpaceHealthPage() {
  const { t } = useTranslation();
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);
  const navigate = useNavigate();
  const { spaceId = '' } = useParams<{ spaceId: string }>();
  const permissions = useSpacePermissions(spaceId);
  const spaceType = permissions.space?.spaceType;
  const isOperator = canManageNotifications(permissions);
  const [weightsOpen, setWeightsOpen] = useState(false);

  const dashboard = useSpaceDashboard(spaceId, spaceType, isOperator);
  const pending = usePendingActions(spaceId, isOperator);
  const pendingCount = dashboard.pendingActions?.totalCount ?? pending.totalCount;

  const hasOperationalSignal = useMemo(() => {
    const occupied = dashboard.accommodationOperations?.occupiedBeds ?? 0;
    const moveIns = dashboard.accommodationOperations?.moveInsThisMonth ?? 0;
    return occupied > 0 || moveIns > 0;
  }, [
    dashboard.accommodationOperations?.moveInsThisMonth,
    dashboard.accommodationOperations?.occupiedBeds,
  ]);

  const lifecycleSignals = useSpaceLifecycleSignals({
    spaceId,
    spaceType,
    permissions,
    enabled: isOperator,
    pendingActionCount: pendingCount,
    hasOperationalSignal,
  });

  const { evaluation } = useSpaceLifecycle({
    spaceType,
    context: lifecycleSignals.context,
    enabled: isOperator,
  });

  const healthExtras = useMemo(() => {
    const reviewFromPending =
      dashboard.pendingActions?.groups?.find((g) => g.actionType === 'PAYMENT_NEEDS_REVIEW')
        ?.count ?? 0;
    const underReviewAmount = dashboard.financial?.underReview ?? 0;
    return {
      occupiedBeds: dashboard.accommodationOperations?.occupiedBeds,
      vacantBeds: dashboard.accommodationOperations?.vacantBeds,
      underReviewPaymentCount:
        reviewFromPending > 0 ? reviewFromPending : underReviewAmount > 0 ? 1 : 0,
    };
  }, [
    dashboard.accommodationOperations?.occupiedBeds,
    dashboard.accommodationOperations?.vacantBeds,
    dashboard.financial?.underReview,
    dashboard.pendingActions?.groups,
  ]);

  const { health } = useSpaceHealth({
    evaluation,
    context: lifecycleSignals.context,
    extras: healthExtras,
    enabled: isOperator,
  });

  const runNavAction = (action: HealthNavAction) => {
    navigateHealthAction(action, {
      navigate,
      spaceId,
      spaceType,
      canViewAccommodation: permissions.canViewAccommodation,
      canManageMembers: permissions.canManageMembers,
    });
  };

  const exampleRows = useMemo(() => {
    if (!health?.available) return [];
    return health.categories.map((category) => {
      const weightPct = Math.round(category.weight * 100);
      const contribution = Math.round(category.score * category.weight);
      return {
        id: category.category,
        shortLabel: t(CATEGORY_SHORT[category.category]),
        scorePct: formatPercent(category.score),
        weightPct: `${weightPct}%`,
        contribution,
      };
    });
  }, [health, t]);

  if (!spaceId) {
    return <Navigate to={ROUTES.root} replace />;
  }

  if (!isOperator) {
    return <Navigate to={spaceDashboardPath(spaceId)} replace />;
  }

  const ringColor = health?.available ? bandAccent(health.band) : s.border;

  return (
    <PageContainer>
      <PageHeader
        title={t('dashboard.health.title')}
        description={
          health?.available ? t(health.summaryKey) : t('dashboard.health.emptyBody')
        }
        breadcrumbs={[
          { label: permissions.space?.spaceName ?? t('navigation.space'), to: spaceDashboardPath(spaceId) },
          { label: t('navigation.dashboard'), to: spaceDashboardPath(spaceId) },
          { label: t('dashboard.health.title') },
        ]}
        actions={
          health?.available ? (
            <Button
              size="small"
              startIcon={<Lightbulb size={14} />}
              onClick={() => setWeightsOpen(true)}
              sx={dashOutlinedButtonSx}
            >
              {t('dashboard.health.weightsInfo.footerTitle')}
            </Button>
          ) : null
        }
      />

      {!health || !health.available ? (
        <EmptyState
          title={t('dashboard.health.emptyTitle')}
          description={t('dashboard.health.emptyBody')}
        />
      ) : (
        <Stack spacing={2}>
          <Box
            sx={{
              p: 2,
              borderRadius: `${DASHBOARD_UX.radius}px`,
              border: `1px solid ${s.border}`,
              bgcolor: s.surface,
              boxShadow: s.shadow,
            }}
          >
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ alignItems: 'center' }}>
              <HealthScoreRing score={health.score} color={ringColor} size={100} strokeWidth={8} />
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography sx={{ ...DASHBOARD_UX.cardTitle, color: ringColor }}>
                  {t(health.bandLabelKey)}
                </Typography>
                <Typography sx={{ ...DASHBOARD_UX.body, color: s.textSecondary, mt: 0.5 }}>
                  {t(health.summaryKey)}
                </Typography>
              </Box>
            </Stack>

            <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap', mt: 2 }}>
              {health.categories.map((category) => {
                const accent = categoryAccent(category.category);
                const Icon = CATEGORY_ICON[category.category];
                return (
                  <Box
                    key={category.category}
                    component="a"
                    href={`#health-${category.category}`}
                    sx={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 0.75,
                      px: 1.25,
                      py: 0.75,
                      borderRadius: `${DASHBOARD_UX.tileRadius}px`,
                      bgcolor: accent.soft,
                      textDecoration: 'none',
                      color: 'inherit',
                    }}
                  >
                    <Icon size={14} color={accent.accent} />
                    <Typography sx={{ ...DASHBOARD_UX.caption, color: s.textPrimary }}>
                      {t(CATEGORY_SHORT[category.category])}
                    </Typography>
                    <Typography sx={{ ...DASHBOARD_UX.link, color: accent.accent }}>
                      {formatPercent(category.score)}
                    </Typography>
                  </Box>
                );
              })}
            </Stack>
          </Box>

          {health.categories.map((category) => (
            <CategoryCard
              key={category.category}
              category={category}
              recommendation={health.recommendation}
              onRunAction={runNavAction}
            />
          ))}

          <Box
            role="button"
            tabIndex={0}
            onClick={() => setWeightsOpen(true)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setWeightsOpen(true);
              }
            }}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              p: 1.5,
              borderRadius: `${DASHBOARD_UX.radius}px`,
              border: `1px solid ${s.border}`,
              bgcolor: s.elevated,
              cursor: 'pointer',
            }}
          >
            <Lightbulb size={18} color={theme.palette.primary.dark} />
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography sx={{ ...DASHBOARD_UX.cardTitle, color: s.textPrimary }}>
                {t('dashboard.health.weightsInfo.footerTitle')}
              </Typography>
              <Typography sx={{ ...DASHBOARD_UX.caption, color: s.textMuted }}>
                {t('dashboard.health.weightsInfo.footerSubtitle')}
              </Typography>
            </Box>
            <ChevronRight size={18} color={s.textMuted} />
          </Box>
        </Stack>
      )}

      <Dialog
        open={weightsOpen && health?.available === true}
        onClose={() => setWeightsOpen(false)}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: {
            borderRadius: `${DASHBOARD_UX.radius}px`,
            border: `1px solid ${s.border}`,
          },
        }}
      >
        <DialogTitle sx={{ ...DASHBOARD_UX.cardTitle }}>
          {t('dashboard.health.weightsInfo.title')}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={1.5}>
            <Typography sx={{ ...DASHBOARD_UX.body, color: s.textSecondary }}>
              {t('dashboard.health.weightsInfo.intro')}
            </Typography>
            <Typography sx={{ ...DASHBOARD_UX.body, color: s.textSecondary }}>
              {t('dashboard.health.weightsInfo.combines')}
            </Typography>
            {(['setup', 'operations', 'attention'] as HealthCategoryId[]).map((id) => {
              const weightPct = Math.round(
                (health?.categories.find((c) => c.category === id)?.weight ?? 0) * 100,
              );
              return (
                <Box key={id}>
                  <Typography sx={{ ...DASHBOARD_UX.cardTitle, color: s.textPrimary }}>
                    {t(CATEGORY_TITLE[id])} ({weightPct}%)
                  </Typography>
                  <Typography sx={{ ...DASHBOARD_UX.caption, color: s.textMuted }}>
                    {t(CATEGORY_EXPLAIN[id])}
                  </Typography>
                </Box>
              );
            })}
            <Typography sx={{ ...DASHBOARD_UX.cardTitle, color: s.textPrimary, pt: 1 }}>
              {t('dashboard.health.weightsInfo.exampleTitle')}
            </Typography>
            {exampleRows.map((row) => (
              <Typography key={row.id} sx={{ ...DASHBOARD_UX.body, color: s.textSecondary }}>
                <strong>{row.shortLabel}</strong>: {row.scorePct} × {row.weightPct} ={' '}
                {row.contribution}
              </Typography>
            ))}
            <Typography sx={{ ...DASHBOARD_UX.cardTitle, color: s.textPrimary }}>
              {t('dashboard.health.weightsInfo.overallLabel')}:{' '}
              {exampleRows.map((r) => r.contribution).join(' + ')} ={' '}
              {formatPercent(health?.score ?? 0)}
            </Typography>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 2.5, pb: 2 }}>
          <Button variant="contained" onClick={() => setWeightsOpen(false)} sx={dashContainedButtonSx}>
            {t('dashboard.health.weightsInfo.gotIt')}
          </Button>
        </DialogActions>
      </Dialog>
    </PageContainer>
  );
}

function CategoryCard({
  category,
  recommendation,
  onRunAction,
}: {
  category: HealthCategoryBreakdown;
  recommendation: RecommendedAction | null;
  onRunAction: (action: HealthNavAction) => void;
}) {
  const { t } = useTranslation();
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);
  const accent = categoryAccent(category.category);
  const Icon = CATEGORY_ICON[category.category];
  const categoryBand = resolveHealthBand(category.score);
  const positiveFactors = category.factors.filter((f) => f.tone === 'positive');
  const concernFactors = category.factors.filter((f) => f.tone !== 'positive');

  const recommended = useMemo(() => {
    const fromSuggestion = category.suggestions[0];
    if (fromSuggestion) {
      return {
        title: t(fromSuggestion.labelKey, fromSuggestion.labelParams),
        action: resolveHealthFactorAction(fromSuggestion, recommendation),
      };
    }
    const occupancy = concernFactors.find((f) => f.id === 'ops.occupancy');
    if (occupancy) {
      return {
        title: t('dashboard.health.actions.improveOccupancy'),
        action: resolveHealthFactorAction(occupancy, recommendation),
      };
    }
    return null;
  }, [category.suggestions, concernFactors, recommendation, t]);

  return (
    <Box
      id={`health-${category.category}`}
      sx={{
        p: 2,
        borderRadius: `${DASHBOARD_UX.radius}px`,
        border: `1px solid ${s.border}`,
        borderLeft: `4px solid ${accent.accent}`,
        bgcolor: s.surface,
        boxShadow: s.shadow,
      }}
    >
      <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', mb: 1.5 }}>
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: `${DASHBOARD_UX.tileRadius}px`,
            bgcolor: accent.soft,
            display: 'grid',
            placeItems: 'center',
          }}
        >
          <Icon size={20} color={accent.accent} />
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ ...DASHBOARD_UX.cardTitle, color: s.textPrimary }}>
            {t(CATEGORY_TITLE[category.category])}
          </Typography>
          <Typography sx={{ ...DASHBOARD_UX.caption, color: accent.accent }}>
            {t(categoryBand.labelKey)}
          </Typography>
        </Box>
        <Typography sx={{ ...DASHBOARD_UX.cardTitle, color: accent.accent }}>
          {formatPercent(category.score)}
        </Typography>
      </Stack>

      <Stack spacing={0.75}>
        {positiveFactors.map((factor) => (
          <FactorRow key={factor.id} factor={factor} />
        ))}
        {concernFactors.map((factor) => {
          const action = resolveHealthFactorAction(factor, recommendation);
          return (
            <FactorRow
              key={factor.id}
              factor={factor}
              onPress={action ? () => onRunAction(action) : undefined}
            />
          );
        })}
      </Stack>

      {recommended?.action ? (
        <Button
          fullWidth
          startIcon={<Users size={16} />}
          onClick={() => {
            if (recommended.action) onRunAction(recommended.action);
          }}
          sx={{
            ...dashOutlinedButtonSx,
            mt: 1.5,
            justifyContent: 'flex-start',
            bgcolor: accent.soft,
            borderColor: 'transparent',
          }}
        >
          {t('dashboard.health.recommendedAction')}: {recommended.title}
        </Button>
      ) : null}
    </Box>
  );
}

function FactorRow({
  factor,
  onPress,
}: {
  factor: HealthFactor;
  onPress?: () => void;
}) {
  const { t } = useTranslation();
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);
  const positive = factor.tone === 'positive';
  const Icon = positive ? CheckCircle2 : TriangleAlert;
  const color = positive ? '#059669' : '#D97706';

  return (
    <Box
      role={onPress ? 'button' : undefined}
      tabIndex={onPress ? 0 : undefined}
      onClick={onPress}
      onKeyDown={
        onPress
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onPress();
              }
            }
          : undefined
      }
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        py: 0.75,
        px: 0.5,
        borderRadius: `${DASHBOARD_UX.tileRadius}px`,
        cursor: onPress ? 'pointer' : 'default',
        '&:hover': onPress ? { bgcolor: s.elevated } : undefined,
      }}
    >
      <Icon size={16} color={color} />
      <Typography sx={{ ...DASHBOARD_UX.body, color: s.textPrimary, flex: 1 }}>
        {t(factor.labelKey, factor.labelParams)}
      </Typography>
      {onPress ? <ChevronRight size={16} color={s.textMuted} /> : null}
    </Box>
  );
}
