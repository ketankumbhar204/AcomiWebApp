import { Box, Typography, useTheme } from '@mui/material';
import type { ReactNode } from 'react';
import { DASHBOARD_UX, dashSurfaces } from '@/modules/dashboard/theme/dashboardUx';

type InfoRowProps = {
  label: string;
  value: ReactNode;
  dense?: boolean;
};

export function InfoRow({ label, value, dense = false }: InfoRowProps) {
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', sm: '160px 1fr' },
        gap: { xs: 0.5, sm: 2 },
        py: dense ? 0.75 : 1,
        borderBottom: `1px solid ${s.border}`,
        '&:last-of-type': { borderBottom: 0 },
      }}
    >
      <Typography sx={{ ...DASHBOARD_UX.metricLabel, color: s.textMuted }}>{label}</Typography>
      <Typography sx={{ ...DASHBOARD_UX.body, color: s.textPrimary, fontWeight: 500 }}>
        {value}
      </Typography>
    </Box>
  );
}
