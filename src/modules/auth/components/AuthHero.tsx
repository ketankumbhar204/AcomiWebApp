import { Box, Typography, useTheme } from '@mui/material';
import type { LucideIcon } from 'lucide-react';
import { colors } from '@/shared/theme/colors';
import { IconBadge } from '@/modules/dashboard/components/IconBadge';
import { DASHBOARD_UX, dashSurfaces } from '@/modules/dashboard/theme/dashboardUx';

type AuthHeroProps = {
  icon: LucideIcon;
  eyebrow: string;
  heading: string;
  subheading: string;
};

/** Compact auth header — Dashboard IconBadge + section typography (no decorative blobs). */
export function AuthHero({ icon: Icon, eyebrow, heading, subheading }: AuthHeroProps) {
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);

  return (
    <Box
      component="header"
      sx={{
        mb: 0.5,
        p: `${DASHBOARD_UX.cardPadding}px`,
        borderRadius: `${DASHBOARD_UX.radius}px`,
        border: `1px solid ${s.border}`,
        bgcolor: s.elevated,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.25 }}>
        <IconBadge accent={colors.primaryDark}>
          <Icon />
        </IconBadge>
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography
            sx={{
              ...DASHBOARD_UX.spaceRole,
              color: s.textSecondary,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              mb: 0.35,
            }}
          >
            {eyebrow}
          </Typography>
          <Typography sx={{ ...DASHBOARD_UX.sectionHeading, color: s.textPrimary, mb: 0.35 }}>
            {heading}
          </Typography>
          <Typography sx={{ ...DASHBOARD_UX.body, color: s.textMuted }}>{subheading}</Typography>
        </Box>
      </Box>
    </Box>
  );
}
