import { Box, FormHelperText, InputBase, Typography, useTheme } from '@mui/material';
import { Smartphone } from 'lucide-react';
import type { ChangeEvent, KeyboardEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { normalizeIndianMobileDigits } from '@/shared/utils/indianMobile';
import { AUTH_UX, authSurfaces } from '../theme/authUx';

type MobileNumberInputProps = {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  error?: string | null;
  disabled?: boolean;
  autoFocus?: boolean;
  onSubmit?: () => void;
};

export function MobileNumberInput({
  value,
  onChange,
  onBlur,
  error,
  disabled = false,
  autoFocus = false,
  onSubmit,
}: MobileNumberInputProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const a = authSurfaces(theme.palette.mode);
  const label = t('auth.login.mobileLabel');

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange(normalizeIndianMobileDigits(event.target.value));
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
        <Smartphone size={14} color={a.brand} strokeWidth={2} aria-hidden />
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
        <Box
          sx={{
            px: 1.5,
            display: 'flex',
            alignItems: 'center',
            bgcolor: a.elevated,
            borderRight: `1px solid ${a.border}`,
            color: a.textSecondary,
            ...AUTH_UX.label,
            minWidth: 52,
            justifyContent: 'center',
          }}
          aria-hidden
        >
          +91
        </Box>
        <InputBase
          value={value}
          onChange={handleChange}
          onBlur={onBlur}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          autoFocus={autoFocus}
          placeholder={t('auth.login.mobilePlaceholder')}
          inputProps={{
            inputMode: 'numeric',
            maxLength: 10,
            'aria-label': label,
            'aria-invalid': Boolean(error),
            autoComplete: 'tel-national',
          }}
          sx={{
            flex: 1,
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
      ) : (
        <FormHelperText sx={{ mx: 0, mt: 0.5, ...AUTH_UX.helper, color: a.textMuted }}>
          {t('auth.login.mobileHelper')}
        </FormHelperText>
      )}
    </Box>
  );
}
