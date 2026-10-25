import { Box, Link, Stack, Typography, useTheme } from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { MealOperationSlotCard } from '@/modules/meals/components/MealOperationSlotCard';
import {
  useDailyMenus,
  useEligibilitySummary,
  useMealPolls,
} from '@/modules/meals/hooks/useMeals';
import { buildDashboardMealSlotRows } from '@/modules/meals/utils/dashboardMealSlotDisplay';
import {
  addDaysIso,
  formatMenuDateLabel,
  isPastMenuDate,
  MEAL_TYPES,
  todayIsoDate,
} from '@/modules/meals/utils/mealDates';
import {
  spaceMealResponsesPath,
  spaceMealsEditPath,
  spaceMealsPath,
  spaceMealsSharePath,
} from '@/routes/paths';
import { PeriodDayNav } from '@/shared/components/PeriodDayNav';
import type { DailyMenuResponse, MealPollSlot, MealType } from '@/shared/types/meals';
import { DASHBOARD_UX, dashSurfaces } from '../theme/dashboardUx';

function hasPlannedMenu(menu: DailyMenuResponse | undefined): boolean {
  return (menu?.options?.filter((o) => o.isAvailable) ?? []).length > 0;
}

type MealOperationsDayWidgetProps = {
  spaceId: string;
  enabled: boolean;
};

export function MealOperationsDayWidget({ spaceId, enabled }: MealOperationsDayWidgetProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);
  const [menuDate, setMenuDate] = useState(todayIsoDate());

  useEffect(() => {
    setMenuDate(todayIsoDate());
  }, [spaceId]);

  const menus = useDailyMenus(spaceId, menuDate, enabled);
  const polls = useMealPolls(spaceId, menuDate, enabled);
  const eligibility = useEligibilitySummary(spaceId, menuDate, enabled);

  const slotRows = useMemo(() => {
    const menuMap = Object.fromEntries(menus.menus.map((menu) => [menu.mealType, menu]));
    const pollMap: Partial<Record<MealType, MealPollSlot>> = {};
    for (const poll of polls.pollDay?.polls ?? []) {
      pollMap[poll.mealType] = poll;
    }
    const eligibleByMeal: Partial<Record<MealType, number>> = {};
    for (const slot of eligibility.summary?.slots ?? []) {
      eligibleByMeal[slot.mealType] = slot.eligibleCount;
    }
    return buildDashboardMealSlotRows(
      menuMap,
      pollMap,
      eligibleByMeal,
      {},
      eligibility.summary?.distinctEligibleMemberCount ?? 0,
    );
  }, [eligibility.summary, menus.menus, polls.pollDay]);

  const daySummary = useMemo(() => {
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

  const pollLine = useMemo(() => {
    const openPolls = (polls.pollDay?.polls ?? []).filter((p) => p.status === 'OPEN');
    if (openPolls.length > 0) {
      const responded = openPolls.reduce((sum, p) => sum + (p.responseCount ?? 0), 0);
      const eligible = eligibility.summary?.distinctEligibleMemberCount ?? 0;
      return t('dashboard.operations.pollOpenLine', { responded, eligible });
    }
    if (daySummary.shared > 0) return t('dashboard.operations.pollClosed');
    return t('dashboard.operations.pollNotOpen');
  }, [daySummary.shared, eligibility.summary?.distinctEligibleMemberCount, polls.pollDay?.polls, t]);

  const isToday = menuDate === todayIsoDate();
  const hasPlannedMeal = daySummary.shared + daySummary.notShared > 0;
  const canShare = hasPlannedMeal && !isPastMenuDate(menuDate);
  const goPlan = () => navigate(spaceMealsPath(spaceId, menuDate));
  const goShare = () =>
    navigate(
      spaceMealsSharePath(spaceId, menuDate, daySummary.notShared > 0 ? 'save' : 'reshare'),
    );

  return (
    <Box
      component="section"
      aria-label={t('dashboard.mealOperations.title')}
      sx={{
        bgcolor: s.surface,
        borderRadius: `${DASHBOARD_UX.radius}px`,
        boxShadow: s.shadow,
        border: `1px solid ${s.border}`,
        p: `${DASHBOARD_UX.sectionPadding}px`,
      }}
    >
      <Stack
        direction="row"
        spacing={1}
        sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 0.75 }}
      >
        <Typography sx={{ ...DASHBOARD_UX.sectionHeading, color: s.textPrimary }}>
          {t('dashboard.mealOperations.title')}
        </Typography>
        <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center', flexShrink: 0 }}>
          <PeriodDayNav
            date={menuDate}
            onPrevious={() => setMenuDate((d) => addDaysIso(d, -1))}
            onNext={() => setMenuDate((d) => addDaysIso(d, 1))}
            onDateSelect={setMenuDate}
            label={
              isToday
                ? `${formatMenuDateLabel(menuDate)} · ${t('common.today', { defaultValue: 'Today' })}`
                : formatMenuDateLabel(menuDate)
            }
            size="compact"
          />
          {!isPastMenuDate(menuDate) ? (
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexShrink: 0 }}>
              {canShare ? (
                <Link
                  component="button"
                  type="button"
                  underline="hover"
                  onClick={goShare}
                  sx={{ ...DASHBOARD_UX.button, color: 'primary.dark' }}
                >
                  {t('dashboard.operations.shareCta', { defaultValue: 'Share' })} →
                </Link>
              ) : null}
              <Link
                component="button"
                type="button"
                underline="hover"
                onClick={goPlan}
                sx={{ ...DASHBOARD_UX.button, color: 'primary.dark' }}
              >
                {t('dashboard.mealOperations.planMenu')} →
              </Link>
            </Stack>
          ) : null}
        </Stack>
      </Stack>

      <Typography sx={{ ...DASHBOARD_UX.sectionSubtitle, color: s.textMuted, mb: 1 }}>
          {t('dashboard.mealOperations.summaryStrip', {
            shared: daySummary.shared,
            notShared: daySummary.notShared,
            empty: daySummary.empty,
          })}
          {' · '}
          {pollLine}
        </Typography>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
          gap: '8px',
          minWidth: 0,
        }}
      >
        {slotRows.map((row) => (
          <MealOperationSlotCard
            key={row.mealType}
            mealType={row.mealType}
            mealLabel={t(`meals.mealType.${row.mealType}`)}
            caption={t(row.captionKey, row.captionParams)}
            countPrimary={row.countPrimary}
            countUnit={
              row.countUnitKey ? t(row.countUnitKey, { defaultValue: 'responded' }) : undefined
            }
            captionTone={row.captionTone}
            statusKind={row.statusKind}
            onPress={() => {
              if (row.statusKind === 'shared') {
                navigate(spaceMealResponsesPath(spaceId, { date: menuDate, mealType: row.mealType }));
                return;
              }
              navigate(spaceMealsEditPath(spaceId, { date: menuDate, mealType: row.mealType }));
            }}
          />
        ))}
      </Box>
    </Box>
  );
}
