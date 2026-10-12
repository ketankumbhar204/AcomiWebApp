import {
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { BedSingle, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ConfirmDialog } from '@/shared/components/ConfirmDialog';
import { StatusChip } from '@/shared/components/StatusChip';
import { colors } from '@/shared/theme/colors';
import type { AccommodationStatus } from '@/shared/types/accommodation';
import { parseOptionalMoney } from '../setup-preview/setupPricingAutofill';
import {
  isBedDraftUnchanged,
  isOccupancyMoneyMissing,
  type BedInteractionDraft,
} from '../utils/bedInteractionDraft';
import { OccupancyActionButtons } from './OccupancyActionButtons';
import { OccupiedBedStaySection } from './OccupiedBedStaySection';

type OccupancyButtons = {
  status?: AccommodationStatus | string;
  occupancyId?: string | null;
  memberId?: string | null;
  canManage?: boolean;
  onAllocate?: () => void;
  onReserve?: () => void;
  onMoveIn?: () => void;
  onCancel?: () => void;
  onTransfer?: () => void;
  onVacate?: () => void;
  onViewHistory?: () => void;
};

type BedInteractionDialogProps = {
  open: boolean;
  mode?: 'persisted' | 'preview';
  label: string;
  spaceId?: string;
  bedId?: string;
  bedNumber: string;
  locationLine?: string;
  status?: AccommodationStatus;
  rent?: number | null;
  deposit?: number | null;
  canEdit: boolean;
  saving?: boolean;
  occupancy?: OccupancyButtons;
  onClose: () => void;
  onSave: (draft: BedInteractionDraft) => void;
};

export function BedInteractionDialog({
  open,
  mode = 'persisted',
  label,
  spaceId,
  bedId,
  bedNumber,
  locationLine,
  status,
  rent,
  deposit,
  canEdit,
  saving = false,
  occupancy,
  onClose,
  onSave,
}: BedInteractionDialogProps) {
  const { t } = useTranslation();
  const [numberText, setNumberText] = useState(bedNumber);
  const [rentText, setRentText] = useState(rent == null ? '' : String(rent));
  const [depositText, setDepositText] = useState(deposit == null ? '' : String(deposit));
  const [rentError, setRentError] = useState<string | null>(null);
  const [depositError, setDepositError] = useState<string | null>(null);
  const [discardOpen, setDiscardOpen] = useState(false);
  const [busyAction, setBusyAction] = useState<'allocate' | 'reserve' | null>(null);
  const busyRef = useRef(false);

  useEffect(() => {
    if (open) {
      busyRef.current = false;
      setBusyAction(null);
      setNumberText(bedNumber);
      setRentText(rent == null ? '' : String(rent));
      setDepositText(deposit == null ? '' : String(deposit));
      setRentError(null);
      setDepositError(null);
      setDiscardOpen(false);
    }
  }, [bedNumber, deposit, open, rent]);

  const current = useMemo(
    () => ({
      bedNumber,
      rent: rent ?? null,
      deposit: deposit ?? null,
    }),
    [bedNumber, deposit, rent],
  );

  const draft = useMemo(
    () => ({
      bedNumber: numberText,
      rent: parseOptionalMoney(rentText),
      deposit: parseOptionalMoney(depositText),
    }),
    [depositText, numberText, rentText],
  );

  const occupiedStay = mode === 'persisted' && status === 'OCCUPIED' && Boolean(spaceId && bedId);
  const structureEditable = canEdit && !occupiedStay;
  const unchanged = isBedDraftUnchanged(current, draft);

  const requestClose = () => {
    if (saving) {
      return;
    }
    if (structureEditable && !unchanged) {
      setDiscardOpen(true);
      return;
    }
    onClose();
  };

  const validateOccupancyPricing = (): boolean => {
    const rentMissing = isOccupancyMoneyMissing(rentText);
    const depositMissing = isOccupancyMoneyMissing(depositText);
    setRentError(
      rentMissing ? t('accommodation.fields.rentRequired', { defaultValue: 'Rent is required' }) : null,
    );
    setDepositError(
      depositMissing
        ? t('accommodation.fields.depositRequired', { defaultValue: 'Deposit is required' })
        : null,
    );
    return !rentMissing && !depositMissing;
  };

  const runOccupancyAction = (action: 'allocate' | 'reserve', run?: () => void) => {
    if (!run || busyRef.current || saving) {
      return;
    }
    if (!validateOccupancyPricing()) {
      return;
    }
    busyRef.current = true;
    setBusyAction(action);
    run();
  };

  const saveLabel =
    mode === 'preview'
      ? t('common.save')
      : t('accommodation.beds.updateAction', { defaultValue: 'Update' });

  return (
    <>
      <Dialog
        open={open}
        onClose={saving || discardOpen ? undefined : requestClose}
        fullWidth
        maxWidth="sm"
        transitionDuration={0}
        slotProps={{ paper: { sx: { maxHeight: '85vh' } } }}
      >
        <DialogTitle sx={{ pr: 1 }}>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'flex-start' }}>
            <Stack
              sx={{
                width: 36,
                height: 36,
                borderRadius: 1.25,
                bgcolor: '#ECFBF3',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <BedSingle size={18} color="#059669" />
            </Stack>
            <Stack spacing={0.5} sx={{ flex: 1, minWidth: 0 }}>
              <Typography sx={{ fontWeight: 700, fontSize: 18 }}>{label}</Typography>
              {locationLine ? (
                <Typography sx={{ color: colors.textSecondary, fontSize: 13 }}>
                  {locationLine}
                </Typography>
              ) : null}
              {status ? <StatusChip label={t(`accommodation.status.${status}`)} /> : null}
            </Stack>
            <IconButton
              aria-label={t('common.close')}
              onClick={requestClose}
              disabled={saving}
              size="small"
            >
              <X size={18} />
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            {occupiedStay && spaceId && bedId ? (
              <OccupiedBedStaySection
                spaceId={spaceId}
                bedId={bedId}
                bedNumber={bedNumber}
                locationLine={locationLine}
              />
            ) : (
              <>
            <Typography sx={{ fontWeight: 700, fontSize: 14 }}>
              {t('accommodation.beds.detailsSection', { defaultValue: 'Bed details' })}
            </Typography>
            <TextField
              label={t('accommodation.beds.bedNumberLabel', { defaultValue: 'Bed number' })}
              value={numberText}
              onChange={(event) => setNumberText(event.target.value)}
              disabled={!structureEditable}
              fullWidth
            />
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
              <TextField
                label={t('accommodation.fields.rent', { defaultValue: 'Rent' })}
                value={rentText}
                onChange={(event) => {
                  setRentText(event.target.value);
                  if (rentError) {
                    setRentError(null);
                  }
                }}
                disabled={!structureEditable}
                type="number"
                placeholder={t('accommodation.fields.enterRent', { defaultValue: 'Enter rent' })}
                error={Boolean(rentError)}
                helperText={rentError}
                slotProps={{
                  input: {
                    startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                  },
                  htmlInput: { min: 0 },
                }}
                fullWidth
              />
              <TextField
                label={t('accommodation.fields.deposit', { defaultValue: 'Deposit' })}
                value={depositText}
                onChange={(event) => {
                  setDepositText(event.target.value);
                  if (depositError) {
                    setDepositError(null);
                  }
                }}
                disabled={!structureEditable}
                type="number"
                placeholder={t('accommodation.fields.enterDeposit', {
                  defaultValue: 'Enter deposit',
                })}
                error={Boolean(depositError)}
                helperText={depositError}
                slotProps={{
                  input: {
                    startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                  },
                  htmlInput: { min: 0 },
                }}
                fullWidth
              />
            </Stack>

            {structureEditable ? (
              <Button
                variant="contained"
                disabled={saving || unchanged}
                onClick={() => onSave(draft)}
              >
                {saveLabel}
              </Button>
            ) : null}
              </>
            )}

            {occupancy ? (
              <OccupancyActionButtons
                status={occupancy.status ?? status}
                occupancyId={occupancy.occupancyId}
                memberId={occupancy.memberId}
                canManage={occupancy.canManage !== false}
                title={t('occupancy.accommodationActions.title', {
                  defaultValue: 'Occupancy actions',
                })}
                pendingAction={busyAction}
                onAllocate={
                  occupancy.onAllocate
                    ? () => runOccupancyAction('allocate', occupancy.onAllocate)
                    : undefined
                }
                onReserve={
                  occupancy.onReserve
                    ? () => runOccupancyAction('reserve', occupancy.onReserve)
                    : undefined
                }
                onMoveIn={occupancy.onMoveIn}
                onCancel={occupancy.onCancel}
                onTransfer={occupancy.onTransfer}
                onVacate={occupancy.onVacate}
                onViewHistory={occupancy.onViewHistory}
              />
            ) : null}
          </Stack>
        </DialogContent>
      </Dialog>
      <ConfirmDialog
        open={discardOpen}
        title={t('accommodation.beds.unsavedTitle', { defaultValue: 'Discard changes?' })}
        description={t('accommodation.beds.unsavedMessage', {
          defaultValue: 'Your bed details have not been saved.',
        })}
        confirmLabel={t('common.discard', { defaultValue: 'Discard' })}
        cancelLabel={t('common.cancel')}
        destructive
        onConfirm={() => {
          setDiscardOpen(false);
          onClose();
        }}
        onClose={() => setDiscardOpen(false)}
      />
    </>
  );
}
