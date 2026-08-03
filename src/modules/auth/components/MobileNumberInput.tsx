import { Box, FormHelperText, InputBase, Typography, useTheme } from '@mui/material';
import { Smartphone } from 'lucide-react';
import type { ChangeEvent, KeyboardEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { colors } from '@/shared/theme/colors';
import { normalizeIndianMobileDigits } from '@/shared/utils/indianMobile';
import { DASHBOARD_UX, dashSurfaces } from '@/modules/dashboard/theme/dashboardUx';

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
  const s = dashSurfaces(theme.palette.mode);

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
        <Smartphone size={DASHBOARD_UX.iconSize} color={colors.primaryDark} strokeWidth={2} />
        <Typography sx={{ ...DASHBOARD_UX.link, color: s.textPrimary }}>
          {t('auth.login.mobileLabel')}
        </Typography>
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
          '&:focus-within': {
            borderColor: error ? colors.danger : colors.primaryDark,
            boxShadow: error
              ? '0 0 0 3px rgba(220,38,38,0.12)'
              : '0 0 0 3px rgba(18, 140, 126, 0.15)',
          },
        }}
      >
        <Box
          sx={{
            px: 1.5,
            display: 'flex',
            alignItems: 'center',
            bgcolor: s.elevated,
            borderRight: `1px solid ${s.border}`,
            color: s.textSecondary,
            ...DASHBOARD_UX.link,
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
            'aria-label': t('auth.login.mobileLabel'),
            'aria-invalid': Boolean(error),
            autoComplete: 'tel-national',
          }}
          sx={{
            flex: 1,
            px: 1.5,
            py: 1,
            ...DASHBOARD_UX.metricLabel,
            color: s.textPrimary,
          }}
        />
      </Box>
      {error ? (
        <FormHelperText error sx={{ mx: 0, mt: 0.75, ...DASHBOARD_UX.sectionSubtitle }}>
          {error}
        </FormHelperText>
      ) : (
        <FormHelperText sx={{ mx: 0, mt: 0.75, ...DASHBOARD_UX.sectionSubtitle, color: s.textMuted }}>
          {t('auth.login.mobileHelper')}
        </FormHelperText>
      )}
    </Box>
  );
}
