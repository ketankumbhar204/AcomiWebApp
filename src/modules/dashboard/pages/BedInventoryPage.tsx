import {
  Box,
  IconButton,
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
  Building2,
  ChevronRight,
  Columns3,
  Filter,
  LayoutGrid,
  Layers,
  List,
  Search,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useSnackbar } from 'notistack';
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
import { dashFilterControlSx } from '@/shared/theme/dashButtonSx';
import { PersistedBedInteractionHost } from '@/modules/accommodation/components/PersistedBedInteractionHost';
import { usePersistedBedInteraction } from '@/modules/accommodation/hooks/usePersistedBedInteraction';
import { formatBedDisplayLabel } from '@/modules/accommodation/utils/formatBedDisplayLabel';
import { formatPricingMoney } from '@/modules/accommodation/utils/commitBedPricing';
import { bedIsSelectableForMoveIn } from '@/modules/accommodation/utils/moveInEntry';
import { ROUTES, spaceBedInventoryPath, spaceDashboardPath, spaceOccupancyWizardPath } from '@/routes/paths';
import type { BedSpaceListItem } from '../api/dashboardDrilldownApi';
import { BedInventoryRoomSections } from '../components/BedInventoryRoomSections';
import {
  PropertyOpsSummaryCards,
  type PropertyOpsFocus,
} from '../components/PropertyOpsSummaryCards';
import { useSpaceBedInventory } from '../hooks/useSpaceBedInventory';
import { useSpaceDashboard } from '../hooks/useSpaceDashboard';
import { useSpaceOccupancyList } from '../hooks/useSpaceOccupancyList';
import { isAccommodationApplicable } from '@/shared/utils/spacePermissions';

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

