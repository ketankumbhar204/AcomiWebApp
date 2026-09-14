import { Box, Typography, useTheme } from '@mui/material';
import { Moon, Sun, Sunrise } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useDailyMenus, useMealHeadcountDay } from '@/modules/meals/hooks/useMeals';
import { formatMenuDateLabel } from '@/modules/meals/utils/mealDates';
import { mealTypeTheme } from '@/modules/meals/utils/mealTypeTheme';
import { spaceMealsEditPath, spaceMealsPath } from '@/routes/paths';
import { StatusChip } from '@/shared/components/StatusChip';
import { colors } from '@/shared/theme/colors';
import type { DailyMenuResponse, MealType } from '@/shared/types/meals';
import { DASHBOARD_UX, dashSurfaces } from '../theme/dashboardUx';

const MEAL_TYPES: MealType[] = ['BREAKFAST', 'LUNCH', 'DINNER'];

const ICONS: Record<MealType, LucideIcon> = {
  BREAKFAST: Sunrise,
  LUNCH: Sun,
  DINNER: Moon,
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
  const headcount = useMealHeadcountDay(spaceId, menuDate, enabled);

  const headcountByType = useMemo(() => {
    const map: Partial<Record<MealType, number>> = {};
    for (const slot of headcount.headcount?.slots ?? []) {
      map[slot.mealType] = slot.mealsToPrepare;
    }
    return map;
  }, [headcount.headcount]);

  const dateLabel = formatMenuDateLabel(menuDate, i18n.language);

  const goPlan = () => navigate(spaceMealsPath(spaceId, menuDate));
  const goEdit = (mealType: MealType) =>
    navigate(spaceMealsEditPath(spaceId, { date: menuDate, mealType }));

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
        height: { xs: 'auto', md: DASHBOARD_UX.summaryCardHeight },
        minHeight: { xs: 0, md: DASHBOARD_UX.summaryCardMinHeight },
        maxHeight: { xs: 'none', md: DASHBOARD_UX.summaryCardMaxHeight },
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
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(3, minmax(0, 1fr))',
          },
          gap: `${DASHBOARD_UX.cardGap}px`,
          flex: 1,
          minHeight: 0,
        }}
      >
        {MEAL_TYPES.map((mealType) => {
          const menu = menus.menus.find((row) => row.mealType === mealType);
          const planned = hasPlannedMenu(menu);
          const Icon = ICONS[mealType];
          const mealTheme = mealTypeTheme(mealType);
          const isShared = planned && menu?.status === 'PUBLISHED';
          const count = headcountByType[mealType];

          let statusLabel = t('meals.status.empty', { defaultValue: 'Empty' });
          let statusTone: 'success' | 'warning' | 'neutral' = 'neutral';
          if (isShared) {
            statusLabel = t('meals.status.PUBLISHED', { defaultValue: 'Published' });
            statusTone = 'success';
          } else if (planned) {
            statusLabel = t(`meals.status.${menu?.status ?? 'DRAFT'}`, {
              defaultValue: 'Not shared',
            });
            statusTone = 'warning';
          }

          return (
            <Box
              key={mealType}
              role="button"
              tabIndex={0}
              onClick={() => goEdit(mealType)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  goEdit(mealType);
                }
              }}
              aria-label={`${t(`meals.mealType.${mealType}`)} — ${statusLabel}`}
              sx={{
                minWidth: 0,
                px: 1.1,
                py: 1,
                bgcolor: mealTheme.soft,
                border: `1px solid #E5E7EB`,
                borderRadius: `${DASHBOARD_UX.tileRadius}px`,
                display: 'flex',
                flexDirection: 'column',
                gap: 0.35,
                cursor: 'pointer',
                transition: DASHBOARD_UX.transition,
                '&:hover': {
                  boxShadow: s.shadow,
                  transform: 'translateY(-1px)',
                },
                '&:focus-visible': {
                  outline: `2px solid ${mealTheme.accent}`,
                  outlineOffset: 2,
                },
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.65, minWidth: 0 }}>
                <Box
                  sx={{
                    width: 28,
                    height: 28,
                    borderRadius: '8px',
                    bgcolor: `${mealTheme.accent}1A`,
                    color: mealTheme.accent,
                    display: 'grid',
                    placeItems: 'center',
                    flexShrink: 0,
                    '& svg': { width: 16, height: 16, strokeWidth: 2.2 },
                  }}
                >
                  <Icon />
                </Box>
                <Typography
                  sx={{
                    fontSize: '0.9375rem',
                    fontWeight: 700,
                    color: mealTheme.accent,
                    minWidth: 0,
                  }}
                  noWrap
                >
                  {t(`meals.mealType.${mealType}`)}
                </Typography>
              </Box>
              <StatusChip label={statusLabel} tone={statusTone} />
              <Typography
                sx={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: mealTheme.accent,
                }}
              >
                {planned
                  ? t('meals.planning.selector.viewMenu', { defaultValue: 'View menu' })
                  : t('meals.planning.selector.planMenu', { defaultValue: 'Plan menu' })}
                {isShared && count != null ? ` · ${count}` : ''}
              </Typography>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
