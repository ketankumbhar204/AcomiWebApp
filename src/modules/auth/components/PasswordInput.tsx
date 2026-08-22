import { Box, FormHelperText, InputBase, Typography, useTheme } from '@mui/material';
import { Lock } from 'lucide-react';
import type { ChangeEvent, KeyboardEvent } from 'react';
import { colors } from '@/shared/theme/colors';
import { DASHBOARD_UX, dashSurfaces } from '@/modules/dashboard/theme/dashboardUx';

type PasswordInputProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  error?: string | null;
  disabled?: boolean;
  autoComplete?: string;
  placeholder?: string;
  onSubmit?: () => void;
};

export function PasswordInput({
  label,
  value,
  onChange,
  onBlur,
  error,
  disabled = false,
  autoComplete = 'current-password',
  placeholder,
  onSubmit,
}: PasswordInputProps) {
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.value);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      onSubmit?.();
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.75 }}>
        <Lock size={DASHBOARD_UX.iconSize} color={colors.primaryDark} strokeWidth={2} />
        <Typography sx={{ ...DASHBOARD_UX.link, color: s.textPrimary }}>{label}</Typography>
      </Box>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'stretch',
          borderRadius: `${DASHBOARD_UX.buttonRadius}px`,
          border: `1px solid ${error ? colors.danger : s.border}`,
          bgcolor: s.surface,
          overflow: 'hidden',
          transition: DASHBOARD_UX.transition,
          minHeight: 40,
        }}
      >
        <InputBase
          type="password"
          value={value}
          onChange={handleChange}
          onBlur={onBlur}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          autoComplete={autoComplete}
          placeholder={placeholder}
          fullWidth
          sx={{
            px: 1.5,
            ...DASHBOARD_UX.body,
            color: s.textPrimary,
          }}
        />
      </Box>
      {error ? <FormHelperText error>{error}</FormHelperText> : null}
    </Box>
  );
}
