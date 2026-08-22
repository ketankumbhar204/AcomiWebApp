import { Box, FormHelperText, InputBase, Typography, useTheme } from '@mui/material';
import { UserRound } from 'lucide-react';
import type { ChangeEvent } from 'react';
import { colors } from '@/shared/theme/colors';
import { DASHBOARD_UX, dashSurfaces } from '@/modules/dashboard/theme/dashboardUx';

type NameInputProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  error?: string | null;
  disabled?: boolean;
  placeholder?: string;
};

export function NameInput({
  label,
  value,
  onChange,
  onBlur,
  error,
  disabled = false,
  placeholder,
}: NameInputProps) {
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.value);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.75 }}>
        <UserRound size={DASHBOARD_UX.iconSize} color={colors.primaryDark} strokeWidth={2} />
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
          minHeight: 40,
        }}
      >
        <InputBase
          value={value}
          onChange={handleChange}
          onBlur={onBlur}
          disabled={disabled}
          autoComplete="name"
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
