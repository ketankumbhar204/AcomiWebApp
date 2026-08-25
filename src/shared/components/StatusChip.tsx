import { Chip, useTheme } from '@mui/material';
import { semanticSurface, type SemanticTone } from '@/shared/theme/semantic';
import { DASHBOARD_UX } from '@/modules/dashboard/theme/dashboardUx';

export type StatusChipTone = 'default' | 'success' | 'warning' | 'error' | 'info' | 'neutral';

const toneMap: Record<StatusChipTone, SemanticTone> = {
  default: 'neutral',
  success: 'success',
  warning: 'warning',
  error: 'danger',
  info: 'info',
  neutral: 'neutral',
};

type StatusChipProps = {
  label: string;
  tone?: StatusChipTone;
  size?: 'small' | 'medium';
};

export function StatusChip({ label, tone = 'default', size = 'small' }: StatusChipProps) {
  const theme = useTheme();
  const surface = semanticSurface(toneMap[tone], theme.palette.mode);

  return (
    <Chip
      size={size}
      label={label}
      variant="outlined"
      sx={{
        height: size === 'small' ? 22 : 28,
        borderRadius: `${DASHBOARD_UX.buttonRadius}px`,
        ...DASHBOARD_UX.badge,
        bgcolor: surface.bg,
        color: surface.fg,
        borderColor: surface.border,
        '& .MuiChip-label': { px: 0.75, color: surface.fg, textTransform: 'none', letterSpacing: 0 },
      }}
    />
  );
}
