import { Alert, Box, Button, CircularProgress, Link, Typography, useTheme } from '@mui/material';
import { Pencil, ShieldCheck } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { env } from '@/shared/config/env';
import { ROUTES } from '@/routes/paths';
import { maskIndianMobile, normalizeIndianMobileDigits } from '@/shared/utils/indianMobile';
import { DASHBOARD_UX, dashSurfaces } from '@/modules/dashboard/theme/dashboardUx';
import { dashContainedButtonSx, dashOutlinedButtonSx } from '@/shared/theme/dashButtonSx';
import { useAuthStore } from '@/store/authStore';
import { useRegistrationDraftStore, isRegistrationTokenValid } from '@/store/registrationDraftStore';
import { authApi } from '../api/authApi';
import { AuthCard } from '../components/AuthCard';
import { AuthErrorBanner } from '../components/AuthErrorBanner';
import { AuthHero } from '../components/AuthHero';
import { OtpInput } from '../components/OtpInput';
import { useCountdown } from '../hooks/useCountdown';
import { useOtpCooldown } from '../hooks/useOtpCooldown';
import { useRegister, useLoginWithOtp } from '../hooks/usePasswordAuth';
import { useSendOtp } from '../hooks/useSendOtp';
import { useVerifyOtp } from '../hooks/useVerifyOtp';
import {
  isVerificationTokenInvalidated,
  mapAccountDeletionError,
} from '@/modules/legal/utils/accountDeletion';
import { formatCountdown, mapRegistrationTokenError } from '../utils/otpAuthErrors';
import type { OtpPurpose } from '@/shared/types/auth';
import { DeleteAccountConfirmDialog } from '@/modules/legal/components/DeleteAccountConfirmDialog';
import { useFinishAccountDeletion } from '@/modules/legal/hooks/useFinishAccountDeletion';

type OtpLocationState = {
  mobileNumber?: string;
  purpose?: OtpPurpose;
  fromProfile?: boolean;
};

function fallbackRoute(purpose: OtpPurpose): string {
  if (purpose === 'LOGIN') {
    return ROUTES.login;
  }
  if (purpose === 'RESET_PASSWORD') {
    return ROUTES.forgotPassword;
  }
  if (purpose === 'ACCOUNT_DELETION') {
    return ROUTES.deleteAccount;
  }
  if (purpose === 'CHANGE_MOBILE') {
    return ROUTES.changeMobile;
  }
  return ROUTES.register;
}

