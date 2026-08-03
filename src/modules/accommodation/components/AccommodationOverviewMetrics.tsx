import { Box, Typography, useTheme } from '@mui/material';
import type { ReactNode } from 'react';
import { DASHBOARD_UX, dashSurfaces } from '@/modules/dashboard/theme/dashboardUx';

export type OverviewMetric = {
  id: string;
  label: string;
  value: ReactNode;
  accent: string;
  icon: ReactNode;
};

type AccommodationOverviewMetricsProps = {
  items: OverviewMetric[];
};

/**
 * Left-column 3×2 overview — compact so full labels fit.
 */
export function AccommodationOverviewMetrics({ items }: AccommodationOverviewMetricsProps) {
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
        gap: 0.75,
        p: 1.25,
        pb: 1,
      }}
    >
      {items.map((item) => (
        <Box
          key={item.id}
          sx={{
            borderRadius: `${DASHBOARD_UX.tileRadius}px`,
            border: `1px solid ${s.border}`,
            bgcolor: s.surface,
            px: 0.75,
            py: 0.65,
            minHeight: 44,
            display: 'flex',
            alignItems: 'center',
            gap: 0.65,
            overflow: 'hidden',
          }}
        >
          <Box
            sx={{
              width: 22,
              height: 22,
              borderRadius: '6px',
              bgcolor: theme.palette.mode === 'dark' ? s.elevated : `${item.accent}1A`,
              color: item.accent,
              display: 'grid',
              placeItems: 'center',
              flexShrink: 0,
              '& svg': { width: 12, height: 12, strokeWidth: 2 },
            }}
          >
            {item.icon}
          </Box>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography
              sx={{
                ...DASHBOARD_UX.counterValue,
                color: s.textPrimary,
              }}
            >
              {item.value}
            </Typography>
            <Typography
              sx={{
                ...DASHBOARD_UX.smallCaption,
                color: s.textSecondary,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
              title={item.label}
            >
              {item.label}
            </Typography>
          </Box>
        </Box>
      ))}
    </Box>
  );
}

type SummaryStripItem = {
  id: string;
  label: string;
  value: ReactNode;
};

type WorkspaceSummaryStripProps = {
  title?: string;
  items: SummaryStripItem[];
};

/** Bottom floor/building summary strip. */
export function WorkspaceSummaryStrip({ title, items }: WorkspaceSummaryStripProps) {
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);

  return (
    <Box
      sx={{
        mt: 1,
        pt: 1.5,
        borderTop: `1px solid ${s.border}`,
      }}
    >
      {title ? (
        <Typography sx={{ ...DASHBOARD_UX.metricLabel, color: s.textMuted, mb: 1 }}>{title}</Typography>
      ) : null}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: `repeat(${Math.min(items.length, 5)}, minmax(0, 1fr))`,
          gap: 1,
        }}
      >
        {items.map((item) => (
          <Box
            key={item.id}
            sx={{
              borderRadius: `${DASHBOARD_UX.tileRadius}px`,
              border: `1px solid ${s.border}`,
              bgcolor: s.elevated,
              px: 1.25,
              py: 1,
              textAlign: 'center',
            }}
          >
            <Typography sx={{ ...DASHBOARD_UX.counterValue, color: s.textPrimary }}>
              {item.value}
            </Typography>
            <Typography sx={{ ...DASHBOARD_UX.metricCaption, color: s.textSecondary, mt: 0.25 }}>
              {item.label}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}
