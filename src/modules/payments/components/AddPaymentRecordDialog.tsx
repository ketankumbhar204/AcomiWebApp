import { useMemo, useState } from 'react';
import {
  Autocomplete,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  InputAdornment,
  TextField,
  Typography,
  useTheme,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { ApiError } from '@/shared/api/errors';
import { DASHBOARD_UX, dashSurfaces } from '@/modules/dashboard/theme/dashboardUx';
import { useMembers } from '@/modules/members/hooks/useMembers';
import type { MemberResponse } from '@/shared/types/member';
import { usePaymentMutations } from '../hooks/usePayments';
import {
  buildManualCharge,
  findCatalogChargeType,
  isChargeablePaymentMember,
  memberMatchesPaymentSearch,
  parsePositiveAmount,
} from '../chargeCatalog';
import { rememberChargeType } from '../recentChargeTypes';
import { ChargeTypeField } from './ChargeTypeField';

export type LockedPaymentMember = {
  memberId: string;
  memberName: string;
  mobileNumber?: string;
};

type AddPaymentRecordDialogProps = {
  open: boolean;
  spaceId: string;
  month: string;
  lockedMember?: LockedPaymentMember | null;
  onClose: () => void;
  onCreated?: (paymentId: string) => void;
};

function defaultDueDate(monthKey: string): string {
  const now = new Date();
  const current = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  if (monthKey === current) {
    return `${current}-${String(now.getDate()).padStart(2, '0')}`;
  }
  return monthKey ? `${monthKey}-01` : '';
}

export function AddPaymentRecordDialog({
  open,
  spaceId,
  month,
  lockedMember = null,
  onClose,
  onCreated,
}: AddPaymentRecordDialogProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);
  const mutations = usePaymentMutations(spaceId);
  const membersQuery = useMembers(spaceId, open && lockedMember == null);
  const [selectedMember, setSelectedMember] = useState<MemberResponse | null>(null);
  const [typeId, setTypeId] = useState('');
  const [customLabel, setCustomLabel] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState(() => defaultDueDate(month));
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [confirmDeposit, setConfirmDeposit] = useState(false);

  const chargeableMembers = useMemo(
    () => membersQuery.members.filter(isChargeablePaymentMember),
    [membersQuery.members],
  );
  const activeMemberId = lockedMember?.memberId ?? selectedMember?.memberId ?? '';
  const selectedType = typeId ? findCatalogChargeType(typeId) : undefined;
  const category = selectedType?.category ?? '';
  const saving = mutations.createPayment.isPending;

  const reset = () => {
    setSelectedMember(null);
    setTypeId('');
    setCustomLabel('');
    setAmount('');
    setDueDate(defaultDueDate(month));
    setDescription('');
    setNotes('');
    setError(null);
    setConfirmDeposit(false);
  };

  const close = () => {
    if (saving) {
      return;
    }
    reset();
    onClose();
  };

  const submit = async (confirmDuplicateDeposit: boolean) => {
    if (saving) {
      return;
    }
    if (!activeMemberId) {
      setError(t('paymentCollection.addRecord.errors.member'));
      return;
    }
    if (!selectedType?.category) {
      setError(
        t(
          selectedType
            ? 'paymentCollection.addRecord.errors.category'
            : 'paymentCollection.addRecord.errors.type',
        ),
      );
      return;
    }
    const typeLabel = t(`paymentCollection.chargeCatalog.types.${selectedType.id}`);
    const draft = buildManualCharge({
      category,
      typeId: selectedType.id,
      typeLabel,
      customLabel,
      description,
    });
    if (!draft) {
      setError(
        selectedType.custom
          ? t('paymentCollection.addRecord.errors.customType')
          : t('paymentCollection.addRecord.errors.type'),
      );
      return;
    }
    const parsedAmount = parsePositiveAmount(amount);
    if (parsedAmount == null) {
      setError(t('paymentCollection.addRecord.errors.amount'));
      return;
    }

    setError(null);
    try {
      const created = await mutations.createPayment.mutateAsync({
        memberId: activeMemberId,
        paymentType: draft.paymentType,
        paymentCategory: draft.paymentCategory,
        amount: parsedAmount,
        month: dueDate ? dueDate.slice(0, 7) : month,
        dueDate: dueDate || undefined,
        title: draft.title,
        description: draft.description,
        remarks: notes.trim() || undefined,
        confirmDuplicateDeposit,
      });
      rememberChargeType(spaceId, selectedType.id);
      reset();
      onCreated?.(created.paymentId);
    } catch (submitError) {
      const depositConflict =
        submitError instanceof ApiError &&
        (submitError.errorCode === 'DEPOSIT_ALREADY_EXISTS' ||
          submitError.status === 409);
      if (depositConflict && draft.paymentType === 'DEPOSIT' && !confirmDuplicateDeposit) {
        setConfirmDeposit(true);
        return;
      }
      setError(
        submitError instanceof ApiError && submitError.message
          ? submitError.message
          : t('paymentCollection.addRecord.errors.failed'),
      );
    }
  };

  return (
    <Dialog open={open} onClose={close} fullWidth maxWidth="xs" aria-labelledby="add-payment-title">
      <DialogTitle id="add-payment-title">
        {t(lockedMember ? 'paymentCollection.addRecord.title' : 'paymentCollection.addRecord.createTitle')}
      </DialogTitle>
      <DialogContent>
        <Stack spacing={1.5} sx={{ pt: 0.5 }}>
          {lockedMember ? (
            <Stack spacing={0.25}>
              <Typography sx={{ ...DASHBOARD_UX.caption, color: s.textMuted }}>
                {t('paymentCollection.addRecord.member')}
              </Typography>
              <Typography sx={{ ...DASHBOARD_UX.cardTitle, color: s.textPrimary }} noWrap>
                {lockedMember.memberName}
              </Typography>
              {lockedMember.mobileNumber ? (
                <Typography sx={{ ...DASHBOARD_UX.body, color: s.textSecondary }} noWrap>
                  {lockedMember.mobileNumber}
                </Typography>
              ) : null}
            </Stack>
          ) : (
            <Autocomplete
              options={chargeableMembers}
              value={selectedMember}
              loading={membersQuery.loading}
              onChange={(_event, value) => setSelectedMember(value)}
              getOptionLabel={(option) => option.fullName}
              isOptionEqualToValue={(option, value) => option.memberId === value.memberId}
              filterOptions={(options, state) =>
                options.filter((option) => memberMatchesPaymentSearch(option, state.inputValue))
              }
              renderOption={(props, option) => (
                <li {...props} key={option.memberId}>
                  <Stack spacing={0}>
                    <Typography sx={{ ...DASHBOARD_UX.body, color: s.textPrimary }}>
                      {option.fullName}
                    </Typography>
                    <Typography sx={{ ...DASHBOARD_UX.caption, color: s.textMuted }}>
                      {option.mobileNumber}
                    </Typography>
                  </Stack>
                </li>
              )}
              renderInput={(params) => (
                <TextField
                  {...params}
                  required
                  label={t('paymentCollection.addRecord.member')}
                  placeholder={t('paymentCollection.addRecord.searchPlaceholder')}
                />
              )}
            />
          )}
          <ChargeTypeField
            spaceId={spaceId}
            typeId={typeId}
            onChange={(type) => {
              setTypeId(type?.id ?? '');
              setCustomLabel('');
              setConfirmDeposit(false);
            }}
          />
          <TextField
            label={t('paymentCollection.addRecord.categoryDerived')}
            value={category ? t(`paymentCollection.chargeCatalog.categories.${category}`) : ''}
            placeholder={t('paymentCollection.addRecord.categoryDerived')}
            slotProps={{
              htmlInput: { tabIndex: -1, 'aria-readonly': true },
              input: {
                readOnly: true,
                endAdornment: category ? (
                  <InputAdornment position="end">
                    <Typography sx={{ fontSize: 12, color: 'text.secondary', whiteSpace: 'nowrap' }}>
                      {t('paymentCollection.addRecord.autoSelected')}
                    </Typography>
                  </InputAdornment>
                ) : undefined,
              },
            }}
            sx={{
              '& .MuiInputBase-root': {
                bgcolor: '#F8FAFC',
              },
              '& .MuiInputBase-input': {
                cursor: 'default',
              },
            }}
          />
          {selectedType?.custom ? (
            <TextField
              required
              label={t('paymentCollection.addRecord.customType')}
              value={customLabel}
              onChange={(event) => setCustomLabel(event.target.value)}
              slotProps={{ htmlInput: { maxLength: 200 } }}
            />
          ) : null}
          <TextField
            required
            label={t('paymentCollection.addRecord.amount')}
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            slotProps={{
              input: { startAdornment: <InputAdornment position="start">₹</InputAdornment> },
              htmlInput: {
                inputMode: 'decimal',
                'aria-label': t('paymentCollection.addRecord.amount'),
              },
            }}
          />
          <TextField
            type="date"
            label={t('paymentCollection.addRecord.dueDate')}
            value={dueDate}
            onChange={(event) => setDueDate(event.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <TextField
            label={t('paymentCollection.addRecord.description')}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            slotProps={{ htmlInput: { maxLength: 500 } }}
          />
          <TextField
            label={t('paymentCollection.addRecord.notes')}
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            multiline
            minRows={2}
            slotProps={{ htmlInput: { maxLength: 2000 } }}
          />
          {confirmDeposit ? (
            <Typography sx={{ ...DASHBOARD_UX.body, color: s.textSecondary }}>
              {t('paymentCollection.addRecord.depositExists')}
            </Typography>
          ) : null}
          {error ? (
            <Typography role="alert" sx={{ ...DASHBOARD_UX.body, color: 'error.main' }}>
              {error}
            </Typography>
          ) : null}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={close} disabled={saving}>
          {t('paymentCollection.addRecord.cancel')}
        </Button>
        <Button
          variant="contained"
          disabled={saving}
          onClick={() => void submit(confirmDeposit)}
        >
          {t(
            lockedMember
              ? 'paymentCollection.addRecord.submit'
              : 'paymentCollection.addRecord.createSubmit',
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
