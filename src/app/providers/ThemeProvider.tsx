import { CssBaseline, ThemeProvider as MuiThemeProvider } from '@mui/material';
import type { ReactNode } from 'react';
import { useMemo } from 'react';
import { createAcomiTheme } from '@/shared/theme';
import { useAppStore } from '@/store/appStore';

type ThemeProviderProps = {
  children: ReactNode;
};

export function ThemeProvider({ children }: ThemeProviderProps) {
  const themeMode = useAppStore((state) => state.themeMode);
  const theme = useMemo(() => createAcomiTheme(themeMode), [themeMode]);

  return (
    <MuiThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </MuiThemeProvider>
  );
}
