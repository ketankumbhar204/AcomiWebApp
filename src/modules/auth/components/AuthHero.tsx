import { Box, Typography, useTheme } from '@mui/material';
import type { LucideIcon } from 'lucide-react';
import { AUTH_UX, authSurfaces } from '../theme/authUx';

type AuthHeroProps = {
  icon: LucideIcon;
  eyebrow: string;
  heading: string;
  subheading: string;
};

/** Compact register/login intro — light semantic surface, not a green block. */
export function AuthHero({ icon: Icon, eyebrow, heading, subheading }: AuthHeroProps) {
  const theme = useTheme();
  const a = authSurfaces(theme.palette.mode);

  return (
    <Box
      component="header"
      sx={{
        mb: 0.25,
        px: 1.75,
        py: 1.5,
        borderRadius: `${AUTH_UX.fieldRadius}px`,
        border: `1px solid ${a.brandSoftBorder}`,
        bgcolor: a.brandSoft,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.25 }}>
        <Box
          sx={{
            width: 28,
            height: 28,
            borderRadius: '8px',
            bgcolor: theme.palette.mode === 'dark' ? 'rgba(15, 23, 42, 0.35)' : '#FFFFFF',
            color: a.brand,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            mt: 0.15,
          }}
        >
          <Icon size={15} strokeWidth={2} aria-hidden />
        </Box>
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography sx={{ ...AUTH_UX.eyebrow, color: a.textMuted, mb: 0.2 }}>{eyebrow}</Typography>
          <Typography
            sx={{
              fontSize: '1.125rem',
              fontWeight: 700,
              lineHeight: 1.25,
              color: a.textPrimary,
              mb: 0.15,
            }}
          >
            {heading}
          </Typography>
          <Typography sx={{ ...AUTH_UX.helper, color: a.textSecondary }}>{subheading}</Typography>
        </Box>
      </Box>
    </Box>
  );
}
