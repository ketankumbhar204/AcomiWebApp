import { Drawer } from '@mui/material';
import type { ReactNode } from 'react';

type AppDrawerProps = {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  children: ReactNode;
  width?: number | string;
  anchor?: 'left' | 'right';
};

export function AppDrawer({
  open,
  onClose,
  children,
  width = 420,
  anchor = 'right',
}: AppDrawerProps) {
  return (
    <Drawer
      anchor={anchor}
      open={open}
      onClose={onClose}
      slotProps={{
        paper: {
          sx: {
            width: { xs: '100%', sm: width },
            maxWidth: '100%',
          },
        },
      }}
    >
      {children}
    </Drawer>
  );
}
