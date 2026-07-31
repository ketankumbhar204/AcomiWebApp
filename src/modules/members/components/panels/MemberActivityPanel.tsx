import { useTranslation } from 'react-i18next';
import { DataTable, type DataTableColumn } from '@/shared/components/DataTable';
import { ErrorState } from '@/shared/components/ErrorState';
import { PageSection } from '@/shared/components/PageSection';
import { useMemberAuditHistory } from '../../hooks/useMemberDetailData';

type MemberActivityPanelProps = {
  spaceId: string;
  memberId: string;
};

export function MemberActivityPanel({ spaceId, memberId }: MemberActivityPanelProps) {
  const { t } = useTranslation();
  const { history, loading, error, reload } = useMemberAuditHistory(spaceId, memberId);

  if (error) {
    return (
      <ErrorState
        title={t('common.errors.generic')}
        message={error instanceof Error ? error.message : t('common.errors.generic')}
        onRetry={() => void reload()}
      />
    );
  }

  const rows = history.map((entry) => ({ ...entry, id: entry.historyId }));

  const columns: DataTableColumn<(typeof rows)[number]>[] = [
    {
      id: 'action',
      header: t('membership.workspace.event'),
      accessor: (row) => row.action,
      primary: true,
    },
    {
      id: 'change',
      header: t('membership.workspace.change'),
      accessor: (row) => `${row.oldValue ?? '—'} → ${row.newValue ?? '—'}`,
      primary: true,
    },
    {
      id: 'by',
      header: t('membership.workspace.changedBy'),
      accessor: (row) => row.changedByName,
    },
    {
      id: 'when',
      header: t('membership.details.created'),
      accessor: (row) => new Date(row.changedAt).toLocaleString(),
    },
  ];

  return (
    <PageSection title={t('membership.detailTabs.history')}>
      <DataTable
        columns={columns}
        rows={rows}
        loading={loading}
        emptyTitle={t('membership.workspace.noActivity')}
        emptyDescription={t('membership.workspace.noActivityBody')}
      />
    </PageSection>
  );
}
