import { Box } from '@mui/material';
import type { ReactNode } from 'react';
import { SkipLink, MAIN_CONTENT_ID } from '@/shared/components/SkipLink';

type BlankLayoutProps = {
  children: ReactNode;
};

/** Minimal full-viewport chrome with no navigation. */
export function BlankLayout({ children }: BlankLayoutProps) {
  return (
    <Box sx={{ minHeight: '100vh', width: '100%', position: 'relative' }}>
      <SkipLink />
      <Box
        component="main"
        id={MAIN_CONTENT_ID}
        tabIndex={-1}
        sx={{
          minHeight: '100vh',
          width: '100%',
          bgcolor: 'background.default',
          color: 'text.primary',
          outline: 'none',
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
