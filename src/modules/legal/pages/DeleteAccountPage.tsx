import { Box, Button, Checkbox, CircularProgress, FormControlLabel, Link, Typography, useTheme } from '@mui/material';
import { Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import { ROUTES } from '@/routes/paths';
import { isValidIndianMobile, normalizeIndianMobileDigits } from '@/shared/utils/indianMobile';
import { DASHBOARD_UX, dashSurfaces } from '@/modules/dashboard/theme/dashboardUx';
import { dashContainedButtonSx } from '@/shared/theme/dashButtonSx';
import { AuthCard } from '@/modules/auth/components/AuthCard';
import { AuthErrorBanner } from '@/modules/auth/components/AuthErrorBanner';
import { AuthHero } from '@/modules/auth/components/AuthHero';
import { MobileNumberInput } from '@/modules/auth/components/MobileNumberInput';
import { PasswordInput } from '@/modules/auth/components/PasswordInput';
import { authApi } from '@/modules/auth/api/authApi';
import { useOtpCooldown } from '@/modules/auth/hooks/useOtpCooldown';
import { useSendOtp } from '@/modules/auth/hooks/useSendOtp';
import { formatCountdown } from '@/modules/auth/utils/otpAuthErrors';
import { validatePassword } from '@/modules/auth/passwordRules';
import { useAuthStore } from '@/store/authStore';
import { useFinishAccountDeletion } from '@/modules/legal/hooks/useFinishAccountDeletion';
import { mapAccountDeletionError } from '@/modules/legal/utils/accountDeletion';

type AuthMethod = 'password' | 'otp';

type DeleteLocationState = {
  fromProfile?: boolean;
  mobileNumber?: string;
};

export function DeleteAccountPage() {
  const { t } = useTranslation();
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = (location.state as DeleteLocationState | null) ?? null;
  const fromProfile = Boolean(locationState?.fromProfile);
  const signedInUser = useAuthStore((state) => state.user);
  const finishAccountDeletion = useFinishAccountDeletion();

  const [authMethod, setAuthMethod] = useState<AuthMethod>('password');
  const [mobileNumber, setMobileNumber] = useState(
    locationState?.mobileNumber ?? signedInUser?.mobileNumber ?? '',
  );
  const [password, setPassword] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const { sendOtp, isLoading: sendingOtp, error: otpSendError, clearError: clearOtpError } = useSendOtp();

  useEffect(() => {
    document.title = `${t('legal.deleteAccount.title')} · ${t('common.appName')}`;
  }, [t]);

  useEffect(() => {
    const nextMobile = locationState?.mobileNumber ?? signedInUser?.mobileNumber ?? '';
    if (nextMobile) {
      setMobileNumber(nextMobile);
    }
  }, [locationState?.mobileNumber, signedInUser]);

  const canDeletePassword =
    isValidIndianMobile(mobileNumber) &&
    validatePassword(password) == null &&
    confirmed &&
    !deleting;
  const otpCooldown = useOtpCooldown(mobileNumber, 'ACCOUNT_DELETION');
  const canSendOtp =
    isValidIndianMobile(mobileNumber) && confirmed && !sendingOtp && !deleting && otpCooldown === 0;
  const lockRegisteredMobile = fromProfile || Boolean(signedInUser);

  const switchAuthMethod = (next: AuthMethod) => {
    if (next === authMethod) {
      return;
    }
    setAuthMethod(next);
    setError(null);
    clearOtpError();
  };

  const handleDeletePassword = async () => {
    if (!canDeletePassword) {
      return;
    }
    setError(null);
    setDeleting(true);
    try {
      await authApi.deleteAccountByPassword({
        mobileNumber: normalizeIndianMobileDigits(mobileNumber),
        password,
      });
      finishAccountDeletion();
    } catch (err) {
      setError(mapAccountDeletionError(err));
    } finally {
      setDeleting(false);
    }
  };

  const handleSendOtp = async () => {
    if (!canSendOtp) {
      if (!isValidIndianMobile(mobileNumber)) {
        setError(
          mobileNumber.trim()
            ? t('auth.login.mobileInvalid')
            : t('auth.login.mobileRequired'),
        );
      }
      return;
    }
    setError(null);
    clearOtpError();
    const result = await sendOtp(normalizeIndianMobileDigits(mobileNumber), 'ACCOUNT_DELETION');
    if (result) {
      navigate(ROUTES.deleteAccountOtp, {
        state: {
          mobileNumber: normalizeIndianMobileDigits(mobileNumber),
          purpose: 'ACCOUNT_DELETION',
          fromProfile,
        },
      });
    }
  };

  return (
    <AuthCard>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: `${DASHBOARD_UX.internalGap + 4}px` }}>
        <AuthHero
          icon={Trash2}
          eyebrow={t('legal.deleteAccount.eyebrow')}
          heading={t('legal.deleteAccount.heading')}
          subheading={t('legal.deleteAccount.subheading')}
        />

        {error || otpSendError ? <AuthErrorBanner message={error || otpSendError || ''} /> : null}

        <Typography sx={{ ...DASHBOARD_UX.sectionSubtitle, color: s.textMuted }}>
          {t('legal.deleteAccount.whatIsDeleted')}
        </Typography>
        <Typography sx={{ ...DASHBOARD_UX.sectionSubtitle, color: s.textMuted }}>
          {t('legal.deleteAccount.whatIsRetained')}
        </Typography>

        <MobileNumberInput
          value={mobileNumber}
          onChange={(value) => {
            setMobileNumber(value);
            if (error) setError(null);
          }}
          disabled={deleting || sendingOtp || lockRegisteredMobile}
          autoFocus={!lockRegisteredMobile}
        />
        {authMethod === 'password' ? (
          <PasswordInput
            label={t('auth.login.passwordLabel')}
            value={password}
            onChange={(value) => {
              setPassword(value);
              if (error) setError(null);
            }}
            disabled={deleting}
            placeholder={t('auth.login.passwordPlaceholder')}
          />
        ) : null}
        <FormControlLabel
          control={
            <Checkbox
              checked={confirmed}
              onChange={(event) => setConfirmed(event.target.checked)}
              disabled={deleting || sendingOtp}
            />
          }
          label={t('legal.deleteAccount.confirmLabel')}
        />
        {authMethod === 'otp' ? (
          <Button
            variant="contained"
            color="primary"
            disabled={!canSendOtp}
            fullWidth
            onClick={() => void handleSendOtp()}
            startIcon={sendingOtp ? <CircularProgress size={16} color="inherit" /> : undefined}
            sx={dashContainedButtonSx}
          >
            {sendingOtp
              ? t('common.pleaseWait')
              : otpCooldown > 0
                ? t('auth.otp.sendOtpIn', { time: formatCountdown(otpCooldown) })
                : t('legal.deleteAccount.sendOtp')}
          </Button>
        ) : (
          <Button
            variant="contained"
            color="error"
            disabled={!canDeletePassword}
            fullWidth
            onClick={() => void handleDeletePassword()}
            startIcon={deleting ? <CircularProgress size={16} color="inherit" /> : undefined}
            sx={dashContainedButtonSx}
          >
            {deleting ? t('common.pleaseWait') : t('legal.deleteAccount.submit')}
          </Button>
        )}
        <Typography sx={{ ...DASHBOARD_UX.smallCaption, color: s.textMuted, textAlign: 'center' }}>
          <Link
            component="button"
            type="button"
            underline="hover"
            disabled={deleting || sendingOtp}
            onClick={() => switchAuthMethod(authMethod === 'otp' ? 'password' : 'otp')}
            sx={{
              ...DASHBOARD_UX.smallCaption,
              color: s.textSecondary,
              background: 'none',
              border: 0,
              p: 0,
              cursor: deleting || sendingOtp ? 'default' : 'pointer',
            }}
          >
            {authMethod === 'otp'
              ? t('legal.deleteAccount.usePassword')
              : t('legal.deleteAccount.otpInstead')}
          </Link>
        </Typography>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
          <Link component={RouterLink} to={ROUTES.privacy} underline="hover">
            {t('legal.privacy.linkLabel')}
          </Link>
          <Link
            component={RouterLink}
            to={!fromProfile ? ROUTES.login : ROUTES.profile}
            underline="hover"
          >
            {!fromProfile ? t('legal.deleteAccount.backToSignIn') : t('navigation.profile')}
          </Link>
        </Box>
      </Box>
    </AuthCard>
  );
}
