import { Box, Stack, Typography, useTheme } from '@mui/material';
import { CircleDashed, Moon, Package, Sun, Sunrise, Users } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useMemo, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useDailyMenus, useMealHeadcountDay } from '@/modules/meals/hooks/useMeals';
import { spaceMealHeadcountPath, spaceMealsPath } from '@/routes/paths';
import { StatusChip } from '@/shared/components/StatusChip';
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
 * Row-1 center — Meal Operations (Today).
 * Header chips + Breakfast / Lunch / Dinner tiles with headcount.
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
  const headcount = useMealHeadcountDay(spaceId, menuDate, enabled);

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

  const headcountByType = useMemo(() => {
    const map: Partial<Record<MealType, number>> = {};
    for (const slot of headcount.headcount?.slots ?? []) {
      map[slot.mealType] = slot.mealsToPrepare;
    }
    return map;
  }, [headcount.headcount]);

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
        spacing={1}
        sx={{ alignItems: 'center', justifyContent: 'space-between', minWidth: 0, gap: 1 }}
      >
        <Typography
          sx={{
            ...DASHBOARD_UX.sectionHeading,
            color: s.textPrimary,
            flexShrink: 1,
            minWidth: 0,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {t('dashboard.mealOperations.titleToday', {
            defaultValue: 'Meal Operations (Today)',
          })}
        </Typography>

        <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center', flexShrink: 0 }}>
          <SummaryChip
            icon={<Users size={12} strokeWidth={2.4} />}
            value={summary.shared}
            label={t('dashboard.todaysOverview.shared')}
            accent={colors.success}
            soft={s.successTint}
          />
          <SummaryChip
            icon={<Package size={12} strokeWidth={2.4} />}
            value={summary.notShared}
            label={t('dashboard.todaysOverview.notShared')}
            accent="#D97706"
            soft={s.warningTint}
          />
          <SummaryChip
            icon={<CircleDashed size={12} strokeWidth={2.4} />}
            value={summary.empty}
            label={t('dashboard.todaysOverview.empty')}
            accent={s.textMuted}
            soft={s.elevated}
          />
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
                bgcolor: s.elevated,
                border: `1px solid ${s.border}`,
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

function SummaryChip({
  icon,
  value,
  label,
  accent,
  soft,
}: {
  icon: ReactNode;
  value: number;
  label: string;
  accent: string;
  soft: string;
}) {
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);

  return (
    <Box
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0.45,
        px: 0.75,
        py: 0.35,
        borderRadius: 999,
        bgcolor: soft,
        border: `1px solid ${accent}33`,
        whiteSpace: 'nowrap',
      }}
    >
      <Box sx={{ color: accent, display: 'flex', alignItems: 'center' }}>{icon}</Box>
      <Typography
        sx={{
          ...DASHBOARD_UX.badge,
          color: s.textPrimary,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {value}
      </Typography>
      <Typography
        sx={{
          ...DASHBOARD_UX.badge,
          color: accent,
        }}
      >
        {label}
      </Typography>
    </Box>
  );
}
