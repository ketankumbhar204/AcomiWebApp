import { Box, Paper, useTheme } from '@mui/material';
import type { ReactNode } from 'react';
import { DASHBOARD_UX, dashSurfaces } from '@/modules/dashboard/theme/dashboardUx';

type StickyFooterProps = {
  children: ReactNode;
};

/** Sticky action bar — Dashboard surface / border / denser padding. */
export function StickyFooter({ children }: StickyFooterProps) {
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);

  return (
    <Paper
      elevation={0}
      square
      sx={{
        position: 'sticky',
        bottom: 0,
        zIndex: (t) => t.zIndex.appBar,
        borderTop: `1px solid ${s.border}`,
        bgcolor: s.surface,
        boxShadow: s.shadow,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          gap: 1.25,
          px: { xs: 2, md: `${DASHBOARD_UX.pagePadding}px` },
          py: 1.25,
        }}
      >
        {children}
      </Box>
    </Paper>
  );
}
