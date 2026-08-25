import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { GlobalDirectoryFrame } from '@/modules/global/components/GlobalDirectoryFrame';
import { SpaceNameChip } from '@/modules/global/components/SpaceNameChip';
import { useAcrossSpaceRecords } from '@/modules/global/hooks/useAcrossSpaceRecords';
import { useOpenSpaceRecord } from '@/modules/global/hooks/useOpenSpaceRecord';
import { paymentsApi } from '@/modules/payments/api/paymentsApi';
import { DataTable, type DataTableColumn } from '@/shared/components/DataTable';
import { StatusChip } from '@/shared/components/StatusChip';
import type { SpacePaymentResponse, UniversalPaymentStatus } from '@/shared/types/payments';
import { currentMonthKey, formatCurrency } from '@/shared/utils/dashboardFinancial';
import { spacePaymentsPath } from '@/routes/paths';
import { useSpaceStore } from '@/store/spaceStore';

type GlobalPaymentRow = SpacePaymentResponse & {
  id: string;
  spaceName: string;
};

function paymentTone(status: UniversalPaymentStatus): 'success' | 'warning' | 'error' | 'neutral' {
  if (status === 'PAID') return 'success';
  if (status === 'REJECTED') return 'error';
  if (status === 'PENDING' || status === 'UNDER_REVIEW' || status === 'PROOF_UPLOADED') {
    return 'warning';
  }
  return 'neutral';
}

export function GlobalPaymentsPage() {
  const { t } = useTranslation();
  const openRecord = useOpenSpaceRecord();
  const mySpaces = useSpaceStore((state) => state.mySpaces);
  const [search, setSearch] = useState('');
  const month = currentMonthKey();

  const { rows, loading, reload } = useAcrossSpaceRecords<GlobalPaymentRow>(
    mySpaces,
    `payments-${month}`,
    async (space) => {
      const list = await paymentsApi.listPayments(space.spaceId, { month });
      return (list.payments ?? []).map((payment) => ({
        ...payment,
        id: `${space.spaceId}:${payment.paymentId}`,
        spaceId: payment.spaceId || space.spaceId,
        spaceName: space.spaceName,
      }));
    },
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((row) =>
      [row.spaceName, row.memberName, row.title, row.paymentStatus].some((value) =>
        String(value).toLowerCase().includes(q),
      ),
    );
  }, [rows, search]);

  const columns: DataTableColumn<GlobalPaymentRow>[] = [
    {
      id: 'member',
      header: t('accountDirectory.member'),
      accessor: (row) => row.memberName,
      primary: true,
    },
    {
      id: 'space',
      header: t('accountDirectory.space'),
      accessor: (row) => <SpaceNameChip name={row.spaceName} />,
      primary: true,
    },
    {
      id: 'title',
      header: t('accountDirectory.title'),
      accessor: (row) => row.title,
    },
    {
      id: 'amount',
      header: t('accountDirectory.amount'),
      accessor: (row) => formatCurrency(row.amount, row.currencyCode),
    },
    {
      id: 'status',
      header: t('membership.status.label', { defaultValue: 'Status' }),
      accessor: (row) => (
        <StatusChip
          label={t(`payments.status.${row.paymentStatus}`, { defaultValue: row.paymentStatus })}
          tone={paymentTone(row.paymentStatus)}
        />
      ),
    },
    {
      id: 'due',
      header: t('accountDirectory.dueDate'),
      accessor: (row) => row.dueDate || '—',
    },
  ];

  return (
    <GlobalDirectoryFrame
      title={t('accountDirectory.paymentsTitle')}
      description={t('accountDirectory.paymentsSubtitle')}
      onRefresh={() => void reload()}
    >
      <DataTable
        columns={columns}
        rows={filtered}
        loading={loading}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder={t('accountDirectory.search')}
        emptyTitle={t('accountDirectory.paymentsEmptyTitle')}
        emptyDescription={t('accountDirectory.paymentsEmptyBody')}
        onRowClick={(row) =>
          void openRecord(row.spaceId, spacePaymentsPath(row.spaceId, row.paymentId))
        }
      />
    </GlobalDirectoryFrame>
  );
}
