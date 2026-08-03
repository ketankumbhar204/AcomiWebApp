import { Box, Typography, useTheme } from '@mui/material';
import type { ReactNode } from 'react';
import { DASHBOARD_UX, dashSurfaces } from '@/modules/dashboard/theme/dashboardUx';

type PageSectionProps = {
  title?: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
};

export function PageSection({ title, description, actions, children }: PageSectionProps) {
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);

  return (
    <Box
      component="section"
      sx={{ display: 'flex', flexDirection: 'column', gap: `${DASHBOARD_UX.cardGap}px` }}
    >
      {title || actions ? (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 2,
          }}
        >
          <Box>
            {title ? (
              <Typography sx={{ ...DASHBOARD_UX.sectionHeading, color: s.textPrimary }}>
                {title}
              </Typography>
            ) : null}
            {description ? (
              <Typography sx={{ ...DASHBOARD_UX.sectionSubtitle, color: s.textSecondary, mt: 0.25 }}>
                {description}
              </Typography>
            ) : null}
          </Box>
          {actions}
        </Box>
      ) : null}
      {children}
    </Box>
  );
}