export function OtpPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);
  const state = (location.state as OtpLocationState | null) ?? null;
  const draftMobile = useRegistrationDraftStore((draft) => draft.mobileNumber);
  const draftPurpose = useRegistrationDraftStore((draft) => draft.purpose);
  const purpose: OtpPurpose = state?.purpose ?? draftPurpose ?? 'REGISTER';
  const mobileNumber = draftMobile ?? state?.mobileNumber ?? '';
  const otpSentAt = useRegistrationDraftStore((draft) => draft.otpSentAt);
  const expiresIn = useRegistrationDraftStore((draft) => draft.expiresIn);
  const verificationToken = useRegistrationDraftStore((draft) => draft.verificationToken);
  const tokenExpiresAt = useRegistrationDraftStore((draft) => draft.verificationTokenExpiresAt);
  const clearDraft = useRegistrationDraftStore((draft) => draft.clear);
  const clearVerification = useRegistrationDraftStore((draft) => draft.clearVerification);
  const finishAccountDeletion = useFinishAccountDeletion();
  const setSession = useAuthStore((state) => state.setSession);

  const { verifyOtp, isLoading, error, clearError } = useVerifyOtp();
  const { sendOtp, isLoading: isResending } = useSendOtp();
  const { register, isLoading: isRegistering, error: registerError, clearError: clearRegisterError } =
    useRegister();
  const { loginWithOtp, isLoading: isOtpLoggingIn, error: loginOtpError, clearError: clearLoginOtpError } =
    useLoginWithOtp();
  const fullName = useRegistrationDraftStore((draft) => draft.fullName);
  const password = useRegistrationDraftStore((draft) => draft.password);
  const confirmPassword = useRegistrationDraftStore((draft) => draft.confirmPassword);
  const [otp, setOtp] = useState('');
  const [info, setInfo] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deletionConfirmed, setDeletionConfirmed] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [changingMobile, setChangingMobile] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [changeError, setChangeError] = useState<string | null>(null);
  const isComplete = otp.length === 6;
  const tokenOk = isRegistrationTokenValid(verificationToken, tokenExpiresAt);
  const deletionVerified = purpose === 'ACCOUNT_DELETION' && tokenOk;
  const busy = isLoading || isResending || isRegistering || isOtpLoggingIn || deleting || changingMobile;
  const bannerError = error || registerError || loginOtpError || changeError;
  const canConfirmDelete = deletionConfirmed && tokenOk && Boolean(verificationToken) && !deleting;

  const otpDeadline = useMemo(
    () => (otpSentAt != null && expiresIn != null ? otpSentAt + expiresIn * 1000 : null),
    [expiresIn, otpSentAt],
  );
  const otpRemaining = useCountdown(otpDeadline);
  const resendRemaining = useOtpCooldown(mobileNumber, purpose);

  useEffect(() => {
    document.title = `${t('navigation.verifyOtp')} · ${t('common.appName')}`;
  }, [t]);

  if (!mobileNumber) {
    return <Navigate to={fallbackRoute(purpose)} replace />;
  }
  if (purpose === 'REGISTER' && (!fullName || !password || !confirmPassword)) {
    return <Navigate to={ROUTES.register} replace />;
  }

  const handleVerify = async (code = otp) => {
    clearError();
    clearRegisterError();
    clearLoginOtpError();
    setInfo(null);
    setChangeError(null);
    if (code.length !== 6) {
      return;
    }
    const result = await verifyOtp(mobileNumber, code, purpose);
    if (!result?.verified) {
      return;
    }
    if (purpose === 'LOGIN') {
      await loginWithOtp(mobileNumber, result.verificationToken);
      return;
    }
    if (purpose === 'RESET_PASSWORD') {
      navigate(ROUTES.resetPassword, { state: { mobileNumber, purpose } });
      return;
    }
    if (purpose === 'ACCOUNT_DELETION') {
      setDeleteError(null);
      setDeletionConfirmed(false);
      setConfirmOpen(true);
      return;
    }
    if (purpose === 'CHANGE_MOBILE') {
      setChangingMobile(true);
      setChangeError(null);
      try {
        const changed = await authApi.changeMobile({
          mobileNumber: normalizeIndianMobileDigits(mobileNumber),
          verificationToken: result.verificationToken,
        });
        clearDraft();
        setSession(changed.user, changed.accessToken);
        navigate(ROUTES.profile, { replace: true, state: { mobileChanged: true } });
      } catch (err) {
        setChangeError(mapRegistrationTokenError(err));
        if (isVerificationTokenInvalidated(err)) {
          clearVerification();
        }
      } finally {
        setChangingMobile(false);
      }
      return;
    }
    if (!fullName || !password || !confirmPassword) {
      navigate(ROUTES.register, { replace: true });
      return;
    }
    await register({
      fullName,
      mobileNumber,
      password,
      confirmPassword,
      verificationToken: result.verificationToken,
    });
  };

  const openDeletionConfirm = () => {
    if (!deletionVerified || deleting) {
      return;
    }
    setDeleteError(null);
    setDeletionConfirmed(false);
    setConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!canConfirmDelete || !verificationToken) {
      return;
    }
    setDeleteError(null);
    setDeleting(true);
    try {
      await authApi.deleteAccountByOtp({
        mobileNumber: normalizeIndianMobileDigits(mobileNumber),
        verificationToken,
      });
      finishAccountDeletion();
    } catch (err) {
      setDeleteError(mapAccountDeletionError(err));
      if (isVerificationTokenInvalidated(err)) {
        clearVerification();
      }
    } finally {
      setDeleting(false);
    }
  };

  const handleResend = async () => {
    clearError();
    clearRegisterError();
    clearLoginOtpError();
    setChangeError(null);
    setOtp('');
    const result = await sendOtp(mobileNumber, purpose);
    if (result) {
      setInfo(t('auth.otp.resent'));
    }
  };

  const handleChangeNumber = () => {
    clearDraft();
    if (purpose === 'ACCOUNT_DELETION') {
      navigate(ROUTES.deleteAccount, {
        state: { fromProfile: Boolean(state?.fromProfile), mobileNumber },
      });
      return;
    }
    if (purpose === 'CHANGE_MOBILE') {
      navigate(ROUTES.changeMobile);
      return;
    }
    navigate(fallbackRoute(purpose));
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
          subheading={`${t('auth.otp.subheading')} ${maskIndianMobile(mobileNumber)}`}
        />

        {bannerError ? <AuthErrorBanner message={bannerError} /> : null}
        {info && !bannerError ? (
          <Alert
            severity="success"
            sx={{
              borderRadius: `${DASHBOARD_UX.tileRadius}px`,
              ...DASHBOARD_UX.body,
            }}
          >
            {info}
          </Alert>
        ) : null}

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
            disabled={busy || confirmOpen}
            onChange={(value) => {
              setOtp(value);
              if (error) {
                clearError();
              }
              if (registerError) {
                clearRegisterError();
              }
              if (info) {
                setInfo(null);
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
            pointerEvents: busy || confirmOpen ? 'none' : 'auto',
            opacity: busy || confirmOpen ? 0.5 : 1,
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
          disabled={deletionVerified ? busy : !isComplete || busy}
          fullWidth
          startIcon={isLoading || isRegistering || isOtpLoggingIn ? <CircularProgress size={16} color="inherit" /> : undefined}
          onClick={() => void (deletionVerified ? openDeletionConfirm() : handleVerify())}
          sx={{
            ...dashContainedButtonSx,
            '&:hover': { boxShadow: s.shadowHover },
          }}
        >
          {isLoading || isRegistering || isOtpLoggingIn
            ? t('common.pleaseWait')
            : deletionVerified
              ? t('legal.deleteAccount.continueDelete')
              : t('auth.otp.verifyContinue')}
        </Button>

        <Button
          type="button"
          variant="outlined"
          color="primary"
          disabled={busy || confirmOpen || resendRemaining > 0}
          fullWidth
          startIcon={isResending ? <CircularProgress size={16} color="inherit" /> : undefined}
          onClick={() => void handleResend()}
          sx={dashOutlinedButtonSx}
        >
          {isResending ? t('common.pleaseWait') : resendLabel}
        </Button>
      </Box>
      {purpose === 'ACCOUNT_DELETION' ? (
        <DeleteAccountConfirmDialog
          open={confirmOpen}
          confirmed={deletionConfirmed}
          deleting={deleting}
          canDelete={canConfirmDelete}
          error={deleteError}
          onConfirmedChange={setDeletionConfirmed}
          onCancel={() => {
            if (!deleting) {
              setConfirmOpen(false);
            }
          }}
          onDelete={() => void handleConfirmDelete()}
        />
      ) : null}
    </AuthCard>
  );
}
