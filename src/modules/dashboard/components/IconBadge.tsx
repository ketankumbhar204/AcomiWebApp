import { Box, useTheme } from '@mui/material';
import type { ReactNode } from 'react';
import { semanticSurface, type SemanticTone } from '@/shared/theme/semantic';
import { DASHBOARD_UX, dashSurfaces } from '../theme/dashboardUx';

type IconBadgeProps = {
  children: ReactNode;
  accent?: string;
  tone?: SemanticTone;
};

/** Compact pastel icon well — prefer `tone` so color meaning stays shared. */
export function IconBadge({ children, accent, tone }: IconBadgeProps) {
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);
  const surface = tone ? semanticSurface(tone, theme.palette.mode) : null;

  return (
    <Box
      sx={{
        width: DASHBOARD_UX.iconWell,
        height: DASHBOARD_UX.iconWell,
        borderRadius: `${DASHBOARD_UX.iconWellRadius}px`,
        bgcolor: surface
          ? surface.iconBg
          : theme.palette.mode === 'dark'
            ? s.elevated
            : `${accent ?? s.textMuted}1A`,
        color: surface?.fg ?? accent ?? s.textMuted,
        display: 'grid',
        placeItems: 'center',
        flexShrink: 0,
        '& svg': {
          width: DASHBOARD_UX.iconSize,
          height: DASHBOARD_UX.iconSize,
          strokeWidth: 1.75,
        },
      }}
    >
      {children}
    </Box>
  );
}
