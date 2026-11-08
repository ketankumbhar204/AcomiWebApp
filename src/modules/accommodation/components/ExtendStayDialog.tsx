import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getErrorMessage } from '@/shared/api/errors';
import { useOccupancyMutations } from '../hooks/useAccommodation';
import { stayTypeDefaultLabel, stayTypeLabelKey, type StayKind } from '@/shared/utils/stayTypeDisplay';
import {
  buildExtendStayRequest,
  createExtensionIdempotencyKey,
} from '../utils/extendStay';

type ExtendStayDialogProps = {
  open: boolean;
  spaceId: string;
  occupancyId: string | null;
  variant?: 'extend' | 'renewal';
  /** OPEN_ENDED stays bill a daily rent, so monthly wording is not used. */
  stayKind?: StayKind | null;
  initialExpectedExitDate?: string;
  onClose: () => void;
};

export function ExtendStayDialog({
  open,
  spaceId,
  occupancyId,
  variant = 'extend',
  stayKind,
  initialExpectedExitDate = '',
  onClose,
}: ExtendStayDialogProps) {
  const { t } = useTranslation();
  const { extend } = useOccupancyMutations(spaceId);
  const [expectedExitDate, setExpectedExitDate] = useState('');
  const [additionalAmount, setAdditionalAmount] = useState('');
  const [rentSnapshot, setRentSnapshot] = useState('');
  const [rentEffectiveMonth, setRentEffectiveMonth] = useState('');
  const [idempotencyKey, setIdempotencyKey] = useState('');
  const [error, setError] = useState<string | null>(null);
  const isRenewal = variant === 'renewal';
  const isOpenEnded = stayKind === 'OPEN_ENDED';
  const renewLabel = isOpenEnded
    ? t('occupancy.actions.renewOpenEnded', { defaultValue: 'Renew stay' })
    : t('occupancy.actions.renewMonthly', { defaultValue: 'Monthly renewal' });

  useEffect(() => {
    if (!open) {
      return;
    }
    setExpectedExitDate(initialExpectedExitDate);
    setAdditionalAmount('');
    setRentSnapshot('');
    setRentEffectiveMonth('');
    setIdempotencyKey(createExtensionIdempotencyKey());
    setError(null);
  }, [open, occupancyId, initialExpectedExitDate]);

  const pending = extend.isPending;

  const submit = async () => {
    if (!occupancyId || pending) {
      return;
    }
    setError(null);
    try {
      const body = buildExtendStayRequest({
        expectedExitDate,
        additionalAmount: isRenewal ? '' : additionalAmount,
        rentSnapshot,
        rentEffectiveMonth,
        idempotencyKey,
      });
      await extend.mutateAsync({ occupancyId, body });
      onClose();
    } catch (caught) {
      if (caught instanceof Error && caught.message === 'RENT_FIELDS') {
        setError(
          isOpenEnded
            ? t('occupancy.extend.rentFieldsDaily', {
                defaultValue: 'A new daily rent needs the month it starts.',
              })
            : t('occupancy.extend.rentFields', {
                defaultValue: 'A new monthly rent needs the month it starts.',
              }),
        );
        return;
      }
      if (caught instanceof Error && (caught.message === 'DATE_REQUIRED' || caught.message === 'AMOUNT')) {
        setError(
          t('occupancy.extend.invalid', {
            defaultValue: 'Enter a planned end date and an amount that is zero or greater.',
          }),
        );
        return;
      }
      setError(getErrorMessage(caught));
    }
  };

  return (
    <Dialog open={open} onClose={pending ? undefined : onClose} fullWidth maxWidth="xs">
      <DialogTitle>
        {isRenewal
          ? renewLabel
          : t('occupancy.actions.extend', { defaultValue: 'Extend stay' })}
      </DialogTitle>
      <DialogContent>
        <Stack spacing={1.5} sx={{ pt: 0.5 }}>
          {stayKind ? (
            <Typography variant="body2" color="text.secondary">
              {t('occupancyWizard.steps.stayType', { defaultValue: 'Stay type' })}
              {': '}
              {t(stayTypeLabelKey(stayKind), { defaultValue: stayTypeDefaultLabel(stayKind) })}
            </Typography>
          ) : null}
          {isRenewal ? (
            <Typography variant="body2" color="text.secondary">
              {isOpenEnded
                ? t('occupancy.extend.renewalHintDaily', {
                    defaultValue:
                      'Extend the billing date on the same occupancy. Optional new daily rent applies from the month you choose.',
                  })
                : t('occupancy.extend.renewalHint', {
                    defaultValue:
                      'Extend for one month on the same occupancy. Optional new rent applies from the month you choose (D-15).',
                  })}
            </Typography>
          ) : null}
          <TextField
            type="date"
            label={
              isRenewal
                ? t('occupancy.extend.newBillingEnd', {
                    defaultValue: 'New planned end / billing date',
                  })
                : t('occupancy.extend.newEnd', { defaultValue: 'New planned end' })
            }
            value={expectedExitDate}
            onChange={(event) => setExpectedExitDate(event.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
            disabled={pending}
            required
          />
          {!isRenewal ? (
            <TextField
              label={t('occupancy.extend.amount', { defaultValue: 'Additional amount' })}
              value={additionalAmount}
              onChange={(event) => setAdditionalAmount(event.target.value)}
              disabled={pending}
              helperText={t('occupancy.extend.amountHelp', {
                defaultValue:
                  'Leave empty for a date-only change. A short stay uses this as one extension charge.',
              })}
            />
          ) : null}
          <TextField
            label={
              isOpenEnded
                ? t('occupancy.extend.rentDaily', { defaultValue: 'New daily rent' })
                : t('occupancy.extend.rent', { defaultValue: 'New monthly rent' })
            }
            value={rentSnapshot}
            onChange={(event) => setRentSnapshot(event.target.value)}
            disabled={pending}
            helperText={
              isRenewal
                ? t('occupancy.extend.rentOptionalHelp', {
                    defaultValue: 'Optional. Leave empty to keep the current rent.',
                  })
                : undefined
            }
          />
          <TextField
            type="month"
            label={t('occupancy.extend.effectiveMonth', { defaultValue: 'Rent starts in' })}
            value={rentEffectiveMonth}
            onChange={(event) => setRentEffectiveMonth(event.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
            disabled={pending}
          />
          {error ? <Alert severity="error">{error}</Alert> : null}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={pending}>
          {t('common.cancel', { defaultValue: 'Cancel' })}
        </Button>
        <Button variant="contained" onClick={() => void submit()} disabled={pending || !expectedExitDate}>
          {isRenewal
            ? renewLabel
            : t('occupancy.actions.extend', { defaultValue: 'Extend stay' })}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
