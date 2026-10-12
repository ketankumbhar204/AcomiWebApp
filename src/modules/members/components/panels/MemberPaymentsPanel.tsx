import { useState } from 'react';
import { Button, Stack, Typography } from '@mui/material';
import { Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useSnackbar } from 'notistack';
import { AddPaymentRecordDialog } from '@/modules/payments/components/AddPaymentRecordDialog';
import { OwnerPaymentRowActions } from '@/modules/payments/components/OwnerPaymentRowActions';
import { PaymentReceivedConfirmDialog } from '@/modules/payments/components/PaymentReceivedConfirmDialog';
import { useOwnerPaymentCardActions } from '@/modules/payments/hooks/useOwnerPaymentCardActions';
import {
  canOwnerMarkPaymentReceived,
  canOwnerSendPaymentReminder,
} from '@/modules/payments/utils/paymentHelpers';
import { DataTable, type DataTableColumn } from '@/shared/components/DataTable';
import { ErrorState } from '@/shared/components/ErrorState';
import { PageSection } from '@/shared/components/PageSection';
import { StatusChip } from '@/shared/components/StatusChip';
import { useSpacePermissions } from '@/shared/hooks/useSpacePermissions';
import { dashContainedButtonSx } from '@/shared/theme/dashButtonSx';
import { colors } from '@/shared/theme/colors';
import { canManagePayments, formatCurrency } from '@/shared/utils/dashboardFinancial';
import { usePaymentsMembers } from '@/modules/payments/hooks/usePayments';
import { formatDuesAmount, memberDuesCue } from '../../utils/memberDues';
import { useMemberPayments } from '../../hooks/useMemberDetailData';
import { useMemberDetails } from '../../hooks/useMembers';

type MemberPaymentsPanelProps = {
  spaceId: string;
  memberId: string;
};

