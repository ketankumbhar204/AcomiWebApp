import { Box, Paper, useMediaQuery, useTheme } from '@mui/material';
import type { ReactNode } from 'react';
import type { SxProps, Theme } from '@mui/material/styles';
import { LAYOUT } from '@/layouts/layoutConstants';
import { DASHBOARD_UX, dashSurfaces } from '@/modules/dashboard/theme/dashboardUx';
import { colors } from '@/shared/theme/colors';

type StickyFooterProps = {
  children: ReactNode;
  /**
   * `sticky` — sticks within the nearest scroll container (default; drawers / panels).
   * `fixed` — pinned to the bottom of the viewport (accounts for desktop sidebar).
   */
  pin?: 'sticky' | 'fixed';
  sx?: SxProps<Theme>;
};

/** Soft mint action strip — distinct from white content cards. */
export const stickyFooterAccentSx = {
  bgcolor: '#EAF7F0',
  borderTop: `2px solid ${colors.primaryDark}33`,
  boxShadow: '0 -6px 18px rgba(16, 24, 40, 0.08)',
} as const;

/**
 * Spacer matching the fixed save strip so page content can scroll fully above it.
 * Place as the last in-flow element on pages that use `<StickyFooter pin="fixed" />`.
 */
export function StickyFooterClearance({
  height = { xs: 168, sm: 128, md: 96 },
}: {
  height?: number | { xs?: number; sm?: number; md?: number; lg?: number };
}) {
  return <Box aria-hidden sx={{ height, flexShrink: 0, width: '100%' }} />;
}

/** Sticky / fixed action bar — mint strip distinct from white cards. */
export function StickyFooter({ children, pin = 'sticky', sx }: StickyFooterProps) {
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);
  const isMdUp = useMediaQuery(theme.breakpoints.up('md'));
  // Permanent rail overlays when expanded, so the in-flow reservation is always
  // the collapsed width.
  const sidebarWidth = LAYOUT.sidebarCollapsedWidth;
  const accent =
    theme.palette.mode === 'dark'
      ? {
          bgcolor: s.section,
          borderTop: `2px solid ${s.border}`,
          boxShadow: s.shadowHover,
        }
      : stickyFooterAccentSx;

  return (
    <Paper
      elevation={0}
      square
      sx={[
        {
          position: pin === 'fixed' ? 'fixed' : 'sticky',
          bottom: 0,
          ...(pin === 'fixed'
            ? {
                left: isMdUp ? sidebarWidth : 0,
                right: 0,
              }
            : null),
          zIndex: (t) => t.zIndex.appBar,
          width: pin === 'fixed' ? 'auto' : '100%',
          mt: 'auto',
          ...accent,
        },
        ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
      ]}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          flexWrap: 'wrap',
          gap: 1.25,
          px: { xs: 2, md: `${DASHBOARD_UX.pagePadding}px` },
          py: 1.25,
        }}
      >
        {children}
      </Box>
    </Paper>
  );
}
