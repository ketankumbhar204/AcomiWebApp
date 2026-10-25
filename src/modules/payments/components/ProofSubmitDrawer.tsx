import { Box, Button, Typography, useTheme } from '@mui/material';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSnackbar } from 'notistack';
import { AppDrawer } from '@/shared/components/AppDrawer';
import { DASHBOARD_UX, dashSurfaces } from '@/modules/dashboard/theme/dashboardUx';
import { StickyFooter } from '@/shared/components/StickyFooter';
import { dashContainedButtonSx, dashOutlinedButtonSx } from '@/shared/theme/dashButtonSx';
import { UniversalPaymentProofForm } from './UniversalPaymentProofForm';
import { usePaymentDetail, usePaymentMutations } from '../hooks/usePayments';
import { canEditSubmittedProof } from '../utils/paymentHelpers';
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
  /** Edit keeps the current proof, UTR, and remarks. Submit starts a new proof. */
  mode?: 'submit' | 'edit';
  onClose: () => void;
};

export function ProofSubmitDrawer({
  open,
  spaceId,
  paymentId,
  mode = 'submit',
  onClose,
}: ProofSubmitDrawerProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);
  const { enqueueSnackbar } = useSnackbar();
  const mutations = usePaymentMutations(spaceId);
  const detail = usePaymentDetail(spaceId, paymentId ?? undefined, open && mode === 'edit');
  const [proof, setProof] = useState<PaymentProofSubmission>(EMPTY_PAYMENT_PROOF);
  const editing = mode === 'edit';
  const seededKey = useRef<string | null>(null);

  useEffect(() => {
    if (!open) {
      seededKey.current = null;
      return;
    }
    const key = `${paymentId ?? ''}:${editing ? 'edit' : 'submit'}`;
    if (seededKey.current === key) {
      return;
    }
    if (!editing) {
      setProof(EMPTY_PAYMENT_PROOF);
      seededKey.current = key;
      return;
    }
    const payment = detail.payment;
    if (!payment || !canEditSubmittedProof(payment.paymentStatus ?? payment.status)) {
      return;
    }
    setProof({
      ...EMPTY_PAYMENT_PROOF,
      paymentMethod: payment.paymentMethod ?? 'UPI',
      referenceNumber: payment.referenceNumber ?? '',
      remarks: payment.remarks ?? '',
      proofFileId: payment.proofFileId ?? undefined,
      previewUrl: payment.proofUrl ?? undefined,
    });
    seededKey.current = key;
  }, [detail.payment, editing, open, paymentId]);

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
      enqueueSnackbar(
        t(editing ? 'paymentCollection.proof.updated' : 'paymentCollection.proof.success'),
        { variant: 'success' },
      );
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
            {t(editing ? 'paymentCollection.proof.editTitle' : 'paymentCollection.proof.submit')}
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
            {t(editing ? 'paymentCollection.proof.saveChanges' : 'common.save')}
          </Button>
        </StickyFooter>
      </Box>
    </AppDrawer>
  );
}
