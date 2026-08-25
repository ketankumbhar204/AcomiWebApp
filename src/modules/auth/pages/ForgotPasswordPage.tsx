import { Box, Button, CircularProgress, Link, useTheme } from '@mui/material';
import { KeyRound } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { ROUTES } from '@/routes/paths';
import { isValidIndianMobile } from '@/shared/utils/indianMobile';
import { DASHBOARD_UX, dashSurfaces } from '@/modules/dashboard/theme/dashboardUx';
import { dashContainedButtonSx } from '@/shared/theme/dashButtonSx';
import { AuthCard } from '../components/AuthCard';
import { AuthErrorBanner } from '../components/AuthErrorBanner';
import { AuthHero } from '../components/AuthHero';
import { MobileNumberInput } from '../components/MobileNumberInput';
import { useSendOtp } from '../hooks/useSendOtp';

export function ForgotPasswordPage() {
  const { t } = useTranslation();
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);
  const navigate = useNavigate();
  const { sendOtp, isLoading, error, clearError } = useSendOtp();
  const [mobileNumber, setMobileNumber] = useState('');

  useEffect(() => {
    document.title = `${t('auth.forgotPassword.heading')} · ${t('common.appName')}`;
  }, [t]);

  const canSubmit = isValidIndianMobile(mobileNumber) && !isLoading;

  const handleSubmit = async () => {
    clearError();
    if (!canSubmit) {
      return;
    }
    const result = await sendOtp(mobileNumber, 'RESET_PASSWORD');
    if (result) {
      navigate(ROUTES.forgotPasswordOtp, {
        state: { mobileNumber, purpose: 'RESET_PASSWORD' },
      });
    }
  };

  return (
    <AuthCard>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: `${DASHBOARD_UX.internalGap + 4}px` }}>
        <AuthHero
          icon={KeyRound}
          eyebrow={t('auth.forgotPassword.eyebrow')}
          heading={t('auth.forgotPassword.heading')}
          subheading={t('auth.forgotPassword.subheading')}
        />
        {error ? <AuthErrorBanner message={error} /> : null}
        <MobileNumberInput
          value={mobileNumber}
          onChange={(value) => {
            setMobileNumber(value);
            if (error) {
              clearError();
            }
          }}
          disabled={isLoading}
          autoFocus
        />
        <Button
          variant="contained"
          color="primary"
          disabled={!canSubmit}
          fullWidth
          onClick={() => void handleSubmit()}
          startIcon={isLoading ? <CircularProgress size={16} color="inherit" /> : undefined}
          sx={{ ...dashContainedButtonSx, '&:hover': { boxShadow: s.shadowHover } }}
        >
          {isLoading ? t('common.pleaseWait') : t('auth.forgotPassword.submit')}
        </Button>
        <Link component={RouterLink} to={ROUTES.login} underline="hover">
          {t('auth.forgotPassword.backToSignIn')}
        </Link>
      </Box>
    </AuthCard>
  );
}
