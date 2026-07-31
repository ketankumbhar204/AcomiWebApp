import { Box, Typography, useTheme } from '@mui/material';
import type { ReactNode } from 'react';
import { DASHBOARD_UX, dashSurfaces } from '@/modules/dashboard/theme/dashboardUx';

type FormSectionProps = {
  title?: string;
  description?: string;
  children: ReactNode;
};

/** Form section — Dashboard section title + field grid. */
export function FormSection({ title, description, children }: FormSectionProps) {
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);

  return (
    <Box
      component="section"
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: `${DASHBOARD_UX.cardGap}px`,
        py: 0.5,
      }}
    >
      {title || description ? (
        <Box>
          {title ? (
            <Typography sx={{ ...DASHBOARD_UX.sectionHeading, color: s.textPrimary }}>{title}</Typography>
          ) : null}
          {description ? (
            <Typography sx={{ ...DASHBOARD_UX.body, color: s.textSecondary, mt: 0.35 }}>
              {description}
            </Typography>
          ) : null}
        </Box>
      ) : null}
      <Box
        sx={{
          display: 'grid',
          gap: `${DASHBOARD_UX.cardGap}px`,
          gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
