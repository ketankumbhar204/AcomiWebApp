import { Box, Button, Typography, useTheme } from '@mui/material';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSnackbar } from 'notistack';
import { AppDrawer } from '@/shared/components/AppDrawer';
import { DASHBOARD_UX, dashSurfaces } from '@/modules/dashboard/theme/dashboardUx';
import { StickyFooter } from '@/shared/components/StickyFooter';
import { dashContainedButtonSx, dashOutlinedButtonSx } from '@/shared/theme/dashButtonSx';
import { UniversalPaymentProofForm } from './UniversalPaymentProofForm';
import { usePaymentMutations } from '../hooks/usePayments';
import {
  EMPTY_PAYMENT_PROOF,
  toSubmitPaymentProofBody,
  validatePaymentProofSubmission,
  type PaymentProofSubmission,
} from '../utils/paymentProofPolicy';

type ProofSubmitDrawerProps = {
  open: boolean;
  spaceId: string;
  paymentId: string | null;
  onClose: () => void;
};

export function ProofSubmitDrawer({
  open,
  spaceId,
  paymentId,
  onClose,
}: ProofSubmitDrawerProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);
  const { enqueueSnackbar } = useSnackbar();
  const mutations = usePaymentMutations(spaceId);
  const [proof, setProof] = useState<PaymentProofSubmission>(EMPTY_PAYMENT_PROOF);

  useEffect(() => {
    if (open) {
      setProof(EMPTY_PAYMENT_PROOF);
    }
  }, [open, paymentId]);

  const handleSubmit = async () => {
    if (!paymentId) {
      return;
    }
    const error = validatePaymentProofSubmission(proof);
    if (error) {
      enqueueSnackbar(t(`paymentCollection.proof.${error}`), { variant: 'warning' });
      return;
    }
    try {
      await mutations.submitProof.mutateAsync({
        paymentId,
        body: toSubmitPaymentProofBody(proof),
      });
      enqueueSnackbar(t('paymentCollection.proof.success'), { variant: 'success' });
      setProof(EMPTY_PAYMENT_PROOF);
      onClose();
    } catch {
      enqueueSnackbar(t('common.errors.generic'), { variant: 'error' });
    }
  };

  return (
    <AppDrawer open={open} onClose={onClose} width={420}>
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Typography sx={{ ...DASHBOARD_UX.cardTitle, color: s.textPrimary }}>
            {t('paymentCollection.proof.submit')}
          </Typography>
        </Box>
        <Box sx={{ p: 2, flex: 1, overflow: 'auto' }}>
          <UniversalPaymentProofForm
            value={proof}
            onChange={setProof}
            disabled={mutations.submitProof.isPending}
          />
        </Box>
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
