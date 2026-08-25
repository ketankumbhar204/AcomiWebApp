import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { GlobalDirectoryFrame } from '@/modules/global/components/GlobalDirectoryFrame';
import { SpaceNameChip } from '@/modules/global/components/SpaceNameChip';
import { useAcrossSpaceRecords } from '@/modules/global/hooks/useAcrossSpaceRecords';
import { useOpenSpaceRecord } from '@/modules/global/hooks/useOpenSpaceRecord';
import { mealsApi } from '@/modules/meals/api/mealsApi';
import { DataTable, type DataTableColumn } from '@/shared/components/DataTable';
import { StatusChip } from '@/shared/components/StatusChip';
import type { DailyMenuResponse } from '@/shared/types/meals';
import { resolveSpacePermissions } from '@/shared/utils/spacePermissions';
import { spaceMealsPath } from '@/routes/paths';
import { useSpaceStore } from '@/store/spaceStore';

type GlobalMealRow = DailyMenuResponse & {
  id: string;
  spaceId: string;
  spaceName: string;
};

export function GlobalMealsPage() {
  const { t } = useTranslation();
  const openRecord = useOpenSpaceRecord();
  const mySpaces = useSpaceStore((state) => state.mySpaces);
  const [search, setSearch] = useState('');

  const { rows, loading, reload } = useAcrossSpaceRecords<GlobalMealRow>(
    mySpaces,
    'meals',
    async (space) => {
      const permissions = resolveSpacePermissions(space);
      if (permissions.canViewMeals === false) {
        return [];
      }
      const menus = await mealsApi.getDailyMenusToday(space.spaceId);
      return menus.map((menu) => ({
        ...menu,
        id: `${space.spaceId}:${menu.menuDate}:${menu.mealType}`,
        spaceId: space.spaceId,
        spaceName: space.spaceName,
      }));
    },
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((row) => {
      const items = (row.options ?? []).map((option) => option.label).join(' ');
      return [row.spaceName, row.mealType, row.status, items].some((value) =>
        value.toLowerCase().includes(q),
      );
    });
  }, [rows, search]);

  const columns: DataTableColumn<GlobalMealRow>[] = [
    {
      id: 'space',
      header: t('accountDirectory.space'),
      accessor: (row) => <SpaceNameChip name={row.spaceName} />,
      primary: true,
    },
    {
      id: 'meal',
      header: t('accountDirectory.meal'),
      accessor: (row) => t(`meals.mealType.${row.mealType}`, { defaultValue: row.mealType }),
      primary: true,
    },
    {
      id: 'items',
      header: t('accountDirectory.menuItems'),
      accessor: (row) =>
        (row.options ?? [])
          .filter((option) => option.isAvailable !== false)
          .map((option) => option.label)
          .join(', ') || '—',
    },
    {
      id: 'status',
      header: t('membership.status.label', { defaultValue: 'Status' }),
      accessor: (row) => (
        <StatusChip
          label={t(`meals.status.${row.status}`, { defaultValue: row.status })}
          tone={row.status === 'PUBLISHED' ? 'success' : 'warning'}
        />
      ),
    },
  ];

  return (
    <GlobalDirectoryFrame
      title={t('accountDirectory.mealsTitle')}
      description={t('accountDirectory.mealsSubtitle')}
      onRefresh={() => void reload()}
    >
      <DataTable
        columns={columns}
        rows={filtered}
        loading={loading}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder={t('accountDirectory.search')}
        emptyTitle={t('accountDirectory.mealsEmptyTitle')}
        emptyDescription={t('accountDirectory.mealsEmptyBody')}
        onRowClick={(row) => void openRecord(row.spaceId, spaceMealsPath(row.spaceId, row.menuDate))}
      />
    </GlobalDirectoryFrame>
  );
}
