import { Box, Paper, Typography, useTheme } from '@mui/material';
import type { LucideIcon } from 'lucide-react';
import { DASHBOARD_UX, dashSurfaces } from '@/modules/dashboard/theme/dashboardUx';
import { colors } from '@/shared/theme/colors';

type ActionCardProps = {
  title: string;
  subtitle?: string;
  icon: LucideIcon;
  badgeCount?: number;
  disabled?: boolean;
  onClick?: () => void;
  /** Compact 2-column dashboard quick actions. */
  compact?: boolean;
  accent?: string;
  highlighted?: boolean;
};

export function ActionCard({
  title,
  subtitle,
  icon: Icon,
  badgeCount,
  disabled = false,
  onClick,
  compact = false,
  accent = colors.primaryDark,
  highlighted = false,
}: ActionCardProps) {
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);

  return (
    <Paper
      elevation={0}
      component="button"
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-label={badgeCount && badgeCount > 0 ? `${title}, ${badgeCount}` : title}
      sx={{
        all: 'unset',
        boxSizing: 'border-box',
        display: 'flex',
        alignItems: compact ? 'center' : 'flex-start',
        gap: compact ? 1.25 : 1.5,
        p: compact ? 1.25 : `${DASHBOARD_UX.cardPadding}px`,
        borderRadius: `${DASHBOARD_UX.radius}px`,
        border: `1px solid ${highlighted ? s.pendingBorder : s.border}`,
        bgcolor: highlighted ? s.pendingTint : s.surface,
        boxShadow: s.shadow,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.55 : 1,
        width: '100%',
        transition: DASHBOARD_UX.transition,
        '&:hover': disabled
          ? undefined
          : {
              boxShadow: s.shadowHover,
              transform: 'translateY(-1px)',
            },
        '&:focus-visible': {
          outline: `2px solid ${colors.primary}`,
          outlineOffset: 2,
        },
      }}
    >
      <Box
        sx={{
          width: compact ? DASHBOARD_UX.iconWell + 10 : 40,
          height: compact ? DASHBOARD_UX.iconWell + 10 : 40,
          borderRadius: `${DASHBOARD_UX.iconWellRadius}px`,
          bgcolor: theme.palette.mode === 'dark' ? s.elevated : `${accent}18`,
          color: accent,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          position: 'relative',
        }}
      >
        <Icon size={compact ? DASHBOARD_UX.iconSize : 18} />
        {badgeCount && badgeCount > 0 ? (
          <Box
            sx={{
              position: 'absolute',
              top: -6,
              right: -6,
              minWidth: 18,
              height: 18,
              px: 0.5,
              borderRadius: 999,
              bgcolor: 'error.main',
              color: 'common.white',
              ...DASHBOARD_UX.badge,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {badgeCount > 99 ? '99+' : badgeCount}
          </Box>
        ) : null}
      </Box>
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography sx={{ ...DASHBOARD_UX.cardTitle, color: s.textPrimary }} noWrap>
          {title}
        </Typography>
        {subtitle ? (
          <Typography
            sx={{
              ...DASHBOARD_UX.body,
              color: s.textSecondary,
              display: 'block',
              whiteSpace: compact ? 'normal' : undefined,
              mt: 0.25,
            }}
          >
            {subtitle}
          </Typography>
        ) : null}
      </Box>
    </Paper>
  );
}
