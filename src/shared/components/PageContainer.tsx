import { Box } from '@mui/material';
import type { ReactNode } from 'react';

type PageContainerProps = {
  children: ReactNode;
  gap?: number;
};

export function PageContainer({ children, gap = 2.5 }: PageContainerProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap,
        width: '100%',
        minWidth: 0,
        maxWidth: '100%',
      }}
    >
      {children}
    </Box>
  );
}
