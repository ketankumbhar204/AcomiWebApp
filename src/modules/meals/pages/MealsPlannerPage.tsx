import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Grid,
  IconButton,
  Stack,
  Typography,
  useTheme,
} from '@mui/material';
import {
  AlertCircle,
  BookOpen,
  CalendarDays,
  Lock,
  MapPinned,
  PieChart,
  Plus,
  RefreshCw,
  Share2,
  Users,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
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
import { resolveDayPollControl, resolveDayShareVisual, resolveDayShareAction } from '../utils/dayShareAction';
import { clearDayShareFailed, isDayShareFailed } from '../utils/dayShareFailure';
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

  const plannedCounts = useMemo(() => {
    let published = 0;
    let modified = 0;
    let draft = 0;
    for (const mealType of MEAL_TYPES) {
      const menu = menuByType[mealType];
      const options = menu?.options?.filter((option) => option.isAvailable) ?? [];
      if (!menu || options.length === 0) {
        continue;
      }
      if (menu.status === 'PUBLISHED') {
        published += 1;
      } else if (menu.status === 'MODIFIED') {
        modified += 1;
      } else {
        draft += 1;
      }
    }
    return { published, modified, draft };
  }, [menuByType]);

  const shareAction = resolveDayShareAction(plannedCounts);
  const shareFailed = isDayShareFailed(spaceId, focusDate);
  const dayStatus = resolveDayShareVisual(plannedCounts, { shareFailed });
  useEffect(() => {
    if (dayStatus === 'shared') {
      clearDayShareFailed(spaceId, focusDate);
    }
  }, [dayStatus, focusDate, spaceId]);
  const pollControl = resolveDayPollControl(
    (dayPolls.pollDay?.polls ?? []).map((poll) => poll.status),
  );
  const [closePollOpen, setClosePollOpen] = useState(false);
  const [closingPoll, setClosingPoll] = useState(false);
  const closingPollRef = useRef(false);

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

  const openingShareRef = useRef(false);
  const openDayShare = () => {
    if (shareAction === 'hidden' || openingShareRef.current) {
      return;
    }
    openingShareRef.current = true;
    navigate(
      spaceMealsSharePath(spaceId, focusDate, shareAction === 'reshare' ? 'reshare' : 'save'),
    );
  };

  const runAction = async (fn: () => Promise<unknown>, successKey: string) => {
    try {
      await fn();
      enqueueSnackbar(t(successKey), { variant: 'success' });
    } catch {
      enqueueSnackbar(t('common.errors.generic'), { variant: 'error' });
    }
  };

  const confirmClosePolls = async () => {
    if (closingPollRef.current) {
      return;
    }
    const openPolls = (dayPolls.pollDay?.polls ?? []).filter((poll) => poll.status === 'OPEN');
    if (openPolls.length === 0) {
      setClosePollOpen(false);
      return;
    }
    closingPollRef.current = true;
    setClosingPoll(true);
    try {
      for (const poll of openPolls) {
        await mutations.closeMealPoll.mutateAsync({
          menuDate: focusDate,
          mealType: poll.mealType,
        });
      }
      enqueueSnackbar(
        t('meals.planning.dayShare.closePollSuccess', {
          defaultValue: 'Meal poll closed successfully.',
        }),
        { variant: 'success' },
      );
      setClosePollOpen(false);
      reloadAll();
    } catch (error) {
      const message =
        error instanceof Error && error.message
          ? error.message
          : t('meals.planning.dayShare.closePollFailed', {
              defaultValue: 'Could not close the meal poll. Try again.',
            });
      enqueueSnackbar(message, { variant: 'error' });
      reloadAll();
    } finally {
      closingPollRef.current = false;
      setClosingPoll(false);
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
            </Stack>
          </Box>
        </Box>

        {/* Stats */}
        {canManage ? (
          <Grid container spacing={1.5}>
            <Grid size={{ xs: 12, sm: 4 }}>
              <StatCard
                tone="success"
                label={t('meals.planning.eligible')}
                value={eligibility.summary?.distinctEligibleMemberCount ?? '—'}
                hint={t('meals.planning.membersShort')}
                icon={
                  <IconBadge tone="success">
                    <Users />
                  </IconBadge>
                }
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <StatCard
                tone="info"
                label={t('meals.planning.publishedSlots')}
                value={publishedSlots}
                hint={t('meals.planning.filterShared')}
                icon={
                  <IconBadge tone="info">
                    <CalendarDays />
                  </IconBadge>
                }
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <StatCard
                tone="warning"
                label={t('meals.planning.openPolls')}
                value={openPollCount}
                hint={t('meals.poll.open')}
                icon={
                  <IconBadge tone="warning">
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
                lg: canManage ? 'minmax(0, 3fr) minmax(0, 1fr)' : '1fr',
              },
            }}
          >
            {/* Selected day — full width for meals */}
            <ContentCard>
              <Box sx={{ mb: 2 }}>
                <Box sx={{ width: 'fit-content', maxWidth: '100%' }}>
                  <PeriodDayNav
                    date={focusDate}
                    onPrevious={() => shiftDate(-1)}
                    onNext={() => shiftDate(1)}
                    onDateSelect={(next) => setSearchParams({ date: next })}
                    label={formatMenuDateLabel(focusDate)}
                  />
                </Box>
                <Typography sx={{ ...DASHBOARD_UX.sectionSubtitle, color: s.textMuted, mt: 0.75 }}>
                  {t('meals.planning.selectedDaySubtitle', {
                    defaultValue: 'Plan your menu for the day',
                  })}
                </Typography>
                <Box
                  sx={{
                    mt: 1.25,
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 1,
                    px: 1.5,
                    py: 1,
                    borderRadius: `${DASHBOARD_UX.radius}px`,
                    border: '1px solid',
                    borderColor:
                      dayStatus === 'shared'
                        ? '#BFE8D4'
                        : dayStatus === 'updated'
                          ? '#D0E0F8'
                          : dayStatus === 'failed'
                            ? '#FECACA'
                            : '#FED7AA',
                    bgcolor:
                      dayStatus === 'shared'
                        ? '#ECFBF3'
                        : dayStatus === 'updated'
                          ? '#EEF4FF'
                          : dayStatus === 'failed'
                            ? '#FEF2F2'
                            : '#FFF4EC',
                  }}
                >
                  {dayStatus === 'shared' ? (
                    <Share2 size={18} color="#059669" strokeWidth={2.2} />
                  ) : (
                    <AlertCircle
                      size={18}
                      strokeWidth={2.2}
                      color={
                        dayStatus === 'failed' ? '#B91C1C' : dayStatus === 'updated' ? '#1D4ED8' : '#C2410C'
                      }
                    />
                  )}
                  <Box sx={{ minWidth: 0 }}>
                    <Typography
                      sx={{
                        fontSize: 14,
                        fontWeight: 700,
                        lineHeight: 1.3,
                        color:
                          dayStatus === 'shared'
                            ? '#047857'
                            : dayStatus === 'updated'
                              ? '#1D4ED8'
                              : dayStatus === 'failed'
                                ? '#B91C1C'
                                : '#C2410C',
                      }}
                    >
                      {dayStatus === 'failed'
                        ? t('meals.planning.dayShare.failed', { defaultValue: 'Sharing failed' })
                        : dayStatus === 'updated'
                          ? t('meals.planning.dayShare.updated', {
                              defaultValue: 'Updated since last share',
                            })
                          : dayStatus === 'shared'
                            ? t('meals.planning.dayShare.shared', { defaultValue: 'Shared' })
                            : t('meals.planning.dayShare.notShared', { defaultValue: 'Not shared' })}
                    </Typography>
                    <Typography sx={{ ...DASHBOARD_UX.metricCaption, color: s.textSecondary, mt: 0.25 }}>
                      {dayStatus === 'failed'
                        ? t('meals.planning.dayShare.failedHint', {
                            defaultValue: 'The menu was not shared. Try again.',
                          })
                        : dayStatus === 'updated'
                          ? t('meals.planning.dayShare.updatedHint', {
                              defaultValue: 'Share again so members see the latest menu',
                            })
                          : dayStatus === 'shared'
                            ? t('meals.planning.dayShare.sharedHint', {
                                defaultValue: "Today's menu has been shared",
                              })
                            : t('meals.planning.dayShare.notSharedHint', {
                                defaultValue: "Today's menu has not been shared yet",
                              })}
                    </Typography>
                  </Box>
                </Box>
              </Box>

              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: {
                    xs: '1fr',
                    sm: 'repeat(3, minmax(0, 1fr))',
                  },
                  gap: `${DASHBOARD_UX.cardGap}px`,
                }}
              >
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
                    onShare={openDayShare}
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
              </Box>

              {canManage && shareAction !== 'hidden' ? (
                <Box sx={{ mt: 2.5 }}>
                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={<Share2 size={DASHBOARD_UX.iconSize} />}
                    onClick={openDayShare}
                    sx={{
                      ...dashContainedButtonSx,
                      ...DASHBOARD_UX.button,
                      minHeight: DASHBOARD_UX.buttonHeight,
                      bgcolor: colors.primaryDark,
                      whiteSpace: 'normal',
                      textAlign: 'center',
                      '&:hover': { bgcolor: colors.primaryHover },
                    }}
                  >
                    {shareAction === 'reshare'
                      ? t('meals.planning.dayShare.reshare', {
                          defaultValue: "Reshare today's menu",
                        })
                      : t('meals.planning.dayShare.action', {
                          defaultValue: "Share today's menu",
                        })}
                  </Button>
                </Box>
              ) : null}

              {canManage && pollControl === 'open' ? (
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<Lock size={DASHBOARD_UX.iconSize} />}
                  disabled={closingPoll}
                  onClick={() => setClosePollOpen(true)}
                  sx={{
                    ...DASHBOARD_UX.button,
                    mt: 1.5,
                    minHeight: DASHBOARD_UX.buttonHeight,
                    color: '#C2410C',
                    borderColor: '#FED7AA',
                    bgcolor: '#FFF4EC',
                    whiteSpace: 'normal',
                    textTransform: 'none',
                    '&:hover': { borderColor: '#FDBA74', bgcolor: '#FFEDD5' },
                  }}
                >
                  {t('meals.planning.dayShare.closePoll', { defaultValue: 'Close poll' })}
                </Button>
              ) : null}
              {canManage && pollControl === 'closed' ? (
                <Box
                  sx={{
                    mt: 1.5,
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 1,
                    px: 1.5,
                    py: 1,
                    borderRadius: `${DASHBOARD_UX.radius}px`,
                    border: '1px solid #E5E7EB',
                    bgcolor: '#F4F5F7',
                  }}
                >
                  <Lock size={16} color="#4B5563" strokeWidth={2.2} />
                  <Box>
                    <Typography sx={{ fontSize: 14, fontWeight: 700, color: '#374151' }}>
                      {t('meals.planning.dayShare.pollClosed', { defaultValue: 'Poll closed' })}
                    </Typography>
                    <Typography sx={{ ...DASHBOARD_UX.metricCaption, color: s.textSecondary }}>
                      {t('meals.planning.dayShare.pollClosedHint', {
                        defaultValue: 'Members can no longer submit or change their selections',
                      })}
                    </Typography>
                  </Box>
                </Box>
              ) : null}

              {canManage && shareAction !== 'hidden' ? (
                <Typography
                  sx={{ ...DASHBOARD_UX.metricCaption, color: s.textMuted, mt: 0.75, textAlign: 'center' }}
                >
                  {t('meals.planning.dayShare.subtitle', {
                    defaultValue: 'Share Breakfast, Lunch and Dinner together',
                  })}
                </Typography>
              ) : canManage ? (
                <Typography
                  sx={{ ...DASHBOARD_UX.metricCaption, color: s.textMuted, mt: 2, textAlign: 'center' }}
                >
                  {t('meals.planning.dayShare.emptyHint', {
                    defaultValue: 'Plan at least one meal before sharing.',
                  })}
                </Typography>
              ) : null}

              {canManage ? (
                <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap', mt: 2.5 }}>
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

                {shareAction !== 'hidden' ? (
                  <Button
                    fullWidth
                    variant="outlined"
                    endIcon={<Share2 size={DASHBOARD_UX.iconSize} />}
                    onClick={openDayShare}
                    sx={{
                      ...dashOutlinedButtonSx,
                      ...DASHBOARD_UX.button,
                      mt: 'auto',
                      minHeight: DASHBOARD_UX.buttonHeight,
                      color: colors.primaryDark,
                      borderColor: colors.primaryDark,
                      whiteSpace: 'normal',
                      '&:hover': {
                        borderColor: colors.primaryDark,
                        bgcolor: `${colors.primaryDark}0F`,
                      },
                    }}
                  >
                    {shareAction === 'reshare'
                      ? t('meals.planning.dayShare.reshare', {
                          defaultValue: "Reshare today's menu",
                        })
                      : t('meals.planning.dayShare.action', {
                          defaultValue: "Share today's menu",
                        })}
                  </Button>
                ) : null}
              </ContentCard>
            ) : null}
          </Box>
        )}
      </Stack>
      <Dialog open={closePollOpen} onClose={closingPoll ? undefined : () => setClosePollOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>
          {t('meals.planning.dayShare.closePollTitle', {
            defaultValue: "Close today's meal poll?",
          })}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {t('meals.planning.dayShare.closePollMessage', {
              defaultValue:
                'Members will no longer be able to submit or change their meal selections for this poll.',
            })}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setClosePollOpen(false)} disabled={closingPoll}>
            {t('common.cancel', { defaultValue: 'Cancel' })}
          </Button>
          <Button onClick={() => void confirmClosePolls()} disabled={closingPoll} color="warning">
            {closingPoll
              ? t('common.loading', { defaultValue: 'Closing…' })
              : t('meals.planning.dayShare.closePollConfirm', { defaultValue: 'Close poll' })}
          </Button>
        </DialogActions>
      </Dialog>
    </PageContainer>
  );
}
