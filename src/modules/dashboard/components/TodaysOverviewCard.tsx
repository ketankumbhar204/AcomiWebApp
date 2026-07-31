import { Box, Stack, Typography, useTheme } from '@mui/material';
import { CalendarDays, ChevronRight } from 'lucide-react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useDailyMenus, useMealPolls } from '@/modules/meals/hooks/useMeals';
import { spaceMealsPath } from '@/routes/paths';
import { colors } from '@/shared/theme/colors';
import type { DailyMenuResponse, MealType } from '@/shared/types/meals';
import { IconBadge } from './IconBadge';
import { DASHBOARD_UX, dashSurfaces, metricValueSx } from '../theme/dashboardUx';

const MEAL_TYPES: MealType[] = ['BREAKFAST', 'LUNCH', 'DINNER'];

function hasPlannedMenu(menu: DailyMenuResponse | undefined): boolean {
  return (menu?.options?.filter((o) => o.isAvailable) ?? []).length > 0;
}

type TodaysOverviewCardProps = {
  spaceId: string;
  menuDate: string;
  enabled: boolean;
};

export function TodaysOverviewCard({ spaceId, menuDate, enabled }: TodaysOverviewCardProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);
  const menus = useDailyMenus(spaceId, menuDate, enabled);
  const polls = useMealPolls(spaceId, menuDate, enabled);

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

  const pollLine = useMemo(() => {
    const open = (polls.pollDay?.polls ?? []).some((p) => p.status === 'OPEN');
    if (open) return t('dashboard.operations.pollOpen');
    if (summary.shared > 0) return t('dashboard.operations.pollClosed');
    return t('dashboard.operations.pollNotOpen');
  }, [polls.pollDay?.polls, summary.shared, t]);

  return (
    <Box
      role="button"
      tabIndex={0}
      onClick={() => navigate(spaceMealsPath(spaceId, menuDate))}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          navigate(spaceMealsPath(spaceId, menuDate));
        }
      }}
      aria-label={t('dashboard.todaysOverview.title')}
      sx={{
        p: `${DASHBOARD_UX.cardPadding}px`,
        borderRadius: `${DASHBOARD_UX.radius}px`,
        bgcolor: s.surface,
        boxShadow: s.shadow,
        border: `1px solid ${s.border}`,
        height: DASHBOARD_UX.summaryCardHeight,
        minHeight: DASHBOARD_UX.summaryCardMinHeight,
        maxHeight: DASHBOARD_UX.summaryCardMaxHeight,
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        transition: DASHBOARD_UX.transition,
        '&:hover': { boxShadow: s.shadowHover },
        '&:focus-visible': { outline: `2px solid ${colors.primary}`, outlineOffset: 2 },
      }}
    >
      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
        <Typography sx={{ ...DASHBOARD_UX.cardTitle, color: s.textPrimary }}>
          {t('dashboard.todaysOverview.title')}
        </Typography>
        <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
          <IconBadge accent={colors.primaryDark}>
            <CalendarDays />
          </IconBadge>
          <ChevronRight size={14} color={s.textMuted} aria-hidden />
        </Stack>
      </Stack>

      <Stack direction="row" spacing={2} sx={{ flex: 1, alignItems: 'center' }}>
        <Metric label={t('dashboard.todaysOverview.shared')} value={summary.shared} />
        <Metric label={t('dashboard.todaysOverview.notShared')} value={summary.notShared} />
        <Metric label={t('dashboard.todaysOverview.empty')} value={summary.empty} />
      </Stack>

      <Typography sx={{ ...DASHBOARD_UX.cardSubtitle, color: s.textSecondary, mt: 'auto' }}>
        {pollLine}
      </Typography>
    </Box>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);
  return (
    <Box>
      <Typography sx={{ ...metricValueSx(), color: s.textPrimary }}>{value}</Typography>
      <Typography sx={{ ...DASHBOARD_UX.caption, color: s.textSecondary, mt: 0.15 }}>
        {label}
      </Typography>
    </Box>
  );
}
