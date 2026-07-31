import { Box, Typography, useTheme } from '@mui/material';
import type { ReactNode } from 'react';
import { DASHBOARD_UX, dashSurfaces } from '@/modules/dashboard/theme/dashboardUx';

type SectionHeaderProps = {
  title: string;
  description?: string;
  action?: ReactNode;
};

/** Lightweight section title — Dashboard sectionHeading. */
export function SectionHeader({ title, description, action }: SectionHeaderProps) {
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: 2,
        mb: 1,
      }}
    >
      <Box sx={{ minWidth: 0 }}>
        <Typography sx={{ ...DASHBOARD_UX.sectionHeading, color: s.textPrimary }}>{title}</Typography>
        {description ? (
          <Typography sx={{ ...DASHBOARD_UX.sectionSubtitle, color: s.textSecondary, mt: 0.25 }}>
            {description}
          </Typography>
        ) : null}
      </Box>
      {action}
    </Box>
  );
}