export function MemberPaymentsPanel({ spaceId, memberId }: MemberPaymentsPanelProps) {
  const { t } = useTranslation();
  const { enqueueSnackbar } = useSnackbar();
  const permissions = useSpacePermissions(spaceId);
  const canCreate = canManagePayments(permissions.membershipRole);
  const { member } = useMemberDetails(spaceId, memberId, canCreate);
  const { payments, month, loading, error, reload } = useMemberPayments(spaceId, memberId);
  const cardActions = useOwnerPaymentCardActions(spaceId, month);
  const ledgerQuery = usePaymentsMembers(
    spaceId,
    { month, q: member?.fullName, page: 0, size: 20 },
    canCreate && Boolean(member?.fullName),
  );
  const ledger = ledgerQuery.members.find((row) => row.memberId === memberId) ?? null;
  const cue = memberDuesCue(ledger);
  const currency = ledger?.currencyCode || 'INR';
  const overdue = payments.reduce((sum, payment) => {
    if (!payment.isOverdue || payment.outstandingAmount == null || payment.outstandingAmount <= 0) {
      return sum;
    }
    if (
      payment.paymentStatus === 'PAID' ||
      payment.paymentStatus === 'UNDER_REVIEW' ||
      payment.paymentStatus === 'PROOF_UPLOADED'
    ) {
      return sum;
    }
    return sum + payment.outstandingAmount;
  }, 0);
  const nextDue = payments
    .filter((payment) => (payment.outstandingAmount ?? 0) > 0 && Boolean(payment.dueDate))
    .map((payment) => payment.dueDate)
    .sort()[0];
  const [addOpen, setAddOpen] = useState(false);

  if (error) {
    return (
      <ErrorState
        title={t('common.errors.generic')}
        message={error instanceof Error ? error.message : t('common.errors.generic')}
        onRetry={() => void reload()}
      />
    );
  }

  const rows = payments.map((payment) => ({ ...payment, id: payment.paymentId }));

  const columns: DataTableColumn<(typeof rows)[number]>[] = [
    {
      id: 'amount',
      header: t('membership.workspace.amount'),
      accessor: (row) => formatCurrency(row.amount),
      primary: true,
    },
    {
      id: 'status',
      header: t('dashboard.drilldown.columns.status'),
      accessor: (row) => (
        <StatusChip label={row.paymentStatus ?? row.status ?? '—'} tone="warning" />
      ),
    },
    {
      id: 'category',
      header: t('membership.workspace.category'),
      accessor: (row) => row.paymentCategory ?? '—',
    },
    {
      id: 'created',
      header: t('membership.details.created'),
      accessor: (row) => new Date(row.createdAt).toLocaleString(),
      primary: true,
    },
    {
      id: 'actions',
      header: '',
      accessor: (row) => {
        if (!canCreate) return null;
        const showReceived = canOwnerMarkPaymentReceived(row.paymentStatus ?? row.status);
        const showReminder = canOwnerSendPaymentReminder(row.reminderEligible);
        if (!showReceived && !showReminder) return null;
        return (
          <OwnerPaymentRowActions
            showReceived={showReceived}
            showReminder={showReminder}
            receivedLoading={cardActions.isProcessing(row.paymentId, 'received')}
            reminderLoading={cardActions.isProcessing(row.paymentId, 'reminder')}
            onReceived={() => cardActions.requestReceivedForPayment(row)}
            onReminder={() => cardActions.sendReminderForPayment(row)}
          />
        );
      },
    },
  ];

  const duesText =
    cue?.kind === 'due'
      ? t('membership.dues.pending', {
          amount: formatDuesAmount(cue.amount, currency),
          defaultValue: 'Pending: {{amount}}',
        })
      : cue?.kind === 'review'
        ? t('membership.dues.review', {
            amount: formatDuesAmount(cue.amount, currency),
            defaultValue: 'Under review: {{amount}}',
          })
        : cue?.kind === 'clear'
          ? t('membership.dues.clear', { defaultValue: 'No pending dues' })
          : null;

  return (
    <Stack spacing={1.5}>
      {ledgerQuery.error ? (
        <Typography variant="body2" color="text.secondary">
          {t('membership.dues.loadFailed', { defaultValue: 'Payment totals could not be loaded.' })}
        </Typography>
      ) : duesText ? (
        <Stack spacing={0.25}>
          <Typography
            variant="body2"
            sx={{
              fontWeight: 700,
              color: cue?.kind === 'due' ? '#D97706' : cue?.kind === 'review' ? '#2563EB' : colors.primaryDark,
            }}
          >
            {duesText}
          </Typography>
          {overdue > 0 ? (
            <Typography variant="body2" sx={{ fontWeight: 700, color: '#DC2626' }}>
              {t('membership.dues.overdue', {
                amount: formatDuesAmount(overdue, currency),
                defaultValue: 'Overdue: {{amount}}',
              })}
            </Typography>
          ) : null}
          {nextDue && cue?.kind === 'due' ? (
            <Typography variant="body2" color="text.secondary">
              {t('membership.dues.nextDue', {
                date: new Date(`${nextDue}T00:00:00`).toLocaleDateString(),
                defaultValue: 'Next due: {{date}}',
              })}
            </Typography>
          ) : null}
        </Stack>
      ) : null}
    <PageSection
      title={t('membership.workspace.paymentHistory')}
      description={t('membership.workspace.paymentMonth', { month })}
      actions={
        canCreate ? (
          <Button
            size="small"
            variant="contained"
            startIcon={<Plus size={14} />}
            onClick={() => setAddOpen(true)}
            sx={{ ...dashContainedButtonSx, bgcolor: colors.primaryDark, minHeight: 36 }}
          >
            {t('paymentCollection.addRecord.action')}
          </Button>
        ) : null
      }
    >
      <DataTable
        columns={columns}
        rows={rows}
        loading={loading}
        emptyTitle={t('membership.workspace.noPayments')}
        emptyDescription={t('membership.workspace.noPaymentsBody')}
      />
      {canCreate ? (
        <AddPaymentRecordDialog
          key={addOpen ? `${memberId}-${month}` : 'member-payment-closed'}
          open={addOpen}
          spaceId={spaceId}
          month={month}
          lockedMember={{
            memberId,
            memberName: member?.fullName ?? '',
            mobileNumber: member?.mobileNumber,
          }}
          onClose={() => setAddOpen(false)}
          onCreated={() => {
            setAddOpen(false);
            enqueueSnackbar(t('paymentCollection.addRecord.success'), { variant: 'success' });
            void reload();
          }}
        />
      ) : null}
    </PageSection>
    <PaymentReceivedConfirmDialog
      open={cardActions.confirmPayments.length > 0}
      payments={cardActions.confirmPayments}
      spaceName={permissions.space?.spaceName}
      confirming={cardActions.receivedConfirmLoading}
      onConfirm={cardActions.confirmReceived}
      onClose={cardActions.cancelConfirm}
    />
    </Stack>
  );
}
