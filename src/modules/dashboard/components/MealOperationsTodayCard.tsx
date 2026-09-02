import { Box, Typography, useTheme } from '@mui/material';
import { Moon, Sun, Sunrise } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useDailyMenus, useMealHeadcountDay } from '@/modules/meals/hooks/useMeals';
import { formatMenuDateLabel } from '@/modules/meals/utils/mealDates';
import { spaceMealHeadcountPath, spaceMealsPath } from '@/routes/paths';
import { StatusChip } from '@/shared/components/StatusChip';
import { colors } from '@/shared/theme/colors';
import { semanticSurface, type SemanticTone } from '@/shared/theme/semantic';
import type { DailyMenuResponse, MealType } from '@/shared/types/meals';
import { IconBadge } from './IconBadge';
import { DASHBOARD_UX, dashSurfaces } from '../theme/dashboardUx';

const MEAL_TYPES: MealType[] = ['BREAKFAST', 'LUNCH', 'DINNER'];

const ICONS: Record<MealType, LucideIcon> = {
  BREAKFAST: Sunrise,
  LUNCH: Sun,
  DINNER: Moon,
};

const MEAL_TONES: Record<MealType, SemanticTone> = {
  BREAKFAST: 'peach',
  LUNCH: 'success',
  DINNER: 'purple',
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
 * Row-1 center — Meal operations.
 * Quiet title + date + one status line; Breakfast / Lunch / Dinner tiles.
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
  const goHeadcount = (mealType: MealType) =>
    navigate(spaceMealHeadcountPath(spaceId, { date: menuDate, mealType }));

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
      <Typography
        sx={{
          ...DASHBOARD_UX.sectionHeading,
          color: s.textPrimary,
          minWidth: 0,
        }}
      >
        {t('dashboard.mealOperations.title', { defaultValue: 'Meal operations' })}
        {' '}
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
          const tone = MEAL_TONES[mealType];
          const surface = semanticSurface(tone, theme.palette.mode);
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
                px: 1.1,
                py: 1,
                bgcolor: surface.bg,
                border: `1px solid ${surface.border}`,
                borderRadius: `${DASHBOARD_UX.tileRadius}px`,
                display: 'flex',
                flexDirection: 'column',
                gap: 0.35,
                cursor: 'pointer',
                transition: DASHBOARD_UX.transition,
                '&:hover': {
                  bgcolor: s.surface,
                  boxShadow: s.shadow,
                  transform: 'translateY(-1px)',
                },
                '&:focus-visible': {
                  outline: `2px solid ${colors.primary}`,
                  outlineOffset: 2,
                },
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.65, minWidth: 0 }}>
                <IconBadge tone={tone}>
                  <Icon />
                </IconBadge>
                <Typography
                  sx={{
                    ...DASHBOARD_UX.cardTitle,
                    color: s.textPrimary,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    flex: 1,
                    minWidth: 0,
                  }}
                >
                  {t(`meals.mealType.${mealType}`)}
                </Typography>
              </Box>

              <StatusChip label={statusLabel} tone={statusTone} />

              <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                {isShared && count != null ? (
                  <>
                    <Typography
                      sx={{
                        ...DASHBOARD_UX.largeNumber,
                        color: s.textPrimary,
                      }}
                    >
                      {count}
                    </Typography>
                    <Typography sx={{ ...DASHBOARD_UX.smallCaption, color: s.textMuted, mt: 0.1 }}>
                      {t('dashboard.headcount.label', { defaultValue: 'Headcount' })}
                    </Typography>
                  </>
                ) : (
                  <Typography sx={{ ...DASHBOARD_UX.body, color: s.textSecondary, mt: 0.25 }}>
                    {planned
                      ? t('dashboard.todaysOverview.notShared')
                      : t('meals.planning.emptySlot', { defaultValue: 'Not planned' })}
                  </Typography>
                )}
              </Box>

              <Typography
                sx={{
                  ...DASHBOARD_UX.link,
                  color: 'primary.dark',
                  alignSelf: 'flex-start',
                  mt: 'auto',
                }}
              >
                {isShared
                  ? `${t('dashboard.headcount.viewDetails', { defaultValue: 'View details' })} →`
                  : `${t('dashboard.mealOperations.planMenu')} →`}
              </Typography>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
