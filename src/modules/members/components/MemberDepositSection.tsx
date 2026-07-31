import { Button, Stack, TextField, Typography } from '@mui/material';
import { useSnackbar } from 'notistack';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DASHBOARD_UX } from '@/modules/dashboard/theme/dashboardUx';
import { EmptyState } from '@/shared/components/EmptyState';
import { InfoRow } from '@/shared/components/InfoRow';
import { PageSection } from '@/shared/components/PageSection';
import { dashContainedButtonSx, dashOutlinedButtonSx } from '@/shared/theme/dashButtonSx';
import type { MemberDetailsResponse } from '@/shared/types/member';
import { useMemberMutations } from '../hooks/useMembers';
import {
  formatCurrency,
  parseDepositAmount,
  validateDeposit,
} from '../utils/memberDeposit';

type MemberDepositSectionProps = {
  spaceId: string;
  member: MemberDetailsResponse;
  canEdit: boolean;
};

export function MemberDepositSection({
  spaceId,
  member,
  canEdit,
}: MemberDepositSectionProps) {
  const { t } = useTranslation();
  const { enqueueSnackbar } = useSnackbar();
  const { updateDeposit } = useMemberMutations(spaceId);

  const [editing, setEditing] = useState(false);
  const [depositAmount, setDepositAmount] = useState(String(member.depositAmount ?? 0));
  const [depositPaid, setDepositPaid] = useState(String(member.depositPaid ?? 0));
  const [depositRefunded, setDepositRefunded] = useState(
    String(member.depositRefunded ?? 0),
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setDepositAmount(String(member.depositAmount ?? 0));
    setDepositPaid(String(member.depositPaid ?? 0));
    setDepositRefunded(String(member.depositRefunded ?? 0));
  }, [member.depositAmount, member.depositPaid, member.depositRefunded]);

  const handleSave = async () => {
    const body = {
      depositAmount: parseDepositAmount(depositAmount),
      depositPaid: parseDepositAmount(depositPaid),
      depositRefunded: parseDepositAmount(depositRefunded),
    };

    const validationKey = validateDeposit(body);
    if (validationKey) {
      setError(t(validationKey));
      return;
    }

    try {
      await updateDeposit.mutateAsync({ memberId: member.memberId, body });
      enqueueSnackbar(t('membership.deposit.successToast'), { variant: 'success' });
      setEditing(false);
      setError(null);
    } catch (err) {
      enqueueSnackbar(err instanceof Error ? err.message : t('common.errors.generic'), {
        variant: 'error',
      });
    }
  };

  const resetForm = () => {
    setEditing(false);
    setError(null);
    setDepositAmount(String(member.depositAmount ?? 0));
    setDepositPaid(String(member.depositPaid ?? 0));
    setDepositRefunded(String(member.depositRefunded ?? 0));
  };

  if (
    !canEdit &&
    (member.depositAmount ?? 0) === 0 &&
    (member.depositPaid ?? 0) === 0 &&
    (member.depositRefunded ?? 0) === 0
  ) {
    return (
      <PageSection title={t('membership.detailTabs.deposit')}>
        <EmptyState
          title={t('membership.deposit.emptyTitle')}
          description={t('membership.deposit.emptyDescription')}
        />
      </PageSection>
    );
  }

  if (editing && canEdit) {
    return (
      <PageSection title={t('membership.detailTabs.deposit')}>
        <Stack spacing={1.5}>
          <TextField
            size="small"
            fullWidth
            type="number"
            label={t('membership.deposit.amount')}
            value={depositAmount}
            onChange={(e) => setDepositAmount(e.target.value)}
            placeholder="e.g. 15000"
            inputProps={{ min: 0, step: 'any' }}
          />
          <TextField
            size="small"
            fullWidth
            type="number"
            label={t('membership.deposit.paid')}
            value={depositPaid}
            onChange={(e) => setDepositPaid(e.target.value)}
            placeholder="e.g. 10000"
            inputProps={{ min: 0, step: 'any' }}
          />
          <TextField
            size="small"
            fullWidth
            type="number"
            label={t('membership.deposit.refunded')}
            value={depositRefunded}
            onChange={(e) => setDepositRefunded(e.target.value)}
            placeholder="e.g. 0"
            inputProps={{ min: 0, step: 'any' }}
          />
          {error ? (
            <Typography sx={{ ...DASHBOARD_UX.caption, color: 'error.main' }}>{error}</Typography>
          ) : null}
          <Stack direction="row" spacing={1}>
            <Button
              variant="contained"
              onClick={() => void handleSave()}
              disabled={updateDeposit.isPending}
              sx={dashContainedButtonSx}
            >
              {t('common.save')}
            </Button>
            <Button
              onClick={resetForm}
              disabled={updateDeposit.isPending}
              sx={dashOutlinedButtonSx}
            >
              {t('common.cancel')}
            </Button>
          </Stack>
        </Stack>
      </PageSection>
    );
  }

  return (
    <PageSection
      title={t('membership.detailTabs.deposit')}
      actions={
        canEdit ? (
          <Button size="small" onClick={() => setEditing(true)} sx={dashOutlinedButtonSx}>
            {t('membership.deposit.edit')}
          </Button>
        ) : null
      }
    >
      <InfoRow
        label={t('membership.deposit.amount')}
        value={formatCurrency(member.depositAmount ?? 0)}
      />
      <InfoRow
        label={t('membership.deposit.paid')}
        value={formatCurrency(member.depositPaid ?? 0)}
      />
      <InfoRow
        label={t('membership.deposit.refunded')}
        value={formatCurrency(member.depositRefunded ?? 0)}
      />
      <InfoRow
        label={t('membership.deposit.balance')}
        value={formatCurrency(member.depositBalance ?? 0)}
      />
    </PageSection>
  );
}
