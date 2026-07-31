import { Box, useTheme } from '@mui/material';
import type { ReactNode } from 'react';
import { DASHBOARD_UX, dashSurfaces } from '../theme/dashboardUx';

type IconBadgeProps = {
  children: ReactNode;
  accent: string;
};

/** Compact 28×28 pastel well, radius 6, icon 16. */
export function IconBadge({ children, accent }: IconBadgeProps) {
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);

  return (
    <Box
      sx={{
        width: DASHBOARD_UX.iconWell,
        height: DASHBOARD_UX.iconWell,
        borderRadius: `${DASHBOARD_UX.iconWellRadius}px`,
        bgcolor: theme.palette.mode === 'dark' ? s.elevated : `${accent}1A`,
        color: accent,
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
