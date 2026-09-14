import { Box, Typography, useTheme } from '@mui/material';
import { MessageSquare } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { DASHBOARD_UX, dashSurfaces } from '@/modules/dashboard/theme/dashboardUx';

/** Matches the fixed 2factor OTP SMS body (OTP masked). */
export const OTP_SMS_SAMPLE_BODY =
  '[Hello] Your OTP for Phone Verification is XXXXXX. Valid for 5 mins - [Southern Express]';

/**
 * Sample SMS card so users recognize the provider template as ACOMI's OTP.
 * "Southern Express" is the 2factor placeholder — not a different product.
 */
export function OtpSmsSample() {
  const { t } = useTranslation();
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);

  return (
    <Box
      component="aside"
      aria-label={t('auth.otp.smsSampleA11y')}
      sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}
    >
      <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75 }}>
        <MessageSquare size={14} color={theme.palette.primary.main} strokeWidth={2.2} />
        <Typography
          sx={{
            ...DASHBOARD_UX.caption,
            fontWeight: 700,
            color: s.textMuted,
            textTransform: 'uppercase',
            letterSpacing: 0.35,
          }}
        >
          {t('auth.otp.smsSampleTitle')}
        </Typography>
      </Box>

      <Box
        sx={{
          bgcolor: '#1F2937',
          color: '#F9FAFB',
          borderRadius: '16px 16px 16px 4px',
          px: 1.5,
          py: 1.25,
          maxWidth: '100%',
        }}
      >
        <Typography
          sx={{
            fontSize: 12,
            fontWeight: 700,
            color: '#9CA3AF',
            mb: 0.5,
          }}
        >
          {t('auth.otp.smsSampleSender')}
        </Typography>
        <Typography sx={{ ...DASHBOARD_UX.body, color: '#F9FAFB', lineHeight: 1.45 }}>
          {t('auth.otp.smsSampleBody')}
        </Typography>
      </Box>

      <Typography sx={{ ...DASHBOARD_UX.caption, color: s.textMuted, lineHeight: 1.4 }}>
        {t('auth.otp.smsSampleCaption')}
      </Typography>
    </Box>
  );
}
