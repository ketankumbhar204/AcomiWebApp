import { Paper, useTheme } from '@mui/material';
import type { ReactNode } from 'react';
import { DASHBOARD_UX, dashSurfaces } from '@/modules/dashboard/theme/dashboardUx';

type ContentCardProps = {
  children: ReactNode;
  padded?: boolean;
};

/** Content card — Dashboard radius, border, shadow. */
export function ContentCard({ children, padded = true }: ContentCardProps) {
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);

  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: `${DASHBOARD_UX.radius}px`,
        border: `1px solid ${s.border}`,
        bgcolor: s.surface,
        boxShadow: s.shadow,
        p: padded ? `${DASHBOARD_UX.cardPadding}px` : 0,
        overflow: 'hidden',
      }}
    >
      {children}
    </Paper>
  );
}
