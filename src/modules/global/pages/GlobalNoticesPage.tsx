import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { notificationsApi } from '@/modules/dashboard/api/notificationsApi';
import { GlobalDirectoryFrame } from '@/modules/global/components/GlobalDirectoryFrame';
import { SpaceNameChip } from '@/modules/global/components/SpaceNameChip';
import { useAcrossSpaceRecords } from '@/modules/global/hooks/useAcrossSpaceRecords';
import { DataTable, type DataTableColumn } from '@/shared/components/DataTable';
import { StatusChip } from '@/shared/components/StatusChip';
import type { SpaceNotification } from '@/shared/types/dashboard';
import { navigateFromNotificationType } from '@/shared/utils/notificationDeepLinks';
import { canManageNotifications } from '@/shared/utils/spaceOperator';
import { findMySpaceEntry, resolveSpacePermissions } from '@/shared/utils/spacePermissions';
import { useSpaceStore } from '@/store/spaceStore';

type GlobalNoticeRow = SpaceNotification & {
  id: string;
  spaceName: string;
};

export function GlobalNoticesPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const mySpaces = useSpaceStore((state) => state.mySpaces);
  const switchSpace = useSpaceStore((state) => state.switchSpace);
  const [search, setSearch] = useState('');

  const { rows, loading, reload } = useAcrossSpaceRecords<GlobalNoticeRow>(
    mySpaces,
    'notices',
    async (space) => {
      const list = await notificationsApi.listNotifications(space.spaceId, false);
      return (list.notifications ?? []).map((notice) => ({
        ...notice,
        id: `${space.spaceId}:${notice.notificationId}`,
        spaceId: notice.spaceId || space.spaceId,
        spaceName: space.spaceName,
      }));
    },
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((row) =>
      [row.spaceName, row.title, row.message ?? '', row.notificationType].some((value) =>
        String(value).toLowerCase().includes(q),
      ),
    );
  }, [rows, search]);

  const columns: DataTableColumn<GlobalNoticeRow>[] = [
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
      id: 'status',
      header: t('membership.status.label', { defaultValue: 'Status' }),
      accessor: (row) => (
        <StatusChip
          label={row.status}
          tone={row.status === 'UNREAD' ? 'warning' : 'neutral'}
        />
      ),
    },
    {
      id: 'when',
      header: t('accountDirectory.when'),
      accessor: (row) => (row.createdAt ? new Date(row.createdAt).toLocaleString() : '—'),
    },
  ];

  const onOpen = async (row: GlobalNoticeRow) => {
    const success = await switchSpace(row.spaceId);
    if (!success) return;
    const entry = findMySpaceEntry(mySpaces, row.spaceId);
    const permissions = resolveSpacePermissions(entry);
    navigateFromNotificationType(
      navigate,
      row.spaceId,
      {
        notificationType: row.notificationType,
        entityId: row.entityId,
        actionRoute: row.actionRoute,
        message: row.message,
        title: row.title,
      },
      canManageNotifications(permissions),
    );
  };

  return (
    <GlobalDirectoryFrame
      title={t('accountDirectory.noticesTitle')}
      description={t('accountDirectory.noticesSubtitle')}
      onRefresh={() => void reload()}
    >
      <DataTable
        columns={columns}
        rows={filtered}
        loading={loading}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder={t('accountDirectory.search')}
        emptyTitle={t('accountDirectory.noticesEmptyTitle')}
        emptyDescription={t('accountDirectory.noticesEmptyBody')}
        onRowClick={(row) => void onOpen(row)}
      />
    </GlobalDirectoryFrame>
  );
}
