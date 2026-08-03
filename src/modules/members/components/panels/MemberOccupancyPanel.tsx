import { Stack, Typography, useTheme } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { DASHBOARD_UX, dashSurfaces } from '@/modules/dashboard/theme/dashboardUx';
import { DataTable, type DataTableColumn } from '@/shared/components/DataTable';
import { EmptyState } from '@/shared/components/EmptyState';
import { ErrorState } from '@/shared/components/ErrorState';
import { InfoRow } from '@/shared/components/InfoRow';
import { LoadingState } from '@/shared/components/LoadingState';
import { PageSection } from '@/shared/components/PageSection';
import { useMemberOccupancies } from '../../hooks/useMemberDetailData';

type MemberOccupancyPanelProps = {
  spaceId: string;
  memberId: string;
  mode: 'current' | 'history';
};

export function MemberOccupancyPanel({ spaceId, memberId, mode }: MemberOccupancyPanelProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);
  const { data, loading, error, reload } = useMemberOccupancies(spaceId, memberId);

  if (loading && !data) {
    return <LoadingState />;
  }

  if (error) {
    return (
      <ErrorState
        title={t('common.errors.generic')}
        message={error instanceof Error ? error.message : t('common.errors.generic')}
        onRetry={() => void reload()}
      />
    );
  }

  if (mode === 'current') {
    const current = data?.currentOccupancy as
      | {
          buildingName?: string;
          floorName?: string;
          unitName?: string;
          roomName?: string;
          bedName?: string;
          moveInDate?: string;
          occupancyStatus?: string;
        }
      | null
      | undefined;

    if (!current) {
      return (
        <EmptyState
          title={t('membership.workspace.noOccupancy')}
          description={t('membership.workspace.noOccupancyBody')}
        />
      );
    }

    const location = [
      current.buildingName,
      current.floorName,
      current.unitName,
      current.roomName,
      current.bedName,
    ]
      .filter(Boolean)
      .join(' · ');

    return (
      <PageSection title={t('membership.workspace.currentStay')}>
        <InfoRow label={t('membership.workspace.location')} value={location || '—'} />
        <InfoRow
          label={t('dashboard.drilldown.columns.status')}
          value={current.occupancyStatus ?? '—'}
        />
        <InfoRow
          label={t('dashboard.drilldown.columns.moveIn')}
          value={current.moveInDate ?? '—'}
        />
      </PageSection>
    );
  }

  const rows =
    data?.occupancies.map((row) => ({
      ...row,
      id: row.occupancyId,
    })) ?? [];

  const columns: DataTableColumn<(typeof rows)[number]>[] = [
    {
      id: 'location',
      header: t('membership.workspace.location'),
      accessor: (row) =>
        [row.buildingName, row.floorName, row.unitName, row.roomName, row.bedName]
          .filter(Boolean)
          .join(' · ') || '—',
      primary: true,
    },
    {
      id: 'status',
      header: t('dashboard.drilldown.columns.status'),
      accessor: (row) => row.status,
    },
    {
      id: 'moveIn',
      header: t('dashboard.drilldown.columns.moveIn'),
      accessor: (row) => row.moveInDate ?? '—',
      primary: true,
    },
    {
      id: 'vacated',
      header: t('membership.workspace.vacated'),
      accessor: (row) => row.vacatedAt?.slice(0, 10) ?? '—',
    },
  ];

  const historyRows =
    data?.history.map((entry) => ({
      ...entry,
      id: entry.historyId,
    })) ?? [];

  const historyColumns: DataTableColumn<(typeof historyRows)[number]>[] = [
    {
      id: 'event',
      header: t('membership.workspace.event'),
      accessor: (row) => row.eventType,
      primary: true,
    },
    {
      id: 'when',
      header: t('membership.details.created'),
      accessor: (row) => new Date(row.performedAt).toLocaleString(),
      primary: true,
    },
    {
      id: 'remarks',
      header: t('membership.workspace.remarks'),
      accessor: (row) => row.remarks ?? '—',
    },
  ];

  return (
    <Stack spacing={2}>
      <PageSection title={t('membership.workspace.occupancyHistory')}>
        <DataTable
          columns={columns}
          rows={rows}
          emptyTitle={t('membership.workspace.noOccupancy')}
          emptyDescription={t('membership.workspace.noOccupancyBody')}
        />
      </PageSection>
      <PageSection title={t('membership.workspace.occupancyEvents')}>
        {historyRows.length === 0 ? (
          <Typography sx={{ ...DASHBOARD_UX.body, color: s.textMuted }}>
            {t('membership.workspace.noOccupancyEvents')}
          </Typography>
        ) : (
          <DataTable columns={historyColumns} rows={historyRows} />
        )}
      </PageSection>
    </Stack>
  );
}
