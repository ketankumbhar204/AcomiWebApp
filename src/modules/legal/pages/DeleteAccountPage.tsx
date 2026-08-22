import { Box, Button, Checkbox, CircularProgress, FormControlLabel, Link, Typography, useTheme } from '@mui/material';
import { Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink } from 'react-router-dom';
import { ApiError } from '@/shared/api/errors';
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
import { validatePassword } from '@/modules/auth/passwordRules';

type Step = 'form' | 'done';

export function DeleteAccountPage() {
  const { t } = useTranslation();
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);

  const [step, setStep] = useState<Step>('form');
  const [mobileNumber, setMobileNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    document.title = `${t('legal.deleteAccount.title')} · ${t('common.appName')}`;
  }, [t]);

  const canDelete =
    isValidIndianMobile(mobileNumber) &&
    validatePassword(password) == null &&
    confirmed &&
    !deleting;

  const mapError = (err: unknown): string => {
    if (err instanceof ApiError) {
      if (err.isNetworkError || err.status === 0) {
        return t('common.errors.network');
      }
      if (err.status === 401) {
        return t('common.errors.invalidCredentials');
      }
      if (err.status >= 500) {
        return t('common.errors.server');
      }
      return err.message || t('common.errors.generic');
    }
    return t('common.errors.generic');
  };

  const handleDelete = async () => {
    if (!canDelete) {
      return;
    }
    setError(null);
    setDeleting(true);
    try {
      await authApi.deleteAccountByPassword({
        mobileNumber: normalizeIndianMobileDigits(mobileNumber),
        password,
      });
      setStep('done');
    } catch (err) {
      setError(mapError(err));
    } finally {
      setDeleting(false);
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

        {error ? <AuthErrorBanner message={error} /> : null}

        {step !== 'done' ? (
          <>
            <Typography sx={{ ...DASHBOARD_UX.sectionSubtitle, color: s.textMuted }}>
              {t('legal.deleteAccount.whatIsDeleted')}
            </Typography>
            <Typography sx={{ ...DASHBOARD_UX.sectionSubtitle, color: s.textMuted }}>
              {t('legal.deleteAccount.whatIsRetained')}
            </Typography>
          </>
        ) : null}

        {step === 'form' ? (
          <>
            <MobileNumberInput
              value={mobileNumber}
              onChange={(value) => {
                setMobileNumber(value);
                if (error) setError(null);
              }}
              disabled={deleting}
              autoFocus
            />
            <PasswordInput
              label={t('auth.login.passwordLabel')}
              value={password}
              onChange={(value) => {
                setPassword(value);
                if (error) setError(null);
              }}
              disabled={deleting}
              placeholder={t('auth.login.passwordPlaceholder')}
              onSubmit={() => {
                if (canDelete) {
                  void handleDelete();
                }
              }}
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={confirmed}
                  onChange={(event) => setConfirmed(event.target.checked)}
                  disabled={deleting}
                />
              }
              label={t('legal.deleteAccount.confirmLabel')}
            />
            <Button
              variant="contained"
              color="error"
              disabled={!canDelete}
              fullWidth
              onClick={() => void handleDelete()}
              startIcon={deleting ? <CircularProgress size={16} color="inherit" /> : undefined}
              sx={dashContainedButtonSx}
            >
              {deleting ? t('common.pleaseWait') : t('legal.deleteAccount.submit')}
            </Button>
          </>
        ) : null}

        {step === 'done' ? (
          <Typography sx={{ ...DASHBOARD_UX.sectionSubtitle, color: s.textMuted }}>
            {t('legal.deleteAccount.success')}
          </Typography>
        ) : null}

        <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
          <Link component={RouterLink} to={ROUTES.privacy} underline="hover">
            {t('legal.privacy.linkLabel')}
          </Link>
          <Link component={RouterLink} to={ROUTES.login} underline="hover">
            {t('legal.deleteAccount.backToSignIn')}
          </Link>
        </Box>
      </Box>
    </AuthCard>
  );
}
