import { MaterialDesignContent, SnackbarProvider as NotistackProvider } from 'notistack';
import { styled } from '@mui/material/styles';
import type { ReactNode } from 'react';
import { colors } from '@/shared/theme/colors';

type SnackbarProviderProps = {
  children: ReactNode;
};

const g = colors.guidance;

/** Same dark panel as the share-meal guided steps, so notices are not green buttons. */
const Notice = styled(MaterialDesignContent)({
  '&.notistack-MuiContent': {
    backgroundColor: g.surface,
    color: g.text,
    border: `1px solid ${g.border}`,
    borderRadius: 20,
    boxShadow: '0 8px 24px rgba(11, 28, 22, 0.28)',
  },
  '&.notistack-MuiContent-success, &.notistack-MuiContent-info, &.notistack-MuiContent-warning, &.notistack-MuiContent-error, &.notistack-MuiContent-default':
    {
      backgroundColor: g.surface,
      color: g.text,
    },
});

export function SnackbarProvider({ children }: SnackbarProviderProps) {
  return (
    <NotistackProvider
      maxSnack={4}
      autoHideDuration={4000}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      Components={{
        default: Notice,
        success: Notice,
        error: Notice,
        warning: Notice,
        info: Notice,
      }}
    >
      {children}
    </NotistackProvider>
  );
}
