import { useState } from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import type { PaymentRejectionReason } from '@/shared/types/payments';

const REJECTION_REASONS: PaymentRejectionReason[] = [
  'PAYMENT_AMOUNT_MISMATCH',
  'WRONG_SCREENSHOT',
  'INVALID_UTR',
  'OTHER',
];

type PaymentReviewActionsProps = {
  reviewing?: boolean;
  onApprove: () => void;
  onReject: (code: PaymentRejectionReason, reason?: string) => void | Promise<void>;
  onRequestUpdate: (message: string) => void | Promise<void>;
};

/** Approve, needs-update, and reject — the same actions as the Payments under-review queue. */
export function PaymentReviewActions({
  reviewing = false,
  onApprove,
  onReject,
  onRequestUpdate,
}: PaymentReviewActionsProps) {
  const { t } = useTranslation();
  const [rejectOpen, setRejectOpen] = useState(false);
  const [updateOpen, setUpdateOpen] = useState(false);
  const [reason, setReason] = useState<PaymentRejectionReason | ''>('');
  const [message, setMessage] = useState('');

  return (
    <>
      <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap">
        <Button size="small" variant="contained" disabled={reviewing} onClick={onApprove}>
          {t('paymentCollection.approval.approve')}
        </Button>
        <Button
          size="small"
          variant="outlined"
          color="warning"
          disabled={reviewing}
          onClick={() => setUpdateOpen(true)}
        >
          {t('paymentCollection.approval.needsUpdateAction')}
        </Button>
        <Button
          size="small"
          variant="outlined"
          color="error"
          disabled={reviewing}
          onClick={() => setRejectOpen(true)}
        >
          {t('paymentCollection.approval.reject')}
        </Button>
      </Stack>

      <Dialog open={updateOpen} onClose={() => setUpdateOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>{t('paymentCollection.approval.needsUpdateAction')}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            multiline
            minRows={3}
            margin="dense"
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            label={t('paymentCollection.review.remarks')}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUpdateOpen(false)}>{t('common.cancel')}</Button>
          <Button
            variant="contained"
            disabled={reviewing || !message.trim()}
            onClick={() => {
              void Promise.resolve(onRequestUpdate(message.trim())).then(() => {
                setMessage('');
                setUpdateOpen(false);
              });
            }}
          >
            {t('paymentCollection.approval.needsUpdateAction')}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={rejectOpen} onClose={() => setRejectOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>{t('paymentCollection.rejection.title')}</DialogTitle>
        <DialogContent>
          <TextField
            select
            fullWidth
            margin="dense"
            label={t('paymentCollection.review.rejectionCode')}
            value={reason}
            onChange={(event) => setReason(event.target.value as PaymentRejectionReason)}
          >
            {REJECTION_REASONS.map((code) => (
              <MenuItem key={code} value={code}>
                {t(`paymentCollection.rejection.${code}`)}
              </MenuItem>
            ))}
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectOpen(false)}>{t('common.cancel')}</Button>
          <Button
            variant="contained"
            color="error"
            disabled={reviewing || !reason}
            onClick={() => {
              if (!reason) return;
              void Promise.resolve(onReject(reason, t(`paymentCollection.rejection.${reason}`))).then(
                () => {
                  setReason('');
                  setRejectOpen(false);
                },
              );
            }}
          >
            {t('paymentCollection.approval.reject')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
