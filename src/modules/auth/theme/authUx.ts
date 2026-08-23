/**
 * Auth-only presentation tokens.
 * Brand chrome uses teal; filled CTAs use ACOMI primary green.
 */
import type { SxProps, Theme } from '@mui/material';
import { colors, darkColors } from '@/shared/theme/colors';

const LIGHT = {
  pageBg: colors.background,
  panelBg: colors.background,
  surface: colors.white,
  elevated: colors.mintSubtle,
  border: '#E5E7EB',
  textPrimary: colors.textPrimary,
  textSecondary: '#475569',
  textMuted: colors.textSecondary,
  /** Wordmark, A-mark, outlined chrome — not filled CTAs. */
  brand: colors.teal,
  brandHover: colors.tealDark,
  brandSoft: colors.lightGreen,
  brandSoftBorder: 'rgba(18, 140, 126, 0.14)',
  /** Primary actions (Continue, Create, Submit). */
  cta: colors.primary,
  ctaHover: colors.primaryHover,
  ctaActive: colors.primaryActive,
  focus: colors.primary,
  shadow: '0 10px 32px rgba(15, 23, 42, 0.08)',
  focusRing: '0 0 0 3px rgba(37, 211, 102, 0.22)',
  danger: colors.danger,
  dangerRing: '0 0 0 3px rgba(220, 38, 38, 0.12)',
  featurePg: colors.info,
  featureMeal: colors.warning,
  featurePay: '#1D4ED8',
} as const;

const DARK = {
  pageBg: darkColors.background,
  panelBg: '#111827',
  surface: darkColors.surface,
  elevated: '#1A2332',
  border: darkColors.border,
  textPrimary: darkColors.textPrimary,
  textSecondary: darkColors.textSecondary,
  textMuted: darkColors.muted,
  brand: darkColors.teal,
  brandHover: '#5EEAD4',
  brandSoft: 'rgba(45, 212, 191, 0.12)',
  brandSoftBorder: 'rgba(45, 212, 191, 0.28)',
  cta: darkColors.primary,
  ctaHover: darkColors.primaryHover,
  ctaActive: darkColors.primaryActive,
  focus: darkColors.primary,
  shadow: 'none',
  focusRing: '0 0 0 3px rgba(37, 211, 102, 0.28)',
  danger: darkColors.danger,
  dangerRing: '0 0 0 3px rgba(248, 113, 113, 0.2)',
  featurePg: '#93C5FD',
  featureMeal: '#FBBF24',
  featurePay: '#93C5FD',
} as const;

/** Aliases so both historical key names resolve. */
export const AUTH_LIGHT = {
  ...LIGHT,
  pageBg: LIGHT.pageBg,
  textMuted: LIGHT.textMuted,
  brandSoft: LIGHT.brandSoft,
  brandSoftBorder: LIGHT.brandSoftBorder,
  elevated: LIGHT.elevated,
} as const;

export const AUTH_DARK = {
  ...DARK,
  pageBg: DARK.pageBg,
  textMuted: DARK.textMuted,
  brandSoft: DARK.brandSoft,
  brandSoftBorder: DARK.brandSoftBorder,
  elevated: DARK.elevated,
} as const;

export const AUTH_UX = {
  cardMaxWidth: 420,
  cardRadius: 16,
  cardPadding: 28,
  fieldHeight: 48,
  fieldRadius: 10,
  buttonHeight: 48,
  markSize: 36,
  headline: { fontSize: '1.625rem', fontWeight: 600, lineHeight: 1.25 },
  brandName: { fontSize: '1.25rem', fontWeight: 700, lineHeight: 1.25 },
  support: { fontSize: '0.9375rem', fontWeight: 400, lineHeight: 1.4 },
  label: { fontSize: '0.8125rem', fontWeight: 600, lineHeight: 1.25 },
  input: { fontSize: '0.9375rem', fontWeight: 400, lineHeight: 1.4 },
  helper: { fontSize: '0.8125rem', fontWeight: 400, lineHeight: 1.4 },
  button: { fontSize: '0.9375rem', fontWeight: 600, lineHeight: 1.2, textTransform: 'none' as const },
  eyebrow: {
    fontSize: '0.6875rem',
    fontWeight: 700,
    letterSpacing: '0.14em',
    textTransform: 'uppercase' as const,
    lineHeight: 1.3,
  },
  feature: { fontSize: '0.8125rem', fontWeight: 600, lineHeight: 1.3 },
} as const;

export function authSurfaces(mode: 'light' | 'dark') {
  return mode === 'dark' ? AUTH_DARK : AUTH_LIGHT;
}

export function authContainedButtonSx(
  cta: string,
  ctaHover: string,
  ctaActive = colors.primaryActive,
): SxProps<Theme> {
  return {
    ...AUTH_UX.button,
    minHeight: AUTH_UX.buttonHeight,
    height: AUTH_UX.buttonHeight,
    borderRadius: `${AUTH_UX.fieldRadius}px`,
    bgcolor: cta,
    color: colors.white,
    boxShadow: 'none',
    '&:hover': {
      bgcolor: ctaHover,
      boxShadow: 'none',
    },
    '&:active': {
      bgcolor: ctaActive,
      boxShadow: 'none',
    },
    '&.Mui-disabled': {
      bgcolor: cta,
      color: colors.white,
      opacity: 0.45,
    },
  };
}
