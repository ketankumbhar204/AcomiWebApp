import { Box, Tooltip, Typography, useTheme } from '@mui/material';
import type { LucideIcon } from 'lucide-react';
import { colors } from '@/shared/theme/colors';
import { semanticSurface, type SemanticTone } from '@/shared/theme/semantic';
import { DASHBOARD_UX, dashSurfaces } from '../theme/dashboardUx';
import { IconBadge } from './IconBadge';

type QuickActionTileProps = {
  title: string;
  subtitle?: string;
  tooltip?: string;
  icon: LucideIcon;
  badgeCount?: number;
  accent?: string;
  tone?: SemanticTone;
  highlighted?: boolean;
  onClick?: () => void;
};

/** Compact quick-action tile — pastel module color + icon well. */
export function QuickActionTile({
  title,
  subtitle,
  tooltip,
  icon: Icon,
  badgeCount,
  accent,
  tone = 'accent',
  highlighted = false,
  onClick,
}: QuickActionTileProps) {
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);
  const surface = semanticSurface(highlighted ? 'warning' : tone, theme.palette.mode);

  const tile = (
    <Box
      component="button"
      type="button"
      onClick={onClick}
      aria-label={badgeCount && badgeCount > 0 ? `${title}, ${badgeCount}` : title}
      sx={{
        all: 'unset',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: 0.45,
        p: 1.25,
        width: '100%',
        minHeight: DASHBOARD_UX.quickActionMinHeight,
        maxHeight: DASHBOARD_UX.quickActionMaxHeight,
        height: DASHBOARD_UX.quickActionHeight,
        borderRadius: `${DASHBOARD_UX.tileRadius}px`,
        bgcolor: surface.bg,
        border: `1px solid ${surface.border}`,
        cursor: 'pointer',
        transition: DASHBOARD_UX.transition,
        overflow: 'hidden',
        '&:hover': {
          boxShadow: s.shadowHover,
          transform: 'translateY(-1px)',
        },
        '&:focus-visible': {
          outline: `2px solid ${colors.primary}`,
          outlineOffset: 2,
        },
      }}
    >
      <Box sx={{ position: 'relative', width: 'fit-content', flexShrink: 0 }}>
        <IconBadge tone={highlighted ? 'warning' : tone} accent={accent ?? surface.fg}>
          <Icon />
        </IconBadge>
        {badgeCount && badgeCount > 0 ? (
          <Box
            sx={{
              position: 'absolute',
              top: -3,
              right: -3,
              minWidth: DASHBOARD_UX.badgeSize,
              height: DASHBOARD_UX.badgeSize,
              px: 0.35,
              borderRadius: 999,
              bgcolor: 'error.main',
              color: 'common.white',
              ...DASHBOARD_UX.badge,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {badgeCount > 99 ? '99+' : badgeCount}
          </Box>
        ) : null}
      </Box>
      <Box sx={{ minWidth: 0, flex: 1, width: '100%' }}>
        <Typography
          sx={{
            ...DASHBOARD_UX.cardTitle,
            color: s.textPrimary,
            whiteSpace: 'normal',
            wordBreak: 'break-word',
          }}
        >
          {title}
        </Typography>
        {subtitle ? (
          <Typography
            sx={{
              mt: 0.2,
              ...DASHBOARD_UX.body,
              color: s.textSecondary,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {subtitle}
          </Typography>
        ) : null}
      </Box>
    </Box>
  );

  if (tooltip) {
    return (
      <Tooltip title={tooltip} placement="top" enterDelay={500}>
        <Box sx={{ display: 'block', width: '100%' }}>{tile}</Box>
      </Tooltip>
    );
  }
  return tile;
}
