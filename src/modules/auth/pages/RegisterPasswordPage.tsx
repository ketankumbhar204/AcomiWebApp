import { Box, Button, CircularProgress, Typography, useTheme } from '@mui/material';
import { zodResolver } from '@hookform/resolvers/zod';
import { UserRound } from 'lucide-react';
import { useEffect, useMemo } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { ROUTES } from '@/routes/paths';
import { DASHBOARD_UX, dashSurfaces } from '@/modules/dashboard/theme/dashboardUx';
import { dashContainedButtonSx } from '@/shared/theme/dashButtonSx';
import {
  isRegistrationTokenValid,
  useRegistrationDraftStore,
} from '@/store/registrationDraftStore';
import { AuthCard } from '../components/AuthCard';
import { AuthErrorBanner } from '../components/AuthErrorBanner';
import { AuthHero } from '../components/AuthHero';
import { NameInput } from '../components/NameInput';
import { PasswordInput } from '../components/PasswordInput';
import { useRegister } from '../hooks/usePasswordAuth';
import { passwordsMatch, validatePassword } from '../passwordRules';
import {
  createRegisterPasswordSchema,
  type RegisterPasswordFormValues,
} from '../schemas/loginSchema';

type PasswordLocationState = {
  mobileNumber?: string;
};

export function RegisterPasswordPage() {
  const { t } = useTranslation();
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state as PasswordLocationState | null) ?? null;
  const { register, isLoading, error, clearError } = useRegister();
  const draftMobile = useRegistrationDraftStore((draft) => draft.mobileNumber);
  const verificationToken = useRegistrationDraftStore((draft) => draft.verificationToken);
  const verificationTokenExpiresAt = useRegistrationDraftStore(
    (draft) => draft.verificationTokenExpiresAt,
  );
  const mobileNumber = draftMobile ?? state?.mobileNumber ?? '';
  const tokenValid = isRegistrationTokenValid(verificationToken, verificationTokenExpiresAt);

  const schema = useMemo(
    () =>
      createRegisterPasswordSchema({
        nameRequired: t('auth.register.nameRequired'),
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
  } = useForm<RegisterPasswordFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      fullName: '',
      password: '',
      confirmPassword: '',
    },
    mode: 'onSubmit',
  });

  const fullName = useWatch({ control, name: 'fullName' }) ?? '';
  const password = useWatch({ control, name: 'password' }) ?? '';
  const confirmPassword = useWatch({ control, name: 'confirmPassword' }) ?? '';
  const canSubmit =
    fullName.trim().length > 0 &&
    validatePassword(password) == null &&
    passwordsMatch(password, confirmPassword) &&
    tokenValid &&
    !isLoading;

  useEffect(() => {
    document.title = `${t('navigation.createPassword')} · ${t('common.appName')}`;
  }, [t]);

  if (!mobileNumber) {
    return <Navigate to={ROUTES.register} replace />;
  }

  if (!tokenValid) {
    return <Navigate to={ROUTES.registerOtp} replace state={{ mobileNumber }} />;
  }

  const onSubmit = handleSubmit(async (values) => {
    clearError();
    if (!isRegistrationTokenValid(verificationToken, verificationTokenExpiresAt)) {
      navigate(ROUTES.registerOtp, { replace: true, state: { mobileNumber } });
      return;
    }
    await register({
      fullName: values.fullName.trim(),
      mobileNumber,
      password: values.password,
      confirmPassword: values.confirmPassword,
      verificationToken: verificationToken as string,
    });
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
          icon={UserRound}
          eyebrow={t('auth.register.verifiedEyebrow')}
          heading={t('auth.register.passwordHeading')}
          subheading={t('auth.register.passwordSubheading')}
        />

        {error ? <AuthErrorBanner message={error} /> : null}

        <Typography sx={{ ...DASHBOARD_UX.body, color: s.textPrimary, fontWeight: 700 }}>
          {t('auth.register.mobileVerified')}: +91 {mobileNumber}
        </Typography>

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
          color="primary"
          disabled={!canSubmit}
          fullWidth
          startIcon={isLoading ? <CircularProgress size={16} color="inherit" /> : undefined}
          sx={{
            mt: 0.5,
            ...dashContainedButtonSx,
            '&:hover': { boxShadow: s.shadowHover },
          }}
        >
          {isLoading ? t('common.pleaseWait') : t('auth.register.submit')}
        </Button>
      </Box>
    </AuthCard>
  );
}
