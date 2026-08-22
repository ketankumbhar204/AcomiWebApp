import { Alert, Box, Button, CircularProgress, Link, Typography, useTheme } from '@mui/material';
import { Pencil, ShieldCheck } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { env } from '@/shared/config/env';
import { ROUTES } from '@/routes/paths';
import { DASHBOARD_UX, dashSurfaces } from '@/modules/dashboard/theme/dashboardUx';
import { dashContainedButtonSx, dashOutlinedButtonSx } from '@/shared/theme/dashButtonSx';
import { useRegistrationDraftStore } from '@/store/registrationDraftStore';
import { AuthCard } from '../components/AuthCard';
import { AuthErrorBanner } from '../components/AuthErrorBanner';
import { AuthHero } from '../components/AuthHero';
import { OtpInput } from '../components/OtpInput';
import { useCountdown } from '../hooks/useCountdown';
import { useSendOtp } from '../hooks/useSendOtp';
import { useVerifyOtp } from '../hooks/useVerifyOtp';
import { formatCountdown } from '../utils/otpAuthErrors';

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
  const draftMobile = useRegistrationDraftStore((draft) => draft.mobileNumber);
  const mobileNumber = draftMobile ?? state?.mobileNumber ?? '';
  const otpSentAt = useRegistrationDraftStore((draft) => draft.otpSentAt);
  const expiresIn = useRegistrationDraftStore((draft) => draft.expiresIn);
  const resendAfter = useRegistrationDraftStore((draft) => draft.resendAfter);
  const clearDraft = useRegistrationDraftStore((draft) => draft.clear);

  const { verifyOtp, isLoading, error, clearError } = useVerifyOtp();
  const { sendOtp, isLoading: isResending } = useSendOtp();
  const [otp, setOtp] = useState('');
  const isComplete = otp.length === 6;
  const busy = isLoading || isResending;

  const otpDeadline = useMemo(
    () => (otpSentAt != null && expiresIn != null ? otpSentAt + expiresIn * 1000 : null),
    [expiresIn, otpSentAt],
  );
  const resendDeadline = useMemo(
    () => (otpSentAt != null && resendAfter != null ? otpSentAt + resendAfter * 1000 : null),
    [otpSentAt, resendAfter],
  );
  const otpRemaining = useCountdown(otpDeadline);
  const resendRemaining = useCountdown(resendDeadline);

  useEffect(() => {
    document.title = `${t('navigation.verifyOtp')} · ${t('common.appName')}`;
  }, [t]);

  if (!mobileNumber) {
    return <Navigate to={ROUTES.register} replace />;
  }

  const handleVerify = async (code = otp) => {
    clearError();
    if (code.length !== 6) {
      return;
    }
    const result = await verifyOtp(mobileNumber, code);
    if (result?.verified) {
      navigate(ROUTES.registerPassword, { state: { mobileNumber } });
    }
  };

  const handleResend = async () => {
    clearError();
    setOtp('');
    await sendOtp(mobileNumber);
  };

  const handleChangeNumber = () => {
    clearDraft();
    navigate(ROUTES.register);
  };

  const resendLabel =
    resendRemaining > 0
      ? t('auth.otp.resendIn', { time: formatCountdown(resendRemaining) })
      : t('auth.otp.resend');

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
            disabled={busy}
            onChange={(value) => {
              setOtp(value);
              if (error) {
                clearError();
              }
            }}
          />
          {otpDeadline != null ? (
            <Typography sx={{ ...DASHBOARD_UX.body, color: s.textMuted, mt: 1.5, textAlign: 'center' }}>
              {otpRemaining > 0
                ? t('auth.otp.expiresIn', { time: formatCountdown(otpRemaining) })
                : t('auth.otp.expiredHint')}
            </Typography>
          ) : null}
          {env.isDevelopment ? (
            <Alert
              severity="info"
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
          component="button"
          type="button"
          underline="hover"
          onClick={handleChangeNumber}
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 0.75,
            ...DASHBOARD_UX.link,
            color: 'primary.dark',
            alignSelf: 'flex-start',
            pointerEvents: busy ? 'none' : 'auto',
            opacity: busy ? 0.5 : 1,
            background: 'none',
            border: 0,
            cursor: 'pointer',
            p: 0,
          }}
        >
          <Pencil size={DASHBOARD_UX.iconSize} />
          {t('auth.otp.wrongNumber')} {t('auth.otp.changeIt')}
        </Link>

        <Button
          type="button"
          variant="contained"
          color="primary"
          disabled={!isComplete || busy}
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

        <Button
          type="button"
          variant="outlined"
          color="primary"
          disabled={busy || resendRemaining > 0}
          fullWidth
          startIcon={isResending ? <CircularProgress size={16} color="inherit" /> : undefined}
          onClick={() => void handleResend()}
          sx={dashOutlinedButtonSx}
        >
          {isResending ? t('common.pleaseWait') : resendLabel}
        </Button>
      </Box>
    </AuthCard>
  );
}
