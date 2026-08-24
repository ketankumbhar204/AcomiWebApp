import { Box, Typography, useTheme } from '@mui/material';
import { Bell, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { spacePendingActionsPath } from '@/routes/paths';
import { colors } from '@/shared/theme/colors';
import { IconBadge } from './IconBadge';
import { DASHBOARD_UX, dashSurfaces } from '../theme/dashboardUx';

type PendingActionsHeroCardProps = {
  spaceId: string;
  pendingCount: number;
};

/** Top-row alert card — Figma third KPI slot. */
export function PendingActionsHeroCard({ spaceId, pendingCount }: PendingActionsHeroCardProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);

  return (
    <Box
      role="button"
      tabIndex={0}
      onClick={() => navigate(spacePendingActionsPath(spaceId))}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          navigate(spacePendingActionsPath(spaceId));
        }
      }}
      aria-label={t('dashboard.attention.pendingActions')}
      sx={{
        p: `${DASHBOARD_UX.cardPadding}px`,
        borderRadius: `${DASHBOARD_UX.radius}px`,
        height: DASHBOARD_UX.summaryCardHeight,
        minHeight: DASHBOARD_UX.summaryCardMinHeight,
        maxHeight: DASHBOARD_UX.summaryCardMaxHeight,
        bgcolor: s.pendingTint,
        border: `1px solid ${s.pendingBorder}`,
        boxShadow: s.shadow,
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        cursor: 'pointer',
        transition: DASHBOARD_UX.transition,
        '&:hover': { boxShadow: s.shadowHover },
        '&:focus-visible': { outline: `2px solid ${colors.primary}`, outlineOffset: 2 },
      }}
    >
      <Box sx={{ position: 'relative', flexShrink: 0 }}>
        <IconBadge tone="warning">
          <Bell />
        </IconBadge>
        {pendingCount > 0 ? (
          <Box
            sx={{
              position: 'absolute',
              top: -4,
              right: -4,
              minWidth: DASHBOARD_UX.badgeSize,
              height: DASHBOARD_UX.badgeSize,
              borderRadius: 999,
              bgcolor: 'error.main',
              color: 'common.white',
              ...DASHBOARD_UX.badge,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {pendingCount > 99 ? '99+' : pendingCount}
          </Box>
        ) : null}
      </Box>
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography sx={{ ...DASHBOARD_UX.cardTitle, color: s.textPrimary }}>
          {t('dashboard.attention.pendingActions')}
        </Typography>
        <Typography sx={{ ...DASHBOARD_UX.cardSubtitle, color: s.textSecondary, mt: 0.35 }}>
          {pendingCount > 0
            ? t('dashboard.attention.pendingActionsSubtitle', { count: pendingCount })
            : t('dashboard.pendingActions.empty')}
        </Typography>
      </Box>
      <ChevronRight size={14} color={s.textMuted} aria-hidden />
    </Box>
  );
}
