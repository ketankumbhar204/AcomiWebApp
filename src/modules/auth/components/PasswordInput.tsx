import { Box, FormHelperText, IconButton, InputBase, Typography, useTheme } from '@mui/material';
import { Eye, EyeOff, Lock } from 'lucide-react';
import { useState, type ChangeEvent, type KeyboardEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { AUTH_UX, authSurfaces } from '../theme/authUx';

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
  const { t } = useTranslation();
  const theme = useTheme();
  const a = authSurfaces(theme.palette.mode);
  const [visible, setVisible] = useState(false);

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
        <Lock size={14} color={a.brand} strokeWidth={2} aria-hidden />
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
          minHeight: AUTH_UX.fieldHeight,
          transition: 'border-color 150ms ease, box-shadow 150ms ease',
          '&:focus-within': {
            borderColor: error ? a.danger : a.focus,
            boxShadow: error ? a.dangerRing : a.focusRing,
          },
        }}
      >
        <InputBase
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={handleChange}
          onBlur={onBlur}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          autoComplete={autoComplete}
          placeholder={placeholder}
          inputProps={{ 'aria-invalid': Boolean(error), 'aria-label': label }}
          endAdornment={
            <IconButton
              type="button"
              size="small"
              onClick={() => setVisible((current) => !current)}
              disabled={disabled}
              aria-label={visible ? t('auth.password.hide') : t('auth.password.show')}
              sx={{
                mr: 0.25,
                color: a.brand,
                '&:hover': { color: a.brandHover, bgcolor: 'transparent' },
              }}
            >
              {visible ? <EyeOff size={18} strokeWidth={2.2} /> : <Eye size={18} strokeWidth={2.2} />}
            </IconButton>
          }
          sx={{
            flex: 1,
            minWidth: 0,
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
