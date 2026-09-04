import { Box, CircularProgress, Typography, useTheme } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { DASHBOARD_UX, dashSurfaces } from '@/modules/dashboard/theme/dashboardUx';
import { colors } from '@/shared/theme/colors';

type LoadingStateProps = {
  label?: string;
  minHeight?: number | string;
};

export function LoadingState({ label, minHeight = 240 }: LoadingStateProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);
  const resolvedLabel = label ?? t('common.loading');

  return (
    <Box
      role="status"
      aria-live="polite"
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 1.25,
        minHeight,
        width: '100%',
      }}
    >
      <CircularProgress size={28} sx={{ color: colors.primaryDark }} />
      <Typography sx={{ ...DASHBOARD_UX.body, color: s.textSecondary }}>{resolvedLabel}</Typography>
    </Box>
  );
}
