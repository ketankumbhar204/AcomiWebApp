import {
  Box,
  Button,
  Grid,
  IconButton,
  Link,
  Stack,
  TextField,
  Typography,
  useTheme,
} from '@mui/material';
import {
  BookOpen,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  MapPinned,
  PieChart,
  RefreshCw,
  Share2,
  Users,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { IconBadge } from '@/modules/dashboard/components/IconBadge';
import { DASHBOARD_UX, dashSurfaces } from '@/modules/dashboard/theme/dashboardUx';
import { Breadcrumbs } from '@/shared/components/Breadcrumbs';
import { ContentCard } from '@/shared/components/ContentCard';
import { PageContainer } from '@/shared/components/PageContainer';
import { StatCard } from '@/shared/components/StatCard';
import { LoadingState } from '@/shared/components/LoadingState';
import { ErrorState } from '@/shared/components/ErrorState';
import { colors } from '@/shared/theme/colors';
import { dashContainedButtonSx, dashOutlinedButtonSx } from '@/shared/theme/dashButtonSx';
import { useSpacePermissions } from '@/shared/hooks/useSpacePermissions';
import {
  spaceMealsLibraryPath,
  spaceMealsLocationsPath,
  spaceMealsParticipationPath,
  spaceMealsPlansPath,
  spaceMealsSharePath,
} from '@/routes/paths';
import type { MealType } from '@/shared/types/meals';
import { MealSlotCard } from '../components/MealSlotCard';
import { SlotEditorDrawer } from '../components/SlotEditorDrawer';
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
  color: colors.primaryDark,
  borderColor: `${colors.primaryDark}55`,
  px: 1.25,
  '&:hover': {
    borderColor: colors.primaryDark,
    bgcolor: `${colors.primaryDark}0F`,
  },
} as const;

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
  const tomorrow = addDaysIso(focusDate, 1);

  const [editSlot, setEditSlot] = useState<{ date: string; mealType: MealType } | null>(null);

  useEffect(() => {
    document.title = `${t('navigation.meals')} · ${t('common.appName')}`;
  }, [t]);

  const todayMenus = useDailyMenus(spaceId, focusDate, permissions.canViewMeals);
  const tomorrowMenus = useDailyMenus(spaceId, tomorrow, permissions.canViewMeals);
  const todayPolls = useMealPolls(spaceId, focusDate, permissions.canViewMeals);
  const tomorrowPolls = useMealPolls(spaceId, tomorrow, canManage);
  const eligibility = useEligibilitySummary(spaceId, focusDate, canManage);
  const headcount = useMealHeadcountDay(spaceId, focusDate, canManage);

  const loading = todayMenus.loading && todayMenus.menus.length === 0;

  const menuByType = (menus: typeof todayMenus.menus) =>
    Object.fromEntries(menus.map((m) => [m.mealType, m])) as Partial<
      Record<MealType, (typeof menus)[number]>
    >;

  const pollByType = (polls: typeof todayPolls.pollDay) =>
    Object.fromEntries((polls?.polls ?? []).map((p) => [p.mealType, p])) as Partial<
      Record<MealType, NonNullable<typeof polls>['polls'][number]>
    >;

  const headcountByType = useMemo(() => {
    const map: Partial<Record<MealType, number>> = {};
    for (const slot of headcount.headcount?.slots ?? []) {
      map[slot.mealType] = slot.mealsToPrepare;
    }
    return map;
  }, [headcount.headcount]);

  const todayMap = menuByType(todayMenus.menus);
  const tomorrowMap = menuByType(tomorrowMenus.menus);
  const todayPollMap = pollByType(todayPolls.pollDay);
  const tomorrowPollMap = pollByType(tomorrowPolls.pollDay);

  const dayStrip = useMemo(() => {
    let shared = 0;
    let notShared = 0;
    let empty = 0;
    for (const mealType of MEAL_TYPES) {
      const menu = todayMap[mealType];
      const options = menu?.options?.filter((o) => o.isAvailable) ?? [];
      if (options.length === 0) empty += 1;
      else if (menu?.status === 'PUBLISHED') shared += 1;
      else notShared += 1;
    }
    return { shared, notShared, empty };
  }, [todayMap]);

  const openPollCount =
    todayPolls.pollDay?.polls.filter((p) => p.status === 'OPEN').length ?? 0;

  const publishedSlots =
    eligibility.summary?.slots.filter((slot) => slot.published).length ??
    todayMenus.menus.filter((m) => m.status === 'PUBLISHED').length;

  const shiftDate = (delta: number) => {
    const next = addDaysIso(focusDate, delta);
    setSearchParams({ date: next });
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
    void todayMenus.reload();
    void tomorrowMenus.reload();
    void todayPolls.reload();
    void tomorrowPolls.reload();
    void eligibility.reload();
    void headcount.reload();
  };

  if (todayMenus.error) {
    return (
      <PageContainer>
        <ErrorState
          title={t('common.errors.generic')}
          message={t('common.errors.server')}
          onRetry={() => void todayMenus.reload()}
          retryLabel={t('common.retry')}
        />
      </PageContainer>
    );
  }

  const renderDayColumn = (
    date: string,
    title: string,
    menus: Partial<Record<MealType, (typeof todayMenus.menus)[number]>>,
    polls: Partial<Record<MealType, NonNullable<typeof todayPolls.pollDay>['polls'][number]>>,
    showHeadcount: boolean,
    gridArea: string,
  ) => (
    <Box
      sx={{
        gridArea,
        height: '100%',
        display: 'flex',
        '& > .MuiPaper-root': {
          flex: 1,
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
        },
      }}
    >
      <ContentCard>
        <Stack
          direction="row"
          sx={{ justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.25, gap: 1 }}
        >
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ ...DASHBOARD_UX.sectionHeading, color: s.textPrimary }}>
              {title}
            </Typography>
            <Typography sx={{ ...DASHBOARD_UX.body, color: s.textSecondary }}>
              {formatMenuDateLabel(date)}
            </Typography>
          </Box>
          {canManage ? (
            <Link
              component="button"
              type="button"
              underline="hover"
              onClick={() => navigate(spaceMealsSharePath(spaceId, date))}
              sx={{ ...DASHBOARD_UX.button, color: colors.primaryDark, flexShrink: 0 }}
            >
              {t('meals.planning.share')}
            </Link>
          ) : null}
        </Stack>

        <Stack spacing={`${DASHBOARD_UX.cardGap}px`} sx={{ flex: 1 }}>
          {MEAL_TYPES.map((mealType) => (
            <MealSlotCard
              key={`${date}-${mealType}`}
              mealType={mealType}
              menu={menus[mealType]}
              poll={polls[mealType]}
              headcount={showHeadcount ? headcountByType[mealType] : null}
              canManage={canManage}
              onEdit={() => setEditSlot({ date, mealType })}
              onPublish={() =>
                void runAction(
                  () => mutations.publishDailyMenu.mutateAsync({ menuDate: date, mealType }),
                  'meals.planning.publishSuccess',
                )
              }
              onOpenPoll={() =>
                void runAction(
                  () => mutations.openMealPoll.mutateAsync({ menuDate: date, mealType }),
                  'meals.poll.openSuccess',
                )
              }
              onClosePoll={() =>
                void runAction(
                  () => mutations.closeMealPoll.mutateAsync({ menuDate: date, mealType }),
                  'meals.poll.closeSuccess',
                )
              }
            />
          ))}
        </Stack>
      </ContentCard>
    </Box>
  );

  return (
    <PageContainer gap={0}>
      <Stack spacing={`${DASHBOARD_UX.sectionGap}px`} sx={{ width: '100%' }}>
        {/* Header: breadcrumb · title | date | actions */}
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
              mt: 0.75,
              display: 'grid',
              gap: 1.5,
              alignItems: 'center',
              gridTemplateColumns: {
                xs: '1fr',
                md: 'minmax(0, 1fr) auto minmax(0, 1fr)',
              },
            }}
          >
            <Box sx={{ minWidth: 0 }}>
              <Typography
                component="h1"
                sx={{ ...DASHBOARD_UX.pageTitle, color: s.textPrimary }}
              >
                {t('meals.planning.title')}
              </Typography>
              <Typography sx={{ ...DASHBOARD_UX.body, color: s.textSecondary, mt: 0.35 }}>
                {t('meals.planning.subtitle')}
              </Typography>
            </Box>

            <Stack
              direction="row"
              spacing={0.5}
              useFlexGap
              sx={{ alignItems: 'center', justifyContent: 'center' }}
            >
              <IconButton
                size="small"
                aria-label={t('common.back')}
                onClick={() => shiftDate(-1)}
                sx={{
                  width: DASHBOARD_UX.buttonHeight,
                  height: DASHBOARD_UX.buttonHeight,
                  border: `1px solid ${s.border}`,
                  borderRadius: `${DASHBOARD_UX.buttonRadius}px`,
                }}
              >
                <ChevronLeft size={16} />
              </IconButton>
              <TextField
                size="small"
                type="date"
                value={focusDate}
                onChange={(e) => setSearchParams({ date: e.target.value })}
                slotProps={{ inputLabel: { shrink: true } }}
                sx={{
                  width: 168,
                  '& .MuiOutlinedInput-root': {
                    minHeight: DASHBOARD_UX.buttonHeight,
                    height: DASHBOARD_UX.buttonHeight,
                    borderRadius: `${DASHBOARD_UX.buttonRadius}px`,
                    bgcolor: s.surface,
                    ...DASHBOARD_UX.body,
                  },
                }}
              />
              <IconButton
                size="small"
                aria-label={t('common.continue')}
                onClick={() => shiftDate(1)}
                sx={{
                  width: DASHBOARD_UX.buttonHeight,
                  height: DASHBOARD_UX.buttonHeight,
                  border: `1px solid ${s.border}`,
                  borderRadius: `${DASHBOARD_UX.buttonRadius}px`,
                }}
              >
                <ChevronRight size={16} />
              </IconButton>
            </Stack>

            <Stack
              direction="row"
              spacing={1}
              useFlexGap
              sx={{
                alignItems: 'center',
                justifyContent: { xs: 'flex-start', md: 'flex-end' },
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
                }}
              >
                <RefreshCw size={14} />
              </IconButton>
              {canManage ? (
                <Button
                  size="small"
                  variant="contained"
                  startIcon={<Share2 size={14} />}
                  onClick={() => navigate(spaceMealsSharePath(spaceId, focusDate))}
                  sx={{
                    ...dashContainedButtonSx,
                    minHeight: DASHBOARD_UX.buttonHeight,
                    height: DASHBOARD_UX.buttonHeight,
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

        {/* Compact nav pills */}
        {canManage ? (
          <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
            <Button
              size="small"
              startIcon={<BookOpen size={14} />}
              onClick={() => navigate(spaceMealsLibraryPath(spaceId))}
              sx={navPillSx}
            >
              {t('meals.library.title')}
            </Button>
            <Button
              size="small"
              startIcon={<Users size={14} />}
              onClick={() => navigate(spaceMealsPlansPath(spaceId))}
              sx={navPillSx}
            >
              {t('meals.subscriptionPlans.title')}
            </Button>
            <Button
              size="small"
              startIcon={<Users size={14} />}
              onClick={() => navigate(spaceMealsParticipationPath(spaceId))}
              sx={navPillSx}
            >
              {t('meals.participation.title')}
            </Button>
            <Button
              size="small"
              startIcon={<MapPinned size={14} />}
              onClick={() => navigate(spaceMealsLocationsPath(spaceId))}
              sx={navPillSx}
            >
              {t('meals.deliveryLocations.title')}
            </Button>
          </Stack>
        ) : null}

        {/* Summary metrics */}
        {canManage ? (
          <Grid container spacing={1.5}>
            <Grid size={{ xs: 12, sm: 4 }}>
              <StatCard
                dense
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
                dense
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
                dense
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
              gap: `${DASHBOARD_UX.cardGap}px`,
              alignItems: 'stretch',
              gridTemplateColumns: {
                xs: '1fr',
                md: '1fr 1fr',
                lg: canManage
                  ? 'minmax(0, 2fr) minmax(0, 2fr) minmax(220px, 1fr)'
                  : '1fr 1fr',
              },
              gridTemplateAreas: {
                xs: canManage
                  ? `"today" "tomorrow" "summary"`
                  : `"today" "tomorrow"`,
                md: canManage
                  ? `"today tomorrow" "summary summary"`
                  : `"today tomorrow"`,
                lg: canManage
                  ? `"today tomorrow summary"`
                  : `"today tomorrow"`,
              },
            }}
          >
            {renderDayColumn(
              focusDate,
              t('meals.planning.today'),
              todayMap,
              todayPollMap,
              true,
              'today',
            )}
            {renderDayColumn(
              tomorrow,
              t('meals.planning.tomorrow'),
              tomorrowMap,
              tomorrowPollMap,
              false,
              'tomorrow',
            )}

            {canManage ? (
              <Box
                sx={{
                  gridArea: 'summary',
                  height: '100%',
                  display: 'flex',
                  '& > .MuiPaper-root': {
                    flex: 1,
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                  },
                }}
              >
                <ContentCard>
                  <Typography sx={{ ...DASHBOARD_UX.sectionHeading, color: s.textPrimary }}>
                    {t('meals.planning.inspector')}
                  </Typography>
                  <Typography sx={{ ...DASHBOARD_UX.body, color: s.textSecondary, mt: 0.25 }}>
                    {formatMenuDateLabel(focusDate)}
                  </Typography>

                  <Typography
                    sx={{ ...DASHBOARD_UX.body, color: s.textSecondary, mt: 1.25, mb: 1 }}
                  >
                    {t('meals.planning.inspectorHint')}
                  </Typography>

                  <Box
                    sx={{
                      p: `${DASHBOARD_UX.metricPadding}px`,
                      borderRadius: `${DASHBOARD_UX.tileRadius}px`,
                      border: `1px solid ${s.border}`,
                      bgcolor: theme.palette.mode === 'dark' ? s.elevated : s.pageBg,
                      mb: 1.25,
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

                  {(headcount.headcount?.slots ?? []).length === 0 ? (
                    <Typography sx={{ ...DASHBOARD_UX.body, color: s.textMuted, py: 1 }}>
                      {t('meals.planning.inspectorHint')}
                    </Typography>
                  ) : (
                    <Stack spacing={1} sx={{ mb: 1.5 }}>
                      {(headcount.headcount?.slots ?? []).map((slot) => (
                        <Box
                          key={slot.mealType}
                          sx={{
                            p: 1,
                            borderRadius: `${DASHBOARD_UX.tileRadius}px`,
                            border: `1px solid ${s.border}`,
                            bgcolor: s.elevated,
                          }}
                        >
                          <Typography sx={{ ...DASHBOARD_UX.cardTitle, color: s.textPrimary }}>
                            {t(`meals.mealType.${slot.mealType}`)}
                          </Typography>
                          <Typography sx={{ ...DASHBOARD_UX.body, color: s.textPrimary }}>
                            {t('meals.planning.headcount', { count: slot.mealsToPrepare })}
                          </Typography>
                          <Typography sx={{ ...DASHBOARD_UX.metricCaption, color: s.textMuted }}>
                            {t(`meals.poll.status.${slot.pollStatus}`)}
                          </Typography>
                        </Box>
                      ))}
                    </Stack>
                  )}

                  <Button
                    fullWidth
                    variant="outlined"
                    endIcon={<Share2 size={14} />}
                    onClick={() => navigate(spaceMealsSharePath(spaceId, focusDate))}
                    sx={{
                      ...dashOutlinedButtonSx,
                      mt: 'auto',
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
              </Box>
            ) : null}
          </Box>
        )}
      </Stack>

      <SlotEditorDrawer
        open={Boolean(editSlot)}
        spaceId={spaceId}
        menuDate={editSlot?.date ?? focusDate}
        mealType={editSlot?.mealType ?? null}
        menu={
          editSlot
            ? editSlot.date === focusDate
              ? todayMap[editSlot.mealType]
              : tomorrowMap[editSlot.mealType]
            : null
        }
        onClose={() => setEditSlot(null)}
      />
    </PageContainer>
  );
}
