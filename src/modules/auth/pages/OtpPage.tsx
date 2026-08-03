import { Alert, Box, Button, CircularProgress, Link, Typography, useTheme } from '@mui/material';
import { Pencil, ShieldCheck } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { env } from '@/shared/config/env';
import { ROUTES } from '@/routes/paths';
import { DASHBOARD_UX, dashSurfaces } from '@/modules/dashboard/theme/dashboardUx';
import { dashContainedButtonSx } from '@/shared/theme/dashButtonSx';
import { AuthCard } from '../components/AuthCard';
import { AuthErrorBanner } from '../components/AuthErrorBanner';
import { AuthHero } from '../components/AuthHero';
import { OtpInput } from '../components/OtpInput';
import { useVerifyOtp } from '../hooks/useVerifyOtp';

type OtpLocationState = {
  mobileNumber?: string;
};

export function OtpPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);
  const state = (location.state as OtpLocationState | null) ?? null;
  const mobileNumber = state?.mobileNumber ?? '';

  const { verifyOtp, isLoading, error, clearError } = useVerifyOtp();
  const [otp, setOtp] = useState('');
  const isComplete = otp.length === 6;

  useEffect(() => {
    document.title = `${t('navigation.verifyOtp')} · ${t('common.appName')}`;
  }, [t]);

  if (!mobileNumber) {
    return <Navigate to={ROUTES.login} replace />;
  }

  const handleVerify = async (code = otp) => {
    clearError();
    if (code.length !== 6) {
      return;
    }
    const success = await verifyOtp(mobileNumber, code);
    if (success) {
      navigate(ROUTES.root, { replace: true });
    }
  };

  return (
    <AuthCard>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: `${DASHBOARD_UX.internalGap + 4}px` }}>
        <AuthHero
          icon={ShieldCheck}
          eyebrow={t('auth.otp.eyebrow')}
          heading={t('auth.otp.heading')}
          subheading={`${t('auth.otp.subheading')} +91 ${mobileNumber}`}
        />

        {error ? <AuthErrorBanner message={error} /> : null}

        <Box
          sx={{
            p: `${DASHBOARD_UX.cardPadding}px`,
            borderRadius: `${DASHBOARD_UX.radius}px`,
            border: `1px solid ${s.border}`,
            bgcolor: s.surface,
          }}
        >
          <Typography sx={{ ...DASHBOARD_UX.cardTitle, color: s.textPrimary, mb: 1.25 }}>
            {t('auth.otp.codeLabel')}
          </Typography>
          <OtpInput
            value={otp}
            disabled={isLoading}
            onChange={(value) => {
              setOtp(value);
              if (error) {
                clearError();
              }
            }}
            onComplete={(value) => {
              void handleVerify(value);
            }}
          />
          {env.isDevelopment ? (
            <Alert
              severity="warning"
              sx={{
                mt: 1.5,
                borderRadius: `${DASHBOARD_UX.tileRadius}px`,
                ...DASHBOARD_UX.body,
              }}
            >
              {t('auth.otp.devHint')}
            </Alert>
          ) : null}
        </Box>

        <Link
          component={RouterLink}
          to={ROUTES.login}
          underline="hover"
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 0.75,
            ...DASHBOARD_UX.link,
            color: 'primary.dark',
            alignSelf: 'flex-start',
            pointerEvents: isLoading ? 'none' : 'auto',
            opacity: isLoading ? 0.5 : 1,
          }}
        >
          <Pencil size={DASHBOARD_UX.iconSize} />
          {t('auth.otp.wrongNumber')} {t('auth.otp.changeIt')}
        </Link>

        <Button
          type="button"
          variant="contained"
          color="primary"
          disabled={!isComplete || isLoading}
          fullWidth
          startIcon={isLoading ? <CircularProgress size={16} color="inherit" /> : undefined}
          onClick={() => void handleVerify()}
          sx={{
            ...dashContainedButtonSx,
            '&:hover': { boxShadow: s.shadowHover },
          }}
        >
          {isLoading ? t('common.pleaseWait') : t('auth.otp.verifyContinue')}
        </Button>
      </Box>
    </AuthCard>
  );
}
