import { Box, Button, CircularProgress, Link, useTheme } from '@mui/material';
import { zodResolver } from '@hookform/resolvers/zod';
import { KeyRound } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
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
import {
  createResetPasswordSchema,
  type ResetPasswordFormValues,
} from '../schemas/loginSchema';

export function ResetPasswordPage() {
  const { t } = useTranslation();
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);
  const { resetPassword, isLoading, error, clearError } = useResetPassword();
  const mobileNumber = useRegistrationDraftStore((state) => state.mobileNumber);
  const verificationToken = useRegistrationDraftStore((state) => state.verificationToken);
  const tokenExpiresAt = useRegistrationDraftStore((state) => state.verificationTokenExpiresAt);
  const [resetComplete, setResetComplete] = useState(false);

  const schema = useMemo(
    () =>
      createResetPasswordSchema({
        passwordRequired: t('auth.register.passwordRequired'),
        passwordTooShort: t('auth.register.passwordTooShort'),
        passwordTooLong: t('auth.register.passwordTooLong'),
        confirmRequired: t('auth.register.confirmPasswordRequired'),
        passwordMismatch: t('auth.register.passwordMismatch'),
      }),
    [t],
  );

  const {
    control,
    handleSubmit,
    trigger,
    getValues,
    formState: { errors },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
    mode: 'onTouched',
    reValidateMode: 'onChange',
  });

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

  const onSubmit = handleSubmit(async (values) => {
    if (!verificationToken) {
      return;
    }
    clearError();
    const ok = await resetPassword({
      mobileNumber,
      verificationToken,
      password: values.password,
      confirmPassword: values.confirmPassword,
    });
    if (ok) {
      setResetComplete(true);
    }
  });

  return (
    <AuthCard>
      <Box
        component="form"
        onSubmit={onSubmit}
        noValidate
        sx={{ display: 'flex', flexDirection: 'column', gap: `${DASHBOARD_UX.internalGap + 4}px` }}
      >
        <AuthHero
          icon={KeyRound}
          eyebrow={t('auth.forgotPassword.eyebrow')}
          heading={t('auth.forgotPassword.newPasswordHeading')}
          subheading={t('auth.forgotPassword.newPasswordSubheading')}
        />
        {error ? <AuthErrorBanner message={error} /> : null}
        <Controller
          name="password"
          control={control}
          render={({ field }) => (
            <PasswordInput
              label={t('auth.register.passwordLabel')}
              value={field.value}
              onChange={(value) => {
                field.onChange(value);
                if (getValues('confirmPassword')) {
                  void trigger('confirmPassword');
                }
                if (error) {
                  clearError();
                }
              }}
              onBlur={field.onBlur}
              error={errors.password?.message}
              disabled={isLoading}
              autoComplete="new-password"
              placeholder={t('auth.register.passwordPlaceholder')}
            />
          )}
        />
        <Controller
          name="confirmPassword"
          control={control}
          render={({ field }) => (
            <PasswordInput
              label={t('auth.register.confirmPasswordLabel')}
              value={field.value}
              onChange={(value) => {
                field.onChange(value);
                if (error) {
                  clearError();
                }
              }}
              onBlur={field.onBlur}
              error={errors.confirmPassword?.message}
              disabled={isLoading}
              autoComplete="new-password"
              placeholder={t('auth.register.confirmPasswordPlaceholder')}
              onSubmit={() => void onSubmit()}
            />
          )}
        />
        <Button
          type="submit"
          variant="contained"
          color="primary"
          disabled={isLoading}
          fullWidth
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
