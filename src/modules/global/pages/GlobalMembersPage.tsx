import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { GlobalDirectoryFrame } from '@/modules/global/components/GlobalDirectoryFrame';
import { SpaceNameChip } from '@/modules/global/components/SpaceNameChip';
import { useAcrossSpaceRecords } from '@/modules/global/hooks/useAcrossSpaceRecords';
import { useOpenSpaceRecord } from '@/modules/global/hooks/useOpenSpaceRecord';
import { memberApi } from '@/modules/members/api/memberApi';
import { memberStatusTone } from '@/modules/members/utils/memberStatus';
import { DataTable, type DataTableColumn } from '@/shared/components/DataTable';
import { StatusChip } from '@/shared/components/StatusChip';
import type { MemberResponse } from '@/shared/types/member';
import { resolveSpacePermissions } from '@/shared/utils/spacePermissions';
import { spaceDashboardPath, spaceMemberPath } from '@/routes/paths';
import { useSpaceStore } from '@/store/spaceStore';

type GlobalMemberRow = MemberResponse & {
  id: string;
  spaceId: string;
  spaceName: string;
};

export function GlobalMembersPage() {
  const { t } = useTranslation();
  const openRecord = useOpenSpaceRecord();
  const mySpaces = useSpaceStore((state) => state.mySpaces);
  const [search, setSearch] = useState('');

  const { rows, loading, reload } = useAcrossSpaceRecords<GlobalMemberRow>(
    mySpaces,
    'members',
    async (space) => {
      const permissions = resolveSpacePermissions(space);
      const members = permissions.canManageMembers
        ? await memberApi.getMembers(space.spaceId)
        : [await memberApi.getMyLinkedMember(space.spaceId)].filter(Boolean);
      return members.map((member) => ({
        ...member,
        id: `${space.spaceId}:${member.memberId}`,
        spaceId: space.spaceId,
        spaceName: space.spaceName,
      }));
    },
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((row) =>
      [row.fullName, row.mobileNumber, row.spaceName, row.role].some((value) =>
        value.toLowerCase().includes(q),
      ),
    );
  }, [rows, search]);

  const columns: DataTableColumn<GlobalMemberRow>[] = [
    {
      id: 'name',
      header: t('accountDirectory.member'),
      accessor: (row) => row.fullName,
      primary: true,
    },
    {
      id: 'space',
      header: t('accountDirectory.space'),
      accessor: (row) => <SpaceNameChip name={row.spaceName} />,
      primary: true,
    },
    {
      id: 'mobile',
      header: t('accountDirectory.mobile'),
      accessor: (row) => row.mobileNumber,
    },
    {
      id: 'role',
      header: t('accountDirectory.role'),
      accessor: (row) => t(`spaces.roles.${row.role}`, { defaultValue: row.role }),
    },
    {
      id: 'status',
      header: t('membership.status.label', { defaultValue: 'Status' }),
      accessor: (row) => (
        <StatusChip
          label={t(`membership.status.${row.status}`, { defaultValue: row.status })}
          tone={memberStatusTone(row.status)}
        />
      ),
    },
  ];

  return (
    <GlobalDirectoryFrame
      title={t('accountDirectory.membersTitle')}
      description={t('accountDirectory.membersSubtitle')}
      onRefresh={() => void reload()}
    >
      <DataTable
        columns={columns}
        rows={filtered}
        loading={loading}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder={t('accountDirectory.search')}
        emptyTitle={t('accountDirectory.membersEmptyTitle')}
        emptyDescription={t('accountDirectory.membersEmptyBody')}
        onRowClick={(row) => {
          const space = mySpaces.find((item) => item.spaceId === row.spaceId);
          const canManage = resolveSpacePermissions(space).canManageMembers;
          const path = canManage
            ? spaceMemberPath(row.spaceId, row.memberId)
            : spaceDashboardPath(row.spaceId);
          void openRecord(row.spaceId, path);
        }}
      />
    </GlobalDirectoryFrame>
  );
}
