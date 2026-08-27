import { Alert, Box, Button, CircularProgress, Link, Typography, useTheme } from '@mui/material';
import { zodResolver } from '@hookform/resolvers/zod';
import { LogIn } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import { ROUTES } from '@/routes/paths';
import { isValidIndianMobile } from '@/shared/utils/indianMobile';
import { DASHBOARD_UX, dashSurfaces } from '@/modules/dashboard/theme/dashboardUx';
import { dashContainedButtonSx } from '@/shared/theme/dashButtonSx';
import { AuthCard } from '../components/AuthCard';
import { AuthErrorBanner } from '../components/AuthErrorBanner';
import { AuthHero } from '../components/AuthHero';
import { MobileNumberInput } from '../components/MobileNumberInput';
import { PasswordInput } from '../components/PasswordInput';
import { useLogin } from '../hooks/usePasswordAuth';
import { useOtpCooldown } from '../hooks/useOtpCooldown';
import { useSendOtp } from '../hooks/useSendOtp';
import { createLoginSchema, type LoginFormValues } from '../schemas/loginSchema';
import { validatePassword } from '../passwordRules';
import { formatCountdown } from '../utils/otpAuthErrors';

export function LoginPage() {
  const { t } = useTranslation();
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);
  const navigate = useNavigate();
  const location = useLocation();
  const accountDeleted = Boolean(
    (location.state as { accountDeleted?: boolean } | null)?.accountDeleted,
  );
  const { login, isLoading, error, clearError } = useLogin();
  const { sendOtp, isLoading: isSendingOtp, error: otpError, clearError: clearOtpError } = useSendOtp();

  const schema = useMemo(
    () =>
      createLoginSchema({
        mobileRequired: t('auth.login.mobileRequired'),
        mobileInvalid: t('auth.login.mobileInvalid'),
        passwordRequired: t('auth.login.passwordRequired'),
        passwordTooShort: t('auth.login.passwordTooShort'),
        passwordTooLong: t('auth.login.passwordTooLong'),
      }),
    [t],
  );

  const {
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { mobileNumber: '', password: '' },
    mode: 'onSubmit',
  });

  const [authMethod, setAuthMethod] = useState<'password' | 'otp'>('password');
  const mobileNumber = useWatch({ control, name: 'mobileNumber' }) ?? '';
  const password = useWatch({ control, name: 'password' }) ?? '';
  const otpCooldown = useOtpCooldown(mobileNumber, 'LOGIN');
  const busy = isLoading || isSendingOtp;
  const bannerError = error || otpError;
  const canSubmitPassword =
    isValidIndianMobile(mobileNumber) && validatePassword(password) == null && !busy;
  const canSendOtp = isValidIndianMobile(mobileNumber) && !busy && otpCooldown === 0;

  const submitPassword = handleSubmit(async (values) => {
    clearError();
    clearOtpError();
    await login(values.mobileNumber, values.password);
  });

  const submitOtp = async () => {
    clearError();
    clearOtpError();
    if (!isValidIndianMobile(mobileNumber)) {
      setError('mobileNumber', {
        type: 'manual',
        message: mobileNumber.trim()
          ? t('auth.login.mobileInvalid')
          : t('auth.login.mobileRequired'),
      });
      return;
    }
    const result = await sendOtp(mobileNumber, 'LOGIN');
    if (result) {
      navigate(ROUTES.loginOtp, { state: { mobileNumber, purpose: 'LOGIN' } });
    }
  };

  return (
    <AuthCard>
      <Box
        component="form"
        onSubmit={(event) => {
          event.preventDefault();
          if (authMethod === 'otp') {
            void submitOtp();
            return;
          }
          void submitPassword();
        }}
        noValidate
        sx={{ display: 'flex', flexDirection: 'column', gap: `${DASHBOARD_UX.internalGap + 4}px` }}
      >
        <AuthHero
          icon={LogIn}
          eyebrow={t('auth.login.eyebrow')}
          heading={t('auth.login.heading')}
          subheading={t('auth.login.subheading')}
        />

        {bannerError ? <AuthErrorBanner message={bannerError} /> : null}
        {!bannerError && accountDeleted ? (
          <Alert
            severity="success"
            sx={{
              borderRadius: `${DASHBOARD_UX.tileRadius}px`,
              ...DASHBOARD_UX.body,
            }}
          >
            {t('legal.deleteAccount.deletedSuccessfully')}
          </Alert>
        ) : null}

        <Controller
          name="mobileNumber"
          control={control}
          render={({ field }) => (
            <MobileNumberInput
              value={field.value}
              onChange={(value) => {
                field.onChange(value);
                if (bannerError) {
                  clearError();
                  clearOtpError();
                }
              }}
              onBlur={field.onBlur}
              error={errors.mobileNumber?.message}
              disabled={busy}
              autoFocus
            />
          )}
        />

        {authMethod === 'password' ? (
          <Controller
            name="password"
            control={control}
            render={({ field }) => (
              <PasswordInput
                label={t('auth.login.passwordLabel')}
                value={field.value}
                onChange={(value) => {
                  field.onChange(value);
                  if (error) {
                    clearError();
                  }
                }}
                onBlur={field.onBlur}
                error={errors.password?.message}
                disabled={busy}
                placeholder={t('auth.login.passwordPlaceholder')}
                onSubmit={() => void submitPassword()}
              />
            )}
          />
        ) : null}

        <Button
          type="submit"
          variant="contained"
          color="primary"
          disabled={authMethod === 'otp' ? !canSendOtp : !canSubmitPassword}
          fullWidth
          startIcon={
            (authMethod === 'otp' ? isSendingOtp : isLoading) ? (
              <CircularProgress size={16} color="inherit" />
            ) : undefined
          }
          sx={{
            mt: 0.5,
            ...dashContainedButtonSx,
            '&:hover': { boxShadow: s.shadowHover },
          }}
        >
          {authMethod === 'otp'
            ? isSendingOtp
              ? t('common.pleaseWait')
              : otpCooldown > 0
                ? t('auth.otp.sendOtpIn', { time: formatCountdown(otpCooldown) })
                : t('auth.login.sendOtp')
            : isLoading
              ? t('common.pleaseWait')
              : t('auth.login.submit')}
        </Button>

        {authMethod === 'password' ? (
          <Typography sx={{ ...DASHBOARD_UX.sectionSubtitle, color: s.textMuted, textAlign: 'center' }}>
            <Link component={RouterLink} to={ROUTES.forgotPassword} underline="hover">
              {t('auth.login.forgotPassword')}
            </Link>
          </Typography>
        ) : null}

        <Typography sx={{ ...DASHBOARD_UX.smallCaption, color: s.textMuted, textAlign: 'center' }}>
          <Link
            component="button"
            type="button"
            underline="hover"
            disabled={busy}
            onClick={() => {
              clearError();
              clearOtpError();
              setAuthMethod((current) => (current === 'otp' ? 'password' : 'otp'));
            }}
            sx={{
              ...DASHBOARD_UX.smallCaption,
              color: s.textSecondary,
              background: 'none',
              border: 0,
              p: 0,
              cursor: busy ? 'default' : 'pointer',
            }}
          >
            {authMethod === 'otp' ? t('auth.login.modePassword') : t('auth.login.otpInstead')}
          </Link>
        </Typography>

        <Typography sx={{ ...DASHBOARD_UX.sectionSubtitle, color: s.textMuted, textAlign: 'center' }}>
          {t('auth.login.registerPrompt')}{' '}
          <Link component={RouterLink} to={ROUTES.register} underline="hover">
            {t('auth.login.registerLink')}
          </Link>
        </Typography>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
          <Link component={RouterLink} to={ROUTES.privacy} underline="hover">
            {t('legal.privacy.linkLabel')}
          </Link>
          <Link component={RouterLink} to={ROUTES.deleteAccount} underline="hover">
            {t('legal.deleteAccount.linkLabel')}
          </Link>
        </Box>
      </Box>
    </AuthCard>
  );
}
