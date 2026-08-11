import { createTheme, type Theme } from '@mui/material/styles';
import type { ThemeMode } from '@/shared/types/common';
import { DASHBOARD_UX } from '@/modules/dashboard/theme/dashboardUx';
import { colors, darkColors } from './colors';
import { elevation } from './elevation';
import { radius } from './radius';
import { typographyOptions } from './typography';

function buildPalette(mode: ThemeMode) {
  const c = mode === 'light' ? colors : darkColors;

  return {
    mode,
    primary: {
      main: c.primary,
      dark: c.primaryDark,
      light: c.lightGreen,
      contrastText: mode === 'light' ? colors.white : colors.textPrimary,
    },
    secondary: {
      main: c.primaryDark,
      contrastText: colors.white,
    },
    success: { main: c.success },
    warning: { main: c.warning },
    error: { main: c.danger },
    background: {
      default: c.background,
      paper: mode === 'light' ? colors.white : c.surface,
    },
    text: {
      primary: c.textPrimary,
      secondary: c.textSecondary,
      disabled: c.muted,
    },
    divider: c.divider ?? c.border,
  } as const;
}

export function createAmicoTheme(mode: ThemeMode = 'light'): Theme {
  const c = mode === 'light' ? colors : darkColors;

  return createTheme({
    palette: buildPalette(mode),
    typography: typographyOptions,
    shape: {
      borderRadius: radius.sm,
    },
    shadows: [
      'none',
      elevation.sm,
      elevation.sm,
      elevation.md,
      elevation.md,
      elevation.md,
      elevation.lg,
      elevation.lg,
      elevation.lg,
      elevation.lg,
      elevation.lg,
      elevation.lg,
      elevation.lg,
      elevation.lg,
      elevation.lg,
      elevation.lg,
      elevation.lg,
      elevation.lg,
      elevation.lg,
      elevation.lg,
      elevation.lg,
      elevation.lg,
      elevation.lg,
      elevation.lg,
      elevation.lg,
    ],
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            backgroundColor: c.background,
            color: c.textPrimary,
          },
        },
      },
      MuiButton: {
        defaultProps: {
          disableElevation: true,
        },
        styleOverrides: {
          root: {
            borderRadius: radius.button,
            ...DASHBOARD_UX.button,
            textTransform: 'none',
          },
          contained: {
            '&.MuiButton-colorPrimary:hover': {
              backgroundColor: c.primaryHover,
            },
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          rounded: {
            borderRadius: radius.card,
          },
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: radius.input,
          },
        },
      },
    },
  });
}
