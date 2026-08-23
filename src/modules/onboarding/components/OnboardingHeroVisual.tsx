import { Box, useTheme } from '@mui/material';
import leftScene from '@/assets/onboarding/left-scene.png';
import phoneScreen from '@/assets/onboarding/phone-screen.png';

/** Left-column visual: 3D property + Sunrise Mess phone, matching the Figma mock. */
export function OnboardingHeroVisual() {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  return (
    <Box
      aria-hidden
      sx={{
        position: 'relative',
        width: '100%',
        height: { xs: 180, md: 196, lg: 210 },
        mt: { xs: 1.5, lg: 'auto' },
        flexShrink: 0,
        overflow: 'hidden',
        borderRadius: '20px',
      }}
    >
      <Box
        component="img"
        src={leftScene}
        alt=""
        sx={{
          position: 'absolute',
          left: 0,
          bottom: 0,
          width: '62%',
          height: '100%',
          objectFit: 'contain',
          objectPosition: 'left bottom',
          pointerEvents: 'none',
          opacity: isDark ? 0.9 : 1,
          filter: isDark ? 'saturate(0.85) brightness(0.92)' : 'none',
        }}
      />
      <Box
        component="img"
        src={phoneScreen}
        alt=""
        sx={{
          position: 'absolute',
          right: 8,
          bottom: 8,
          height: { xs: 148, md: 164, lg: 176 },
          width: 'auto',
          maxWidth: '48%',
          objectFit: 'contain',
          borderRadius: '22px',
          transform: 'rotate(6deg)',
          filter: isDark
            ? 'drop-shadow(0 18px 28px rgba(15, 23, 42, 0.28)) saturate(0.9)'
            : 'drop-shadow(0 18px 28px rgba(15, 23, 42, 0.22))',
          zIndex: 2,
          pointerEvents: 'none',
        }}
      />
    </Box>
  );
}
