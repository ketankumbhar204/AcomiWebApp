import { Box, Typography, useTheme } from '@mui/material';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { MealOperationSlotCard } from '@/modules/meals/components/MealOperationSlotCard';
import { useDailyMenus, useEligibilitySummary, useMealPolls } from '@/modules/meals/hooks/useMeals';
import { buildDashboardMealSlotRows } from '@/modules/meals/utils/dashboardMealSlotDisplay';
import { formatMenuDateLabel } from '@/modules/meals/utils/mealDates';
import { spaceMealResponsesPath, spaceMealsEditPath, spaceMealsPath } from '@/routes/paths';
import { colors } from '@/shared/theme/colors';
import type { MealPollSlot, MealType } from '@/shared/types/meals';
import { DASHBOARD_UX, dashSurfaces } from '../theme/dashboardUx';

type MealOperationsTodayCardProps = {
  spaceId: string;
  menuDate: string;
  enabled: boolean;
};

/**
 * Dashboard meal operations — tiles open the menu editor (mobile parity).
 */
export function MealOperationsTodayCard({
  spaceId,
  menuDate,
  enabled,
}: MealOperationsTodayCardProps) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);
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

  const dateLabel = formatMenuDateLabel(menuDate, i18n.language);

  const goPlan = () => navigate(spaceMealsPath(spaceId, menuDate));
  const goSlot = (mealType: MealType, statusKind: string) => {
    if (statusKind === 'shared') {
      navigate(spaceMealResponsesPath(spaceId, { date: menuDate, mealType }));
      return;
    }
    navigate(spaceMealsEditPath(spaceId, { date: menuDate, mealType }));
  };

  return (
    <Box
      component="section"
      aria-label={t('dashboard.mealOperations.title', {
        defaultValue: 'Meal operations',
      })}
      sx={{
        p: 1.5,
        borderRadius: `${DASHBOARD_UX.radius}px`,
        bgcolor: s.surface,
        boxShadow: s.shadow,
        border: `1px solid ${s.border}`,
        minHeight: { xs: 0, md: DASHBOARD_UX.summaryCardMinHeight },
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
        minWidth: 0,
        boxSizing: 'border-box',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 1,
          minWidth: 0,
        }}
      >
        <Typography
          sx={{
            ...DASHBOARD_UX.sectionHeading,
            color: s.textPrimary,
            minWidth: 0,
          }}
        >
          {t('dashboard.mealOperations.title', { defaultValue: 'Meal operations' })}{' '}
          <Box
            component="span"
            sx={{
              fontSize: '0.875rem',
              fontWeight: 600,
              lineHeight: 1.3,
              color: s.textSecondary,
            }}
          >
            ({dateLabel})
          </Box>
        </Typography>
        <Typography
          component="button"
          type="button"
          onClick={goPlan}
          sx={{
            ...DASHBOARD_UX.link,
            color: colors.primaryDark,
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            fontWeight: 700,
          }}
        >
          {t('dashboard.operations.planMenuCta', { defaultValue: 'Plan menu' })} →
        </Typography>
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
          gap: '8px',
          flex: 1,
          minWidth: 0,
          alignItems: 'stretch',
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
              row.countUnitKey
                ? t(row.countUnitKey, { defaultValue: 'responded' })
                : undefined
            }
            captionTone={row.captionTone}
            statusKind={row.statusKind}
            onPress={() => goSlot(row.mealType, row.statusKind)}
          />
        ))}
      </Box>
    </Box>
  );
}
