import { Box, Paper, Typography, useTheme } from '@mui/material';
import type { ReactNode } from 'react';
import { DASHBOARD_UX, dashSurfaces } from '@/modules/dashboard/theme/dashboardUx';
import { colors } from '@/shared/theme/colors';

type StatCardProps = {
  label: string;
  value: ReactNode;
  hint?: string;
  icon?: ReactNode;
  onClick?: () => void;
  /** Dense KPI used on the redesigned dashboard. */
  dense?: boolean;
  accentColor?: string;
};

export function StatCard({
  label,
  value,
  hint,
  icon,
  onClick,
  dense = false,
  accentColor,
}: StatCardProps) {
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);

  return (
    <Paper
      elevation={0}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={
        onClick
          ? (event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      aria-label={onClick ? `${label}: ${String(value)}` : undefined}
      sx={{
        p: dense ? `${DASHBOARD_UX.metricPadding}px` : `${DASHBOARD_UX.cardPadding}px`,
        borderRadius: `${DASHBOARD_UX.radius}px`,
        height: '100%',
        border: `1px solid ${s.border}`,
        bgcolor: s.surface,
        boxShadow: s.shadow,
        cursor: onClick ? 'pointer' : 'default',
        transition: DASHBOARD_UX.transition,
        borderLeft: accentColor ? `3px solid ${accentColor}` : undefined,
        '&:hover': onClick
          ? {
              boxShadow: s.shadowHover,
              transform: 'translateY(-1px)',
            }
          : undefined,
        '&:focus-visible': onClick
          ? {
              outline: `2px solid ${colors.primary}`,
              outlineOffset: 2,
            }
          : undefined,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 1,
        }}
      >
        <Typography sx={{ ...DASHBOARD_UX.metricLabel, color: s.textSecondary }}>{label}</Typography>
        {icon}
      </Box>
      <Typography
        sx={{
          ...(dense ? DASHBOARD_UX.counterValue : DASHBOARD_UX.largeNumber),
          mt: dense ? 0.25 : 0.5,
          color: accentColor ?? s.textPrimary,
        }}
      >
        {value}
      </Typography>
      {hint ? (
        <Typography sx={{ ...DASHBOARD_UX.metricCaption, color: s.textMuted, mt: 0.25, display: 'block' }}>
          {hint}
        </Typography>
      ) : null}
    </Paper>
  );
}
