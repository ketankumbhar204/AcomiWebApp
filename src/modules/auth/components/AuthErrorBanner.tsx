import { Alert, useTheme } from '@mui/material';
import { TriangleAlert } from 'lucide-react';
import { AUTH_UX } from '../theme/authUx';

type AuthErrorBannerProps = {
  message: string;
};

export function AuthErrorBanner({ message }: AuthErrorBannerProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  return (
    <Alert
      severity="error"
      icon={<TriangleAlert size={16} />}
      sx={{
        borderRadius: `${AUTH_UX.fieldRadius}px`,
        bgcolor: isDark ? 'rgba(220, 38, 38, 0.12)' : '#FEF2F2',
        border: `1px solid ${isDark ? 'rgba(248, 113, 113, 0.35)' : '#FECACA'}`,
        color: isDark ? '#FCA5A5' : '#B91C1C',
        ...AUTH_UX.helper,
        '& .MuiAlert-icon': {
          color: isDark ? '#FCA5A5' : '#B91C1C',
        },
      }}
    >
      {message}
    </Alert>
  );
}
