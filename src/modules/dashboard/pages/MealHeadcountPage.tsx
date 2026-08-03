import {
  Box,
  Button,
  Divider,
  Skeleton,
  Stack,
  Tab,
  Tabs,
  Typography,
  useTheme,
} from '@mui/material';
import { useQueries, useQuery } from '@tanstack/react-query';
import {
  Ban,
  ChevronRight,
  Info,
  Moon,
  Plus,
  RefreshCw,
  Sun,
  Sunrise,
  UtensilsCrossed,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { IconBadge } from '@/modules/dashboard/components/IconBadge';
import { DASHBOARD_UX, dashSurfaces } from '@/modules/dashboard/theme/dashboardUx';
import { mealsApi } from '@/modules/meals/api/mealsApi';
import { useDailyMenus, useMealHeadcountDay } from '@/modules/meals/hooks/useMeals';
import { formatMenuDateLabel, todayIsoDate } from '@/modules/meals/utils/mealDates';
import { Breadcrumbs } from '@/shared/components/Breadcrumbs';
import { ContentCard } from '@/shared/components/ContentCard';
import { EmptyState } from '@/shared/components/EmptyState';
import { ErrorState } from '@/shared/components/ErrorState';
import { PageContainer } from '@/shared/components/PageContainer';
import { StatusChip } from '@/shared/components/StatusChip';
import { colors } from '@/shared/theme/colors';
import { dashContainedButtonSx, dashOutlinedButtonSx } from '@/shared/theme/dashButtonSx';
import { useSpacePermissions } from '@/shared/hooks/useSpacePermissions';
import type {
  DailyMenuResponse,
  MealHeadcountDetailResponse,
  MealHeadcountOption,
  MealType,
} from '@/shared/types/meals';
import {
  ROUTES,
  spaceDashboardPath,
  spaceMealsPath,
  spaceMealsPollPath,
} from '@/routes/paths';

const MEAL_TYPES: MealType[] = ['BREAKFAST', 'LUNCH', 'DINNER'];

type TabValue = MealType | 'ALL';

const MEAL_ICONS: Record<MealType, LucideIcon> = {
  BREAKFAST: Sunrise,
  LUNCH: Sun,
  DINNER: Moon,
};

const MEAL_ACCENTS: Record<MealType, string> = {
  BREAKFAST: '#D97706',
  LUNCH: colors.primaryDark,
  DINNER: '#7C3AED',
};

function isUnavailableOption(option: MealHeadcountOption): boolean {
  return /not available/i.test(option.label);
}

function formatUpdatedAt(ms: number | undefined, locale?: string): string {
  if (!ms) return '—';
  try {
    return new Date(ms).toLocaleTimeString(locale, {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return '—';
  }
}

function hasPlannedMenu(menu: DailyMenuResponse | undefined): boolean {
  return (menu?.options?.filter((o) => o.isAvailable) ?? []).length > 0;
}

type OptionRowProps = {
  option: MealHeadcountOption;
  accent: string;
  expanded: boolean;
  onToggle: () => void;
  unavailableHint: string;
  toPrepareLabel: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  surface: string;
  hover: string;
  divider: string;
};

function OptionRow({
  option,
  accent,
  expanded,
  onToggle,
  unavailableHint,
  toPrepareLabel,
  textPrimary,
  textSecondary,
  textMuted,
  surface,
  hover,
  divider,
}: OptionRowProps) {
  const unavailable = isUnavailableOption(option);
  return (
    <Box
      role="button"
      tabIndex={0}
      onClick={onToggle}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onToggle();
        }
      }}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
        px: `${DASHBOARD_UX.cardPadding}px`,
        py: 1.25,
        borderBottom: `1px solid ${divider}`,
        bgcolor: surface,
        cursor: 'pointer',
        transition: DASHBOARD_UX.transition,
        opacity: unavailable ? 0.72 : 1,
        '&:last-of-type': { borderBottom: 0 },
        '&:hover': { bgcolor: hover },
        '&:focus-visible': {
          outline: `2px solid ${colors.primary}`,
          outlineOffset: -2,
        },
      }}
    >
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: 'minmax(0, 1fr) 88px 24px',
            md: '1.2fr 1.4fr 100px 24px',
          },
          gap: 1.5,
          alignItems: 'center',
        }}
      >
        <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center', minWidth: 0 }}>
          <IconBadge accent={unavailable ? textMuted : accent}>
            {unavailable ? <Ban /> : <UtensilsCrossed />}
          </IconBadge>
          <Typography
            sx={{
              ...DASHBOARD_UX.cardTitle,
              color: unavailable ? textMuted : textPrimary,
            }}
            noWrap
          >
            {option.label}
          </Typography>
        </Stack>
        <Box sx={{ minWidth: 0, display: { xs: 'none', md: 'block' } }}>
          <Typography sx={{ ...DASHBOARD_UX.body, color: textSecondary }} noWrap>
            {option.detail
              ? option.detail
              : unavailable
                ? unavailableHint
                : '—'}
          </Typography>
        </Box>
        <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
          <Typography
            sx={{
              ...DASHBOARD_UX.sectionHeading,
              color: unavailable ? textMuted : textPrimary,
            }}
          >
            {option.count}
          </Typography>
          <Typography sx={{ ...DASHBOARD_UX.metricCaption, color: textMuted }}>
            {toPrepareLabel}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <ChevronRight size={DASHBOARD_UX.iconSize} color={textMuted} />
        </Box>
      </Box>
      {expanded && option.members.length > 0 ? (
        <>
          <Divider sx={{ borderColor: divider }} />
          <Typography sx={{ ...DASHBOARD_UX.body, color: textSecondary }}>
            {option.members.map((m) => m.memberName).join(' · ')}
          </Typography>
        </>
      ) : null}
    </Box>
  );
}

