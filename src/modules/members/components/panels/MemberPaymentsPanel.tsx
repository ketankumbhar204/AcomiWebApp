import { useTranslation } from 'react-i18next';
import { DataTable, type DataTableColumn } from '@/shared/components/DataTable';
import { ErrorState } from '@/shared/components/ErrorState';
import { PageSection } from '@/shared/components/PageSection';
import { StatusChip } from '@/shared/components/StatusChip';
import { formatCurrency } from '@/shared/utils/dashboardFinancial';
import { useMemberPayments } from '../../hooks/useMemberDetailData';

type MemberPaymentsPanelProps = {
  spaceId: string;
  memberId: string;
};

export function MemberPaymentsPanel({ spaceId, memberId }: MemberPaymentsPanelProps) {
  const { t } = useTranslation();
  const { payments, month, loading, error, reload } = useMemberPayments(spaceId, memberId);

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
  ];

  return (
    <PageSection
      title={t('membership.workspace.paymentHistory')}
      description={t('membership.workspace.paymentMonth', { month })}
    >
      <DataTable
        columns={columns}
        rows={rows}
        loading={loading}
        emptyTitle={t('membership.workspace.noPayments')}
        emptyDescription={t('membership.workspace.noPaymentsBody')}
      />
    </PageSection>
  );
}
