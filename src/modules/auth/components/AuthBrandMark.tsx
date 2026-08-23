import { Box, useTheme } from '@mui/material';
import { AUTH_UX, authSurfaces } from '../theme/authUx';

type AuthBrandMarkProps = {
  size?: number;
};

/** ACOMI “A” mark — replaces the retired CountIn “C”. */
export function AuthBrandMark({ size = AUTH_UX.markSize }: AuthBrandMarkProps) {
  const theme = useTheme();
  const a = authSurfaces(theme.palette.mode);

  return (
    <Box
      aria-hidden
      sx={{
        width: size,
        height: size,
        flexShrink: 0,
        borderRadius: `${Math.round(size * 0.28)}px`,
        bgcolor: a.brand,
        color: theme.palette.mode === 'dark' ? '#0F172A' : '#FFFFFF',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: '"Plus Jakarta Sans", "Helvetica Neue", Arial, sans-serif',
        fontWeight: 700,
        fontSize: Math.round(size * 0.5),
        letterSpacing: '-0.04em',
        lineHeight: 1,
        userSelect: 'none',
      }}
    >
      A
    </Box>
  );
}
