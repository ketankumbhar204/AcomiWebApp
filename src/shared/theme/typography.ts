import type { ThemeOptions } from '@mui/material/styles';

/** Plus Jakarta Sans — same family as mobile. */
export const fontFamily = {
  sans: '"Plus Jakarta Sans", "Helvetica Neue", Arial, sans-serif',
} as const;

export const fontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  xxl: 24,
  xxxl: 28,
  display: 32,
} as const;

export const typographyOptions: ThemeOptions['typography'] = {
  fontFamily: fontFamily.sans,
  fontSize: fontSize.md,
  h1: { fontSize: fontSize.xxxl, fontWeight: 700, lineHeight: 1.25 },
  h2: { fontSize: fontSize.xxl, fontWeight: 700, lineHeight: 1.3 },
  h3: { fontSize: fontSize.xl, fontWeight: 600, lineHeight: 1.35 },
  h4: { fontSize: fontSize.lg, fontWeight: 600, lineHeight: 1.4 },
  h5: { fontSize: fontSize.md, fontWeight: 600, lineHeight: 1.4 },
  h6: { fontSize: fontSize.sm, fontWeight: 600, lineHeight: 1.4 },
  body1: { fontSize: fontSize.md, fontWeight: 400, lineHeight: 1.5 },
  body2: { fontSize: fontSize.sm, fontWeight: 400, lineHeight: 1.5 },
  button: { fontSize: fontSize.md, fontWeight: 600, textTransform: 'none' },
  caption: { fontSize: fontSize.sm, fontWeight: 400, lineHeight: 1.4 },
  overline: {
    fontSize: fontSize.xs,
    fontWeight: 600,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
  },
};