function pageCopy(
  status: string,
  focus: PropertyOpsFocus | null,
  t: (key: string, opts?: Record<string, unknown>) => string,
) {
  if (focus === 'moveIns') {
    return {
      title: t('dashboard.drilldown.moveInsTitle'),
      description: t('dashboard.drilldown.moveInsSubtitle'),
      empty: t('dashboard.drilldown.emptyMoveIns'),
    };
  }
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
  ...dashFilterControlSx,
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
  const { spaceId = '' } = useParams<{ spaceId: string }>();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const permissions = useSpacePermissions(spaceId);
  const [searchParams, setSearchParams] = useSearchParams();
  const status = searchParams.get('status') ?? 'AVAILABLE';
  const focusParam = searchParams.get('focus');
  const opsFocus: PropertyOpsFocus | null =
    focusParam === 'moveIns'
      ? 'moveIns'
      : status === 'AVAILABLE'
        ? 'vacant'
        : status === 'OCCUPIED'
          ? 'occupied'
          : null;
  const allocateIntent = searchParams.get('intent') === 'allocate';
  const [search, setSearch] = useState('');
  const [buildingId, setBuildingId] = useState('');
  const [floorId, setFloorId] = useState('');
  const [unitId, setUnitId] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('cards');

  const buildings = useBuildings(spaceId, Boolean(spaceId));
  const floors = useFloors(spaceId, buildingId || undefined, Boolean(buildingId));
  const units = useUnitsByFloor(
    spaceId,
    buildingId || undefined,
    floorId || undefined,
    Boolean(buildingId && floorId),
  );

  const inventoryStatus = opsFocus === 'moveIns' ? 'OCCUPIED' : status;
  const beds = useSpaceBedInventory(spaceId, inventoryStatus, search, Boolean(spaceId), {
    buildingId: buildingId || undefined,
    floorId: floorId || undefined,
    unitId: unitId || undefined,
  });
  const canManage = permissions.canManageOccupancy === true;
  const selectingForMoveIn = allocateIntent && opsFocus === 'vacant' && canManage;
  const spaceType = permissions.space?.spaceType;
  const showOpsCards =
    spaceType != null && isAccommodationApplicable(spaceType) && opsFocus != null;
  const dashboard = useSpaceDashboard(spaceId, spaceType, showOpsCards);
  const moveInsQuery = useSpaceOccupancyList(
    spaceId,
    'moveInsThisMonth',
    '',
    showOpsCards && opsFocus === 'moveIns',
  );
  const moveInsByBedId = useMemo(() => {
    const map = new Map<string, { memberName: string; moveInDate: string | null; rent: number | null; deposit: number | null }>();
    if (opsFocus !== 'moveIns') {
      return map;
    }
    for (const row of moveInsQuery.items) {
      if (!row.bedId) continue;
      map.set(row.bedId, {
        memberName: row.memberName,
        moveInDate: row.moveInDate ?? row.actualMoveInAt?.slice(0, 10) ?? null,
        rent: null,
        deposit: null,
      });
    }
    return map;
  }, [moveInsQuery.items, opsFocus]);
  const visibleBeds = useMemo(() => {
    if (opsFocus !== 'moveIns') {
      return beds.items;
    }
    return beds.items.filter((bed) => moveInsByBedId.has(bed.bedId));
  }, [beds.items, moveInsByBedId, opsFocus]);
  const copy = pageCopy(status, opsFocus, t);
  const returnTo = spaceBedInventoryPath(spaceId, status);
  const bedInteraction = usePersistedBedInteraction({
    spaceId,
    canEditStructure: permissions.canManageAccommodation === true,
    canManageOccupancy: canManage,
    returnTo,
    onSuccess: () => void beds.reload(),
  });

  useEffect(() => {
    document.title = `${copy.title} · ${t('common.appName')}`;
  }, [copy.title, t]);

  const rows: BedRow[] = useMemo(
    () => visibleBeds.map((item) => ({ ...item, id: item.bedId })),
    [visibleBeds],
  );

  const openForMoveIn = (bed: BedSpaceListItem) => {
    if (!bedIsSelectableForMoveIn(bed.status)) {
      enqueueSnackbar(t('occupancy.errors.targetUnavailable'), { variant: 'warning' });
      return;
    }
    navigate(
      spaceOccupancyWizardPath(spaceId, 'ALLOCATE', {
        bedId: bed.bedId,
        roomId: bed.roomId ?? undefined,
        unitId: bed.unitId ?? undefined,
        buildingId: bed.buildingId,
        returnTo: spaceBedInventoryPath(spaceId, 'AVAILABLE', { intent: 'allocate' }),
      }),
    );
  };

  const openBed = (bed: BedSpaceListItem) => {
    if (selectingForMoveIn) {
      openForMoveIn(bed);
      return;
    }
    bedInteraction.open({
      bedId: bed.bedId,
      roomId: bed.roomId ?? '',
      buildingId: bed.buildingId,
      floorId: bed.floorId,
      unitId: bed.unitId,
      label: formatBedDisplayLabel(bed.label, t),
      bedNumber: bed.label,
      status: bed.status as never,
      rent: bed.defaultRent,
      deposit: bed.defaultDeposit,
      locationLine: [bed.buildingName, bed.floorName, bed.unitName, bed.roomName]
        .filter(Boolean)
        .join(' · '),
    });
  };

  const selectOpsFocus = (next: PropertyOpsFocus) => {
    if (next === opsFocus) {
      return;
    }
    const params = new URLSearchParams(searchParams);
    params.set('status', next === 'vacant' ? 'AVAILABLE' : 'OCCUPIED');
    if (next === 'moveIns') {
      params.set('focus', 'moveIns');
    } else {
      params.delete('focus');
    }
    if (next !== 'vacant') {
      params.delete('intent');
    }
    setSearchParams(params, { replace: true });
    setViewMode('cards');
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

  const actionButtons = (row: BedSpaceListItem) => (
    <IconButton
      size="small"
      aria-label={t('accommodation.beds.viewBed', { defaultValue: 'View bed' })}
      onClick={(event) => {
        event.stopPropagation();
        openBed(row);
      }}
      sx={{ color: s.textMuted }}
    >
      <ChevronRight size={18} />
    </IconButton>
  );

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
      id: 'rent',
      header: t('accommodation.setup.fields.rent'),
      accessor: (row) => formatPricingMoney(row.defaultRent, t('accommodation.pricingConfirm.notSet')),
    },
    {
      id: 'deposit',
      header: t('accommodation.setup.fields.deposit'),
      accessor: (row) => formatPricingMoney(row.defaultDeposit, t('accommodation.pricingConfirm.notSet')),
    },
    {
      id: 'actions',
      header: t('common.actions'),
      align: 'right',
      width: 52,
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
      <ToggleButton value="cards" aria-label={t('accommodation.workspace.cards')}>
        <LayoutGrid size={16} />
      </ToggleButton>
      <ToggleButton value="table" aria-label={t('accommodation.workspace.table')}>
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
              ...dashFilterControlSx,
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
            {opsFocus === 'moveIns'
              ? t('dashboard.drilldown.showingMoveIns', {
                  defaultValue: 'Showing {{count}} move-ins this month',
                  count: visibleBeds.length,
                })
              : opsFocus === 'occupied'
                ? t('dashboard.drilldown.showingOccupiedBeds', {
                    defaultValue: 'Showing {{count}} occupied beds',
                    count: visibleBeds.length,
                  })
                : opsFocus === 'vacant'
                  ? t('dashboard.drilldown.showingAvailableBeds', {
                      defaultValue: 'Showing {{count}} available beds',
                      count: visibleBeds.length,
                    })
                  : t('dashboard.drilldown.showingCount', {
                      defaultValue: '{{count}} beds',
                      count: visibleBeds.length,
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
      <Stack spacing={`${DASHBOARD_UX.sectionGap}px`} sx={{ width: '100%', minWidth: 0 }}>
        <PageHeader
          title={copy.title}
          description={copy.description}
          breadcrumbs={[
            { label: t('navigation.dashboard'), to: spaceDashboardPath(spaceId) },
            {
              label: copy.title,
              to: spaceBedInventoryPath(
                spaceId,
                opsFocus === 'vacant' ? 'AVAILABLE' : 'OCCUPIED',
                opsFocus === 'moveIns' ? { focus: 'moveIns' } : undefined,
              ),
            },
          ]}
        />

        {showOpsCards && dashboard.accommodationOperations ? (
          <PropertyOpsSummaryCards
            operations={dashboard.accommodationOperations}
            selected={opsFocus}
            onSelect={selectOpsFocus}
          />
        ) : null}

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
            loading={beds.loading || (opsFocus === 'moveIns' && moveInsQuery.loading)}
            onRowClick={(row) => openBed(row)}
            emptyTitle={copy.empty}
            emptyDescription={t('dashboard.drilldown.emptyBedsDescription')}
          />
        ) : (beds.loading && beds.items.length === 0) ||
          (opsFocus === 'moveIns' && moveInsQuery.loading && moveInsQuery.items.length === 0) ? (
          <LoadingState />
        ) : visibleBeds.length === 0 ? (
          <EmptyState
            title={copy.empty}
            description={t('dashboard.drilldown.emptyBedsDescription')}
            icon={<BedDouble size={28} />}
          />
        ) : (
          <BedInventoryRoomSections
            beds={visibleBeds}
            spaceId={spaceId}
            moveInsByBedId={moveInsByBedId}
            onViewBed={openBed}
          />
        )}
      </Stack>
      <PersistedBedInteractionHost interaction={bedInteraction} />
    </PageContainer>
  );
}
