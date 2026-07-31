import { Box, LinearProgress, Stack, Typography, useTheme } from '@mui/material';
import type { ReactNode } from 'react';
import { DASHBOARD_UX, dashSurfaces } from '@/modules/dashboard/theme/dashboardUx';
import { colors } from '@/shared/theme/colors';
import { occupancyAccent, occupancyRatio } from '../utils/occupancyVisuals';

type EntityOccupancyCardProps = {
  title: string;
  occupied: number;
  total: number;
  subtitle?: string;
  illustration?: ReactNode;
  selected?: boolean;
  onClick?: () => void;
  trailing?: ReactNode;
  /** Overflow actions (⋮) — click is stopped so card select still works */
  menu?: ReactNode;
  /** Override occupancy label, e.g. "5/7 Occupied" */
  occupancyLabel?: string;
  /** Tighter padding — used for full-width corridor floor rows */
  dense?: boolean;
};

/**
 * Workspace entity card — top accent, optional illustration, occupancy progress.
 * Matches Accommodation Figma unit/room cards.
 */
export function EntityOccupancyCard({
  title,
  occupied,
  total,
  subtitle,
  illustration,
  selected = false,
  onClick,
  trailing,
  menu,
  occupancyLabel,
  dense = false,
}: EntityOccupancyCardProps) {
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);
  const accent = occupancyAccent(occupied, total);
  const ratio = occupancyRatio(occupied, total) * 100;

  return (
    <Box
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      sx={{
        height: '100%',
        borderRadius: `${DASHBOARD_UX.radius}px`,
        border: `1px solid ${selected ? colors.primary : s.border}`,
        borderTop: `3px solid ${accent}`,
        bgcolor: s.surface,
        boxShadow: selected ? s.shadowHover : s.shadow,
        cursor: onClick ? 'pointer' : 'default',
        transition: DASHBOARD_UX.transition,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        '&:hover': onClick
          ? {
              boxShadow: s.shadowHover,
              borderColor: colors.primary,
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
      {menu ? (
        <Box
          sx={{
            position: 'absolute',
            top: 6,
            right: 6,
            zIndex: 1,
            bgcolor: s.surface,
            borderRadius: `${DASHBOARD_UX.buttonRadius}px`,
            boxShadow: s.shadow,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {menu}
        </Box>
      ) : null}
      {illustration ? (
        <Box
          sx={{
            px: dense ? 1.25 : 1.5,
            pt: dense ? 1 : 1.5,
            pb: dense ? 0 : 0.5,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            width: '100%',
          }}
        >
          {illustration}
        </Box>
      ) : null}
      <Stack
        spacing={dense ? 0.5 : 0.75}
        sx={{
          p: dense ? 1.25 : `${DASHBOARD_UX.cardPadding}px`,
          pt: illustration ? (dense ? 0.25 : 0.5) : undefined,
          flex: 1,
        }}
      >
        <Stack direction="row" spacing={1} sx={{ alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <Typography sx={{ ...DASHBOARD_UX.cardTitle, color: s.textPrimary, flex: 1, minWidth: 0 }} noWrap>
            {title}
          </Typography>
          {trailing}
        </Stack>
        {subtitle ? (
          <Typography sx={{ ...DASHBOARD_UX.body, color: s.textSecondary }} noWrap>
            {subtitle}
          </Typography>
        ) : null}
        <Typography sx={{ ...DASHBOARD_UX.counterLabel, color: accent, fontWeight: 600 }}>
          {occupancyLabel ?? `${occupied}/${total}`}
        </Typography>
        <LinearProgress
          variant="determinate"
          value={ratio}
          sx={{
            height: dense ? 5 : 6,
            borderRadius: 99,
            bgcolor: theme.palette.mode === 'dark' ? s.elevated : '#F1F5F9',
            '& .MuiLinearProgress-bar': {
              borderRadius: 99,
              bgcolor: accent,
            },
          }}
        />
      </Stack>
    </Box>
  );
}

type AddEntityCardProps = {
  label: string;
  onClick: () => void;
};

/** Dashed placeholder card — "+ Add Unit / Room". */
export function AddEntityCard({ label, onClick }: AddEntityCardProps) {
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);

  return (
    <Box
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      sx={{
        height: '100%',
        minHeight: 120,
        borderRadius: `${DASHBOARD_UX.radius}px`,
        border: `1.5px dashed ${s.border}`,
        bgcolor: theme.palette.mode === 'dark' ? s.elevated : '#FAFBFC',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        transition: DASHBOARD_UX.transition,
        color: colors.primaryDark,
        ...DASHBOARD_UX.link,
        '&:hover': {
          borderColor: colors.primary,
          bgcolor: 'rgba(37, 211, 102, 0.06)',
        },
      }}
    >
      {label}
    </Box>
  );
}
