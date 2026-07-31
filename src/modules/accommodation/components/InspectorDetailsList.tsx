import { Box, Typography, useTheme } from '@mui/material';
import { Info } from 'lucide-react';
import type { ReactNode } from 'react';
import { DASHBOARD_UX, dashSurfaces } from '@/modules/dashboard/theme/dashboardUx';
import { ACC_ACCENTS } from '../utils/accommodationAccents';

export type InspectorDetailRow = {
  label: string;
  value?: string | number | null | ReactNode;
  icon?: ReactNode;
};

type InspectorDetailsListProps = {
  title?: string;
  rows: InspectorDetailRow[];
};

/** Figma “Details” block — header bar + icon / label / value rows. */
export function InspectorDetailsList({
  title = 'Details',
  rows,
}: InspectorDetailsListProps) {
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);
  const visible = rows.filter((r) => r.value != null && r.value !== '');
  if (visible.length === 0) return null;

  return (
    <Box
      sx={{
        borderRadius: `${DASHBOARD_UX.tileRadius}px`,
        border: `1px solid ${s.border}`,
        overflow: 'hidden',
        bgcolor: s.surface,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.75,
          px: 1.5,
          py: 1,
          bgcolor: theme.palette.mode === 'dark' ? s.elevated : '#F8FAFC',
          borderBottom: `1px solid ${s.border}`,
        }}
      >
        <Info size={14} color={s.textMuted} />
        <Typography sx={{ ...DASHBOARD_UX.metricLabel, color: s.textPrimary, fontWeight: 700 }}>
          {title}
        </Typography>
      </Box>
      {visible.map((row, index) => (
        <Box
          key={row.label}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.25,
            px: 1.5,
            py: 1.1,
            borderTop: index === 0 ? 'none' : `1px solid ${s.border}`,
          }}
        >
          {row.icon ? (
            <Box sx={{ display: 'flex', color: ACC_ACCENTS.detailIcon, flexShrink: 0 }}>
              {row.icon}
            </Box>
          ) : null}
          <Typography sx={{ ...DASHBOARD_UX.body, color: s.textSecondary, flex: 1, minWidth: 0 }}>
            {row.label}
          </Typography>
          <Typography
            component="div"
            sx={{
              ...DASHBOARD_UX.body,
              fontWeight: 700,
              color: s.textPrimary,
              textAlign: 'right',
            }}
          >
            {row.value}
          </Typography>
        </Box>
      ))}
    </Box>
  );
}

export type PastelAction = {
  id: string;
  label: string;
  icon: ReactNode;
  color: string;
  bgcolor: string;
  onClick: () => void;
  disabled?: boolean;
};

type PastelQuickActionsProps = {
  title?: string;
  actions: PastelAction[];
};

/** Figma pastel quick-action tiles (Allocate / Reserve / History). */
export function PastelQuickActions({
  title = 'Quick Actions',
  actions,
}: PastelQuickActionsProps) {
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);
  if (actions.length === 0) return null;

  return (
    <Box>
      <Typography sx={{ ...DASHBOARD_UX.metricLabel, color: s.textPrimary, fontWeight: 700, mb: 1 }}>
        {title}
      </Typography>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: `repeat(${Math.min(actions.length, 3)}, minmax(0, 1fr))`,
          gap: 1,
        }}
      >
        {actions.map((action) => (
          <Box
            key={action.id}
            component="button"
            type="button"
            disabled={action.disabled}
            onClick={action.onClick}
            sx={{
              all: 'unset',
              boxSizing: 'border-box',
              cursor: action.disabled ? 'default' : 'pointer',
              opacity: action.disabled ? 0.5 : 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 0.75,
              minHeight: 76,
              px: 0.75,
              py: 1.25,
              borderRadius: `${DASHBOARD_UX.tileRadius}px`,
              bgcolor: action.bgcolor,
              color: action.color,
              transition: DASHBOARD_UX.transition,
              '&:hover': action.disabled
                ? undefined
                : {
                    filter: 'brightness(0.97)',
                    boxShadow: s.shadowHover,
                  },
            }}
          >
            <Box sx={{ display: 'flex', color: 'inherit' }}>{action.icon}</Box>
            <Typography
              sx={{
                ...DASHBOARD_UX.metricCaption,
                fontWeight: 700,
                color: 'inherit',
                textAlign: 'center',
                lineHeight: 1.2,
              }}
            >
              {action.label}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}
