import { SnackbarProvider as NotistackProvider } from 'notistack';
import type { ReactNode } from 'react';

type SnackbarProviderProps = {
  children: ReactNode;
};

export function SnackbarProvider({ children }: SnackbarProviderProps) {
  return (
    <NotistackProvider
      maxSnack={4}
      autoHideDuration={4000}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
    >
      {children}
    </NotistackProvider>
  );
}
