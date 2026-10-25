import {
  Box,
  Button,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { Copy, Eye, EyeOff, RefreshCw } from 'lucide-react';
import { useSnackbar } from 'notistack';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { adminApi } from '@/modules/admin/api/adminApi';
import { canCopyPassword, generateStrongPassword } from '@/modules/admin/utils/generatePassword';
import { confirmPasswordError, newPasswordError } from '@/modules/auth/passwordMessages';
import { useAuthStore } from '@/store/authStore';
import { getErrorMessage } from '@/shared/api/errors';
import { ConfirmDialog } from '@/shared/components/ConfirmDialog';
import { colors } from '@/shared/theme/colors';
import { maskIndianMobile } from '@/shared/utils/indianMobile';

type AdminResetPasswordPanelProps = {
  userId: string;
  displayName: string;
  mobileNumber: string;
};

function clearSecret(setter: (value: string) => void) {
  setter('');
}

export function AdminResetPasswordPanel({
  userId,
  displayName,
  mobileNumber,
}: AdminResetPasswordPanelProps) {
  const { t } = useTranslation();
  const { enqueueSnackbar } = useSnackbar();
  const currentUserId = useAuthStore((state) => state.user?.id);
  const isSelf = currentUserId != null && currentUserId === userId;
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [generatedPending, setGeneratedPending] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    return () => {
      clearSecret(setPassword);
      clearSecret(setConfirmPassword);
    };
  }, [userId]);

  function applyGenerated(next: string) {
    setPassword(next);
    setConfirmPassword(next);
    setShowPassword(false);
    setShowConfirm(false);
    setPasswordError(null);
    setConfirmError(null);
    setGeneratedPending(true);
  }

  function handlePasswordChange(value: string) {
    setPassword(value);
    setGeneratedPending(false);
    if (passwordError) {
      setPasswordError(newPasswordError(t, value));
    }
    if (confirmError || confirmPassword.length > 0) {
      setConfirmError(confirmPasswordError(t, value, confirmPassword));
    }
  }

  function handlePasswordBlur() {
    setPasswordError(newPasswordError(t, password));
    if (confirmPassword) {
      setConfirmError(confirmPasswordError(t, password, confirmPassword));
    }
  }

  function handleConfirmChange(value: string) {
    setConfirmPassword(value);
    if (confirmError || value.length > 0) {
      setConfirmError(confirmPasswordError(t, password, value));
    }
  }

  function handleConfirmBlur() {
    setConfirmError(confirmPasswordError(t, password, confirmPassword));
  }

  function handleGenerate() {
    try {
      applyGenerated(generateStrongPassword());
    } catch {
      enqueueSnackbar(t('admin.users.detail.reset.generateFailed'), { variant: 'error' });
    }
  }

  async function handleCopy() {
    if (!canCopyPassword(password) || saving) {
      return;
    }
    try {
      if (!navigator.clipboard?.writeText) {
        throw new Error('Clipboard unavailable');
      }
      await navigator.clipboard.writeText(password);
      enqueueSnackbar(t('admin.users.detail.reset.passwordCopied'), { variant: 'success' });
    } catch {
      enqueueSnackbar(t('admin.users.detail.reset.passwordCopyFailed'), { variant: 'error' });
    }
  }

  function requestReset() {
    if (saving || isSelf) {
      return;
    }
    const nextPasswordError = newPasswordError(t, password);
    const nextConfirmError = confirmPasswordError(t, password, confirmPassword);
    setPasswordError(nextPasswordError);
    setConfirmError(nextConfirmError);
    if (nextPasswordError || nextConfirmError) {
      return;
    }
    setConfirmOpen(true);
  }

  async function confirmReset() {
    if (saving || isSelf) {
      return;
    }
    const nextPasswordError = newPasswordError(t, password);
    const nextConfirmError = confirmPasswordError(t, password, confirmPassword);
    setPasswordError(nextPasswordError);
    setConfirmError(nextConfirmError);
    if (nextPasswordError || nextConfirmError) {
      setConfirmOpen(false);
      return;
    }
    setSaving(true);
    try {
      await adminApi.resetRegisteredUserPassword(userId, { password, confirmPassword });
      clearSecret(setPassword);
      clearSecret(setConfirmPassword);
      setShowPassword(false);
      setShowConfirm(false);
      setGeneratedPending(false);
      setPasswordError(null);
      setConfirmError(null);
      setConfirmOpen(false);
      enqueueSnackbar(t('admin.users.detail.reset.success'), { variant: 'success' });
    } catch (err) {
      enqueueSnackbar(getErrorMessage(err, t('admin.users.detail.reset.failed')), {
        variant: 'error',
      });
    } finally {
      setSaving(false);
    }
  }

  const copyDisabled = saving || !canCopyPassword(password);

  return (
    <Box
      sx={{
        mt: 3,
        p: { xs: 2, md: 2.5 },
        borderRadius: '12px',
        bgcolor: colors.white,
        border: `1px solid ${colors.border}`,
      }}>
      <Typography sx={{ fontWeight: 800, fontSize: 16, color: colors.textPrimary }}>
        {displayName}
      </Typography>
      <Typography sx={{ fontSize: 13, color: colors.textSecondary, mt: 0.25, mb: 2 }}>
        {maskIndianMobile(mobileNumber)}
      </Typography>

      <Typography sx={{ fontWeight: 800, fontSize: 18 }}>{t('admin.users.detail.reset.title')}</Typography>
      <Typography sx={{ color: 'text.secondary', mt: 0.5, mb: 2 }}>
        {isSelf ? t('admin.users.detail.reset.self') : t('admin.users.detail.reset.hint')}
      </Typography>

      {isSelf ? null : (
        <Stack spacing={1.75}>
          <TextField
            type={showPassword ? 'text' : 'password'}
            label={t('admin.users.detail.reset.newPassword')}
            value={password}
            onChange={(event) => handlePasswordChange(event.target.value)}
            onBlur={handlePasswordBlur}
            error={Boolean(passwordError)}
            helperText={
              passwordError ||
              `${t('auth.register.passwordTooShort')} ${t('auth.register.passwordTooLong')}`
            }
            fullWidth
            disabled={saving}
            autoComplete="new-password"
            spellCheck={false}
            slotProps={{
              htmlInput: {
                autoCapitalize: 'none',
                autoCorrect: 'off',
                'aria-label': t('admin.users.detail.reset.newPassword'),
              },
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      type="button"
                      edge="end"
                      aria-label={
                        showPassword ? t('auth.password.hide') : t('auth.password.show')
                      }
                      onClick={() => setShowPassword((current) => !current)}
                      disabled={saving}>
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
          />
          <TextField
            type={showConfirm ? 'text' : 'password'}
            label={t('admin.users.detail.reset.confirmPassword')}
            value={confirmPassword}
            onChange={(event) => handleConfirmChange(event.target.value)}
            onBlur={handleConfirmBlur}
            error={Boolean(confirmError)}
            helperText={confirmError || ' '}
            fullWidth
            disabled={saving}
            autoComplete="new-password"
            spellCheck={false}
            slotProps={{
              htmlInput: {
                autoCapitalize: 'none',
                autoCorrect: 'off',
                'aria-label': t('admin.users.detail.reset.confirmPassword'),
              },
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      type="button"
                      edge="end"
                      aria-label={showConfirm ? t('auth.password.hide') : t('auth.password.show')}
                      onClick={() => setShowConfirm((current) => !current)}
                      disabled={saving}>
                      {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
          />
          {generatedPending ? (
            <Typography role="status" sx={{ fontSize: 13, color: colors.warning, fontWeight: 700 }}>
              {t('admin.users.detail.reset.generatedNotApplied')}
            </Typography>
          ) : null}
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
            <Button
              type="button"
              startIcon={<RefreshCw size={16} />}
              onClick={handleGenerate}
              disabled={saving}
              aria-label={t('admin.users.detail.reset.generate')}
              sx={secondaryButtonSx}>
              {t('admin.users.detail.reset.generate')}
            </Button>
            <Button
              type="button"
              startIcon={<Copy size={16} />}
              onClick={() => void handleCopy()}
              disabled={copyDisabled}
              aria-label={t('admin.users.detail.reset.copy')}
              sx={secondaryButtonSx}>
              {t('admin.users.detail.reset.copy')}
            </Button>
          </Stack>
          <Button
            type="button"
            variant="contained"
            onClick={requestReset}
            disabled={saving}
            aria-label={t('admin.users.detail.reset.submit')}
            sx={primaryButtonSx}>
            {saving ? t('admin.common.saving') : t('admin.users.detail.reset.submit')}
          </Button>
        </Stack>
      )}

      <ConfirmDialog
        open={confirmOpen}
        title={t('admin.users.detail.reset.confirmTitle')}
        description={t('admin.users.detail.reset.confirmBody', {
          name: displayName,
          mobile: maskIndianMobile(mobileNumber),
        })}
        confirmLabel={t('admin.users.detail.reset.submit')}
        confirmingLabel={t('admin.common.saving')}
        confirming={saving}
        onConfirm={() => void confirmReset()}
        onClose={() => {
          if (!saving) setConfirmOpen(false);
        }}
      />
    </Box>
  );
}

const secondaryButtonSx = {
  textTransform: 'none',
  fontWeight: 700,
  borderRadius: '10px',
  minHeight: 44,
  px: 2,
  border: `1px solid ${colors.border}`,
  color: colors.tealDark,
  bgcolor: colors.lightGreen,
  '&:hover': { bgcolor: colors.mintSubtle, borderColor: colors.primary },
} as const;

const primaryButtonSx = {
  textTransform: 'none',
  fontWeight: 700,
  borderRadius: '10px',
  minHeight: 48,
  px: 2.5,
  bgcolor: colors.primary,
  color: colors.white,
  '&:hover': { bgcolor: colors.primaryHover },
  '&.Mui-disabled': { bgcolor: colors.primary, color: colors.white, opacity: 0.5 },
} as const;
