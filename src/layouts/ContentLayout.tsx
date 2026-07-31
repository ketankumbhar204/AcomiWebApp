import { Box } from '@mui/material';
import type { ReactNode } from 'react';
import { LAYOUT } from './layoutConstants';

type ContentLayoutProps = {
  children: ReactNode;
  /** Constrain inner width for readability on ultra-wide screens. */
  maxWidth?: number | false;
  /** Reduce vertical padding for dense dashboards. */
  dense?: boolean;
};

export function ContentLayout({
  children,
  maxWidth = LAYOUT.contentMaxWidth,
  dense = false,
}: ContentLayoutProps) {
  return (
    <Box
      sx={{
        width: '100%',
        maxWidth: maxWidth === false ? 'none' : maxWidth,
        mx: 'auto',
        px: { xs: 1.5, md: 3 },
        py: { xs: dense ? 1.5 : 2, md: dense ? 1.75 : 3 },
      }}
    >
      {children}
    </Box>
  );
}
