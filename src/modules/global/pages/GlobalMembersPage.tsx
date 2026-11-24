import { Box } from '@mui/material';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { GlobalDirectoryFrame } from '@/modules/global/components/GlobalDirectoryFrame';
import { SpaceNameChip } from '@/modules/global/components/SpaceNameChip';
import { useOpenSpaceRecord } from '@/modules/global/hooks/useOpenSpaceRecord';
import { useMemberDirectory } from '@/modules/members/hooks/useMemberDirectory';
import { DataTable, type DataTableColumn } from '@/shared/components/DataTable';
import { ContactNumberLine } from '@/shared/components/ContactAndStayMeta';
import type {
  MemberDirectoryAssociationResponse,
  MemberDirectoryPersonResponse,
} from '@/shared/types/member';
import { resolveSpacePermissions } from '@/shared/utils/spacePermissions';
import { spaceDashboardPath, spaceMemberPath } from '@/routes/paths';
import { useSpaceStore } from '@/store/spaceStore';

type DirectoryRow = MemberDirectoryPersonResponse & { id: string };

const PAGE_SIZE = 20;

export function GlobalMembersPage() {
  const { t } = useTranslation();
  const openRecord = useOpenSpaceRecord();
  const mySpaces = useSpaceStore((state) => state.mySpaces);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);

  const directory = useMemberDirectory({ search, page, size: PAGE_SIZE });

  const rows: DirectoryRow[] = directory.people.map((person) => ({
    ...person,
    id: person.directoryId,
  }));

  const openAssociation = (association: MemberDirectoryAssociationResponse) => {
    const space = mySpaces.find((item) => item.spaceId === association.spaceId);
    const canManage = resolveSpacePermissions(space).canManageMembers;
    const path = canManage
      ? spaceMemberPath(association.spaceId, association.memberId)
      : spaceDashboardPath(association.spaceId);
    void openRecord(association.spaceId, path);
  };

  const openPerson = (person: DirectoryRow) => {
    const association = person.associations[0];
    if (!association) return;
    openAssociation(association);
  };

  const columns: DataTableColumn<DirectoryRow>[] = [
    {
      id: 'name',
      header: t('accountDirectory.member'),
      accessor: (row) => row.displayName,
      primary: true,
    },
    {
      id: 'mobile',
      header: t('accountDirectory.mobile'),
      accessor: (row) => <ContactNumberLine value={row.mobileNumber} />,
    },
    {
      id: 'spaces',
      header: t('accountDirectory.space'),
      accessor: (row) => (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
          {row.associations.map((association) => (
            <Box
              key={`${association.spaceId}:${association.memberId}`}
              component="button"
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                openAssociation(association);
              }}
              sx={{
                border: 0,
                p: 0,
                m: 0,
                background: 'transparent',
                cursor: 'pointer',
              }}
            >
              <SpaceNameChip name={association.spaceName} />
            </Box>
          ))}
        </Box>
      ),
      primary: true,
    },
  ];

  return (
    <GlobalDirectoryFrame
      title={t('accountDirectory.membersTitle')}
      description={t('accountDirectory.membersSubtitle')}
      onRefresh={() => void directory.reload()}
    >
      <DataTable
        columns={columns}
        rows={rows}
        loading={directory.loading}
        searchValue={search}
        onSearchChange={(value) => {
          setPage(0);
          setSearch(value);
        }}
        searchPlaceholder={t('accountDirectory.search')}
        page={page}
        pageSize={PAGE_SIZE}
        totalItems={directory.totalElements}
        onPageChange={setPage}
        emptyTitle={t('accountDirectory.membersEmptyTitle')}
        emptyDescription={t('accountDirectory.membersEmptyBody')}
        onRowClick={openPerson}
      />
    </GlobalDirectoryFrame>
  );
}
