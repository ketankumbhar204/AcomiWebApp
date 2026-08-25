import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { complaintsApi } from '@/modules/complaints/api/complaintsApi';
import { GlobalDirectoryFrame } from '@/modules/global/components/GlobalDirectoryFrame';
import { SpaceNameChip } from '@/modules/global/components/SpaceNameChip';
import { useAcrossSpaceRecords } from '@/modules/global/hooks/useAcrossSpaceRecords';
import { useOpenSpaceRecord } from '@/modules/global/hooks/useOpenSpaceRecord';
import { DataTable, type DataTableColumn } from '@/shared/components/DataTable';
import { StatusChip } from '@/shared/components/StatusChip';
import type { ComplaintResponse, ComplaintStatus } from '@/shared/types/complaints';
import { resolveSpacePermissions } from '@/shared/utils/spacePermissions';
import { spaceComplaintsPath } from '@/routes/paths';
import { useSpaceStore } from '@/store/spaceStore';

type GlobalComplaintRow = ComplaintResponse & {
  id: string;
  spaceName: string;
};

function complaintTone(status: ComplaintStatus): 'success' | 'warning' | 'error' | 'neutral' | 'info' {
  if (status === 'RESOLVED' || status === 'CLOSED') return 'success';
  if (status === 'CANCELLED') return 'neutral';
  if (status === 'OPEN') return 'error';
  return 'warning';
}

export function GlobalComplaintsPage() {
  const { t } = useTranslation();
  const openRecord = useOpenSpaceRecord();
  const mySpaces = useSpaceStore((state) => state.mySpaces);
  const [search, setSearch] = useState('');

  const { rows, loading, reload } = useAcrossSpaceRecords<GlobalComplaintRow>(
    mySpaces,
    'complaints',
    async (space) => {
      const permissions = resolveSpacePermissions(space);
      const canSeeAll = permissions.canViewAllComplaints || permissions.canManageComplaints;
      const list = await complaintsApi.list(space.spaceId, canSeeAll ? undefined : { mine: true });
      return (list.complaints ?? []).map((complaint) => ({
        ...complaint,
        id: `${space.spaceId}:${complaint.complaintId}`,
        spaceId: complaint.spaceId || space.spaceId,
        spaceName: space.spaceName,
      }));
    },
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((row) =>
      [row.spaceName, row.title, row.status, row.category, row.createdByMemberName ?? ''].some(
        (value) => String(value).toLowerCase().includes(q),
      ),
    );
  }, [rows, search]);

  const columns: DataTableColumn<GlobalComplaintRow>[] = [
    {
      id: 'title',
      header: t('accountDirectory.subject'),
      accessor: (row) => row.title,
      primary: true,
    },
    {
      id: 'space',
      header: t('accountDirectory.space'),
      accessor: (row) => <SpaceNameChip name={row.spaceName} />,
      primary: true,
    },
    {
      id: 'category',
      header: t('complaints.fields.category'),
      accessor: (row) => t(`complaints.category.${row.category}`, { defaultValue: row.category }),
    },
    {
      id: 'status',
      header: t('membership.status.label', { defaultValue: 'Status' }),
      accessor: (row) => (
        <StatusChip
          label={t(`complaints.status.${row.status}`, { defaultValue: row.status })}
          tone={complaintTone(row.status)}
        />
      ),
    },
    {
      id: 'reporter',
      header: t('complaints.fields.reporter'),
      accessor: (row) => row.createdByMemberName || '—',
    },
  ];

  return (
    <GlobalDirectoryFrame
      title={t('accountDirectory.complaintsTitle')}
      description={t('accountDirectory.complaintsSubtitle')}
      onRefresh={() => void reload()}
    >
      <DataTable
        columns={columns}
        rows={filtered}
        loading={loading}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder={t('accountDirectory.search')}
        emptyTitle={t('accountDirectory.complaintsEmptyTitle')}
        emptyDescription={t('accountDirectory.complaintsEmptyBody')}
        onRowClick={(row) =>
          void openRecord(row.spaceId, spaceComplaintsPath(row.spaceId, row.complaintId))
        }
      />
    </GlobalDirectoryFrame>
  );
}
