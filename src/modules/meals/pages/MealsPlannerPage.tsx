import {
  Box,
  Button,
  Grid,
  IconButton,
  Stack,
  Typography,
  useTheme,
} from '@mui/material';
import {
  BookOpen,
  CalendarDays,
  MapPinned,
  PieChart,
  Plus,
  RefreshCw,
  Share2,
  Users,
} from 'lucide-react';
import { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { IconBadge } from '@/modules/dashboard/components/IconBadge';
import { DASHBOARD_UX, dashSurfaces } from '@/modules/dashboard/theme/dashboardUx';
import { Breadcrumbs } from '@/shared/components/Breadcrumbs';
import { ContentCard } from '@/shared/components/ContentCard';
import { PageContainer } from '@/shared/components/PageContainer';
import { PeriodDayNav } from '@/shared/components/PeriodDayNav';
import { StatCard } from '@/shared/components/StatCard';
import { LoadingState } from '@/shared/components/LoadingState';
import { ErrorState } from '@/shared/components/ErrorState';
import { colors } from '@/shared/theme/colors';
import { dashContainedButtonSx, dashOutlinedButtonSx } from '@/shared/theme/dashButtonSx';
import { useSpacePermissions } from '@/shared/hooks/useSpacePermissions';
import {
  spaceMealsEditPath,
  spaceMealsLibraryPath,
  spaceMealsLocationsPath,
  spaceMealsParticipationPath,
  spaceMealsPlansPath,
  spaceMealsSharePath,
} from '@/routes/paths';
import type { MealType } from '@/shared/types/meals';
import { MealSlotCard } from '../components/MealSlotCard';
import {
  useDailyMenus,
  useEligibilitySummary,
  useMealHeadcountDay,
  useMealMutations,
  useMealPolls,
} from '../hooks/useMeals';
import { addDaysIso, formatMenuDateLabel, MEAL_TYPES, todayIsoDate } from '../utils/mealDates';

const navPillSx = {
  ...dashOutlinedButtonSx,
  ...DASHBOARD_UX.button,
  color: colors.primaryDark,
  borderColor: `${colors.primaryDark}55`,
  px: 1.5,
  minHeight: DASHBOARD_UX.buttonHeight,
  '&:hover': {
    borderColor: colors.primaryDark,
    bgcolor: `${colors.primaryDark}0F`,
  },
} as const;

function mealStatusTone(status: 'empty' | 'shared' | 'notShared'): string {
  if (status === 'shared') return colors.success;
  if (status === 'notShared') return colors.warning;
  return '#94A3B8';
}

export function MealsPlannerPage() {
  const { t } = useTranslation();
  const { spaceId = '' } = useParams<{ spaceId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);
  const permissions = useSpacePermissions(spaceId);
  const canManage = permissions.canManageMeals === true;
  const mutations = useMealMutations(spaceId);

  const focusDate = searchParams.get('date') || todayIsoDate();

  useEffect(() => {
    document.title = `${t('navigation.meals')} · ${t('common.appName')}`;
  }, [t]);

  const dayMenus = useDailyMenus(spaceId, focusDate, permissions.canViewMeals);
  const dayPolls = useMealPolls(spaceId, focusDate, permissions.canViewMeals);
  const eligibility = useEligibilitySummary(spaceId, focusDate, canManage);
  const headcount = useMealHeadcountDay(spaceId, focusDate, canManage);

  const loading = dayMenus.loading && dayMenus.menus.length === 0;

  const menuByType = useMemo(() => {
    return Object.fromEntries(dayMenus.menus.map((m) => [m.mealType, m])) as Partial<
      Record<MealType, (typeof dayMenus.menus)[number]>
    >;
  }, [dayMenus.menus]);

  const pollByType = useMemo(() => {
    return Object.fromEntries((dayPolls.pollDay?.polls ?? []).map((p) => [p.mealType, p])) as Partial<
      Record<MealType, NonNullable<typeof dayPolls.pollDay>['polls'][number]>
    >;
  }, [dayPolls.pollDay]);

  const headcountByType = useMemo(() => {
    const map: Partial<Record<MealType, number>> = {};
    for (const slot of headcount.headcount?.slots ?? []) {
      map[slot.mealType] = slot.mealsToPrepare;
    }
    return map;
  }, [headcount.headcount]);

  const mealStatuses = useMemo(() => {
    return MEAL_TYPES.map((mealType) => {
      const menu = menuByType[mealType];
      const options = menu?.options?.filter((o) => o.isAvailable) ?? [];
      let kind: 'empty' | 'shared' | 'notShared' = 'empty';
      if (options.length > 0) {
        kind = menu?.status === 'PUBLISHED' ? 'shared' : 'notShared';
      }
      return { mealType, kind };
    });
  }, [menuByType]);

  const dayStrip = useMemo(() => {
    let shared = 0;
    let notShared = 0;
    let empty = 0;
    for (const row of mealStatuses) {
      if (row.kind === 'empty') empty += 1;
      else if (row.kind === 'shared') shared += 1;
      else notShared += 1;
    }
    return { shared, notShared, empty };
  }, [mealStatuses]);

  const openPollCount =
    dayPolls.pollDay?.polls.filter((p) => p.status === 'OPEN').length ?? 0;

  const publishedSlots =
    eligibility.summary?.slots.filter((slot) => slot.published).length ??
    dayMenus.menus.filter((m) => m.status === 'PUBLISHED').length;

  const shiftDate = (delta: number) => {
    setSearchParams({ date: addDaysIso(focusDate, delta) });
  };

  const runAction = async (fn: () => Promise<unknown>, successKey: string) => {
    try {
      await fn();
      enqueueSnackbar(t(successKey), { variant: 'success' });
    } catch {
      enqueueSnackbar(t('common.errors.generic'), { variant: 'error' });
    }
  };

  const reloadAll = () => {
    void dayMenus.reload();
    void dayPolls.reload();
    void eligibility.reload();
    void headcount.reload();
  };

  if (dayMenus.error) {
    return (
      <PageContainer>
        <ErrorState
          title={t('common.errors.generic')}
          message={t('common.errors.server')}
          onRetry={() => void dayMenus.reload()}
          retryLabel={t('common.retry')}
        />
      </PageContainer>
    );
  }

  const dateLabel = formatMenuDateLabel(focusDate);

  return (
    <PageContainer gap={0}>
      <Stack spacing={`${DASHBOARD_UX.sectionGap + 2}px`} sx={{ width: '100%' }}>
        {/* Header */}
        <Box>
          <Breadcrumbs
            items={[
              { label: permissions.space?.spaceName ?? t('navigation.space') },
              { label: t('navigation.meals') },
              { label: t('meals.planning.title') },
            ]}
          />
          <Box
            sx={{
              mt: 1,
              display: 'grid',
              gap: 1.5,
              alignItems: 'center',
              gridTemplateColumns: {
                xs: '1fr',
                lg: 'minmax(0, 1fr) auto auto',
              },
            }}
          >
            <Box sx={{ minWidth: 0 }}>
              <Typography component="h1" sx={{ ...DASHBOARD_UX.pageTitle, color: s.textPrimary }}>
                {t('meals.planning.title')}
              </Typography>
              <Typography sx={{ ...DASHBOARD_UX.greetingSub, color: s.textSecondary, mt: 0.5 }}>
                {t('meals.planning.subtitle')}
              </Typography>
            </Box>

            <PeriodDayNav
              date={focusDate}
              onPrevious={() => shiftDate(-1)}
              onNext={() => shiftDate(1)}
              onDateSelect={(next) => setSearchParams({ date: next })}
              label={formatMenuDateLabel(focusDate)}
            />

            <Stack
              direction="row"
              spacing={1}
              useFlexGap
              sx={{
                alignItems: 'center',
                justifyContent: { xs: 'flex-start', lg: 'flex-end' },
                flexWrap: 'wrap',
              }}
            >
              <IconButton
                size="small"
                aria-label={t('common.refresh')}
                onClick={reloadAll}
                sx={{
                  width: DASHBOARD_UX.buttonHeight,
                  height: DASHBOARD_UX.buttonHeight,
                  border: `1px solid ${s.border}`,
                  borderRadius: `${DASHBOARD_UX.buttonRadius}px`,
                  bgcolor: s.surface,
                }}
              >
                <RefreshCw size={DASHBOARD_UX.iconSize} />
              </IconButton>
              {canManage ? (
                <Button
                  size="small"
                  variant="contained"
                  startIcon={<Share2 size={DASHBOARD_UX.iconSize} />}
                  onClick={() => navigate(spaceMealsSharePath(spaceId, focusDate))}
                  sx={{
                    ...dashContainedButtonSx,
                    ...DASHBOARD_UX.button,
                    minHeight: DASHBOARD_UX.buttonHeight,
                    height: DASHBOARD_UX.buttonHeight,
                    px: `${DASHBOARD_UX.buttonPx}px`,
                    bgcolor: colors.primaryDark,
                    '&:hover': { bgcolor: colors.primaryHover },
                  }}
                >
                  {t('meals.planning.share')}
                </Button>
              ) : null}
            </Stack>
          </Box>
        </Box>

        {/* Secondary nav */}
        {canManage ? (
          <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
            <Button
              size="small"
              startIcon={<BookOpen size={DASHBOARD_UX.iconSize} />}
              onClick={() => navigate(spaceMealsLibraryPath(spaceId))}
              sx={navPillSx}
            >
              {t('meals.library.title')}
            </Button>
            <Button
              size="small"
              startIcon={<Users size={DASHBOARD_UX.iconSize} />}
              onClick={() => navigate(spaceMealsPlansPath(spaceId))}
              sx={navPillSx}
            >
              {t('meals.subscriptionPlans.title')}
            </Button>
            <Button
              size="small"
              startIcon={<Users size={DASHBOARD_UX.iconSize} />}
              onClick={() => navigate(spaceMealsParticipationPath(spaceId))}
              sx={navPillSx}
            >
              {t('meals.participation.title')}
            </Button>
            <Button
              size="small"
              startIcon={<MapPinned size={DASHBOARD_UX.iconSize} />}
              onClick={() => navigate(spaceMealsLocationsPath(spaceId))}
              sx={navPillSx}
            >
              {t('meals.deliveryLocations.title')}
            </Button>
          </Stack>
        ) : null}

        {/* Stats */}
        {canManage ? (
          <Grid container spacing={1.5}>
            <Grid size={{ xs: 12, sm: 4 }}>
              <StatCard
                label={t('meals.planning.eligible')}
                value={eligibility.summary?.distinctEligibleMemberCount ?? '—'}
                hint={t('meals.planning.membersShort')}
                icon={
                  <IconBadge accent={colors.success}>
                    <Users />
                  </IconBadge>
                }
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <StatCard
                label={t('meals.planning.publishedSlots')}
                value={publishedSlots}
                hint={t('meals.planning.filterShared')}
                icon={
                  <IconBadge accent="#2563EB">
                    <CalendarDays />
                  </IconBadge>
                }
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <StatCard
                label={t('meals.planning.openPolls')}
                value={openPollCount}
                hint={t('meals.poll.open')}
                icon={
                  <IconBadge accent={colors.warning}>
                    <PieChart />
                  </IconBadge>
                }
              />
            </Grid>
          </Grid>
        ) : null}

        {loading ? (
          <LoadingState />
        ) : (
          <Box
            sx={{
              display: 'grid',
              gap: `${DASHBOARD_UX.sectionGap}px`,
              alignItems: 'start',
              gridTemplateColumns: {
                xs: '1fr',
                lg: canManage ? 'minmax(0, 3fr) minmax(260px, 1fr)' : '1fr',
              },
            }}
          >
            {/* Selected day — full width for meals */}
            <ContentCard>
              <Box sx={{ mb: 2 }}>
                <Typography sx={{ ...DASHBOARD_UX.sectionHeading, color: s.textPrimary }}>
                  {dateLabel}
                </Typography>
                <Typography sx={{ ...DASHBOARD_UX.sectionSubtitle, color: s.textMuted, mt: 0.35 }}>
                  {t('meals.planning.selectedDaySubtitle', {
                    defaultValue: 'Plan your menu for the day',
                  })}
                </Typography>
              </Box>

              <Stack spacing={`${DASHBOARD_UX.cardGap + 4}px`}>
                {MEAL_TYPES.map((mealType) => (
                  <MealSlotCard
                    key={`${focusDate}-${mealType}`}
                    mealType={mealType}
                    menu={menuByType[mealType]}
                    poll={pollByType[mealType]}
                    headcount={headcountByType[mealType] ?? null}
                    canManage={canManage}
                    onEdit={() =>
                      navigate(
                        spaceMealsEditPath(spaceId, {
                          date: focusDate,
                          mealType,
                        }),
                      )
                    }
                    onShare={() => navigate(spaceMealsSharePath(spaceId, focusDate))}
                    onPublish={() =>
                      void runAction(
                        () =>
                          mutations.publishDailyMenu.mutateAsync({
                            menuDate: focusDate,
                            mealType,
                          }),
                        'meals.planning.publishSuccess',
                      )
                    }
                    onOpenPoll={() =>
                      void runAction(
                        () =>
                          mutations.openMealPoll.mutateAsync({
                            menuDate: focusDate,
                            mealType,
                          }),
                        'meals.poll.openSuccess',
                      )
                    }
                    onClosePoll={() =>
                      void runAction(
                        () =>
                          mutations.closeMealPoll.mutateAsync({
                            menuDate: focusDate,
                            mealType,
                          }),
                        'meals.poll.closeSuccess',
                      )
                    }
                  />
                ))}
              </Stack>

              {canManage ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2.5 }}>
                  <Button
                    startIcon={<Plus size={DASHBOARD_UX.iconSize} />}
                    onClick={() => shiftDate(1)}
                    sx={{
                      ...dashOutlinedButtonSx,
                      ...DASHBOARD_UX.button,
                      color: colors.primaryDark,
                      borderColor: `${colors.primaryDark}66`,
                      px: `${DASHBOARD_UX.buttonPx}px`,
                      minHeight: DASHBOARD_UX.buttonHeight,
                      '&:hover': {
                        borderColor: colors.primaryDark,
                        bgcolor: `${colors.primaryDark}0F`,
                      },
                    }}
                  >
                    {t('meals.planning.planForAnotherDay', {
                      defaultValue: 'Plan for another day',
                    })}
                  </Button>
                </Box>
              ) : null}
            </ContentCard>

            {/* Day summary */}
            {canManage ? (
              <ContentCard>
                <Typography sx={{ ...DASHBOARD_UX.sectionHeading, color: s.textPrimary }}>
                  {t('meals.planning.inspector')}
                </Typography>
                <Typography sx={{ ...DASHBOARD_UX.metricLabel, color: s.textSecondary, mt: 0.35 }}>
                  {dateLabel}
                </Typography>

                <Stack spacing={1.25} sx={{ mt: 2, mb: 2 }}>
                  {mealStatuses.map(({ mealType, kind }) => (
                    <Stack
                      key={mealType}
                      direction="row"
                      spacing={1}
                      sx={{ alignItems: 'center', justifyContent: 'space-between' }}
                    >
                      <Stack direction="row" spacing={1} sx={{ alignItems: 'center', minWidth: 0 }}>
                        <Box
                          sx={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            bgcolor: mealStatusTone(kind),
                            flexShrink: 0,
                          }}
                        />
                        <Typography sx={{ ...DASHBOARD_UX.cardTitle, color: s.textPrimary }}>
                          {t(`meals.mealType.${mealType}`)}
                        </Typography>
                      </Stack>
                      <Typography sx={{ ...DASHBOARD_UX.metricLabel, color: s.textMuted }}>
                        {kind === 'empty'
                          ? t('meals.planning.emptySlot')
                          : kind === 'shared'
                            ? t('meals.planning.filterShared')
                            : t('meals.planning.filterNotShared')}
                      </Typography>
                    </Stack>
                  ))}
                </Stack>

                <Typography sx={{ ...DASHBOARD_UX.body, color: s.textSecondary, mb: 1.5 }}>
                  {t('meals.planning.inspectorHint')}
                </Typography>

                <Box
                  sx={{
                    p: `${DASHBOARD_UX.cardPadding}px`,
                    borderRadius: `${DASHBOARD_UX.tileRadius}px`,
                    border: `1px solid ${s.border}`,
                    bgcolor: theme.palette.mode === 'dark' ? s.elevated : `${colors.primary}0A`,
                    mb: 1.5,
                  }}
                >
                  <Typography sx={{ ...DASHBOARD_UX.metricLabel, color: s.textMuted, mb: 0.5 }}>
                    {t('meals.planning.dayOverviewTitle')}
                  </Typography>
                  <Typography sx={{ ...DASHBOARD_UX.body, color: s.textPrimary }}>
                    {t('meals.planning.dayStatusVisual', {
                      shared: dayStrip.shared,
                      notShared: dayStrip.notShared,
                      empty: dayStrip.empty,
                    })}
                  </Typography>
                </Box>

                {(headcount.headcount?.slots ?? []).length > 0 ? (
                  <Stack spacing={1} sx={{ mb: 1.5 }}>
                    {(headcount.headcount?.slots ?? []).map((slot) => (
                      <Box
                        key={slot.mealType}
                        sx={{
                          p: 1.25,
                          borderRadius: `${DASHBOARD_UX.tileRadius}px`,
                          border: `1px solid ${s.border}`,
                          bgcolor: s.elevated,
                        }}
                      >
                        <Typography sx={{ ...DASHBOARD_UX.cardTitle, color: s.textPrimary }}>
                          {t(`meals.mealType.${slot.mealType}`)}
                        </Typography>
                        <Typography sx={{ ...DASHBOARD_UX.body, color: s.textPrimary, mt: 0.25 }}>
                          {t('meals.planning.headcount', { count: slot.mealsToPrepare })}
                        </Typography>
                        <Typography sx={{ ...DASHBOARD_UX.metricCaption, color: s.textMuted }}>
                          {t(`meals.poll.status.${slot.pollStatus}`)}
                        </Typography>
                      </Box>
                    ))}
                  </Stack>
                ) : null}

                <Button
                  fullWidth
                  variant="outlined"
                  endIcon={<Share2 size={DASHBOARD_UX.iconSize} />}
                  onClick={() => navigate(spaceMealsSharePath(spaceId, focusDate))}
                  sx={{
                    ...dashOutlinedButtonSx,
                    ...DASHBOARD_UX.button,
                    mt: 'auto',
                    minHeight: DASHBOARD_UX.buttonHeight,
                    color: colors.primaryDark,
                    borderColor: colors.primaryDark,
                    '&:hover': {
                      borderColor: colors.primaryDark,
                      bgcolor: `${colors.primaryDark}0F`,
                    },
                  }}
                >
                  {t('meals.planning.sharePreview')}
                </Button>
              </ContentCard>
            ) : null}
          </Box>
        )}
      </Stack>
    </PageContainer>
  );
}
