import { Chip, useTheme } from '@mui/material';
import { DASHBOARD_UX, dashSurfaces } from '@/modules/dashboard/theme/dashboardUx';

export type StatusChipTone = 'default' | 'success' | 'warning' | 'error' | 'info' | 'neutral';

const toneColor: Record<StatusChipTone, 'default' | 'success' | 'warning' | 'error' | 'info'> = {
  default: 'default',
  success: 'success',
  warning: 'warning',
  error: 'error',
  info: 'info',
  neutral: 'default',
};

type StatusChipProps = {
  label: string;
  tone?: StatusChipTone;
  size?: 'small' | 'medium';
};

export function StatusChip({ label, tone = 'default', size = 'small' }: StatusChipProps) {
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);

  return (
    <Chip
      size={size}
      label={label}
      color={toneColor[tone]}
      variant="outlined"
      sx={{
        height: size === 'small' ? 22 : 28,
        borderRadius: `${DASHBOARD_UX.buttonRadius}px`,
        ...DASHBOARD_UX.badge,
        bgcolor: s.surface,
        '& .MuiChip-label': { px: 0.75 },
      }}
    />
  );
}
