import type { ThemeOptions } from '@mui/material/styles';

/**
 * Plus Jakarta Sans — same family as mobile.
 * Scale mirrors DASHBOARD_TYPOGRAPHY.md / DASHBOARD_UX (desktop SaaS SoT).
 * Prefer spreading DASHBOARD_UX tokens in screens; these MUI variants are fallbacks only.
 */
export const fontFamily = {
  sans: '"Plus Jakarta Sans", "Helvetica Neue", Arial, sans-serif',
} as const;

/** Pixel sizes matching DASHBOARD_UX rem scale at 16px root. */
export const fontSize = {
  /** Badges / sidebar section only — never body */
  badge: 12,
  /** Body, labels, links, buttons, breadcrumbs — floor for readable content */
  sm: 14,
  /** Primary input text */
  md: 15,
  /** Card titles */
  lg: 16,
  /** Section headings / space name */
  xl: 20,
  /** Page titles / large metrics */
  xxxl: 28,
} as const;

export const typographyOptions: ThemeOptions['typography'] = {
  fontFamily: fontFamily.sans,
  fontSize: fontSize.md,
  h1: { fontSize: fontSize.xxxl, fontWeight: 700, lineHeight: 1.5 },
  h2: { fontSize: fontSize.xl, fontWeight: 700, lineHeight: 1.4 },
  h3: { fontSize: fontSize.xl, fontWeight: 700, lineHeight: 1.4 },
  h4: { fontSize: fontSize.lg, fontWeight: 600, lineHeight: 1.5 },
  h5: { fontSize: fontSize.lg, fontWeight: 600, lineHeight: 1.5 },
  h6: { fontSize: fontSize.lg, fontWeight: 600, lineHeight: 1.5 },
  subtitle1: { fontSize: fontSize.sm, fontWeight: 500, lineHeight: 1.45 },
  subtitle2: { fontSize: fontSize.sm, fontWeight: 500, lineHeight: 1.45 },
  body1: { fontSize: fontSize.sm, fontWeight: 400, lineHeight: 1.45 },
  body2: { fontSize: fontSize.sm, fontWeight: 400, lineHeight: 1.45 },
  button: { fontSize: fontSize.sm, fontWeight: 600, textTransform: 'none', lineHeight: 1.2 },
  caption: { fontSize: fontSize.sm, fontWeight: 400, lineHeight: 1.4 },
  overline: {
    fontSize: fontSize.badge,
    fontWeight: 600,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    lineHeight: 1.3,
  },
};
