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
          html: {
            ...acomiCssVars(c),
            fontSize: 16,
          },
          body: {
            backgroundColor: c.background,
            color: c.textPrimary,
            fontSize: DASHBOARD_UX.body.fontSize,
            fontWeight: DASHBOARD_UX.body.fontWeight,
            lineHeight: DASHBOARD_UX.body.lineHeight,
          },
        },
      },
      MuiTabs: {
        defaultProps: {
          variant: 'scrollable',
          allowScrollButtonsMobile: true,
          scrollButtons: 'auto',
        },
      },
      MuiDialog: {
        defaultProps: {
          fullWidth: true,
        },
        styleOverrides: {
          paper: ({ theme }) => ({
            [theme.breakpoints.down('sm')]: {
              margin: 16,
              width: 'calc(100% - 32px)',
              maxWidth: 'calc(100% - 32px)',
              maxHeight: 'calc(100dvh - 32px)',
            },
          }),
        },
      },
      MuiDialogContent: {
        styleOverrides: {
          root: ({ theme }) => ({
            [theme.breakpoints.down('sm')]: {
              overflowY: 'auto',
            },
          }),
        },
      },
      MuiDialogActions: {
        styleOverrides: {
          root: {
            flexWrap: 'wrap',
            gap: 8,
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
      MuiTab: {
        styleOverrides: {
          root: ({ theme }) => ({
            ...DASHBOARD_UX.button,
            textTransform: 'none',
            minHeight: 36,
            [theme.breakpoints.down('sm')]: {
              minWidth: 72,
              paddingLeft: 12,
              paddingRight: 12,
            },
          }),
        },
      },
      MuiTableCell: {
        styleOverrides: {
          root: {
            ...DASHBOARD_UX.body,
          },
          head: {
            ...DASHBOARD_UX.caption,
            fontWeight: 600,
            textTransform: 'none',
            letterSpacing: 0,
          },
        },
      },
      MuiMenuItem: {
        styleOverrides: {
          root: {
            ...DASHBOARD_UX.body,
            minHeight: 36,
          },
        },
      },
      MuiListItemText: {
        styleOverrides: {
          primary: {
            ...DASHBOARD_UX.body,
          },
          secondary: {
            ...DASHBOARD_UX.greetingSub,
          },
        },
      },
      MuiInputBase: {
        styleOverrides: {
          root: {
            ...DASHBOARD_UX.inputText,
          },
          input: {
            ...DASHBOARD_UX.inputText,
          },
        },
      },
      MuiInputLabel: {
        styleOverrides: {
          root: {
            ...DASHBOARD_UX.inputLabel,
          },
        },
      },
      MuiFormControlLabel: {
        styleOverrides: {
          label: {
            ...DASHBOARD_UX.body,
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            ...DASHBOARD_UX.badge,
            textTransform: 'none',
          },
          label: {
            textTransform: 'none',
            letterSpacing: 0,
          },
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
