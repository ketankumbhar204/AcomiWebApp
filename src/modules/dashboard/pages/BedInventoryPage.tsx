import {
  Box,
  Button,
  Grid,
  InputAdornment,
  MenuItem,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  useTheme,
} from '@mui/material';
import {
  BedDouble,
  Bookmark,
  Building2,
  CalendarCheck,
  Columns3,
  Filter,
  LayoutGrid,
  Layers,
  List,
  Search,
  UserPlus,
} from 'lucide-react';
import { useSnackbar } from 'notistack';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { accommodationApi } from '@/modules/accommodation/api/accommodationApi';
import {
  useBuildings,
  useFloors,
  useUnitsByFloor,
} from '@/modules/accommodation/hooks/useAccommodation';
import { DASHBOARD_UX, dashSurfaces } from '@/modules/dashboard/theme/dashboardUx';
import { ContentCard } from '@/shared/components/ContentCard';
import { DataTable, type DataTableColumn } from '@/shared/components/DataTable';
import { EmptyState } from '@/shared/components/EmptyState';
import { ErrorState } from '@/shared/components/ErrorState';
import { LoadingState } from '@/shared/components/LoadingState';
import { PageContainer } from '@/shared/components/PageContainer';
import { PageHeader } from '@/shared/components/PageHeader';
import { StatusChip, type StatusChipTone } from '@/shared/components/StatusChip';
import { useSpacePermissions } from '@/shared/hooks/useSpacePermissions';
import { colors } from '@/shared/theme/colors';
import { dashContainedButtonSx, dashOutlinedButtonSx } from '@/shared/theme/dashButtonSx';
import {
  ROUTES,
  spaceBedInventoryPath,
  spaceDashboardPath,
  spaceOccupancyWizardPath,
} from '@/routes/paths';
import type { BedSpaceListItem } from '../api/dashboardDrilldownApi';
import { BedInventoryCard } from '../components/BedInventoryCard';
import { useSpaceBedInventory } from '../hooks/useSpaceBedInventory';

type BedRow = BedSpaceListItem & { id: string };
type ViewMode = 'cards' | 'table';

const STATUS_OPTIONS = ['AVAILABLE', 'OCCUPIED', 'RESERVED', 'MAINTENANCE', 'BLOCKED', 'ALL'] as const;

function statusTone(status: string): StatusChipTone {
  switch (status) {
    case 'AVAILABLE':
      return 'success';
    case 'RESERVED':
      return 'info';
    case 'OCCUPIED':
      return 'error';
    case 'MAINTENANCE':
    case 'BLOCKED':
      return 'warning';
    default:
      return 'neutral';
  }
}

function pageCopy(status: string, t: (key: string, opts?: Record<string, unknown>) => string) {
  if (status === 'OCCUPIED') {
    return {
      title: t('dashboard.drilldown.occupiedBedsTitle'),
      description: t('dashboard.drilldown.occupiedBedsSubtitle'),
      empty: t('dashboard.drilldown.emptyOccupiedBeds'),
    };
  }
  if (status === 'RESERVED') {
    return {
      title: t('dashboard.drilldown.reservedBedsTitle'),
      description: t('dashboard.drilldown.reservedBedsSubtitle'),
      empty: t('dashboard.drilldown.emptyReservedBeds'),
    };
  }
  if (status === 'ALL') {
    return {
      title: t('dashboard.drilldown.allBedsTitle'),
      description: t('dashboard.drilldown.allBedsSubtitle'),
      empty: t('dashboard.drilldown.emptyVacantBeds'),
    };
  }
  return {
    title: t('dashboard.drilldown.vacantBedsTitle'),
    description: t('dashboard.drilldown.vacantBedsSubtitle'),
    empty: t('dashboard.drilldown.emptyVacantBeds'),
  };
}

const filterFieldSx = {
  minWidth: 148,
  '& .MuiOutlinedInput-root': {
    minHeight: DASHBOARD_UX.buttonHeight,
    height: DASHBOARD_UX.buttonHeight,
    borderRadius: `${DASHBOARD_UX.buttonRadius}px`,
  },
};

