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
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSnackbar } from 'notistack';
import { getErrorMessage } from '@/shared/api/errors';
import { dashContainedButtonSx, dashOutlinedButtonSx } from '@/shared/theme/dashButtonSx';
import type { PaymentSettlementAction } from '@/shared/types/payments';
import {
  resolveSettlementAmounts,
  type SettlementActionKind,
} from '@/modules/payments/utils/paymentRefundDisplay';
import {
  occupancyApi,
  type ReservationCancellationPreviewPayment,
  type ReservationPaymentSettlementDecision,
} from '../api/occupancyApi';

type DecisionState = {
  action: PaymentSettlementAction;
  refundAmount: string;
  reason: string;
};

type Props = {
  open: boolean;
  spaceId: string;
  occupancyId: string | null;
  onClose: () => void;
  onCancelled: () => void;
};

function defaultAction(item: ReservationCancellationPreviewPayment): PaymentSettlementAction {
  if (item.allowedActions.includes('CANCEL_UNPAID')) {
    return 'CANCEL_UNPAID';
  }
  if (item.allowedActions.includes('FULL_REFUND')) {
    return 'FULL_REFUND';
  }
  return item.allowedActions[0] ?? 'RETAIN';
}

export function ReservationCancellationDialog({
  open,
  spaceId,
  occupancyId,
  onClose,
  onCancelled,
}: Props) {
  const { t } = useTranslation();
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [remarks, setRemarks] = useState('');
  const [payments, setPayments] = useState<ReservationCancellationPreviewPayment[]>([]);
  const [decisions, setDecisions] = useState<Record<string, DecisionState>>({});

  useEffect(() => {
    if (!open || !occupancyId) {
      return;
    }
    let cancelled = false;
    setLoading(true);
    occupancyApi
      .previewReservationCancellation(spaceId, occupancyId)
      .then(preview => {
        if (cancelled) {
          return;
        }
        setPayments(preview.payments ?? []);
        const next: Record<string, DecisionState> = {};
        for (const item of preview.payments ?? []) {
          const action = defaultAction(item);
          next[item.paymentId] = {
            action,
            refundAmount: '',
            reason: '',
          };
        }
        setDecisions(next);
      })
      .catch(err => {
        enqueueSnackbar(getErrorMessage(err), { variant: 'error' });
        onClose();
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [enqueueSnackbar, occupancyId, onClose, open, spaceId]);

  const collectedNeedingDecision = useMemo(
    () => payments.filter(p => p.collected && (p.refundableAmount ?? 0) > 0),
    [payments],
  );

  const handleSubmit = async () => {
    if (!occupancyId) {
      return;
    }
    const settlements: ReservationPaymentSettlementDecision[] = [];
    for (const item of payments) {
      const decision = decisions[item.paymentId];
      if (!decision) {
        continue;
      }
      if (item.collected && (item.refundableAmount ?? 0) > 0) {
        if (!decision.reason.trim()) {
          enqueueSnackbar(
            t('occupancy.cancelReservation.reasonRequired', {
              defaultValue: 'Enter a reason for each collected payment settlement.',
            }),
            { variant: 'warning' },
          );
          return;
        }
        const settleAction = decision.action as SettlementActionKind;
        const remaining = Number(item.refundableAmount ?? 0);
        if (decision.action === 'PARTIAL_REFUND') {
          const raw = Number(decision.refundAmount);
          if (!Number.isFinite(raw) || raw <= 0 || raw > remaining + 0.0001) {
            enqueueSnackbar(
              t('occupancy.cancelReservation.refundAmountRequired', {
                defaultValue: 'Enter a valid refund amount.',
              }),
              { variant: 'warning' },
            );
            return;
          }
        }
        const amounts = resolveSettlementAmounts(
          settleAction,
          remaining,
          decision.refundAmount,
        );
        if (amounts.refundAmount + amounts.retainedAmount <= 0) {
          enqueueSnackbar(
            t('occupancy.cancelReservation.refundAmountRequired', {
              defaultValue: 'Enter a valid refund amount.',
            }),
            { variant: 'warning' },
          );
          return;
        }
        settlements.push({
          paymentId: item.paymentId,
          action: decision.action,
          refundAmount: amounts.refundAmount > 0 ? amounts.refundAmount : null,
          retainedAmount: amounts.retainedAmount > 0 ? amounts.retainedAmount : null,
          reason: decision.reason.trim(),
        });
      }
    }

    setSubmitting(true);
    try {
      await occupancyApi.cancelReservation(spaceId, occupancyId, {
        remarks: remarks.trim() || undefined,
        settlements,
      });
      enqueueSnackbar(
        t('occupancy.toast.reservationCancelled', {
          defaultValue: 'Reservation cancelled',
        }),
        { variant: 'success' },
      );
      onCancelled();
      onClose();
    } catch (err) {
      enqueueSnackbar(getErrorMessage(err), { variant: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={submitting ? undefined : onClose} fullWidth maxWidth="sm">
      <DialogTitle>
        {t('occupancy.cancelReservation.title', { defaultValue: 'Cancel reservation' })}
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <Typography variant="body2" color="text.secondary">
            {t('occupancy.cancelReservation.settlementHint', {
              defaultValue:
                'Unpaid obligations are cancelled automatically. Collected amounts need refund or retain.',
            })}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t('payments.settle.recordNotice', {
              defaultValue:
                'This records a completed refund or retention in ACOMI after you confirm money was returned or kept. It does not send a bank/UPI payout.',
            })}
          </Typography>
          {loading ? (
            <Typography variant="body2">
              {t('common.loading', { defaultValue: 'Loading…' })}
            </Typography>
          ) : payments.length === 0 ? (
            <Typography variant="body2">
              {t('occupancy.cancelReservation.noPayments', {
                defaultValue: 'No payment obligations on this reservation.',
              })}
            </Typography>
          ) : (
            payments.map(item => {
              const decision = decisions[item.paymentId];
              const needsSettlement = item.collected && (item.refundableAmount ?? 0) > 0;
              const amounts =
                needsSettlement && decision && decision.action !== 'CANCEL_UNPAID'
                  ? resolveSettlementAmounts(
                      decision.action as SettlementActionKind,
                      Number(item.refundableAmount ?? 0),
                      decision.refundAmount,
                    )
                  : null;
              return (
                <Stack
                  key={item.paymentId}
                  spacing={1}
                  sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 1.5 }}
                >
                  <Typography sx={{ fontWeight: 600 }}>{item.title}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    ₹{Number(item.amount).toLocaleString('en-IN')} · {item.paymentStatus}
                    {item.collected
                      ? ` · refundable ₹${Number(item.refundableAmount).toLocaleString('en-IN')}`
                      : ''}
                  </Typography>
                  {needsSettlement && decision ? (
                    <>
                      <FormControl fullWidth size="small">
                        <InputLabel>
                          {t('occupancy.cancelReservation.action', { defaultValue: 'Settlement' })}
                        </InputLabel>
                        <Select
                          label={t('occupancy.cancelReservation.action', {
                            defaultValue: 'Settlement',
                          })}
                          value={decision.action}
                          onChange={e =>
                            setDecisions(prev => ({
                              ...prev,
                              [item.paymentId]: {
                                ...decision,
                                action: e.target.value as PaymentSettlementAction,
                                refundAmount: '',
                              },
                            }))
                          }
                        >
                          {item.allowedActions.map(action => (
                            <MenuItem key={action} value={action}>
                              {action === 'FULL_REFUND'
                                ? t('payments.settle.fullRefund', { defaultValue: 'Full refund' })
                                : action === 'PARTIAL_REFUND'
                                  ? t('payments.settle.partialRefund', {
                                      defaultValue: 'Partial refund',
                                    })
                                  : action === 'RETAIN'
                                    ? t('payments.settle.retain', {
                                        defaultValue: 'Retain amount',
                                      })
                                    : action}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                      {decision.action === 'PARTIAL_REFUND' ? (
                        <TextField
                          size="small"
                          label={t('payments.settle.refundAmount', {
                            defaultValue: 'Refund amount',
                          })}
                          value={decision.refundAmount}
                          onChange={e =>
                            setDecisions(prev => ({
                              ...prev,
                              [item.paymentId]: { ...decision, refundAmount: e.target.value },
                            }))
                          }
                        />
                      ) : null}
                      {amounts ? (
                        <Stack
                          spacing={0.25}
                          sx={{ bgcolor: 'action.hover', borderRadius: 1, px: 1.25, py: 1 }}
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
                      ) : null}
                      <TextField
                        size="small"
                        required
                        label={t('payments.settle.reason', { defaultValue: 'Reason' })}
                        value={decision.reason}
                        onChange={e =>
                          setDecisions(prev => ({
                            ...prev,
                            [item.paymentId]: { ...decision, reason: e.target.value },
                          }))
                        }
                      />
                    </>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      {item.collected
                        ? t('occupancy.cancelReservation.alreadySettled', {
                            defaultValue: 'Already settled.',
                          })
                        : t('occupancy.cancelReservation.willCancelUnpaid', {
                            defaultValue: 'Will be cancelled (unpaid).',
                          })}
                    </Typography>
                  )}
                </Stack>
              );
            })
          )}
          <TextField
            label={t('occupancy.cancelReservation.remarks', {
              defaultValue: 'Cancellation remarks (optional)',
            })}
            value={remarks}
            onChange={e => setRemarks(e.target.value)}
            multiline
            minRows={2}
          />
          {collectedNeedingDecision.length > 0 ? (
            <Typography variant="caption" color="text.secondary">
              {t('occupancy.cancelReservation.collectedCount', {
                defaultValue: '{{count}} collected payment(s) require settlement.',
                count: collectedNeedingDecision.length,
              })}
            </Typography>
          ) : null}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button sx={dashOutlinedButtonSx} onClick={onClose} disabled={submitting}>
          {t('common.back', { defaultValue: 'Back' })}
        </Button>
        <Button
          sx={dashContainedButtonSx}
          color="error"
          onClick={handleSubmit}
          disabled={loading || submitting}
        >
          {t('occupancy.actions.cancelReservation', { defaultValue: 'Cancel reservation' })}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
