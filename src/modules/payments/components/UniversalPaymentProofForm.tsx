import {
  Box,
  Button,
  Chip,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
  useTheme,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { DASHBOARD_UX, dashSurfaces } from '@/modules/dashboard/theme/dashboardUx';
import { dashOutlinedButtonSx } from '@/shared/theme/dashButtonSx';
import type { UniversalPaymentMethod } from '@/shared/types/payments';
import {
  EMPTY_PAYMENT_PROOF,
  UNIVERSAL_PAYMENT_METHODS,
  type PaymentProofSubmission,
} from '../utils/paymentProofPolicy';

export type UniversalPaymentProofFormProps = {
  value: PaymentProofSubmission;
  onChange: (next: PaymentProofSubmission) => void;
  disabled?: boolean;
  showHint?: boolean;
  /** Prefer chips (mobile parity) vs select dropdown */
  methodVariant?: 'chips' | 'select';
};

function revokePreview(url: string | undefined) {
  if (url?.startsWith('blob:')) {
    URL.revokeObjectURL(url);
  }
}

export function UniversalPaymentProofForm({
  value,
  onChange,
  disabled = false,
  showHint = true,
  methodVariant = 'chips',
}: UniversalPaymentProofFormProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);
  const payload = { ...EMPTY_PAYMENT_PROOF, ...value };
  const method = payload.paymentMethod ?? 'UPI';
  const hasProof = Boolean(
    payload.localFile || payload.proofFileId?.trim() || payload.proofImageBase64?.trim(),
  );
  const previewSrc = payload.previewUrl
    ? payload.previewUrl
    : payload.proofImageBase64?.trim()
      ? `data:image/jpeg;base64,${payload.proofImageBase64}`
      : null;

  const patch = (partial: Partial<PaymentProofSubmission>) => {
    onChange({ ...payload, ...partial });
  };

  const clearProof = () => {
    revokePreview(payload.previewUrl);
    patch({
      proofImageBase64: undefined,
      proofFileId: undefined,
      localFile: undefined,
      previewUrl: undefined,
    });
  };

  const onFile = (file: File | null) => {
    if (!file) {
      clearProof();
      return;
    }
    revokePreview(payload.previewUrl);
    patch({
      localFile: file,
      previewUrl: URL.createObjectURL(file),
      proofImageBase64: undefined,
      proofFileId: undefined,
    });
  };

  return (
    <Stack spacing={2}>
      {showHint ? (
        <Typography sx={{ ...DASHBOARD_UX.smallCaption, color: s.textSecondary }}>
          {t('paymentCollection.proof.hint')}
        </Typography>
      ) : null}

      {previewSrc ? (
        <Box
          component="img"
          src={previewSrc}
          alt={t('paymentCollection.proof.selected')}
          sx={{
            width: '100%',
            maxHeight: 180,
            objectFit: 'contain',
            borderRadius: 1.5,
            border: `1px solid ${s.border}`,
            bgcolor: s.elevated,
          }}
        />
      ) : null}

      <Button
        variant="outlined"
        component="label"
        disabled={disabled}
        sx={dashOutlinedButtonSx}
      >
        {hasProof
          ? t('paymentCollection.proof.changeScreenshot')
          : t('paymentCollection.proof.uploadScreenshot')}
        <input
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0] ?? null;
            e.target.value = '';
            if (hasProof && !file) {
              clearProof();
              return;
            }
            onFile(file);
          }}
        />
      </Button>
      {hasProof ? (
        <Button
          size="small"
          disabled={disabled}
          onClick={clearProof}
          sx={{ alignSelf: 'flex-start', ...dashOutlinedButtonSx }}
        >
          {t('meals.customerPlans.removeScreenshot', { defaultValue: 'Remove screenshot' })}
        </Button>
      ) : (
        <Typography sx={{ ...DASHBOARD_UX.smallCaption, color: s.textMuted }}>
          {t('paymentCollection.proof.uploadOptional')}
        </Typography>
      )}

      {methodVariant === 'select' ? (
        <FormControl fullWidth size="small" disabled={disabled}>
          <InputLabel>{t('paymentCollection.proof.paymentMethod')}</InputLabel>
          <Select
            label={t('paymentCollection.proof.paymentMethod')}
            value={method}
            onChange={(e) =>
              patch({ paymentMethod: e.target.value as UniversalPaymentMethod })
            }
          >
            {UNIVERSAL_PAYMENT_METHODS.map((m) => (
              <MenuItem key={m} value={m}>
                {t(`paymentCollection.method.${m}`)}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      ) : (
        <Box>
          <Typography
            sx={{ ...DASHBOARD_UX.smallCaption, color: s.textSecondary, mb: 1 }}
          >
            {t('paymentCollection.proof.paymentMethod')}
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {UNIVERSAL_PAYMENT_METHODS.map((m) => {
              const selected = method === m;
              return (
                <Chip
                  key={m}
                  label={t(`paymentCollection.method.${m}`)}
                  clickable={!disabled}
                  color={selected ? 'primary' : 'default'}
                  variant={selected ? 'filled' : 'outlined'}
                  onClick={() => {
                    if (!disabled) patch({ paymentMethod: m });
                  }}
                  sx={{ fontWeight: selected ? 700 : 500 }}
                />
              );
            })}
          </Box>
        </Box>
      )}

      <TextField
        label={t('paymentCollection.fields.reference')}
        value={payload.referenceNumber ?? ''}
        onChange={(e) => patch({ referenceNumber: e.target.value })}
        placeholder={t('paymentCollection.proof.utrPlaceholder')}
        fullWidth
        size="small"
        disabled={disabled}
      />

      <TextField
        label={t('paymentCollection.proof.remarksLabel')}
        value={payload.remarks ?? ''}
        onChange={(e) => patch({ remarks: e.target.value })}
        placeholder={t('paymentCollection.proof.remarksPlaceholder')}
        helperText={t('paymentCollection.proof.remarksHelper')}
        fullWidth
        multiline
        minRows={2}
        size="small"
        disabled={disabled}
      />
    </Stack>
  );
}
