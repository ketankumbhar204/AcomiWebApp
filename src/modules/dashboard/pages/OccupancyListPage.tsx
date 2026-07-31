import { Stack } from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate, useParams, useSearchParams } from 'react-router-dom';
import {
  useSpaceOccupancyList,
  type DashboardOccupancyListMode,
} from '../hooks/useSpaceOccupancyList';
import { DASHBOARD_UX } from '@/modules/dashboard/theme/dashboardUx';
import { DataTable, type DataTableColumn } from '@/shared/components/DataTable';
import { ErrorState } from '@/shared/components/ErrorState';
import { PageContainer } from '@/shared/components/PageContainer';
import { PageHeader } from '@/shared/components/PageHeader';
import { StatusChip } from '@/shared/components/StatusChip';
import type { OccupancyListItem } from '../api/dashboardDrilldownApi';
import { ROUTES, spaceDashboardPath, spaceOccupancyListPath } from '@/routes/paths';

type OccupancyRow = OccupancyListItem & { id: string };

function locationLabel(row: OccupancyListItem): string {
  return [row.buildingName, row.floorName, row.unitName, row.roomName, row.bedName]
    .filter(Boolean)
    .join(' · ');
}

export function OccupancyListPage() {
  const { t } = useTranslation();
  const { spaceId = '' } = useParams<{ spaceId: string }>();
  const [searchParams] = useSearchParams();
  const modeParam = searchParams.get('mode');
  const mode: DashboardOccupancyListMode =
    modeParam === 'moveInsThisMonth' ? 'moveInsThisMonth' : 'active';
  const [search, setSearch] = useState('');
  const occupancies = useSpaceOccupancyList(spaceId, mode, search, Boolean(spaceId));

  const isMoveIns = mode === 'moveInsThisMonth';
  const title = isMoveIns
    ? t('dashboard.drilldown.moveInsTitle')
    : t('dashboard.drilldown.occupiedBedsTitle');
  const description = isMoveIns
    ? t('dashboard.drilldown.moveInsSubtitle')
    : t('dashboard.drilldown.occupiedBedsSubtitle');

  useEffect(() => {
    document.title = `${title} · ${t('common.appName')}`;
  }, [t, title]);

  const rows: OccupancyRow[] = useMemo(
    () =>
      occupancies.items.map((item) => ({
        ...item,
        id: item.occupancyId,
      })),
    [occupancies.items],
  );

  const columns: DataTableColumn<OccupancyRow>[] = [
    {
      id: 'member',
      header: t('dashboard.drilldown.columns.member'),
      accessor: (row) => row.memberName,
      sortable: true,
      primary: true,
    },
    {
      id: 'location',
      header: t('dashboard.drilldown.columns.location'),
      accessor: (row) => locationLabel(row) || '—',
      primary: true,
    },
    {
      id: 'status',
      header: t('dashboard.drilldown.columns.status'),
      accessor: (row) => <StatusChip label={row.status} tone="success" />,
    },
    {
      id: 'moveIn',
      header: t('dashboard.drilldown.columns.moveIn'),
      accessor: (row) => row.moveInDate ?? row.actualMoveInAt?.slice(0, 10) ?? '—',
      sortable: true,
    },
  ];

  if (!spaceId) {
    return <Navigate to={ROUTES.root} replace />;
  }

  return (
    <PageContainer gap={0}>
      <Stack spacing={`${DASHBOARD_UX.sectionGap}px`} sx={{ width: '100%' }}>
      <PageHeader
        title={title}
        description={description}
        breadcrumbs={[
          { label: t('navigation.dashboard'), to: spaceDashboardPath(spaceId) },
          {
            label: title,
            to: spaceOccupancyListPath(spaceId, mode),
          },
        ]}
      />

      {occupancies.error ? (
        <ErrorState
          title={t('common.errors.generic')}
          message={
            occupancies.error instanceof Error
              ? occupancies.error.message
              : String(occupancies.error)
          }
          onRetry={() => void occupancies.reload()}
        />
      ) : (
        <DataTable
          columns={columns}
          rows={rows}
          loading={occupancies.loading}
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder={t('dashboard.drilldown.searchResidents')}
          emptyTitle={
            isMoveIns
              ? t('dashboard.drilldown.emptyMoveIns')
              : t('dashboard.drilldown.emptyOccupiedBeds')
          }
          emptyDescription={t('dashboard.drilldown.emptyOccupancyDescription')}
        />
      )}
      </Stack>
    </PageContainer>
  );
}
