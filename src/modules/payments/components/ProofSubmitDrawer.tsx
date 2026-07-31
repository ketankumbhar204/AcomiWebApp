import {
  Box,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSnackbar } from 'notistack';
import { AppDrawer } from '@/shared/components/AppDrawer';
import { StickyFooter } from '@/shared/components/StickyFooter';
import { dashContainedButtonSx, dashOutlinedButtonSx } from '@/shared/theme/dashButtonSx';
import type { UniversalPaymentMethod } from '@/shared/types/payments';
import { usePaymentMutations } from '../hooks/usePayments';

type ProofSubmitDrawerProps = {
  open: boolean;
  spaceId: string;
  paymentId: string | null;
  onClose: () => void;
};

const METHODS: UniversalPaymentMethod[] = [
  'UPI',
  'BANK_TRANSFER',
  'CASH',
  'CHEQUE',
  'OTHER',
];

export function ProofSubmitDrawer({
  open,
  spaceId,
  paymentId,
  onClose,
}: ProofSubmitDrawerProps) {
  const { t } = useTranslation();
  const { enqueueSnackbar } = useSnackbar();
  const mutations = usePaymentMutations(spaceId);
  const [referenceNumber, setReferenceNumber] = useState('');
  const [remarks, setRemarks] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<UniversalPaymentMethod>('UPI');
  const [proofImageBase64, setProofImageBase64] = useState<string | undefined>();

  const onFile = (file: File | null) => {
    if (!file) {
      setProofImageBase64(undefined);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result ?? '');
      const base64 = result.includes(',') ? result.split(',')[1] : result;
      setProofImageBase64(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!paymentId) {
      return;
    }
    try {
      await mutations.submitProof.mutateAsync({
        paymentId,
        body: {
          referenceNumber: referenceNumber.trim() || undefined,
          remarks: remarks.trim() || undefined,
          paymentMethod,
          proofImageBase64,
        },
      });
      enqueueSnackbar(t('paymentCollection.proof.success'), { variant: 'success' });
      setReferenceNumber('');
      setRemarks('');
      setProofImageBase64(undefined);
      onClose();
    } catch {
      enqueueSnackbar(t('common.errors.generic'), { variant: 'error' });
    }
  };

  return (
    <AppDrawer open={open} onClose={onClose} width={420}>
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            {t('paymentCollection.proof.submit')}
          </Typography>
        </Box>
        <Stack spacing={2} sx={{ p: 2, flex: 1, overflow: 'auto' }}>
          <FormControl fullWidth size="small">
            <InputLabel>{t('paymentCollection.fields.method')}</InputLabel>
            <Select
              label={t('paymentCollection.fields.method')}
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as UniversalPaymentMethod)}
            >
              {METHODS.map((method) => (
                <MenuItem key={method} value={method}>
                  {t(`paymentCollection.method.${method}`)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            label={t('paymentCollection.fields.reference')}
            value={referenceNumber}
            onChange={(e) => setReferenceNumber(e.target.value)}
            placeholder={t('paymentCollection.proof.utrPlaceholder')}
            fullWidth
            size="small"
          />
          <TextField
            label={t('paymentCollection.proof.remarks')}
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder={t('paymentCollection.proof.remarksPlaceholder')}
            fullWidth
            multiline
            minRows={2}
            size="small"
          />
          <Button variant="outlined" component="label" sx={dashOutlinedButtonSx}>
            {t('paymentCollection.proof.upload')}
            <input
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => onFile(e.target.files?.[0] ?? null)}
            />
          </Button>
          {proofImageBase64 ? (
            <Typography variant="caption" color="text.secondary">
              {t('paymentCollection.proof.selected')}
            </Typography>
          ) : null}
        </Stack>
        <StickyFooter>
          <Button onClick={onClose} sx={dashOutlinedButtonSx}>
            {t('common.cancel')}
          </Button>
          <Button
            variant="contained"
            disabled={mutations.submitProof.isPending || !paymentId}
            onClick={() => void handleSubmit()}
            sx={dashContainedButtonSx}
          >
            {t('common.save')}
          </Button>
        </StickyFooter>
      </Box>
    </AppDrawer>
  );
}
