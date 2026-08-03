import { Box, Typography, useTheme } from '@mui/material';
import type { LucideIcon } from 'lucide-react';
import { DASHBOARD_UX, dashSurfaces } from '@/modules/dashboard/theme/dashboardUx';
import { colors } from '@/shared/theme/colors';

type MemberFormHeroProps = {
  icon: LucideIcon;
  eyebrow: string;
  heading: string;
  subheading: string;
};

/** Mobile-parity hero for Add/Edit Member drawer. */
export function MemberFormHero({
  icon: Icon,
  eyebrow,
  heading,
  subheading,
}: MemberFormHeroProps) {
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);

  return (
    <Box
      sx={{
        position: 'relative',
        overflow: 'hidden',
        borderRadius: `${DASHBOARD_UX.radius + 6}px`,
        border: `1px solid ${colors.primary}33`,
        bgcolor: s.successTint,
        boxShadow: s.shadow,
        p: 2,
        mb: 1.5,
      }}
    >
      <Box
        aria-hidden
        sx={{
          position: 'absolute',
          width: 120,
          height: 120,
          borderRadius: '50%',
          bgcolor: `${colors.primary}14`,
          top: -36,
          right: -28,
        }}
      />
      <Box
        aria-hidden
        sx={{
          position: 'absolute',
          width: 64,
          height: 64,
          borderRadius: '50%',
          border: `1.5px solid ${colors.primary}28`,
          bottom: -18,
          left: 18,
        }}
      />
      <Box
        sx={{
          width: 36,
          height: 36,
          borderRadius: `${DASHBOARD_UX.buttonRadius}px`,
          bgcolor: s.surface,
          border: `1px solid ${s.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mb: 1,
          boxShadow: s.shadow,
        }}
      >
        <Icon size={18} color={colors.primaryDark} strokeWidth={2.2} />
      </Box>
      <Typography sx={{ ...DASHBOARD_UX.sidebarSection, color: s.textMuted }}>{eyebrow}</Typography>
      <Typography sx={{ ...DASHBOARD_UX.sectionHeading, color: s.textPrimary, mt: 0.5 }}>
        {heading}
      </Typography>
      <Typography sx={{ ...DASHBOARD_UX.body, color: s.textSecondary, mt: 0.5, maxWidth: 420 }}>
        {subheading}
      </Typography>
    </Box>
  );
}
