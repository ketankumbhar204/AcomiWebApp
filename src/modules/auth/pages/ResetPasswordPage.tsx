import { Box, Button, CircularProgress, Link, useTheme } from '@mui/material';
import { KeyRound } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink, Navigate } from 'react-router-dom';
import { ROUTES } from '@/routes/paths';
import { DASHBOARD_UX, dashSurfaces } from '@/modules/dashboard/theme/dashboardUx';
import { dashContainedButtonSx } from '@/shared/theme/dashButtonSx';
import { useRegistrationDraftStore, isRegistrationTokenValid } from '@/store/registrationDraftStore';
import { AuthCard } from '../components/AuthCard';
import { AuthErrorBanner } from '../components/AuthErrorBanner';
import { AuthHero } from '../components/AuthHero';
import { PasswordInput } from '../components/PasswordInput';
import { useResetPassword } from '../hooks/usePasswordAuth';
import { passwordsMatch, validatePassword } from '../passwordRules';

export function ResetPasswordPage() {
  const { t } = useTranslation();
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);
  const { resetPassword, isLoading, error, clearError } = useResetPassword();
  const mobileNumber = useRegistrationDraftStore((state) => state.mobileNumber);
  const verificationToken = useRegistrationDraftStore((state) => state.verificationToken);
  const tokenExpiresAt = useRegistrationDraftStore((state) => state.verificationTokenExpiresAt);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetComplete, setResetComplete] = useState(false);

  useEffect(() => {
    document.title = `${t('auth.forgotPassword.newPasswordHeading')} · ${t('common.appName')}`;
  }, [t]);

  if (resetComplete) {
    return <Navigate to={ROUTES.login} replace />;
  }

  const tokenOk = isRegistrationTokenValid(verificationToken, tokenExpiresAt);
  if (!mobileNumber || !tokenOk) {
    return <Navigate to={ROUTES.forgotPassword} replace />;
  }

  const canSubmit =
    validatePassword(password) == null &&
    passwordsMatch(password, confirmPassword) &&
    !isLoading;

  const handleSubmit = async () => {
    if (!canSubmit || !verificationToken) {
      return;
    }
    clearError();
    const ok = await resetPassword({
      mobileNumber,
      verificationToken,
      password,
      confirmPassword,
    });
    if (ok) {
      setResetComplete(true);
    }
  };

  return (
    <AuthCard>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: `${DASHBOARD_UX.internalGap + 4}px` }}>
        <AuthHero
          icon={KeyRound}
          eyebrow={t('auth.forgotPassword.eyebrow')}
          heading={t('auth.forgotPassword.newPasswordHeading')}
          subheading={t('auth.forgotPassword.newPasswordSubheading')}
        />
        {error ? <AuthErrorBanner message={error} /> : null}
        <PasswordInput
          label={t('auth.register.passwordLabel')}
          value={password}
          onChange={setPassword}
          disabled={isLoading}
          placeholder={t('auth.register.passwordPlaceholder')}
        />
        <PasswordInput
          label={t('auth.register.confirmPasswordLabel')}
          value={confirmPassword}
          onChange={setConfirmPassword}
          disabled={isLoading}
          placeholder={t('auth.register.confirmPasswordPlaceholder')}
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
          {isLoading ? t('common.pleaseWait') : t('auth.forgotPassword.newPasswordHeading')}
        </Button>
        <Link component={RouterLink} to={ROUTES.login} underline="hover">
          {t('auth.forgotPassword.backToSignIn')}
        </Link>
      </Box>
    </AuthCard>
  );
}
