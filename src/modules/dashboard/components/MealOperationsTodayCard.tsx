import { Box, Stack, Typography, useTheme } from '@mui/material';
import { Moon, Sun, Sunrise } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useDailyMenus } from '@/modules/meals/hooks/useMeals';
import { spaceMealHeadcountPath, spaceMealsPath } from '@/routes/paths';
import { colors } from '@/shared/theme/colors';
import type { DailyMenuResponse, MealType } from '@/shared/types/meals';
import { IconBadge } from './IconBadge';
import { DASHBOARD_UX, dashSurfaces } from '../theme/dashboardUx';

const MEAL_TYPES: MealType[] = ['BREAKFAST', 'LUNCH', 'DINNER'];

const ICONS: Record<MealType, LucideIcon> = {
  BREAKFAST: Sunrise,
  LUNCH: Sun,
  DINNER: Moon,
};

const ACCENTS: Record<MealType, string> = {
  BREAKFAST: '#D97706',
  LUNCH: colors.primaryDark,
  DINNER: '#7C3AED',
};

function hasPlannedMenu(menu: DailyMenuResponse | undefined): boolean {
  return (menu?.options?.filter((o) => o.isAvailable) ?? []).length > 0;
}

type MealOperationsTodayCardProps = {
  spaceId: string;
  menuDate: string;
  enabled: boolean;
};

/**
 * Compact Row-1 center card:
 * Header = title + Shared / Not shared / Empty (top-right)
 * Body = Breakfast · Lunch · Dinner slots
 */
export function MealOperationsTodayCard({
  spaceId,
  menuDate,
  enabled,
}: MealOperationsTodayCardProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);
  const menus = useDailyMenus(spaceId, menuDate, enabled);

  const summary = useMemo(() => {
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

  const goPlan = () => navigate(spaceMealsPath(spaceId, menuDate));
  const goHeadcount = (mealType: MealType) =>
    navigate(spaceMealHeadcountPath(spaceId, { date: menuDate, mealType }));

  return (
    <Box
      component="section"
      aria-label={t('dashboard.mealOperations.titleToday', {
        defaultValue: 'Meal Operations (Today)',
      })}
      sx={{
        p: 1.5,
        borderRadius: `${DASHBOARD_UX.radius}px`,
        bgcolor: s.surface,
        boxShadow: s.shadow,
        border: `1px solid ${s.border}`,
        height: DASHBOARD_UX.summaryCardHeight,
        minHeight: DASHBOARD_UX.summaryCardMinHeight,
        maxHeight: DASHBOARD_UX.summaryCardMaxHeight,
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
        minWidth: 0,
        boxSizing: 'border-box',
      }}
    >
      <Stack
        direction="row"
        spacing={1.5}
        sx={{ alignItems: 'center', justifyContent: 'space-between', minWidth: 0 }}
      >
        <Typography
          sx={{
            ...DASHBOARD_UX.sectionHeading,
            color: s.textPrimary,
            flexShrink: 0,
          }}
        >
          {t('dashboard.mealOperations.titleToday', {
            defaultValue: 'Meal Operations (Today)',
          })}
        </Typography>

        <Stack direction="row" spacing={1.75} sx={{ alignItems: 'flex-end', flexShrink: 0 }}>
          <HeaderMetric label={t('dashboard.todaysOverview.shared')} value={summary.shared} />
          <HeaderMetric label={t('dashboard.todaysOverview.notShared')} value={summary.notShared} />
          <HeaderMetric label={t('dashboard.todaysOverview.empty')} value={summary.empty} />
        </Stack>
      </Stack>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
          gap: `${DASHBOARD_UX.cardGap}px`,
          flex: 1,
          minHeight: 0,
        }}
      >
        {MEAL_TYPES.map((mealType) => {
          const menu = menus.menus.find((row) => row.mealType === mealType);
          const planned = hasPlannedMenu(menu);
          const Icon = ICONS[mealType];
          const accent = ACCENTS[mealType];
          const isShared = planned && menu?.status === 'PUBLISHED';
          let statusLabel = t('meals.status.empty', { defaultValue: 'Empty' });
          if (isShared) {
            statusLabel = t('meals.status.PUBLISHED', { defaultValue: 'Shared' });
          } else if (planned) {
            statusLabel = t(`meals.status.${menu?.status ?? 'DRAFT'}`, {
              defaultValue: 'Not shared',
            });
          }

          const onSlotPress = () => {
            if (isShared) {
              goHeadcount(mealType);
              return;
            }
            goPlan();
          };

          return (
            <Box
              key={mealType}
              role="button"
              tabIndex={0}
              onClick={onSlotPress}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSlotPress();
                }
              }}
              aria-label={`${t(`meals.mealType.${mealType}`)} — ${statusLabel}`}
              sx={{
                minWidth: 0,
                px: 1,
                py: 0.85,
                bgcolor: s.elevated,
                border: `1px solid ${s.border}`,
                borderRadius: `${DASHBOARD_UX.tileRadius}px`,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                gap: 0.25,
                cursor: 'pointer',
                transition: DASHBOARD_UX.transition,
                '&:hover': {
                  bgcolor: s.surface,
                  boxShadow: s.shadow,
                },
                '&:focus-visible': {
                  outline: `2px solid ${colors.primary}`,
                  outlineOffset: 2,
                },
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6, minWidth: 0 }}>
                <IconBadge accent={accent}>
                  <Icon />
                </IconBadge>
                <Typography
                  sx={{
                    ...DASHBOARD_UX.cardTitle,
                    color: s.textPrimary,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {t(`meals.mealType.${mealType}`)}
                </Typography>
              </Box>
              <Typography sx={{ ...DASHBOARD_UX.body, color: s.textSecondary }} noWrap>
                {statusLabel}
              </Typography>
              <Typography
                sx={{
                  ...DASHBOARD_UX.link,
                  color: 'primary.dark',
                  alignSelf: 'flex-start',
                }}
              >
                {isShared
                  ? `${t('dashboard.headcount.view', { defaultValue: 'View headcount' })} →`
                  : `${t('dashboard.mealOperations.planMenu')} →`}
              </Typography>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}

function HeaderMetric({ label, value }: { label: string; value: number }) {
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);
  return (
    <Box sx={{ textAlign: 'right', minWidth: 36 }}>
      <Typography sx={{ ...DASHBOARD_UX.counterValue, color: s.textPrimary }}>{value}</Typography>
      <Typography sx={{ ...DASHBOARD_UX.counterLabel, color: s.textSecondary, mt: 0.1 }}>
        {label}
      </Typography>
    </Box>
  );
}
