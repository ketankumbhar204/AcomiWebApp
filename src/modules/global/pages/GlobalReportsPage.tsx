import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { spaceTypeLabelKey } from '@/modules/onboarding/components/createSpace/createSpaceVisuals';
import { GlobalDirectoryFrame } from '@/modules/global/components/GlobalDirectoryFrame';
import { SpaceNameChip } from '@/modules/global/components/SpaceNameChip';
import { useGlobalDashboard } from '@/modules/global/hooks/useGlobalDashboard';
import { useOpenSpaceRecord } from '@/modules/global/hooks/useOpenSpaceRecord';
import { DataTable, type DataTableColumn } from '@/shared/components/DataTable';
import { StatusChip } from '@/shared/components/StatusChip';
import type { GlobalSpaceStatus } from '@/shared/types/dashboard';
import type { SpaceType } from '@/shared/types/space';
import { spaceDashboardPath } from '@/routes/paths';
import { useSpaceStore } from '@/store/spaceStore';

type GlobalReportRow = GlobalSpaceStatus & { id: string };

export function GlobalReportsPage() {
  const { t } = useTranslation();
  const openRecord = useOpenSpaceRecord();
  const mySpaces = useSpaceStore((state) => state.mySpaces);
  const { data, loading, reload } = useGlobalDashboard(true);
  const [search, setSearch] = useState('');

  const rows: GlobalReportRow[] = useMemo(() => {
    const summaries = data?.spaceSummaries ?? [];
    if (summaries.length > 0) {
      return summaries.map((space) => ({ ...space, id: space.spaceId }));
    }
    return mySpaces.map((space) => ({
      id: space.spaceId,
      spaceId: space.spaceId,
      spaceName: space.spaceName,
      spaceType: space.spaceType,
      membershipRole: space.membershipRole,
      pendingActionCount: 0,
      needsAttention: false,
    }));
  }, [data?.spaceSummaries, mySpaces]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((row) =>
      [row.spaceName, row.membershipRole, String(row.spaceType ?? '')].some((value) =>
        value.toLowerCase().includes(q),
      ),
    );
  }, [rows, search]);

  const columns: DataTableColumn<GlobalReportRow>[] = [
    {
      id: 'space',
      header: t('accountDirectory.space'),
      accessor: (row) => <SpaceNameChip name={row.spaceName} />,
      primary: true,
    },
    {
      id: 'type',
      header: t('accountDirectory.type'),
      accessor: (row) => {
        const type = row.spaceType as SpaceType | undefined;
        return type ? t(spaceTypeLabelKey(type), { defaultValue: type }) : '—';
      },
    },
    {
      id: 'role',
      header: t('accountDirectory.role'),
      accessor: (row) => t(`spaces.roles.${row.membershipRole}`, { defaultValue: row.membershipRole }),
    },
    {
      id: 'pending',
      header: t('accountDirectory.pending'),
      accessor: (row) => row.pendingActionCount,
    },
    {
      id: 'attention',
      header: t('accountDirectory.attention'),
      accessor: (row) => (
        <StatusChip
          label={
            row.needsAttention
              ? t('spaces.globalDashboard.needsAttention')
              : t('spaces.globalDashboard.attentionOk')
          }
          tone={row.needsAttention ? 'warning' : 'success'}
        />
      ),
      primary: true,
    },
  ];

  return (
    <GlobalDirectoryFrame
      title={t('accountDirectory.reportsTitle')}
      description={t('accountDirectory.reportsSubtitle')}
      onRefresh={() => void reload()}
    >
      <DataTable
        columns={columns}
        rows={filtered}
        loading={loading}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder={t('accountDirectory.search')}
        emptyTitle={t('accountDirectory.reportsEmptyTitle')}
        emptyDescription={t('accountDirectory.reportsEmptyBody')}
        onRowClick={(row) => void openRecord(row.spaceId, spaceDashboardPath(row.spaceId))}
      />
    </GlobalDirectoryFrame>
  );
}
