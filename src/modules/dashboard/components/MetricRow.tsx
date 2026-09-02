import { Box, Typography, useTheme } from '@mui/material';
import type { ReactNode } from 'react';
import { colors } from '@/shared/theme/colors';
import { semanticSurface, type SemanticTone } from '@/shared/theme/semantic';
import { DASHBOARD_UX, dashSurfaces, metricValueSx } from '../theme/dashboardUx';

export type MetricCell = {
  id: string;
  label: string;
  value: ReactNode;
  caption?: string;
  captionColor?: string;
  icon?: ReactNode;
  accent?: string;
  tone?: SemanticTone;
  onClick?: () => void;
};

type MetricRowProps = {
  items: MetricCell[];
  /** Column count — use 2 for Figma 2×2 boards, 4 for a single strip. */
  columns?: 2 | 4;
  minHeight?: number;
  maxHeight?: number;
  /** When nested inside DashboardSection surface, skip outer chrome. */
  embedded?: boolean;
};

/**
 * Metric board — compact 1px grid with pastel semantic cell fills.
 */
export function MetricRow({
  items,
  columns = 2,
  minHeight = DASHBOARD_UX.paymentCardMinHeight,
  maxHeight = DASHBOARD_UX.paymentCardMaxHeight,
  embedded = false,
}: MetricRowProps) {
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);
  const mode = theme.palette.mode;

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: {
          xs: 'repeat(2, minmax(0, 1fr))',
          md: `repeat(${columns}, minmax(0, 1fr))`,
        },
        gap: '1px',
        width: '100%',
        bgcolor: s.border,
        borderRadius: embedded ? `${DASHBOARD_UX.tileRadius}px` : `${DASHBOARD_UX.radius}px`,
        overflow: 'hidden',
        ...(embedded
          ? {}
          : {
              border: `1px solid ${s.border}`,
              boxShadow: s.shadow,
            }),
      }}
    >
      {items.map((item) => {
        const surface = item.tone ? semanticSurface(item.tone, mode) : null;
        return (
          <Box
            key={item.id}
            role={item.onClick ? 'button' : undefined}
            tabIndex={item.onClick ? 0 : undefined}
            onClick={item.onClick}
            onKeyDown={
              item.onClick
                ? (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      item.onClick?.();
                    }
                  }
                : undefined
            }
            aria-label={item.onClick ? `${item.label}: ${String(item.value)}` : undefined}
            sx={{
              minWidth: 0,
              minHeight: { xs: 64, md: minHeight },
              maxHeight: { xs: 'none', md: maxHeight },
              px: `${DASHBOARD_UX.metricPadding}px`,
              py: `${DASHBOARD_UX.metricPadding}px`,
              boxSizing: 'border-box',
              bgcolor: surface?.bg ?? s.surface,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              gap: `${DASHBOARD_UX.metricGap}px`,
              overflow: 'hidden',
              cursor: item.onClick ? 'pointer' : 'default',
              transition: DASHBOARD_UX.transition,
              '&:hover': item.onClick
                ? {
                    bgcolor: surface?.iconBg ?? (theme.palette.mode === 'dark' ? s.elevated : 'rgba(248, 250, 252, 1)'),
                  }
                : undefined,
              '&:focus-visible': item.onClick
                ? { outline: `2px solid ${colors.primary}`, outlineOffset: -2 }
                : undefined,
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: 1,
                minWidth: 0,
              }}
            >
              <Typography
                sx={{
                  ...DASHBOARD_UX.metricLabel,
                  color: s.textSecondary,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  minWidth: 0,
                }}
              >
                {item.label}
              </Typography>
              {item.icon ? <Box sx={{ flexShrink: 0 }}>{item.icon}</Box> : null}
            </Box>

            <Typography
              component="div"
              sx={{
                ...metricValueSx(),
                color: surface?.fg ?? item.accent ?? s.textPrimary,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {item.value}
            </Typography>
          </Box>
        );
      })}
    </Box>
  );
}
