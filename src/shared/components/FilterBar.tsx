import { Box, Button, Collapse, useTheme } from '@mui/material';
import { Filter, RotateCcw } from 'lucide-react';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { DASHBOARD_UX, dashSurfaces } from '@/modules/dashboard/theme/dashboardUx';
import { dashOutlinedButtonSx } from '@/shared/theme/dashButtonSx';

type FilterBarProps = {
  children: ReactNode;
  activeCount?: number;
  onReset?: () => void;
  defaultExpanded?: boolean;
};

export function FilterBar({
  children,
  activeCount = 0,
  onReset,
  defaultExpanded = false,
}: FilterBarProps) {
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);
  const [expanded, setExpanded] = useState(defaultExpanded || activeCount > 0);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: `${DASHBOARD_UX.internalGap}px` }}>
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        <Button
          size="small"
          variant={expanded ? 'contained' : 'outlined'}
          startIcon={<Filter size={14} />}
          onClick={() => setExpanded((value) => !value)}
          sx={dashOutlinedButtonSx}
        >
          Filters{activeCount > 0 ? ` (${activeCount})` : ''}
        </Button>
        {onReset && activeCount > 0 ? (
          <Button
            size="small"
            startIcon={<RotateCcw size={14} />}
            onClick={onReset}
            sx={dashOutlinedButtonSx}
          >
            Reset
          </Button>
        ) : null}
      </Box>
      <Collapse in={expanded}>
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: `${DASHBOARD_UX.cardGap}px`,
            p: `${DASHBOARD_UX.metricPadding}px`,
            borderRadius: `${DASHBOARD_UX.tileRadius}px`,
            border: `1px solid ${s.border}`,
            bgcolor: s.elevated,
          }}
        >
          {children}
        </Box>
      </Collapse>
    </Box>
  );
}
