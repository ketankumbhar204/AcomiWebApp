import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSnackbar } from 'notistack';
import { getErrorMessage } from '@/shared/api/errors';
import { dashContainedButtonSx, dashOutlinedButtonSx } from '@/shared/theme/dashButtonSx';
import type {
  PaymentSettlementAction,
  SpacePaymentResponse,
  UniversalPaymentMethod,
} from '@/shared/types/payments';
import { usePaymentMutations } from '../hooks/usePayments';
import {
  canCancelUnpaidPayment,
  canSettleCollectedPayment,
  remainingRefundableAmount,
} from '../utils/paymentHelpers';
import {
  formatPaymentListTitle,
  resolveSettlementAmounts,
} from '../utils/paymentRefundDisplay';

type Props = {
  spaceId: string;
  payment: SpacePaymentResponse;
  canManage: boolean;
};

type SettleAction = Exclude<PaymentSettlementAction, 'CANCEL_UNPAID'>;

export function PaymentSettlementActions({ spaceId, payment, canManage }: Props) {
  const { t } = useTranslation();
  const { enqueueSnackbar } = useSnackbar();
  const mutations = usePaymentMutations(spaceId);
  const [settleOpen, setSettleOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [action, setAction] = useState<SettleAction>('FULL_REFUND');
  const refundable = useMemo(() => remainingRefundableAmount(payment), [payment]);
  const [refundAmount, setRefundAmount] = useState('');
  const [reason, setReason] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [cancelRemarks, setCancelRemarks] = useState('');
  const [refundMethod, setRefundMethod] = useState<UniversalPaymentMethod | ''>('');
  const [refundDate, setRefundDate] = useState('');
  const [refundReference, setRefundReference] = useState('');

  const amounts = useMemo(
    () => resolveSettlementAmounts(action, refundable, refundAmount),
    [action, refundAmount, refundable],
  );

  if (!canManage) {
    return null;
  }

  const status = payment.paymentStatus;
  const showCancel = canCancelUnpaidPayment(status);
  const showSettle = canSettleCollectedPayment(status) && refundable > 0;

  if (!showCancel && !showSettle) {
    return null;
  }

  const openSettle = () => {
    setRefundAmount('');
    setReason('');
    setRefundMethod('');
    setRefundDate('');
    setRefundReference('');
    setAction('FULL_REFUND');
    setSettleOpen(true);
  };

  const handleCancel = async () => {
    if (!cancelReason.trim()) {
      enqueueSnackbar(t('payments.settle.reasonRequired', { defaultValue: 'Reason is required' }), {
        variant: 'warning',
      });
      return;
    }
    try {
      const remarks = cancelRemarks.trim();
      await mutations.cancelPayment.mutateAsync({
        paymentId: payment.paymentId,
        body: {
          reason: remarks ? `${cancelReason.trim()} — ${remarks}` : cancelReason.trim(),
        },
      });
      enqueueSnackbar(t('payments.settle.cancelled', { defaultValue: 'Payment cancelled' }), {
        variant: 'success',
      });
      setCancelOpen(false);
      setCancelReason('');
      setCancelRemarks('');
    } catch (err) {
      enqueueSnackbar(getErrorMessage(err), { variant: 'error' });
    }
  };

  const handleSettle = async () => {
    if (!reason.trim()) {
      enqueueSnackbar(t('payments.settle.reasonRequired', { defaultValue: 'Reason is required' }), {
        variant: 'warning',
      });
      return;
    }
    if (action === 'PARTIAL_REFUND') {
      const raw = Number(refundAmount);
      if (!Number.isFinite(raw) || raw <= 0 || raw > refundable + 0.0001) {
        enqueueSnackbar(
          t('payments.settle.invalidRefundAmount', {
            defaultValue:
              'Refund amount must be greater than 0 and within the remaining refundable amount',
          }),
          { variant: 'warning' },
        );
        return;
      }
    }
    if (amounts.refundAmount + amounts.retainedAmount <= 0) {
      enqueueSnackbar(
        t('payments.settle.invalidRefundAmount', {
          defaultValue:
            'Refund amount must be greater than 0 and within the remaining refundable amount',
        }),
        { variant: 'warning' },
      );
      return;
    }
    try {
      await mutations.settlePayment.mutateAsync({
        paymentId: payment.paymentId,
        body: {
          action,
          refundAmount: amounts.refundAmount > 0 ? amounts.refundAmount : null,
          retainedAmount: amounts.retainedAmount > 0 ? amounts.retainedAmount : null,
          reason: reason.trim(),
          refundMethod: refundMethod || null,
          refundDate: refundDate || null,
          refundReference: refundReference.trim() || null,
        },
      });
      enqueueSnackbar(t('payments.settle.done', { defaultValue: 'Payment settled' }), {
        variant: 'success',
      });
      setSettleOpen(false);
      setReason('');
    } catch (err) {
      enqueueSnackbar(getErrorMessage(err), { variant: 'error' });
    }
  };

  return (
    <>
      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
        {showCancel ? (
          <Button
            sx={dashOutlinedButtonSx}
            color="error"
            disabled={mutations.cancelPayment.isPending}
            onClick={() => setCancelOpen(true)}
          >
            {t('payments.settle.cancelUnpaid', { defaultValue: 'Cancel payment' })}
          </Button>
        ) : null}
        {showSettle ? (
          <Button sx={dashOutlinedButtonSx} onClick={openSettle}>
            {t('payments.settle.open', { defaultValue: 'Refund / retain' })}
          </Button>
        ) : null}
      </Stack>

      <Dialog open={cancelOpen} onClose={() => setCancelOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>
          {t('payments.settle.cancelUnpaid', { defaultValue: 'Cancel payment' })}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              {formatPaymentListTitle(payment)} · ₹{Number(payment.amount).toLocaleString('en-IN')}
            </Typography>
            <TextField
              size="small"
              required
              label={t('payments.settle.cancelReason', { defaultValue: 'Cancellation reason' })}
              value={cancelReason}
              onChange={e => setCancelReason(e.target.value)}
            />
            <TextField
              size="small"
              label={t('payments.settle.cancelRemarks', { defaultValue: 'Remarks (optional)' })}
              value={cancelRemarks}
              onChange={e => setCancelRemarks(e.target.value)}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button sx={dashOutlinedButtonSx} onClick={() => setCancelOpen(false)}>
            {t('common.back', { defaultValue: 'Back' })}
          </Button>
          <Button
            sx={dashContainedButtonSx}
            color="error"
            disabled={mutations.cancelPayment.isPending}
            onClick={() => void handleCancel()}
          >
            {t('payments.settle.confirmCancel', { defaultValue: 'Confirm cancellation' })}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={settleOpen} onClose={() => setSettleOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>
          {t('payments.settle.title', { defaultValue: 'Settle collected payment' })}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              {formatPaymentListTitle(payment)} · ₹{Number(payment.amount).toLocaleString('en-IN')}
            </Typography>
            <Typography variant="body2">
              {t('payments.settle.collected', {
                defaultValue: 'Collected: ₹{{amount}}',
                amount: Number(payment.paidAmount ?? payment.amount).toLocaleString('en-IN'),
              })}
            </Typography>
            <Typography variant="body2">
              {t('payments.settle.alreadyRefunded', {
                defaultValue: 'Already refunded: ₹{{amount}}',
                amount: Number(payment.refundedAmount ?? 0).toLocaleString('en-IN'),
              })}
            </Typography>
            <Typography variant="body2">
              {t('payments.settle.remainingRefundable', {
                defaultValue: 'Remaining refundable: ₹{{amount}}',
                amount: refundable.toLocaleString('en-IN'),
              })}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t('payments.settle.recordNotice', {
                defaultValue:
                  'This records a completed refund or retention in ACOMI after you confirm money was returned or kept. It does not send a bank/UPI payout.',
              })}
            </Typography>
            <FormControl fullWidth size="small">
              <InputLabel>{t('payments.settle.action', { defaultValue: 'Action' })}</InputLabel>
              <Select
                label={t('payments.settle.action', { defaultValue: 'Action' })}
                value={action}
                onChange={e => {
                  setAction(e.target.value as SettleAction);
                  setRefundAmount('');
                }}
              >
                <MenuItem value="FULL_REFUND">
                  {t('payments.settle.fullRefund', { defaultValue: 'Full refund' })}
                </MenuItem>
                <MenuItem value="PARTIAL_REFUND">
                  {t('payments.settle.partialRefund', { defaultValue: 'Partial refund' })}
                </MenuItem>
                <MenuItem value="RETAIN">
                  {t('payments.settle.retain', { defaultValue: 'Retain amount' })}
                </MenuItem>
              </Select>
            </FormControl>
            {action === 'PARTIAL_REFUND' ? (
              <TextField
                size="small"
                label={t('payments.settle.refundAmount', { defaultValue: 'Refund amount' })}
                value={refundAmount}
                onChange={e => setRefundAmount(e.target.value)}
              />
            ) : null}
            <Stack
              spacing={0.5}
              sx={{ bgcolor: 'action.hover', borderRadius: 1, px: 1.5, py: 1 }}
            >
              <Typography variant="body2">
                {t('payments.settle.refundNow', {
                  defaultValue: 'Refund now: ₹{{amount}}',
                  amount: amounts.refundAmount.toLocaleString('en-IN'),
                })}
              </Typography>
              <Typography variant="body2">
                {t('payments.settle.retainedNow', {
                  defaultValue: 'Retained now: ₹{{amount}}',
                  amount: amounts.retainedAmount.toLocaleString('en-IN'),
                })}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {t('payments.settle.retainedHint', {
                  defaultValue:
                    'Retained amount is money you keep (not returned). For partial refund it is calculated automatically.',
                })}
              </Typography>
            </Stack>
            {action === 'FULL_REFUND' || action === 'PARTIAL_REFUND' ? (
              <>
                <FormControl fullWidth size="small">
                  <InputLabel>
                    {t('payments.settle.refundMethod', { defaultValue: 'Refund method' })}
                  </InputLabel>
                  <Select
                    label={t('payments.settle.refundMethod', { defaultValue: 'Refund method' })}
                    value={refundMethod}
                    onChange={e => setRefundMethod(e.target.value as UniversalPaymentMethod | '')}
                  >
                    <MenuItem value="">{t('common.none', { defaultValue: 'None' })}</MenuItem>
                    <MenuItem value="UPI">UPI</MenuItem>
                    <MenuItem value="BANK_TRANSFER">Bank transfer</MenuItem>
                    <MenuItem value="CASH">Cash</MenuItem>
                    <MenuItem value="CHEQUE">Cheque</MenuItem>
                    <MenuItem value="OTHER">Other</MenuItem>
                  </Select>
                </FormControl>
                <TextField
                  size="small"
                  type="date"
                  InputLabelProps={{ shrink: true }}
                  label={t('payments.settle.refundDate', { defaultValue: 'Refund date' })}
                  value={refundDate}
                  onChange={e => setRefundDate(e.target.value)}
                />
                <TextField
                  size="small"
                  label={t('payments.settle.refundReference', {
                    defaultValue: 'Reference / transaction ID',
                  })}
                  value={refundReference}
                  onChange={e => setRefundReference(e.target.value)}
                />
              </>
            ) : null}
            <TextField
              size="small"
              required
              label={t('payments.settle.reason', { defaultValue: 'Reason' })}
              value={reason}
              onChange={e => setReason(e.target.value)}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button sx={dashOutlinedButtonSx} onClick={() => setSettleOpen(false)}>
            {t('common.back', { defaultValue: 'Back' })}
          </Button>
          <Button
            sx={dashContainedButtonSx}
            disabled={mutations.settlePayment.isPending}
            onClick={() => void handleSettle()}
          >
            {t('payments.settle.confirm', { defaultValue: 'Record settlement' })}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
