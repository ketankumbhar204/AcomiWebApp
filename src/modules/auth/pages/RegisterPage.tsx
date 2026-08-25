import { Box, Button, CircularProgress, Link, Typography, useTheme } from '@mui/material';
import { zodResolver } from '@hookform/resolvers/zod';
import { UserRound } from 'lucide-react';
import { useMemo } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { ROUTES } from '@/routes/paths';
import { isValidIndianMobile } from '@/shared/utils/indianMobile';
import { AUTH_UX, authContainedButtonSx, authSurfaces } from '../theme/authUx';
import { AuthCard } from '../components/AuthCard';
import { AuthErrorBanner } from '../components/AuthErrorBanner';
import { AuthHero } from '../components/AuthHero';
import { MobileNumberInput } from '../components/MobileNumberInput';
import { NameInput } from '../components/NameInput';
import { PasswordInput } from '../components/PasswordInput';
import { useSendOtp } from '../hooks/useSendOtp';
import { passwordsMatch, validatePassword } from '../passwordRules';
import { createRegisterSchema, type RegisterFormValues } from '../schemas/loginSchema';
import { useRegistrationDraftStore } from '@/store/registrationDraftStore';

export function RegisterPage() {
  const { t } = useTranslation();
  const theme = useTheme();
  const a = authSurfaces(theme.palette.mode);
  const navigate = useNavigate();
  const { sendOtp, isLoading, error, clearError } = useSendOtp();
  const setCredentials = useRegistrationDraftStore((state) => state.setCredentials);

  const schema = useMemo(
    () =>
      createRegisterSchema({
        nameRequired: t('auth.register.nameRequired'),
        mobileRequired: t('auth.login.mobileRequired'),
        mobileInvalid: t('auth.login.mobileInvalid'),
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
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      fullName: '',
      mobileNumber: '',
      password: '',
      confirmPassword: '',
    },
    mode: 'onSubmit',
  });

  const fullName = useWatch({ control, name: 'fullName' }) ?? '';
  const mobileNumber = useWatch({ control, name: 'mobileNumber' }) ?? '';
  const password = useWatch({ control, name: 'password' }) ?? '';
  const confirmPassword = useWatch({ control, name: 'confirmPassword' }) ?? '';
  const canSubmit =
    fullName.trim().length > 0 &&
    isValidIndianMobile(mobileNumber) &&
    validatePassword(password) == null &&
    passwordsMatch(password, confirmPassword) &&
    !isLoading;

  const onSubmit = handleSubmit(async (values) => {
    clearError();
    setCredentials({
      fullName: values.fullName.trim(),
      password: values.password,
      confirmPassword: values.confirmPassword,
    });
    const result = await sendOtp(values.mobileNumber, 'REGISTER');
    if (result) {
      navigate(ROUTES.registerOtp, { state: { mobileNumber: values.mobileNumber } });
    }
  });

  return (
    <AuthCard>
      <Box
        component="form"
        onSubmit={onSubmit}
        noValidate
        sx={{ display: 'flex', flexDirection: 'column', gap: 1.75 }}
      >
        <AuthHero
          icon={UserRound}
          eyebrow={t('auth.register.eyebrow')}
          heading={t('auth.register.heading')}
          subheading={t('auth.register.subheading')}
        />

        {error ? <AuthErrorBanner message={error} /> : null}

        <Controller
          name="fullName"
          control={control}
          render={({ field }) => (
            <NameInput
              label={t('auth.register.nameLabel')}
              value={field.value}
              onChange={(value) => {
                field.onChange(value);
                if (error) {
                  clearError();
                }
              }}
              onBlur={field.onBlur}
              error={errors.fullName?.message}
              disabled={isLoading}
              placeholder={t('auth.register.namePlaceholder')}
            />
          )}
        />

        <Controller
          name="mobileNumber"
          control={control}
          render={({ field }) => (
            <MobileNumberInput
              value={field.value}
              onChange={(value) => {
                field.onChange(value);
                if (error) {
                  clearError();
                }
              }}
              onBlur={field.onBlur}
              error={errors.mobileNumber?.message}
              disabled={isLoading}
            />
          )}
        />

        <Controller
          name="password"
          control={control}
          render={({ field }) => (
            <PasswordInput
              label={t('auth.register.passwordLabel')}
              value={field.value}
              onChange={(value) => {
                field.onChange(value);
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
          disableElevation
          disabled={!canSubmit}
          fullWidth
          startIcon={isLoading ? <CircularProgress size={16} color="inherit" /> : undefined}
          sx={{
            mt: 0.5,
            ...authContainedButtonSx(a.cta, a.ctaHover),
          }}
        >
          {isLoading ? t('common.pleaseWait') : t('auth.register.submit')}
        </Button>

        <Typography sx={{ ...AUTH_UX.helper, color: a.textMuted, textAlign: 'center' }}>
          {t('auth.register.loginPrompt')}{' '}
          <Link
            component={RouterLink}
            to={ROUTES.login}
            underline="hover"
            sx={{ ...AUTH_UX.label, color: a.brand }}
          >
            {t('auth.register.loginLink')}
          </Link>
        </Typography>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
          <Link
            component={RouterLink}
            to={ROUTES.privacy}
            underline="hover"
            sx={{ ...AUTH_UX.helper, color: a.brand }}
          >
            {t('legal.privacy.linkLabel')}
          </Link>
          <Link
            component={RouterLink}
            to={ROUTES.deleteAccount}
            underline="hover"
            sx={{ ...AUTH_UX.helper, color: a.brand }}
          >
            {t('legal.deleteAccount.linkLabel')}
          </Link>
        </Box>
      </Box>
    </AuthCard>
  );
}
