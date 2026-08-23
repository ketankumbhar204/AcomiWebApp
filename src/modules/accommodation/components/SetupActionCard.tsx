import { Box, Typography, useTheme } from '@mui/material';
import type { LucideIcon } from 'lucide-react';
import { ChevronRight } from 'lucide-react';
import { DASHBOARD_UX, dashSurfaces } from '@/modules/dashboard/theme/dashboardUx';

const ACCENTS = {
  purple: { icon: '#7C3AED', well: 'rgba(124, 58, 237, 0.12)', wellHover: 'rgba(124, 58, 237, 0.18)' },
  blue: { icon: '#2563EB', well: 'rgba(37, 99, 235, 0.12)', wellHover: 'rgba(37, 99, 235, 0.18)' },
} as const;

type SetupActionCardProps = {
  title: string;
  subtitle: string;
  description: string;
  icon: LucideIcon;
  accent: keyof typeof ACCENTS;
  onClick: () => void;
};

/** Clickable empty-state action card — icon well + copy + chevron, no illustrations. */
export function SetupActionCard({
  title,
  subtitle,
  description,
  icon: Icon,
  accent,
  onClick,
}: SetupActionCardProps) {
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);
  const tone = ACCENTS[accent];
  const dark = theme.palette.mode === 'dark';

  return (
    <Box
      component="button"
      type="button"
      onClick={onClick}
      sx={{
        all: 'unset',
        boxSizing: 'border-box',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'stretch',
        gap: 1.25,
        width: '100%',
        minHeight: { xs: 0, sm: 168 },
        p: 2,
        borderRadius: '12px',
        border: `1px solid ${s.border}`,
        bgcolor: s.surface,
        boxShadow: s.shadow,
        transition: DASHBOARD_UX.transition,
        '&:hover': {
          borderColor: tone.icon,
          boxShadow: s.shadowHover,
          '& .setup-card-well': {
            bgcolor: dark ? s.elevated : tone.wellHover,
          },
          '& .setup-card-chevron': {
            transform: 'translateX(4px)',
            color: tone.icon,
          },
        },
        '&:focus-visible': {
          outline: `2px solid ${tone.icon}`,
          outlineOffset: 2,
        },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1 }}>
        <Box
          className="setup-card-well"
          sx={{
            width: 40,
            height: 40,
            borderRadius: '10px',
            bgcolor: dark ? s.elevated : tone.well,
            color: tone.icon,
            display: 'grid',
            placeItems: 'center',
            flexShrink: 0,
            transition: 'background-color 180ms ease',
          }}
        >
          <Icon size={20} strokeWidth={2.1} />
        </Box>
        <Box
          className="setup-card-chevron"
          sx={{
            color: s.textMuted,
            display: 'flex',
            mt: 0.5,
            transition: 'transform 180ms ease, color 180ms ease',
          }}
        >
          <ChevronRight size={18} strokeWidth={2.2} />
        </Box>
      </Box>
      <Box>
        <Typography sx={{ ...DASHBOARD_UX.cardTitle, color: s.textPrimary }}>{title}</Typography>
        <Typography sx={{ ...DASHBOARD_UX.caption, color: tone.icon, mt: 0.35 }}>{subtitle}</Typography>
        <Typography sx={{ ...DASHBOARD_UX.body, color: s.textSecondary, mt: 0.75 }}>{description}</Typography>
      </Box>
    </Box>
  );
}
