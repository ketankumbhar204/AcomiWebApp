import { Box, IconButton, Link, Stack, Typography, useTheme } from '@mui/material';
import { ChevronLeft, ChevronRight, Moon, Sun, Sunrise } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  useDailyMenus,
  useEligibilitySummary,
  useMealHeadcountDay,
  useMealPolls,
} from '@/modules/meals/hooks/useMeals';
import {
  addDaysIso,
  formatMenuDateLabel,
  todayIsoDate,
} from '@/modules/meals/utils/mealDates';
import { spaceMealsPath } from '@/routes/paths';
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
  useMealHeadcountDay(spaceId, menuDate, enabled);

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
  const goPlan = () => navigate(spaceMealsPath(spaceId, menuDate));

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
        <Stack direction="row" spacing={0.25} sx={{ alignItems: 'center', flexShrink: 0 }}>
          <IconButton
            size="small"
            aria-label={t('common.previous', { defaultValue: 'Previous day' })}
            onClick={() => setMenuDate((d) => addDaysIso(d, -1))}
            sx={{ p: 0.5 }}
          >
            <ChevronLeft size={14} />
          </IconButton>
          <Typography
            sx={{
              ...DASHBOARD_UX.button,
              color: s.textPrimary,
              minWidth: 136,
              textAlign: 'center',
            }}
          >
            {formatMenuDateLabel(menuDate)}
            {isToday ? ` · ${t('common.today', { defaultValue: 'Today' })}` : ''}
          </Typography>
          <IconButton
            size="small"
            aria-label={t('common.next', { defaultValue: 'Next day' })}
            onClick={() => setMenuDate((d) => addDaysIso(d, 1))}
            sx={{ p: 0.5 }}
          >
            <ChevronRight size={14} />
          </IconButton>
          <Link
            component="button"
            type="button"
            underline="hover"
            onClick={goPlan}
            sx={{
              ...DASHBOARD_UX.button,
              color: 'primary.dark',
              ml: 0.75,
            }}
          >
            {t('dashboard.mealOperations.planMenu')} →
          </Link>
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
          gap: `${DASHBOARD_UX.cardGap}px`,
        }}
      >
        {MEAL_TYPES.map((mealType) => {
          const menu = menus.menus.find((row) => row.mealType === mealType);
          const planned = hasPlannedMenu(menu);
          const Icon = ICONS[mealType];
          const accent = ACCENTS[mealType];
          let statusLabel = t('meals.status.empty', { defaultValue: 'Empty' });
          if (planned && menu?.status === 'PUBLISHED') {
            statusLabel = t('meals.status.PUBLISHED', { defaultValue: 'Shared' });
          } else if (planned) {
            statusLabel = t(`meals.status.${menu?.status ?? 'DRAFT'}`, {
              defaultValue: 'Not shared',
            });
          }

          return (
            <Box
              key={mealType}
              role="button"
              tabIndex={0}
              onClick={goPlan}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  goPlan();
                }
              }}
              aria-label={`${t(`meals.mealType.${mealType}`)} — ${statusLabel}`}
              sx={{
                minWidth: 0,
                minHeight: DASHBOARD_UX.mealCardMinHeight,
                maxHeight: DASHBOARD_UX.mealCardMaxHeight,
                px: `${DASHBOARD_UX.metricPadding + 2}px`,
                py: `${DASHBOARD_UX.metricPadding}px`,
                bgcolor: s.elevated,
                border: `1px solid ${s.border}`,
                borderRadius: `${DASHBOARD_UX.tileRadius}px`,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                gap: `${DASHBOARD_UX.internalGap}px`,
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
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: `${DASHBOARD_UX.internalGap}px`,
                  minWidth: 0,
                }}
              >
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
              <Typography sx={{ ...DASHBOARD_UX.cardSubtitle, color: s.textSecondary }} noWrap>
                {statusLabel}
              </Typography>
              <Typography sx={{ ...DASHBOARD_UX.button, color: 'primary.dark' }}>
                {t('dashboard.mealOperations.planMenu')} →
              </Typography>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
