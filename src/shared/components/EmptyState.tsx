import { Box, Typography, useTheme } from '@mui/material';
import type { ReactNode } from 'react';
import { DASHBOARD_UX, dashSurfaces } from '@/modules/dashboard/theme/dashboardUx';

type EmptyStateProps = {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
};

/** Shared empty state — Dashboard typography & muted text. */
export function EmptyState({ title, description, icon, action }: EmptyStateProps) {
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        gap: 1,
        py: 4,
        px: 2,
      }}
    >
      {icon ? <Box sx={{ mb: 0.5 }}>{icon}</Box> : null}
      <Typography sx={{ ...DASHBOARD_UX.sectionHeading, color: s.textPrimary }}>{title}</Typography>
      {description ? (
        <Typography sx={{ ...DASHBOARD_UX.body, color: s.textSecondary, maxWidth: 420 }}>
          {description}
        </Typography>
      ) : null}
      {action ? <Box sx={{ mt: 1.5 }}>{action}</Box> : null}
    </Box>
  );
}
