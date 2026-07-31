import { Box, Stack, Typography, useTheme } from '@mui/material';
import { ChevronRight, Shield } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import type { HealthBandId, SpaceHealthResult } from '@/spaceLifecycle';
import { spaceSpaceHealthPath } from '@/routes/paths';
import { colors } from '@/shared/theme/colors';
import { HealthScoreRing } from './HealthScoreRing';
import { IconBadge } from './IconBadge';
import { DASHBOARD_UX, dashSurfaces } from '../theme/dashboardUx';

function bandColor(band: HealthBandId): string {
  switch (band) {
    case 'excellent':
    case 'healthy':
      return colors.success;
    case 'needsImprovement':
      return '#D97706';
    case 'atRisk':
      return '#EA580C';
    case 'critical':
      return '#DC2626';
    default:
      return colors.primaryDark;
  }
}

type SpaceHealthCardProps = {
  spaceId: string;
  health: SpaceHealthResult | null;
  pendingCount: number;
};

export function SpaceHealthCard({ spaceId, health, pendingCount }: SpaceHealthCardProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);
  const available = health?.available === true;
  const score = available ? health.score : 0;
  const band = available ? health.band : 'healthy';
  const color = bandColor(band);

  return (
    <Box
      role="button"
      tabIndex={0}
      onClick={() => navigate(spaceSpaceHealthPath(spaceId))}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          navigate(spaceSpaceHealthPath(spaceId));
        }
      }}
      aria-label={
        available
          ? t('dashboard.health.a11y.summary', {
              score,
              band: t(`dashboard.health.bands.${band}`),
            })
          : t('dashboard.health.emptyTitle')
      }
      sx={{
        p: 1.5,
        borderRadius: `${DASHBOARD_UX.radius}px`,
        bgcolor: s.surface,
        boxShadow: s.shadow,
        border: `1px solid ${s.border}`,
        height: DASHBOARD_UX.summaryCardHeight,
        minHeight: DASHBOARD_UX.summaryCardMinHeight,
        maxHeight: DASHBOARD_UX.summaryCardMaxHeight,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: 1.25,
        boxSizing: 'border-box',
        transition: DASHBOARD_UX.transition,
        '&:hover': { boxShadow: s.shadowHover },
        '&:focus-visible': { outline: `2px solid ${colors.primary}`, outlineOffset: 2 },
      }}
    >
      <HealthScoreRing
        score={available ? score : 0}
        color={available ? color : s.border}
        size={DASHBOARD_UX.healthRingSize}
        strokeWidth={DASHBOARD_UX.healthRingStroke}
      />
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 0.25 }}>
          <Typography sx={{ ...DASHBOARD_UX.cardTitle, color: s.textPrimary }}>
            {t('dashboard.health.title')}
          </Typography>
          <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
            <IconBadge accent={color}>
              <Shield />
            </IconBadge>
            <ChevronRight size={14} color={s.textMuted} aria-hidden />
          </Stack>
        </Stack>
        <Typography sx={{ ...DASHBOARD_UX.metricLabel, color, fontWeight: 600 }}>
          {available ? t(`dashboard.health.bands.${band}`) : t('dashboard.health.emptyTitle')}
        </Typography>
        <Typography sx={{ ...DASHBOARD_UX.cardSubtitle, color: s.textSecondary, mt: 0.25 }}>
          {pendingCount > 0
            ? t('dashboard.health.banner.issuesAttention', { count: pendingCount })
            : available
              ? t('dashboard.health.summary.healthy')
              : t('dashboard.health.emptyBody')}
        </Typography>
      </Box>
    </Box>
  );
}
