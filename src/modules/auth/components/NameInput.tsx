import { Box, FormHelperText, InputBase, Typography, useTheme } from '@mui/material';
import { UserRound } from 'lucide-react';
import type { ChangeEvent } from 'react';
import { AUTH_UX, authSurfaces } from '../theme/authUx';

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
  const a = authSurfaces(theme.palette.mode);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.value);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.75 }}>
        <UserRound size={14} color={a.brand} strokeWidth={2} aria-hidden />
        <Typography component="label" sx={{ ...AUTH_UX.label, color: a.textPrimary }}>
          {label}
        </Typography>
      </Box>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'stretch',
          borderRadius: `${AUTH_UX.fieldRadius}px`,
          border: `1px solid ${error ? a.danger : a.border}`,
          bgcolor: a.surface,
          overflow: 'hidden',
          minHeight: AUTH_UX.fieldHeight,
          transition: 'border-color 150ms ease, box-shadow 150ms ease',
          '&:focus-within': {
            borderColor: error ? a.danger : a.focus,
            boxShadow: error ? a.dangerRing : a.focusRing,
          },
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
          inputProps={{ 'aria-invalid': Boolean(error), 'aria-label': label }}
          sx={{
            px: 1.5,
            ...AUTH_UX.input,
            color: a.textPrimary,
            '& input::placeholder': { color: a.textMuted, opacity: 1 },
          }}
        />
      </Box>
      {error ? (
        <FormHelperText error sx={{ mx: 0, mt: 0.5, ...AUTH_UX.helper }}>
          {error}
        </FormHelperText>
      ) : null}
    </Box>
  );
}