/**
 * Meal headcount — presentation matches Dashboard mock.
 * Data/API parity unchanged (day + detail + daily menus for poll chips only).
 */
export function MealHeadcountPage() {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);
  const navigate = useNavigate();
  const { spaceId = '' } = useParams<{ spaceId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const permissions = useSpacePermissions(spaceId);
  const canManage = permissions.canManageMeals === true;
  const [expandedOptionId, setExpandedOptionId] = useState<string | null>(null);

  const menuDate = searchParams.get('date') || todayIsoDate();
  const mealParam = searchParams.get('mealType');
  const tabAll = mealParam === 'ALL';

  const day = useMealHeadcountDay(spaceId, menuDate, canManage);
  const slots = day.headcount?.slots ?? [];
  const menus = useDailyMenus(spaceId, menuDate, canManage);

  const countByType = useMemo(() => {
    const map: Partial<Record<MealType, number>> = {};
    for (const slot of slots) {
      map[slot.mealType] = slot.mealsToPrepare ?? 0;
    }
    return map;
  }, [slots]);

  const availableTypes = useMemo(() => {
    const fromSlots = slots.map((slot) => slot.mealType);
    const filtered = MEAL_TYPES.filter((type) => fromSlots.includes(type));
    return filtered.length > 0 ? filtered : MEAL_TYPES;
  }, [slots]);

  const hasAnySlot = slots.length > 0;

  const activeTab: TabValue = tabAll
    ? 'ALL'
    : mealParam && MEAL_TYPES.includes(mealParam as MealType)
      ? (mealParam as MealType)
      : availableTypes[0] ?? 'LUNCH';

  const activeMealType: MealType =
    activeTab === 'ALL' ? availableTypes[0] ?? 'LUNCH' : activeTab;

  const detailQuery = useQuery({
    queryKey: ['meal-headcount-detail', spaceId, menuDate, activeMealType],
    queryFn: () => mealsApi.getMealHeadcountDetail(spaceId, menuDate, activeMealType),
    enabled: Boolean(canManage && spaceId && hasAnySlot && activeTab !== 'ALL'),
    staleTime: 15_000,
  });

  const allDetailQueries = useQueries({
    queries: MEAL_TYPES.map((mealType) => ({
      queryKey: ['meal-headcount-detail', spaceId, menuDate, mealType],
      queryFn: () => mealsApi.getMealHeadcountDetail(spaceId, menuDate, mealType),
      enabled: Boolean(canManage && spaceId && hasAnySlot && activeTab === 'ALL'),
      staleTime: 15_000,
    })),
  });

  const pollSummary = useMemo(() => {
    let shared = 0;
    let notShared = 0;
    let empty = 0;
    for (const mealType of MEAL_TYPES) {
      const menu = menus.menus.find((row) => row.mealType === mealType);
      if (!hasPlannedMenu(menu)) empty += 1;
      else if (menu?.status === 'PUBLISHED') shared += 1;
      else notShared += 1;
    }
    return { shared, notShared, empty };
  }, [menus.menus]);

  const totalMeals = useMemo(
    () => slots.reduce((sum, slot) => sum + (slot.mealsToPrepare ?? 0), 0),
    [slots],
  );

  if (!spaceId) {
    return <Navigate to={ROUTES.root} replace />;
  }

  if (!canManage) {
    return <Navigate to={spaceDashboardPath(spaceId)} replace />;
  }

  const setTab = (value: TabValue) => {
    const next = new URLSearchParams(searchParams);
    next.set('date', menuDate);
    if (value === 'ALL') next.set('mealType', 'ALL');
    else next.set('mealType', value);
    setSearchParams(next, { replace: true });
    setExpandedOptionId(null);
  };

  const refreshAll = async () => {
    await Promise.all([
      day.reload(),
      menus.reload(),
      detailQuery.refetch(),
      ...allDetailQueries.map((q) => q.refetch()),
    ]);
  };

  const goPlan = () => navigate(spaceMealsPath(spaceId, menuDate));
  const goPoll = () => navigate(spaceMealsPollPath(spaceId, menuDate));

  const detail = detailQuery.data;
  const pollOpen = detail?.pollStatus !== 'CLOSED';
  const lastUpdatedMs =
    activeTab === 'ALL'
      ? Math.max(0, ...allDetailQueries.map((q) => q.dataUpdatedAt || 0)) || undefined
      : detailQuery.dataUpdatedAt || undefined;

  const toPrepareLabel = t('dashboard.headcount.toPrepare', { defaultValue: 'To prepare' });
  const unavailableHint = t('dashboard.headcount.unavailableHint', {
    defaultValue: 'Marked as not available',
  });

  const renderMealDetailCard = (
    mealType: MealType,
    mealDetail: MealHeadcountDetailResponse | undefined,
    loading: boolean,
    error: Error | null,
    onRetry: () => void,
  ) => {
    const Icon = MEAL_ICONS[mealType];
    const accent = MEAL_ACCENTS[mealType];
    const open = mealDetail?.pollStatus !== 'CLOSED';

    if (loading) {
      return (
        <ContentCard key={mealType}>
          <Stack spacing={1.5}>
            <Skeleton variant="rounded" height={64} />
            <Skeleton variant="rounded" height={72} />
          </Stack>
        </ContentCard>
      );
    }

    if (error) {
      return (
        <ErrorState
          key={mealType}
          title={t('common.errors.generic')}
          message={error.message}
          onRetry={onRetry}
        />
      );
    }

    if (!mealDetail) return null;

    return (
      <ContentCard key={mealType} padded={false}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={2}
          sx={{
            alignItems: { md: 'center' },
            justifyContent: 'space-between',
            p: `${DASHBOARD_UX.cardPadding}px`,
            borderBottom: `1px solid ${s.divider}`,
          }}
        >
          <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', minWidth: 0 }}>
            <IconBadge accent={accent}>
              <Icon />
            </IconBadge>
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
              <Typography sx={{ ...DASHBOARD_UX.cardTitle, color: s.textPrimary }}>
                {t(`meals.mealType.${mealType}`)}
              </Typography>
              <StatusChip
                label={
                  open
                    ? t('dashboard.operations.pollOpen')
                    : t('dashboard.operations.pollClosed')
                }
                tone={open ? 'success' : 'neutral'}
              />
            </Stack>
          </Stack>

          <Box sx={{ textAlign: { xs: 'left', md: 'center' }, minWidth: 120 }}>
            <Typography sx={{ ...DASHBOARD_UX.largeNumber, color: s.textPrimary }}>
              {mealDetail.mealsToPrepare} / {mealDetail.eligibleCount}
            </Typography>
            <Typography sx={{ ...DASHBOARD_UX.metricCaption, color: s.textMuted, mt: 0.25 }}>
              {t('dashboard.headcount.collectedExpected', {
                defaultValue: 'Headcount collected / Expected',
              })}
            </Typography>
          </Box>

          <Button
            variant="outlined"
            endIcon={<ChevronRight size={DASHBOARD_UX.iconSize} />}
            onClick={goPoll}
            sx={{
              ...dashOutlinedButtonSx,
              height: DASHBOARD_UX.buttonHeight,
              flexShrink: 0,
            }}
          >
            {t('dashboard.headcount.viewPollResults', {
              defaultValue: 'View poll results',
            })}
          </Button>
        </Stack>

        {/* Column headers — desktop */}
        <Box
          sx={{
            display: { xs: 'none', md: 'grid' },
            gridTemplateColumns: '1.2fr 1.4fr 100px 24px',
            gap: 1.5,
            px: `${DASHBOARD_UX.cardPadding}px`,
            py: 1,
            bgcolor: s.elevated,
            borderBottom: `1px solid ${s.divider}`,
          }}
        >
          <Typography sx={{ ...DASHBOARD_UX.metricLabel, color: s.textMuted }}>
            {t('dashboard.headcount.colMenuItem', { defaultValue: 'Menu item' })}
          </Typography>
          <Typography sx={{ ...DASHBOARD_UX.metricLabel, color: s.textMuted }}>
            {t('dashboard.headcount.colDescription', { defaultValue: 'Description' })}
          </Typography>
          <Typography sx={{ ...DASHBOARD_UX.metricLabel, color: s.textMuted, textAlign: 'right' }}>
            {t('dashboard.headcount.label', { defaultValue: 'Headcount' })}
          </Typography>
          <Box />
        </Box>

        {mealDetail.options.map((option) => (
          <OptionRow
            key={option.optionId}
            option={option}
            accent={accent}
            expanded={expandedOptionId === option.optionId}
            onToggle={() =>
              setExpandedOptionId(
                expandedOptionId === option.optionId ? null : option.optionId,
              )
            }
            unavailableHint={unavailableHint}
            toPrepareLabel={toPrepareLabel}
            textPrimary={s.textPrimary}
            textSecondary={s.textSecondary}
            textMuted={s.textMuted}
            surface={s.surface}
            hover={s.hover}
            divider={s.divider}
          />
        ))}

        <Box sx={{ p: `${DASHBOARD_UX.cardPadding}px` }}>
          <Button
            fullWidth
            variant="outlined"
            startIcon={<Plus size={DASHBOARD_UX.iconSize} />}
            onClick={goPlan}
            sx={{
              ...dashOutlinedButtonSx,
              height: DASHBOARD_UX.buttonHeight + 8,
              borderStyle: 'dashed',
              color: colors.primaryDark,
              borderColor: `${colors.primary}99`,
              '&:hover': {
                borderStyle: 'dashed',
                bgcolor: s.hover,
                borderColor: colors.primaryDark,
              },
            }}
          >
            {t('dashboard.headcount.addItemToMeal', {
              defaultValue: 'Add item to {{meal}}',
              meal: t(`meals.mealType.${mealType}`),
            })}
          </Button>
        </Box>

        {mealDetail.deliveryBreakdown && mealDetail.deliveryBreakdown.length > 0 ? (
          <Box sx={{ px: `${DASHBOARD_UX.cardPadding}px`, pb: `${DASHBOARD_UX.cardPadding}px` }}>
            <Typography sx={{ ...DASHBOARD_UX.sectionHeading, color: s.textPrimary, mb: 1 }}>
              {t('dashboard.headcount.byLocation', { defaultValue: 'By serving location' })}
            </Typography>
            <Stack spacing={1}>
              {mealDetail.deliveryBreakdown.map((loc) => (
                <Stack
                  key={loc.locationId}
                  direction="row"
                  sx={{
                    justifyContent: 'space-between',
                    py: 0.75,
                    px: 1,
                    borderRadius: `${DASHBOARD_UX.tileRadius}px`,
                    bgcolor: s.elevated,
                    border: `1px solid ${s.border}`,
                  }}
                >
                  <Typography sx={{ ...DASHBOARD_UX.body, color: s.textPrimary }}>
                    {loc.locationName}
                  </Typography>
                  <Typography sx={{ ...DASHBOARD_UX.cardTitle, color: s.textPrimary }}>
                    {loc.totalPlates}
                  </Typography>
                </Stack>
              ))}
            </Stack>
          </Box>
        ) : null}

        {mealDetail.noResponseMembers.length > 0 ? (
          <Box sx={{ px: `${DASHBOARD_UX.cardPadding}px`, pb: `${DASHBOARD_UX.cardPadding}px` }}>
            <Typography sx={{ ...DASHBOARD_UX.sectionHeading, color: s.textPrimary, mb: 1 }}>
              {t('dashboard.headcount.noResponse', { defaultValue: 'No response' })}
            </Typography>
            <Typography sx={{ ...DASHBOARD_UX.body, color: s.textSecondary }}>
              {mealDetail.noResponseMembers.map((m) => m.memberName).join(' · ')}
            </Typography>
          </Box>
        ) : null}
      </ContentCard>
    );
  };

  return (
    <PageContainer gap={0}>
      <Stack spacing={`${DASHBOARD_UX.sectionGap}px`} sx={{ width: '100%', pb: 2 }}>
        {/* Header */}
        <Box>
          <Breadcrumbs
            items={[
              { label: t('navigation.dashboard'), to: spaceDashboardPath(spaceId) },
              { label: t('dashboard.headcount.title', { defaultValue: 'Meal headcount' }) },
            ]}
          />
          <Box
            sx={{
              display: 'flex',
              alignItems: { xs: 'stretch', sm: 'flex-start' },
              justifyContent: 'space-between',
              gap: 2,
              flexDirection: { xs: 'column', sm: 'row' },
              mt: 0.75,
            }}
          >
            <Box sx={{ minWidth: 0 }}>
              <Typography component="h1" sx={{ ...DASHBOARD_UX.pageTitle, color: s.textPrimary }}>
                {t('dashboard.headcount.title', { defaultValue: 'Meal headcount' })}
              </Typography>
              <Typography sx={{ ...DASHBOARD_UX.greetingSub, color: s.textSecondary, mt: 0.5 }}>
                {t('dashboard.headcount.forDate', {
                  defaultValue: 'Meals to prepare for {{date}}',
                  date: formatMenuDateLabel(menuDate, i18n.language),
                })}
              </Typography>
            </Box>
            <Button
              variant="contained"
              onClick={goPlan}
              endIcon={<ChevronRight size={DASHBOARD_UX.iconSize} />}
              sx={{ ...dashContainedButtonSx, height: DASHBOARD_UX.buttonHeight, flexShrink: 0 }}
            >
              {t('dashboard.mealOperations.planMenu')} →
            </Button>
          </Box>
        </Box>

        {day.loading && !hasAnySlot ? (
          <ContentCard>
            <Stack spacing={2}>
              <Skeleton variant="rounded" height={72} />
              <Skeleton variant="rounded" height={48} />
              <Skeleton variant="rounded" height={120} />
            </Stack>
          </ContentCard>
        ) : null}

        {!day.loading && !hasAnySlot ? (
          <ContentCard>
            <EmptyState
              icon={<UtensilsCrossed size={28} />}
              title={t('dashboard.headcount.emptyTitle', { defaultValue: 'No headcount yet' })}
              description={t('dashboard.headcount.emptyBody', {
                defaultValue: 'Share a meal menu to start collecting responses and headcount.',
              })}
              action={
                <Button variant="contained" onClick={goPlan} sx={dashContainedButtonSx}>
                  {t('dashboard.mealOperations.planMenu')} →
                </Button>
              }
            />
          </ContentCard>
        ) : null}

        {hasAnySlot ? (
          <>
            {/* Summary — 4 tiles */}
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: {
                  xs: '1fr',
                  sm: '1fr 1fr',
                  lg: 'repeat(4, minmax(0, 1fr))',
                },
                gap: `${DASHBOARD_UX.cardGap}px`,
              }}
            >
              <ContentCard>
                <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                  <IconBadge accent={colors.primaryDark}>
                    <UtensilsCrossed />
                  </IconBadge>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography sx={{ ...DASHBOARD_UX.metricLabel, color: s.textSecondary }}>
                      {t('dashboard.headcount.totalMeals', {
                        defaultValue: 'Total meals to prepare',
                      })}
                    </Typography>
                    <Typography sx={{ ...DASHBOARD_UX.largeNumber, color: s.textPrimary }}>
                      {totalMeals}
                    </Typography>
                    <Typography sx={{ ...DASHBOARD_UX.metricCaption, color: s.textMuted }}>
                      {t('dashboard.headcount.acrossAll', { defaultValue: 'Across all meals' })}
                    </Typography>
                  </Box>
                </Stack>
              </ContentCard>

              {MEAL_TYPES.map((mealType) => {
                const Icon = MEAL_ICONS[mealType];
                const accent = MEAL_ACCENTS[mealType];
                return (
                  <ContentCard
                    key={mealType}
                    onClick={() => setTab(mealType)}
                    selected={activeTab === mealType}
                  >
                    <Stack spacing={0.5}>
                      <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center' }}>
                        <Box sx={{ color: accent, display: 'flex' }}>
                          <Icon size={DASHBOARD_UX.iconSize} strokeWidth={2} />
                        </Box>
                        <Typography sx={{ ...DASHBOARD_UX.metricLabel, color: s.textSecondary }}>
                          {t(`meals.mealType.${mealType}`)}
                        </Typography>
                      </Stack>
                      <Typography sx={{ ...DASHBOARD_UX.largeNumber, color: accent }}>
                        {countByType[mealType] ?? 0}
                      </Typography>
                      <Typography sx={{ ...DASHBOARD_UX.metricCaption, color: s.textMuted }}>
                        {toPrepareLabel}
                      </Typography>
                    </Stack>
                  </ContentCard>
                );
              })}
            </Box>

            {/* Main + right rail */}
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1fr) 280px' },
                gap: `${DASHBOARD_UX.sectionGap}px`,
                alignItems: 'start',
              }}
            >
              <Stack spacing={`${DASHBOARD_UX.cardGap}px`} sx={{ minWidth: 0 }}>
                {/* Tabs */}
                <Box
                  sx={{
                    position: 'sticky',
                    top: 0,
                    zIndex: 2,
                    bgcolor: s.pageBg,
                    borderBottom: `1px solid ${s.divider}`,
                  }}
                >
                  <Tabs
                    value={activeTab}
                    onChange={(_, value: TabValue) => setTab(value)}
                    variant="scrollable"
                    scrollButtons="auto"
                    sx={{
                      minHeight: DASHBOARD_UX.buttonHeight + 8,
                      '& .MuiTab-root': {
                        ...DASHBOARD_UX.button,
                        textTransform: 'none',
                        minHeight: DASHBOARD_UX.buttonHeight + 8,
                        color: s.textMuted,
                      },
                      '& .Mui-selected': {
                        color: `${colors.primaryDark} !important`,
                      },
                      '& .MuiTabs-indicator': {
                        backgroundColor: colors.primary,
                        height: 3,
                        borderRadius: 2,
                      },
                    }}
                  >
                    {MEAL_TYPES.map((mealType) => (
                      <Tab
                        key={mealType}
                        value={mealType}
                        label={`${t(`meals.mealType.${mealType}`)} (${countByType[mealType] ?? 0})`}
                      />
                    ))}
                    <Tab
                      value="ALL"
                      label={t('dashboard.headcount.allMeals', { defaultValue: 'All meals' })}
                    />
                  </Tabs>
                </Box>

                {activeTab === 'ALL'
                  ? MEAL_TYPES.map((mealType, index) => {
                      const q = allDetailQueries[index];
                      return renderMealDetailCard(
                        mealType,
                        q?.data,
                        Boolean(q?.isLoading),
                        q?.error instanceof Error ? q.error : null,
                        () => void q?.refetch(),
                      );
                    })
                  : renderMealDetailCard(
                      activeMealType,
                      detail,
                      detailQuery.isLoading,
                      detailQuery.error instanceof Error ? detailQuery.error : null,
                      () => void detailQuery.refetch(),
                    )}
              </Stack>

              {/* Right widgets */}
              <Stack
                spacing={`${DASHBOARD_UX.cardGap}px`}
                sx={{ position: { lg: 'sticky' }, top: { lg: 8 } }}
              >
                <ContentCard>
                  <Typography sx={{ ...DASHBOARD_UX.cardTitle, color: s.textPrimary, mb: 0.5 }}>
                    {t('dashboard.headcount.daySummary', { defaultValue: 'Day summary' })}
                  </Typography>
                  <Typography sx={{ ...DASHBOARD_UX.metricCaption, color: s.textMuted, mb: 1.5 }}>
                    {formatMenuDateLabel(menuDate, i18n.language)}
                  </Typography>
                  <Stack spacing={1.25}>
                    {MEAL_TYPES.map((mealType) => {
                      const accent = MEAL_ACCENTS[mealType];
                      return (
                        <Stack
                          key={mealType}
                          direction="row"
                          sx={{ alignItems: 'center', justifyContent: 'space-between' }}
                        >
                          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                            <Box
                              sx={{
                                width: 8,
                                height: 8,
                                borderRadius: '50%',
                                bgcolor: accent,
                                flexShrink: 0,
                              }}
                            />
                            <Typography sx={{ ...DASHBOARD_UX.body, color: s.textPrimary }}>
                              {t(`meals.mealType.${mealType}`)}
                            </Typography>
                          </Stack>
                          <Typography sx={{ ...DASHBOARD_UX.link, color: accent }}>
                            {countByType[mealType] ?? 0}{' '}
                            <Box component="span" sx={{ ...DASHBOARD_UX.metricCaption, color: s.textMuted }}>
                              {toPrepareLabel}
                            </Box>
                          </Typography>
                        </Stack>
                      );
                    })}
                  </Stack>
                </ContentCard>

                <ContentCard>
                  <Typography sx={{ ...DASHBOARD_UX.cardTitle, color: s.textPrimary, mb: 1.5 }}>
                    {t('dashboard.headcount.todaysPollStatus', {
                      defaultValue: "Today's poll status",
                    })}
                  </Typography>
                  <Stack spacing={1}>
                    {(
                      [
                        {
                          key: 'shared',
                          label: t('dashboard.todaysOverview.shared', { defaultValue: 'Shared' }),
                          value: pollSummary.shared,
                          color: colors.success,
                        },
                        {
                          key: 'notShared',
                          label: t('dashboard.todaysOverview.notShared', {
                            defaultValue: 'Not shared',
                          }),
                          value: pollSummary.notShared,
                          color: '#D97706',
                        },
                        {
                          key: 'empty',
                          label: t('dashboard.todaysOverview.empty', { defaultValue: 'Empty' }),
                          value: pollSummary.empty,
                          color: s.textMuted,
                        },
                      ] as const
                    ).map((row) => (
                      <Stack
                        key={row.key}
                        direction="row"
                        sx={{ justifyContent: 'space-between', alignItems: 'center' }}
                      >
                        <Typography sx={{ ...DASHBOARD_UX.body, color: s.textSecondary }}>
                          {row.label}
                        </Typography>
                        <Typography sx={{ ...DASHBOARD_UX.cardTitle, color: row.color }}>
                          {row.value}
                        </Typography>
                      </Stack>
                    ))}
                  </Stack>
                  <Divider sx={{ borderColor: s.divider, my: 1.5 }} />
                  <Stack
                    direction="row"
                    sx={{ justifyContent: 'space-between', alignItems: 'center', gap: 1 }}
                  >
                    <Typography sx={{ ...DASHBOARD_UX.metricCaption, color: s.textMuted }}>
                      {t('dashboard.headcount.lastUpdated', {
                        defaultValue: 'Last updated: {{time}}',
                        time: formatUpdatedAt(lastUpdatedMs, i18n.language),
                      })}
                    </Typography>
                    <Button
                      size="small"
                      startIcon={<RefreshCw size={DASHBOARD_UX.iconSize} />}
                      onClick={() => void refreshAll()}
                      sx={{ ...dashOutlinedButtonSx, height: DASHBOARD_UX.buttonHeight }}
                    >
                      {t('common.refresh')}
                    </Button>
                  </Stack>
                </ContentCard>
              </Stack>
            </Box>

            {/* Footer */}
            <Box
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                alignItems: { sm: 'center' },
                justifyContent: 'space-between',
                gap: 1.25,
                p: `${DASHBOARD_UX.cardPadding}px`,
                borderRadius: `${DASHBOARD_UX.radius}px`,
                border: `1px solid ${s.border}`,
                bgcolor: s.successTint,
              }}
            >
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center', minWidth: 0 }}>
                <Info size={DASHBOARD_UX.iconSize} color={colors.primaryDark} />
                <Typography sx={{ ...DASHBOARD_UX.body, color: s.textSecondary }}>
                  {t('dashboard.headcount.basedOnResponses', {
                    defaultValue: 'Numbers are based on confirmed poll responses so far.',
                  })}
                </Typography>
              </Stack>
              <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', flexShrink: 0 }}>
                <Typography sx={{ ...DASHBOARD_UX.metricCaption, color: s.textMuted }}>
                  {t('dashboard.headcount.lastUpdated', {
                    defaultValue: 'Last updated: {{time}}',
                    time: formatUpdatedAt(lastUpdatedMs, i18n.language),
                  })}
                </Typography>
                <Button
                  size="small"
                  startIcon={<RefreshCw size={DASHBOARD_UX.iconSize} />}
                  onClick={() => void refreshAll()}
                  sx={{ ...dashOutlinedButtonSx, height: DASHBOARD_UX.buttonHeight }}
                >
                  {t('common.refresh')}
                </Button>
              </Stack>
            </Box>
          </>
        ) : null}
      </Stack>
    </PageContainer>
  );
}
