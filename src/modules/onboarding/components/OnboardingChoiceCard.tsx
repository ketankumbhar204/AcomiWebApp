import { Box, Typography, useTheme } from '@mui/material';
import { ArrowRight, type LucideIcon } from 'lucide-react';
import { IconBadge } from '@/modules/dashboard/components/IconBadge';
import { DASHBOARD_UX, dashSurfaces } from '@/modules/dashboard/theme/dashboardUx';
import { colors } from '@/shared/theme/colors';

type OnboardingChoiceCardProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  benefits: string[];
  onClick: () => void;
  accent?: string;
};

/** Choice card for create / join — Dashboard surface + IconBadge (RN parity, desktop density). */
export function OnboardingChoiceCard({
  icon: Icon,
  title,
  description,
  benefits,
  onClick,
  accent = colors.primaryDark,
}: OnboardingChoiceCardProps) {
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);

  return (
    <Box
      component="button"
      type="button"
      onClick={onClick}
      aria-label={`${title}. ${description}`}
      sx={{
        all: 'unset',
        boxSizing: 'border-box',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 1.5,
        width: '100%',
        p: `${DASHBOARD_UX.cardPadding}px`,
        borderRadius: `${DASHBOARD_UX.radius}px`,
        border: `1px solid ${s.border}`,
        bgcolor: s.surface,
        boxShadow: s.shadow,
        cursor: 'pointer',
        transition: DASHBOARD_UX.transition,
        textAlign: 'left',
        '&:hover': {
          boxShadow: s.shadowHover,
          borderColor: `${accent}55`,
          transform: 'translateY(-1px)',
        },
        '&:focus-visible': {
          outline: `2px solid ${colors.primary}`,
          outlineOffset: 2,
        },
      }}
    >
      <IconBadge accent={accent}>
        <Icon />
      </IconBadge>

      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography sx={{ ...DASHBOARD_UX.cardTitle, color: s.textPrimary, mb: 0.35 }}>
          {title}
        </Typography>
        <Typography sx={{ ...DASHBOARD_UX.body, color: s.textSecondary, mb: 1 }}>
          {description}
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          {benefits.map((benefit) => (
            <Box key={benefit} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box
                sx={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  bgcolor: accent,
                  flexShrink: 0,
                }}
              />
              <Typography sx={{ ...DASHBOARD_UX.body, color: s.textMuted }}>{benefit}</Typography>
            </Box>
          ))}
        </Box>
      </Box>

      <Box
        sx={{
          width: 28,
          height: 28,
          borderRadius: `${DASHBOARD_UX.iconWellRadius}px`,
          bgcolor: theme.palette.mode === 'dark' ? s.elevated : `${accent}14`,
          color: accent,
          display: 'grid',
          placeItems: 'center',
          flexShrink: 0,
          mt: 0.25,
        }}
        aria-hidden
      >
        <ArrowRight size={14} strokeWidth={2.2} />
      </Box>
    </Box>
  );
}
