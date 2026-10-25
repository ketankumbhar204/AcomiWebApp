import { Box, Paper, Typography, useTheme } from '@mui/material';
import { ChevronRight } from 'lucide-react';
import type { ReactNode } from 'react';
import { DASHBOARD_UX, dashSurfaces } from '@/modules/dashboard/theme/dashboardUx';
import { colors } from '@/shared/theme/colors';
import { semanticSurface, type SemanticTone } from '@/shared/theme/semantic';

type StatCardProps = {
  label: string;
  value: ReactNode;
  hint?: string;
  icon?: ReactNode;
  onClick?: () => void;
  /** Dense KPI used on the redesigned dashboard. */
  dense?: boolean;
  accentColor?: string;
  tone?: SemanticTone;
  /** Active filter selection highlight. */
  selected?: boolean;
};

export function StatCard({
  label,
  value,
  hint,
  icon,
  onClick,
  dense = false,
  accentColor,
  tone,
  selected = false,
}: StatCardProps) {
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);
  const surface = tone ? semanticSurface(tone, theme.palette.mode) : null;
  const valueColor = surface?.fg ?? accentColor ?? s.textPrimary;

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
      aria-pressed={onClick ? selected : undefined}
      sx={{
        px: dense ? 1.25 : 1.5,
        py: dense ? 1.25 : 1.5,
        borderRadius: `${DASHBOARD_UX.radius}px`,
        height: '100%',
        border: `1px solid ${selected ? colors.primary : surface?.border ?? s.border}`,
        borderWidth: selected ? 2 : 1,
        bgcolor: surface?.bg ?? s.surface,
        boxShadow: s.shadow,
        cursor: onClick ? 'pointer' : 'default',
        transition: DASHBOARD_UX.transition,
        display: 'flex',
        alignItems: 'center',
        gap: 1.25,
        minWidth: 0,
        '&:hover': onClick
          ? {
              boxShadow: s.shadowHover,
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
      {icon ? (
        <>
          <Box sx={{ flexShrink: 0, display: 'flex' }}>{icon}</Box>
          <Box
            sx={{
              width: '1px',
              alignSelf: 'stretch',
              my: 0.5,
              bgcolor: s.divider,
              flexShrink: 0,
            }}
          />
        </>
      ) : null}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography
          sx={{
            ...(dense ? DASHBOARD_UX.counterValue : DASHBOARD_UX.largeNumber),
            fontSize: dense ? '1.5rem' : '1.625rem',
            lineHeight: 1.15,
            color: valueColor,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {value}
        </Typography>
        <Typography
          sx={{
            ...DASHBOARD_UX.metricLabel,
            color: s.textSecondary,
            mt: 0.25,
            display: 'block',
          }}
        >
          {label}
        </Typography>
        {hint ? (
          <Typography sx={{ ...DASHBOARD_UX.metricCaption, color: s.textMuted, mt: 0.25, display: 'block' }}>
            {hint}
          </Typography>
        ) : null}
      </Box>
      {onClick ? (
        <ChevronRight size={16} color={s.textMuted} strokeWidth={2.2} aria-hidden />
      ) : null}
    </Paper>
  );
}
