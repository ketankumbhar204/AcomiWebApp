import { Box, Button, CircularProgress, Typography, useTheme } from '@mui/material';
import { zodResolver } from '@hookform/resolvers/zod';
import { LogIn } from 'lucide-react';
import { useMemo } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/routes/paths';
import { isValidIndianMobile } from '@/shared/utils/indianMobile';
import { DASHBOARD_UX, dashSurfaces } from '@/modules/dashboard/theme/dashboardUx';
import { AuthCard } from '../components/AuthCard';
import { AuthErrorBanner } from '../components/AuthErrorBanner';
import { AuthHero } from '../components/AuthHero';
import { MobileNumberInput } from '../components/MobileNumberInput';
import { useSendOtp } from '../hooks/useSendOtp';
import { createLoginSchema, type LoginFormValues } from '../schemas/loginSchema';

export function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);
  const { sendOtp, isLoading, error, clearError } = useSendOtp();

  const schema = useMemo(
    () =>
      createLoginSchema({
        required: t('auth.login.mobileRequired'),
        invalid: t('auth.login.mobileInvalid'),
      }),
    [t],
  );

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { mobileNumber: '' },
    mode: 'onSubmit',
  });

  const mobileNumber = useWatch({ control, name: 'mobileNumber' }) ?? '';
  const canSubmit = isValidIndianMobile(mobileNumber) && !isLoading;

  const onSubmit = handleSubmit(async (values) => {
    clearError();
    const success = await sendOtp(values.mobileNumber);
    if (success) {
      navigate(ROUTES.otp, { state: { mobileNumber: values.mobileNumber } });
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
          icon={LogIn}
          eyebrow={t('auth.login.eyebrow')}
          heading={t('auth.login.heading')}
          subheading={t('auth.login.subheading')}
        />

        {error ? <AuthErrorBanner message={error} /> : null}

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
              autoFocus
              onSubmit={() => void onSubmit()}
            />
          )}
        />

        <Typography sx={{ ...DASHBOARD_UX.sectionSubtitle, color: s.textMuted, textAlign: 'center' }}>
          {t('auth.login.disclaimer')}
        </Typography>

        <Button
          type="submit"
          variant="contained"
          color="primary"
          disabled={!canSubmit}
          fullWidth
          startIcon={isLoading ? <CircularProgress size={16} color="inherit" /> : undefined}
          sx={{
            mt: 0.5,
            minHeight: 40,
            borderRadius: `${DASHBOARD_UX.buttonRadius}px`,
            fontSize: DASHBOARD_UX.button.fontSize,
            fontWeight: DASHBOARD_UX.button.fontWeight,
            textTransform: 'none',
            boxShadow: 'none',
            '&:hover': { boxShadow: s.shadowHover },
          }}
        >
          {isLoading ? t('common.pleaseWait') : t('auth.login.sendOtp')}
        </Button>
      </Box>
    </AuthCard>
  );
}
