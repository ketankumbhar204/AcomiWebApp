import { Alert, AlertTitle, Box, Button, useTheme } from '@mui/material';
import { DASHBOARD_UX, dashSurfaces } from '@/modules/dashboard/theme/dashboardUx';
import { dashOutlinedButtonSx } from '@/shared/theme/dashButtonSx';

type ErrorStateProps = {
  title?: string;
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
};

export function ErrorState({
  title = 'Something went wrong',
  message,
  onRetry,
  retryLabel = 'Try again',
}: ErrorStateProps) {
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);

  return (
    <Box sx={{ width: '100%' }}>
      <Alert
        severity="error"
        sx={{
          borderRadius: `${DASHBOARD_UX.tileRadius}px`,
          border: `1px solid ${s.border}`,
          bgcolor: s.surface,
        }}
        action={
          onRetry ? (
            <Button color="inherit" size="small" onClick={onRetry} sx={dashOutlinedButtonSx}>
              {retryLabel}
            </Button>
          ) : undefined
        }
      >
        <AlertTitle sx={{ ...DASHBOARD_UX.cardTitle, color: s.textPrimary }}>{title}</AlertTitle>
        <Box component="span" sx={{ ...DASHBOARD_UX.body, color: s.textSecondary }}>
          {message}
        </Box>
      </Alert>
    </Box>
  );
}