export function BedInventoryPage() {
  const { t } = useTranslation();
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const { spaceId = '' } = useParams<{ spaceId: string }>();
  const permissions = useSpacePermissions(spaceId);
  const [searchParams, setSearchParams] = useSearchParams();
  const status = searchParams.get('status') ?? 'AVAILABLE';
  const [search, setSearch] = useState('');
  const [buildingId, setBuildingId] = useState('');
  const [floorId, setFloorId] = useState('');
  const [unitId, setUnitId] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>(() =>
    status === 'AVAILABLE' || status === 'RESERVED' ? 'table' : 'cards',
  );
  const [moveInBusyId, setMoveInBusyId] = useState<string | null>(null);

  const buildings = useBuildings(spaceId, Boolean(spaceId));
  const floors = useFloors(spaceId, buildingId || undefined, Boolean(buildingId));
  const units = useUnitsByFloor(
    spaceId,
    buildingId || undefined,
    floorId || undefined,
    Boolean(buildingId && floorId),
  );

  const beds = useSpaceBedInventory(spaceId, status, search, Boolean(spaceId), {
    buildingId: buildingId || undefined,
    floorId: floorId || undefined,
    unitId: unitId || undefined,
  });
  const canManage = permissions.canManageOccupancy === true;
  const copy = pageCopy(status, t);
  const returnTo = spaceBedInventoryPath(spaceId, status);

  useEffect(() => {
    document.title = `${copy.title} · ${t('common.appName')}`;
  }, [copy.title, t]);

  const rows: BedRow[] = useMemo(
    () => beds.items.map((item) => ({ ...item, id: item.bedId })),
    [beds.items],
  );

  const openWizard = (
    mode: 'ALLOCATE' | 'RESERVE' | 'MOVE_IN',
    bed: BedSpaceListItem,
    extra?: { occupancyId?: string; memberId?: string },
  ) => {
    navigate(
      spaceOccupancyWizardPath(spaceId, mode, {
        bedId: bed.bedId,
        roomId: bed.roomId,
        unitId: bed.unitId ?? undefined,
        buildingId: bed.buildingId,
        occupancyId: extra?.occupancyId,
        memberId: extra?.memberId,
        returnTo,
      }),
    );
  };

  const handleAllocate = (bed: BedSpaceListItem) => openWizard('ALLOCATE', bed);
  const handleReserve = (bed: BedSpaceListItem) => openWizard('RESERVE', bed);

  const handleMoveIn = async (bed: BedSpaceListItem) => {
    setMoveInBusyId(bed.bedId);
    try {
      const detail = await accommodationApi.getBed(spaceId, bed.bedId);
      const occupancyId = detail.occupant?.occupancyId;
      if (!occupancyId) {
        enqueueSnackbar(
          t('occupancy.errors.moveInMissing', {
            defaultValue: 'No reservation found for this bed.',
          }),
          { variant: 'warning' },
        );
        return;
      }
      openWizard('MOVE_IN', bed, {
        occupancyId,
        memberId: detail.occupant?.memberId,
      });
    } catch (err) {
      enqueueSnackbar(err instanceof Error ? err.message : t('common.errors.generic'), {
        variant: 'error',
      });
    } finally {
      setMoveInBusyId(null);
    }
  };

  const setStatus = (next: string) => {
    setSearchParams(next ? { status: next } : {});
    setBuildingId('');
    setFloorId('');
    setUnitId('');
    if (next === 'AVAILABLE' || next === 'RESERVED') {
      setViewMode('table');
    }
  };

  const hierarchyFilters = (
    <>
      <TextField
        size="small"
        select
        value={buildingId}
        onChange={(e) => {
          setBuildingId(e.target.value);
          setFloorId('');
          setUnitId('');
        }}
        sx={filterFieldSx}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <Building2 size={14} color={s.textMuted} />
              </InputAdornment>
            ),
          },
        }}
      >
        <MenuItem value="">
          {t('dashboard.drilldown.columns.building')} · {t('common.all', { defaultValue: 'All' })}
        </MenuItem>
        {buildings.buildings.map((b) => (
          <MenuItem key={b.buildingId} value={b.buildingId}>
            {b.name}
          </MenuItem>
        ))}
      </TextField>
      <TextField
        size="small"
        select
        value={floorId}
        disabled={!buildingId}
        onChange={(e) => {
          setFloorId(e.target.value);
          setUnitId('');
        }}
        sx={filterFieldSx}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <Layers size={14} color={s.textMuted} />
              </InputAdornment>
            ),
          },
        }}
      >
        <MenuItem value="">
          {t('accommodation.floors.title', { defaultValue: 'Floor' })} ·{' '}
          {t('common.all', { defaultValue: 'All' })}
        </MenuItem>
        {floors.floors.map((f) => (
          <MenuItem key={f.floorId} value={f.floorId}>
            {f.name}
          </MenuItem>
        ))}
      </TextField>
      <TextField
        size="small"
        select
        value={unitId}
        disabled={!floorId}
        onChange={(e) => setUnitId(e.target.value)}
        sx={filterFieldSx}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <Columns3 size={14} color={s.textMuted} />
              </InputAdornment>
            ),
          },
        }}
      >
        <MenuItem value="">
          {t('accommodation.units.title', { defaultValue: 'Unit' })} ·{' '}
          {t('common.all', { defaultValue: 'All' })}
        </MenuItem>
        {units.units.map((u) => (
          <MenuItem key={u.unitId} value={u.unitId}>
            {u.name}
          </MenuItem>
        ))}
      </TextField>
    </>
  );

  const actionButtons = (row: BedSpaceListItem) => {
    if (!canManage) return null;
    if (row.status === 'AVAILABLE') {
      return (
        <Stack
          direction="row"
          spacing={0.75}
          useFlexGap
          sx={{ flexWrap: 'wrap', justifyContent: 'flex-end' }}
        >
          <Button
            size="small"
            variant="contained"
            startIcon={<UserPlus size={14} />}
            onClick={(e) => {
              e.stopPropagation();
              handleAllocate(row);
            }}
            sx={dashContainedButtonSx}
          >
            {t('occupancy.actions.allocate')}
          </Button>
          <Button
            size="small"
            variant="outlined"
            startIcon={<Bookmark size={14} />}
            onClick={(e) => {
              e.stopPropagation();
              handleReserve(row);
            }}
            sx={dashOutlinedButtonSx}
          >
            {t('occupancy.actions.reserve')}
          </Button>
        </Stack>
      );
    }
    if (row.status === 'RESERVED') {
      return (
        <Button
          size="small"
          variant="contained"
          startIcon={<CalendarCheck size={14} />}
          disabled={moveInBusyId === row.bedId}
          onClick={(e) => {
            e.stopPropagation();
            void handleMoveIn(row);
          }}
          sx={dashContainedButtonSx}
        >
          {t('occupancy.actions.moveIn')}
        </Button>
      );
    }
    return null;
  };

  const columns: DataTableColumn<BedRow>[] = [
    {
      id: 'label',
      header: t('dashboard.drilldown.columns.bed'),
      accessor: (row) =>
        t('accommodation.beds.bedLabel', { defaultValue: 'Bed {{label}}', label: row.label }),
      sortable: true,
      primary: true,
    },
    {
      id: 'building',
      header: t('dashboard.drilldown.columns.building'),
      accessor: (row) => row.buildingName ?? '—',
    },
    {
      id: 'room',
      header: t('dashboard.drilldown.columns.room'),
      accessor: (row) =>
        [row.floorName, row.unitName, row.roomName].filter(Boolean).join(' · ') || '—',
      primary: true,
    },
    {
      id: 'status',
      header: t('dashboard.drilldown.columns.status'),
      accessor: (row) => (
        <StatusChip
          label={t(`accommodation.status.${row.status}`, { defaultValue: row.status })}
          tone={statusTone(row.status)}
        />
      ),
    },
    {
      id: 'actions',
      header: t('common.actions'),
      align: 'right',
      width: 280,
      accessor: (row) => actionButtons(row),
    },
  ];

  const viewToggle = (
    <ToggleButtonGroup
      size="small"
      exclusive
      value={viewMode}
      onChange={(_, value: ViewMode | null) => {
        if (value) setViewMode(value);
      }}
      sx={{
        '& .MuiToggleButton-root': {
          minHeight: DASHBOARD_UX.buttonHeight,
          height: DASHBOARD_UX.buttonHeight,
          borderRadius: `${DASHBOARD_UX.buttonRadius}px`,
          px: 1.25,
          borderColor: s.border,
          color: s.textSecondary,
          '&.Mui-selected': {
            bgcolor: `${colors.primary}1A`,
            color: colors.primaryDark,
            borderColor: colors.primary,
          },
        },
      }}
    >
      <ToggleButton value="cards" aria-label="Cards">
        <LayoutGrid size={16} />
      </ToggleButton>
      <ToggleButton value="table" aria-label="Table">
        <List size={16} />
      </ToggleButton>
    </ToggleButtonGroup>
  );

  const filterBar = (
    <ContentCard>
      <Stack spacing={1.5}>
        <Stack
          direction={{ xs: 'column', lg: 'row' }}
          spacing={1}
          useFlexGap
          sx={{ alignItems: { lg: 'center' }, flexWrap: 'wrap' }}
        >
          <TextField
            size="small"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('dashboard.drilldown.searchBeds')}
            sx={{
              flex: '1 1 260px',
              minWidth: { xs: '100%', sm: 240 },
              maxWidth: { lg: 420 },
              '& .MuiOutlinedInput-root': {
                minHeight: DASHBOARD_UX.buttonHeight,
                height: DASHBOARD_UX.buttonHeight,
                borderRadius: `${DASHBOARD_UX.buttonRadius}px`,
                bgcolor: s.elevated,
              },
            }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <Search size={16} color={s.textMuted} />
                  </InputAdornment>
                ),
              },
            }}
          />

          <TextField
            size="small"
            select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            sx={{
              minWidth: 180,
              '& .MuiOutlinedInput-root': {
                minHeight: DASHBOARD_UX.buttonHeight,
                height: DASHBOARD_UX.buttonHeight,
                borderRadius: `${DASHBOARD_UX.buttonRadius}px`,
              },
            }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <Filter size={14} color={s.textMuted} />
                  </InputAdornment>
                ),
              },
            }}
          >
            {STATUS_OPTIONS.map((option) => (
              <MenuItem key={option} value={option}>
                {option === 'ALL'
                  ? `${t('dashboard.drilldown.filterTitle')} · ${t('common.all', { defaultValue: 'All' })}`
                  : t(`accommodation.status.${option}`, { defaultValue: option })}
              </MenuItem>
            ))}
          </TextField>

          {hierarchyFilters}
          <Box sx={{ ml: { lg: 'auto' } }}>{viewToggle}</Box>
        </Stack>

        <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
          <Typography sx={{ ...DASHBOARD_UX.metricCaption, color: s.textMuted }}>
            {t('dashboard.drilldown.showingCount', {
              defaultValue: '{{count}} beds',
              count: beds.items.length,
            })}
          </Typography>
          {status === 'AVAILABLE' && canManage ? (
            <Typography sx={{ ...DASHBOARD_UX.metricCaption, color: s.textSecondary }}>
              · {t('dashboard.drilldown.vacantBedsSubtitle')}
            </Typography>
          ) : null}
        </Stack>
      </Stack>
    </ContentCard>
  );

  if (!spaceId) {
    return <Navigate to={ROUTES.root} replace />;
  }

  return (
    <PageContainer gap={0}>
      <Stack spacing={`${DASHBOARD_UX.sectionGap}px`} sx={{ width: '100%' }}>
        <PageHeader
          title={copy.title}
          description={copy.description}
          breadcrumbs={[
            { label: t('navigation.dashboard'), to: spaceDashboardPath(spaceId) },
            {
              label: copy.title,
              to: spaceBedInventoryPath(spaceId, status),
            },
          ]}
        />

        {filterBar}

        {beds.error ? (
          <ErrorState
            title={t('common.errors.generic')}
            message={beds.error instanceof Error ? beds.error.message : String(beds.error)}
            onRetry={() => void beds.reload()}
          />
        ) : viewMode === 'table' ? (
          <DataTable
            columns={columns}
            rows={rows}
            loading={beds.loading}
            emptyTitle={copy.empty}
            emptyDescription={t('dashboard.drilldown.emptyBedsDescription')}
          />
        ) : beds.loading && beds.items.length === 0 ? (
          <LoadingState />
        ) : beds.items.length === 0 ? (
          <EmptyState
            title={copy.empty}
            description={t('dashboard.drilldown.emptyBedsDescription')}
            icon={<BedDouble size={28} />}
          />
        ) : (
          <Grid container spacing={1.5}>
            {beds.items.map((bed) => (
              <Grid key={bed.bedId} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
                <BedInventoryCard
                  bed={bed}
                  canManageOccupancy={canManage}
                  onAllocate={() => handleAllocate(bed)}
                  onReserve={() => handleReserve(bed)}
                  onMoveIn={() => void handleMoveIn(bed)}
                />
              </Grid>
            ))}
          </Grid>
        )}
      </Stack>
    </PageContainer>
  );
}
