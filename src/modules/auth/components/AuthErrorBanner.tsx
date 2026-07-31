import { Alert, useTheme } from '@mui/material';
import { TriangleAlert } from 'lucide-react';
import { DASHBOARD_UX, dashSurfaces } from '@/modules/dashboard/theme/dashboardUx';

type AuthErrorBannerProps = {
  message: string;
};

export function AuthErrorBanner({ message }: AuthErrorBannerProps) {
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);

  return (
    <Alert
      severity="error"
      icon={<TriangleAlert size={DASHBOARD_UX.iconSize} />}
      sx={{
        borderRadius: `${DASHBOARD_UX.tileRadius}px`,
        bgcolor: theme.palette.mode === 'dark' ? 'rgba(220, 38, 38, 0.12)' : '#FEF2F2',
        border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(248, 113, 113, 0.35)' : '#FECACA'}`,
        color: theme.palette.mode === 'dark' ? '#FCA5A5' : '#B91C1C',
        ...DASHBOARD_UX.body,
        boxShadow: s.shadow === 'none' ? undefined : undefined,
        '& .MuiAlert-icon': {
          color: theme.palette.mode === 'dark' ? '#FCA5A5' : '#B91C1C',
        },
      }}
    >
      {message}
    </Alert>
  );
}
