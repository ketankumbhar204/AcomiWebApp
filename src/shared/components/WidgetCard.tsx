import { Box, Paper, Typography, useTheme } from '@mui/material';
import type { ReactNode } from 'react';
import { DASHBOARD_UX, dashSurfaces } from '@/modules/dashboard/theme/dashboardUx';

type WidgetCardProps = {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
};

export function WidgetCard({ title, subtitle, action, children }: WidgetCardProps) {
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);

  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: `${DASHBOARD_UX.radius}px`,
        p: `${DASHBOARD_UX.cardPadding}px`,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: `${DASHBOARD_UX.internalGap}px`,
        bgcolor: s.surface,
        border: `1px solid ${s.border}`,
        boxShadow: s.shadow,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1 }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ ...DASHBOARD_UX.cardTitle, color: s.textPrimary }}>{title}</Typography>
          {subtitle ? (
            <Typography sx={{ ...DASHBOARD_UX.cardSubtitle, color: s.textSecondary, mt: 0.25 }}>
              {subtitle}
            </Typography>
          ) : null}
        </Box>
        {action}
      </Box>
      <Box sx={{ flex: 1, minHeight: 0 }}>{children}</Box>
    </Paper>
  );
}
