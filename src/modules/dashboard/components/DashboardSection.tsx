import { Box, Typography, useTheme } from '@mui/material';
import type { ReactNode } from 'react';
import { DASHBOARD_UX, dashSurfaces } from '../theme/dashboardUx';

type DashboardSectionProps = {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  surface?: boolean;
};

/** Section shell — title lives inside the card (Figma boards). */
export function DashboardSection({
  title,
  subtitle,
  action,
  children,
  surface = true,
}: DashboardSectionProps) {
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);

  const header = (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: 1,
        mb: surface ? 1 : 0.75,
      }}
    >
      <Box sx={{ minWidth: 0 }}>
        <Typography sx={{ ...DASHBOARD_UX.sectionHeading, color: s.textPrimary }}>{title}</Typography>
          {subtitle ? (
            <Typography sx={{ ...DASHBOARD_UX.sectionSubtitle, color: s.textMuted, mt: 0.15 }}>
              {subtitle}
            </Typography>
          ) : null}
      </Box>
      {action}
    </Box>
  );

  return (
    <Box component="section" aria-label={title} sx={{ minWidth: 0, height: '100%' }}>
      {surface ? (
        <Box
          sx={{
            bgcolor: s.surface,
            borderRadius: `${DASHBOARD_UX.radius}px`,
            border: `1px solid ${s.border}`,
            boxShadow: s.shadow,
            p: `${DASHBOARD_UX.sectionPadding}px`,
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {header}
          {children}
        </Box>
      ) : (
        <>
          {header}
          {children}
        </>
      )}
    </Box>
  );
}
