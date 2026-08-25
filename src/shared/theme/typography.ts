import type { ThemeOptions } from '@mui/material/styles';

/**
 * Plus Jakarta Sans — same family as mobile.
 * Scale matches DASHBOARD_UX so MUI defaults and token spreads stay aligned.
 */
export const fontFamily = {
  sans: '"Plus Jakarta Sans", "Helvetica Neue", Arial, sans-serif',
} as const;

/** Pixel sizes matching DASHBOARD_UX rem scale at 16px root. */
export const fontSize = {
  /** Badges / sidebar section only */
  badge: 11,
  /** Captions / metric labels */
  xs: 12,
  /** Body, labels, links, buttons */
  sm: 14,
  /** Card titles */
  lg: 14,
  /** Section headings */
  xl: 16,
  /** Page titles / large metrics */
  xxxl: 22,
} as const;

export const typographyOptions: ThemeOptions['typography'] = {
  fontFamily: fontFamily.sans,
  fontSize: fontSize.sm,
  h1: { fontSize: fontSize.xxxl, fontWeight: 700, lineHeight: 1.27 },
  h2: { fontSize: fontSize.xl, fontWeight: 700, lineHeight: 1.375 },
  h3: { fontSize: fontSize.xl, fontWeight: 700, lineHeight: 1.375 },
  h4: { fontSize: fontSize.lg, fontWeight: 600, lineHeight: 1.43 },
  h5: { fontSize: fontSize.lg, fontWeight: 600, lineHeight: 1.43 },
  h6: { fontSize: fontSize.lg, fontWeight: 600, lineHeight: 1.43 },
  subtitle1: { fontSize: fontSize.sm, fontWeight: 500, lineHeight: 1.43 },
  subtitle2: { fontSize: fontSize.xs, fontWeight: 500, lineHeight: 1.5 },
  body1: { fontSize: fontSize.sm, fontWeight: 400, lineHeight: 1.43 },
  body2: { fontSize: fontSize.sm, fontWeight: 400, lineHeight: 1.43 },
  button: { fontSize: 13, fontWeight: 600, textTransform: 'none', lineHeight: 1.2 },
  caption: { fontSize: fontSize.xs, fontWeight: 400, lineHeight: 1.5 },
  overline: {
    fontSize: fontSize.badge,
    fontWeight: 600,
    letterSpacing: '0.04em',
    textTransform: 'none',
    lineHeight: 1.3,
  },
};
