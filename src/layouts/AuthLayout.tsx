import { Box, useTheme } from '@mui/material';
import type { ReactNode } from 'react';
import { AuthIllustration } from '@/modules/auth/components/AuthIllustration';
import { DASHBOARD_UX, dashSurfaces } from '@/modules/dashboard/theme/dashboardUx';
import { SkipLink, MAIN_CONTENT_ID } from '@/shared/components/SkipLink';

type AuthLayoutProps = {
  children: ReactNode;
};

/**
 * Auth shell aligned to Dashboard surfaces — branding panel + centered card column.
 */
export function AuthLayout({ children }: AuthLayoutProps) {
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: 'minmax(280px, 1fr) minmax(320px, 1fr)' },
        bgcolor: s.pageBg,
        position: 'relative',
      }}
    >
      <SkipLink />
      <AuthIllustration />
      <Box
        component="main"
        id={MAIN_CONTENT_ID}
        tabIndex={-1}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          px: { xs: 2, sm: 3, md: `${DASHBOARD_UX.pagePadding}px` },
          py: { xs: 4, md: 5 },
          minHeight: { xs: '100vh', md: 'auto' },
          outline: 'none',
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
