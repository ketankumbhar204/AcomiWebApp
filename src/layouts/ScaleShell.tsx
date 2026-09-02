import { Box } from '@mui/material';
import type { ReactNode } from 'react';

type ScaleShellProps = {
  children: ReactNode;
  /**
   * Stretch to parent height for column-scroll layouts.
   * Kept for callers that previously used the scaled canvas fill mode.
   */
  fillHeight?: boolean;
};

/**
 * Fluid content wrapper. Previously locked a 1280px canvas and CSS-scaled it
 * down on narrower viewports, which made every page look like a shrunk desktop.
 * Layouts now reflow; this remains as a passthrough so existing imports compile.
 */
export function ScaleShell({ children, fillHeight = false }: ScaleShellProps) {
  return (
    <Box
      sx={{
        width: '100%',
        maxWidth: '100%',
        minWidth: 0,
        ...(fillHeight
          ? {
              flex: '1 1 auto',
              alignSelf: 'stretch',
              minHeight: 0,
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              '& > *': {
                flex: 1,
                minHeight: 0,
                minWidth: 0,
              },
            }
          : null),
      }}
    >
      {children}
    </Box>
  );
}

/** @deprecated Use ScaleShell — kept for existing dashboard imports. */
export const DashboardScaleShell = ScaleShell;
