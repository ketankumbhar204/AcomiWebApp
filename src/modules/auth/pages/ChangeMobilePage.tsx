import { Box, Button, CircularProgress, Link, Typography, useTheme } from '@mui/material';
import { Smartphone } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink, Navigate, useNavigate } from 'react-router-dom';
import { ROUTES } from '@/routes/paths';
import { isValidIndianMobile, maskIndianMobile, normalizeIndianMobileDigits } from '@/shared/utils/indianMobile';
import { DASHBOARD_UX, dashSurfaces } from '@/modules/dashboard/theme/dashboardUx';
import { dashContainedButtonSx } from '@/shared/theme/dashButtonSx';
import { useAuthStore } from '@/store/authStore';
import { AuthCard } from '../components/AuthCard';
import { AuthErrorBanner } from '../components/AuthErrorBanner';
import { AuthHero } from '../components/AuthHero';
import { MobileNumberInput } from '../components/MobileNumberInput';
import { useOtpCooldown } from '../hooks/useOtpCooldown';
import { useSendOtp } from '../hooks/useSendOtp';
import { formatCountdown } from '../utils/otpAuthErrors';

export function ChangeMobilePage() {
  const { t } = useTranslation();
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const currentMobile = normalizeIndianMobileDigits(user?.mobileNumber ?? '');
  const { sendOtp, isLoading, error, clearError } = useSendOtp();
  const [mobileNumber, setMobileNumber] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const cooldown = useOtpCooldown(mobileNumber, 'CHANGE_MOBILE');

  useEffect(() => {
    document.title = `${t('auth.changeMobile.heading')} · ${t('common.appName')}`;
  }, [t]);

  if (!user) {
    return <Navigate to={ROUTES.login} replace />;
  }

  const bannerError = localError || error;
  const canSubmit =
    isValidIndianMobile(mobileNumber) &&
    normalizeIndianMobileDigits(mobileNumber) !== currentMobile &&
    !isLoading &&
    cooldown === 0;

  const handleSubmit = async () => {
    clearError();
    setLocalError(null);
    const next = normalizeIndianMobileDigits(mobileNumber);
    if (!isValidIndianMobile(next)) {
      setLocalError(
        mobileNumber.trim() ? t('auth.login.mobileInvalid') : t('auth.login.mobileRequired'),
      );
      return;
    }
    if (next === currentMobile) {
      setLocalError(t('auth.changeMobile.sameNumber'));
      return;
    }
    const result = await sendOtp(next, 'CHANGE_MOBILE');
    if (result) {
      navigate(ROUTES.changeMobileOtp, {
        state: { mobileNumber: next, purpose: 'CHANGE_MOBILE' },
      });
    }
  };

  return (
    <AuthCard>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: `${DASHBOARD_UX.internalGap + 4}px` }}>
        <AuthHero
          icon={Smartphone}
          eyebrow={t('auth.changeMobile.eyebrow')}
          heading={t('auth.changeMobile.heading')}
          subheading={t('auth.changeMobile.subheading')}
        />
        {bannerError ? <AuthErrorBanner message={bannerError} /> : null}
        <Typography sx={{ ...DASHBOARD_UX.sectionSubtitle, color: s.textMuted }}>
          {t('auth.changeMobile.currentLabel')} {maskIndianMobile(currentMobile)}
        </Typography>
        <MobileNumberInput
          value={mobileNumber}
          onChange={(value) => {
            setMobileNumber(value);
            if (localError) {
              setLocalError(null);
            }
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
          {isLoading
            ? t('common.pleaseWait')
            : cooldown > 0
              ? t('auth.otp.sendOtpIn', { time: formatCountdown(cooldown) })
              : t('auth.changeMobile.sendOtp')}
        </Button>
        <Link component={RouterLink} to={ROUTES.profile} underline="hover">
          {t('auth.changeMobile.backToProfile')}
        </Link>
      </Box>
    </AuthCard>
  );
}
