import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getErrorMessage } from '@/shared/api/errors';
import { useOccupancyMutations } from '../hooks/useAccommodation';
import { createExtensionIdempotencyKey } from '../utils/extendStay';
import {
  buildReviseOpenEndedRentRequest,
  defaultRentEffectiveFromYmd,
  formatDailyRentDisplay,
  previousRateThroughYmd,
} from '../utils/reviseOpenEndedRent';

type ReasonCode = '' | 'RENT_REVISION' | 'MUTUAL_AGREEMENT' | 'OTHER';

type ReviseOpenEndedRentDialogProps = {
  open: boolean;
  spaceId: string;
  occupancyId: string | null;
  currentDailyRent?: number | null;
  onClose: () => void;
};

export function ReviseOpenEndedRentDialog({
  open,
  spaceId,
  occupancyId,
  currentDailyRent,
  onClose,
}: ReviseOpenEndedRentDialogProps) {
  const { t } = useTranslation();
  const { extend } = useOccupancyMutations(spaceId);
  const [newDailyRent, setNewDailyRent] = useState('');
  const [effectiveFrom, setEffectiveFrom] = useState('');
  const [reasonCode, setReasonCode] = useState<ReasonCode>('');
  const [reasonOther, setReasonOther] = useState('');
  const [idempotencyKey, setIdempotencyKey] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }
    setNewDailyRent(
      currentDailyRent != null && !Number.isNaN(currentDailyRent) ? String(currentDailyRent) : '',
    );
    setEffectiveFrom(defaultRentEffectiveFromYmd());
    setReasonCode('');
    setReasonOther('');
    setIdempotencyKey(createExtensionIdempotencyKey());
    setError(null);
  }, [open, occupancyId, currentDailyRent]);

  const pending = extend.isPending;
  const missingCurrent = currentDailyRent == null || Number.isNaN(currentDailyRent);
  const previewThrough = useMemo(() => previousRateThroughYmd(effectiveFrom), [effectiveFrom]);
  const previewNew = Number(newDailyRent.trim());

  const submit = async () => {
    if (!occupancyId || pending) {
      return;
    }
    setError(null);
    try {
      const body = buildReviseOpenEndedRentRequest({
        currentDailyRent,
        newDailyRent,
        effectiveFrom,
        reasonCode,
        reasonOther,
        idempotencyKey,
      });
      await extend.mutateAsync({
        occupancyId,
        body: {
          idempotencyKey: body.idempotencyKey,
          rentSnapshot: body.rentSnapshot,
          rentEffectiveMonth: body.rentEffectiveMonth,
          reason: body.reason,
        },
      });
      onClose();
    } catch (caught) {
      if (caught instanceof Error) {
        if (caught.message === 'CURRENT_RENT_MISSING') {
          setError(
            t('occupancy.reviseRent.currentMissing', {
              defaultValue: 'Current daily rent is missing for this stay. Refresh and try again.',
            }),
          );
          return;
        }
        if (caught.message === 'RENT_UNCHANGED') {
          setError(
            t('occupancy.reviseRent.unchanged', {
              defaultValue: 'Enter a new daily rent that differs from the current rate.',
            }),
          );
          return;
        }
        if (caught.message === 'DATE_REQUIRED' || caught.message === 'AMOUNT') {
          setError(
            t('occupancy.reviseRent.invalid', {
              defaultValue: 'Enter a valid new daily rent and effective date.',
            }),
          );
          return;
        }
      }
      setError(getErrorMessage(caught));
    }
  };

  return (
    <Dialog open={open} onClose={pending ? undefined : onClose} fullWidth maxWidth="xs">
      <DialogTitle>
        {t('occupancy.actions.reviseOpenEnded', { defaultValue: 'Update Daily Rent' })}
      </DialogTitle>
      <DialogContent>
        <Stack spacing={1.5} sx={{ pt: 0.5 }}>
          <Typography variant="body2" color="text.secondary">
            {t('occupancy.reviseRent.subtitle', {
              defaultValue:
                'Revise the daily rate for this No Fixed Move-Out Date stay. Stay type does not change.',
            })}
          </Typography>
          {missingCurrent ? (
            <Alert severity="error">
              {t('occupancy.reviseRent.currentMissing', {
                defaultValue: 'Current daily rent is missing for this stay. Refresh and try again.',
              })}
            </Alert>
          ) : (
            <>
              <TextField
                label={t('occupancy.reviseRent.currentDaily', { defaultValue: 'Current Daily Rent' })}
                value={formatDailyRentDisplay(currentDailyRent)}
                fullWidth
                InputProps={{ readOnly: true }}
              />
              <TextField
                label={t('occupancy.reviseRent.newDaily', { defaultValue: 'New Daily Rent' })}
                value={newDailyRent}
                onChange={e => setNewDailyRent(e.target.value)}
                fullWidth
                type="number"
                inputProps={{ min: 0, step: '0.01' }}
                disabled={pending}
              />
              <TextField
                label={t('occupancy.reviseRent.effectiveFrom', { defaultValue: 'Effective From' })}
                type="date"
                value={effectiveFrom}
                onChange={e => setEffectiveFrom(e.target.value)}
                fullWidth
                InputLabelProps={{ shrink: true }}
                disabled={pending}
              />
              <TextField
                select
                label={t('occupancy.reviseRent.reason', {
                  defaultValue: 'Reason for Change (optional)',
                })}
                value={reasonCode}
                onChange={e => setReasonCode(e.target.value as ReasonCode)}
                fullWidth
                disabled={pending}>
                <MenuItem value="">—</MenuItem>
                <MenuItem value="RENT_REVISION">
                  {t('occupancy.reviseRent.reason.RENT_REVISION', { defaultValue: 'Rent revision' })}
                </MenuItem>
                <MenuItem value="MUTUAL_AGREEMENT">
                  {t('occupancy.reviseRent.reason.MUTUAL_AGREEMENT', {
                    defaultValue: 'Mutual agreement',
                  })}
                </MenuItem>
                <MenuItem value="OTHER">
                  {t('occupancy.reviseRent.reason.OTHER', { defaultValue: 'Other' })}
                </MenuItem>
              </TextField>
              {reasonCode === 'OTHER' ? (
                <TextField
                  label={t('occupancy.reviseRent.reasonOther', {
                    defaultValue: 'Short explanation',
                  })}
                  value={reasonOther}
                  onChange={e => setReasonOther(e.target.value)}
                  fullWidth
                  disabled={pending}
                />
              ) : null}
              {Number.isFinite(previewNew) && previewThrough ? (
                <Alert severity="info">
                  <Typography variant="body2">
                    {t('occupancy.reviseRent.previewCurrent', {
                      defaultValue: 'Current daily rent: {{amount}}',
                      amount: formatDailyRentDisplay(currentDailyRent),
                    })}
                  </Typography>
                  <Typography variant="body2">
                    {t('occupancy.reviseRent.previewNew', {
                      defaultValue: 'New daily rent: {{amount}}',
                      amount: formatDailyRentDisplay(previewNew),
                    })}
                  </Typography>
                  <Typography variant="body2">
                    {t('occupancy.reviseRent.previewEffective', {
                      defaultValue: 'Effective from: {{date}}',
                      date: effectiveFrom,
                    })}
                  </Typography>
                  <Typography variant="body2">
                    {t('occupancy.reviseRent.previewPreviousThrough', {
                      defaultValue: 'Previous rate applies through: {{date}}',
                      date: previewThrough,
                    })}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                    {t('occupancy.reviseRent.previewNote', {
                      defaultValue:
                        'Already generated or paid bills are not changed. Future days are not charged in advance.',
                    })}
                  </Typography>
                </Alert>
              ) : null}
            </>
          )}
          {error ? <Alert severity="error">{error}</Alert> : null}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={pending}>
          {t('common.cancel')}
        </Button>
        <Button
          variant="contained"
          onClick={() => void submit()}
          disabled={pending || missingCurrent || !occupancyId}>
          {t('occupancy.actions.reviseOpenEnded', { defaultValue: 'Update Daily Rent' })}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
