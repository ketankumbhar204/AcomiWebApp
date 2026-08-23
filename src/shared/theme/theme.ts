import { createTheme, type Theme } from '@mui/material/styles';
import type { ThemeMode } from '@/shared/types/common';
import { DASHBOARD_UX } from '@/modules/dashboard/theme/dashboardUx';
import { acomiCssVars, colors, darkColors } from './colors';
import { elevation } from './elevation';
import { radius } from './radius';
import { typographyOptions } from './typography';

function buildPalette(mode: ThemeMode) {
  const c = mode === 'light' ? colors : darkColors;

  return {
    mode,
    primary: {
      main: c.primary,
      dark: c.primaryHover,
      light: c.lightGreen,
      contrastText: colors.white,
    },
    secondary: {
      main: c.teal,
      dark: c.tealDark,
      light: c.lightGreen,
      contrastText: colors.white,
    },
    success: { main: c.success },
    warning: { main: c.warning },
    error: { main: c.danger },
    info: { main: c.info },
    background: {
      default: c.background,
      paper: mode === 'light' ? colors.white : c.surface,
    },
    text: {
      primary: c.textPrimary,
      secondary: c.textSecondary,
      disabled: c.muted,
    },
    divider: c.divider,
  } as const;
}

export function createAcomiTheme(mode: ThemeMode = 'light'): Theme {
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
          html: acomiCssVars(c),
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
            '&.MuiButton-colorPrimary:active': {
              backgroundColor: c.primaryActive,
            },
            '&.MuiButton-colorPrimary.Mui-disabled': {
              backgroundColor: mode === 'light' ? '#CDEBD8' : '#1F3A2E',
              color: mode === 'light' ? '#6B8F78' : '#7A9A88',
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
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: c.teal,
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: c.primary,
              borderWidth: '1.5px',
            },
          },
        },
      },
      MuiCheckbox: {
        styleOverrides: {
          root: {
            color: c.muted,
            '&.Mui-checked': {
              color: c.primary,
            },
          },
        },
      },
      MuiRadio: {
        styleOverrides: {
          root: {
            color: c.muted,
            '&.Mui-checked': {
              color: c.primary,
            },
          },
        },
      },
      MuiSwitch: {
        styleOverrides: {
          switchBase: {
            '&.Mui-checked': {
              color: c.primary,
            },
            '&.Mui-checked + .MuiSwitch-track': {
              backgroundColor: c.primary,
            },
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          colorPrimary: {
            backgroundColor: c.lightGreen,
            color: c.tealDark,
          },
        },
      },
      MuiStepIcon: {
        styleOverrides: {
          root: {
            color: c.border,
            '&.Mui-active': {
              color: c.primary,
            },
            '&.Mui-completed': {
              color: c.primary,
            },
          },
        },
      },
    },
  });
}
