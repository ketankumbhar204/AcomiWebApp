import { Box, Typography } from '@mui/material';
import type { ReactNode } from 'react';
import { colors } from '@/shared/theme/colors';

type AdminLeadDetailFieldProps = {
  label: string;
  value?: ReactNode;
  icon?: ReactNode;
};

/** Label + value row used on Admin lead detail cards. */
export function AdminLeadDetailField({ label, value, icon }: AdminLeadDetailFieldProps) {
  const display =
    value === null || value === undefined || value === '' ? (
      <Typography component="span" sx={{ color: colors.muted }}>
        —
      </Typography>
    ) : (
      value
    );

  return (
    <Box sx={{ minWidth: 0 }}>
      <Typography
        variant="caption"
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.5,
          color: colors.textSecondary,
          fontWeight: 600,
          letterSpacing: 0.2,
          mb: 0.35,
        }}
      >
        {icon}
        {label}
      </Typography>
      <Typography
        variant="body2"
        sx={{
          color: colors.textPrimary,
          fontWeight: 600,
          wordBreak: 'break-word',
          lineHeight: 1.45,
        }}
      >
        {display}
      </Typography>
    </Box>
  );
}
