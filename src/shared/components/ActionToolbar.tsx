import { Box } from '@mui/material';
import type { ReactNode } from 'react';

type ActionToolbarProps = {
  children: ReactNode;
  align?: 'start' | 'end' | 'between';
};

export function ActionToolbar({ children, align = 'end' }: ActionToolbarProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        flexWrap: 'wrap',
        justifyContent:
          align === 'start' ? 'flex-start' : align === 'between' ? 'space-between' : 'flex-end',
      }}
    >
      {children}
    </Box>
  );
}
