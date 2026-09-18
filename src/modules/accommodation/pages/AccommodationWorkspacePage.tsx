import {
  Box,
  Button,
  IconButton,
  Paper,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  LayoutGrid,
  List,
  Plus,
  RefreshCw,
  Search,
  Settings2,
  Wand2,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { AccommodationOpsWidget, type AccommodationOpsMetricId } from '@/modules/dashboard/components/AccommodationOpsWidget';
import { useSpaceDashboard } from '@/modules/dashboard/hooks/useSpaceDashboard';
import { useSpaceOccupancyList } from '@/modules/dashboard/hooks/useSpaceOccupancyList';
import { DASHBOARD_UX, dashSurfaces } from '@/modules/dashboard/theme/dashboardUx';
import { usePaymentsMembers } from '@/modules/payments/hooks/usePayments';
import { PageContainer } from '@/shared/components/PageContainer';
import { PageHeader } from '@/shared/components/PageHeader';
import { ErrorState } from '@/shared/components/ErrorState';
import { LoadingState } from '@/shared/components/LoadingState';
import { EmptyState } from '@/shared/components/EmptyState';
import { AppDrawer } from '@/shared/components/AppDrawer';
import { useSpacePermissions } from '@/shared/hooks/useSpacePermissions';
import { dashContainedButtonSx, dashOutlinedButtonSx } from '@/shared/theme/dashButtonSx';
import { currentMonthKey } from '@/shared/utils/dashboardFinancial';
import {
  spaceAccommodationQuickSetupPath,
  spaceOccupancyWizardPath,
} from '@/routes/paths';
import { HierarchyTree, type TreeSelection } from '../components/HierarchyTree';
import { CenterWorkspace } from '../components/CenterWorkspace';
import { EntityInspector } from '../components/EntityInspector';
import { EntityFormDrawer, type EntityFormMode } from '../components/EntityFormDrawer';
import { AccommodationPathBar } from '../components/AccommodationPathBar';
import { AccommodationEmptySetup } from '../components/AccommodationEmptySetup';
import { RoomInventoryPanel, type RoomsOpsFocus } from '../components/RoomInventoryPanel';
import { useBuildings } from '../hooks/useAccommodation';
import { getAccommodationUiProfile } from '../utils/accommodationProfile';

const VIEW_STORAGE_KEY = 'acomi.accommodation.viewMode.v2';

type ViewMode = 'cards' | 'table';

export function AccommodationWorkspacePage() {
  const { t } = useTranslation();
  const { spaceId = '' } = useParams<{ spaceId: string }>();
  const navigate = useNavigate();
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);
  const isLgDown = useMediaQuery(theme.breakpoints.down('lg'));
  const isMdDown = useMediaQuery(theme.breakpoints.down('md'));
  const permissions = useSpacePermissions(spaceId);
  const spaceType = permissions.space?.spaceType;
  const buildingsQuery = useBuildings(spaceId, permissions.canViewAccommodation);
  const dashboard = useSpaceDashboard(
    spaceId,
    spaceType,
    Boolean(spaceId && spaceType && permissions.canViewAccommodation),
  );
  const canDrillOccupancy =
    permissions.canViewSpaceOccupancies === true || permissions.canManageOccupancy;

  const [opsFocus, setOpsFocus] = useState<RoomsOpsFocus>(null);
  const [selection, setSelection] = useState<TreeSelection | null>(null);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    try {
      return localStorage.getItem(VIEW_STORAGE_KEY) === 'table' ? 'table' : 'cards';
    } catch {
      return 'cards';
    }
  });
  const [formMode, setFormMode] = useState<EntityFormMode | null>(null);
  const [treeDrawerOpen, setTreeDrawerOpen] = useState(false);
  const [childrenDrawerOpen, setChildrenDrawerOpen] = useState(false);

  const moveInsQuery = useSpaceOccupancyList(
    spaceId,
    'moveInsThisMonth',
    '',
    Boolean(spaceId && opsFocus === 'MOVE_INS_THIS_MONTH'),
  );
  const paymentMonth = currentMonthKey();
  const pendingMembersQuery = usePaymentsMembers(
    spaceId,
    { month: paymentMonth, status: 'PENDING', page: 0, size: 500 },
    Boolean(spaceId && opsFocus === 'PENDING_PAYMENTS'),
  );
  const activeOccupanciesForPending = useSpaceOccupancyList(
    spaceId,
    'active',
    '',
    Boolean(spaceId && opsFocus === 'PENDING_PAYMENTS'),
  );

  const focusedBedIds = useMemo(() => {
    const ids = new Set<string>();
    if (opsFocus === 'MOVE_INS_THIS_MONTH') {
      for (const row of moveInsQuery.items) {
        if (row.bedId) {
          ids.add(row.bedId);
        }
      }
      return ids;
    }
    if (opsFocus === 'PENDING_PAYMENTS') {
      const pendingMemberIds = new Set(
        pendingMembersQuery.members.map((member) => member.memberId),
      );
      for (const row of activeOccupanciesForPending.items) {
        if (row.bedId && pendingMemberIds.has(row.memberId)) {
          ids.add(row.bedId);
        }
      }
    }
    return ids;
  }, [
    activeOccupanciesForPending.items,
    moveInsQuery.items,
    opsFocus,
    pendingMembersQuery.members,
  ]);

  const selectedOpsMetricId = useMemo((): AccommodationOpsMetricId | null => {
    if (opsFocus === 'OCCUPIED') return 'occupied';
    if (opsFocus === 'VACANT') return 'vacant';
    if (opsFocus === 'MOVE_INS_THIS_MONTH') return 'moveIns';
    if (opsFocus === 'PENDING_PAYMENTS') return 'pendingPay';
    return null;
  }, [opsFocus]);

  const handleSelectOpsMetric = (id: AccommodationOpsMetricId) => {
    const next: RoomsOpsFocus =
      id === 'occupied'
        ? 'OCCUPIED'
        : id === 'vacant'
          ? 'VACANT'
          : id === 'moveIns'
            ? 'MOVE_INS_THIS_MONTH'
            : 'PENDING_PAYMENTS';
    setOpsFocus((prev) => (prev === next ? null : next));
    setViewMode('cards');
  };

  useEffect(() => {
    document.title = `${t('navigation.rooms')} · ${t('common.appName')}`;
  }, [t]);

  useEffect(() => {
    try {
      localStorage.setItem(VIEW_STORAGE_KEY, viewMode);
    } catch {
      /* ignore */
    }
  }, [viewMode]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        document.getElementById('accommodation-search')?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Default-select first building so center + children populate
  useEffect(() => {
    const firstBuilding = buildingsQuery.buildings[0];
    if (!selection && firstBuilding) {
      setSelection({ type: 'building', buildingId: firstBuilding.buildingId });
    }
  }, [buildingsQuery.buildings, selection]);

  const profile = useMemo(() => {
    if (!spaceType) {
      return null;
    }
    const layout =
      buildingsQuery.buildings[0]?.layoutMode ??
      (selection && 'buildingId' in selection
        ? buildingsQuery.buildings.find((b) => b.buildingId === selection.buildingId)?.layoutMode
        : undefined);
    return getAccommodationUiProfile(spaceType, layout);
  }, [buildingsQuery.buildings, selection, spaceType]);

  const handleSelect = (next: TreeSelection) => {
    setSelection(next);
    if (isLgDown) {
      setChildrenDrawerOpen(true);
      setTreeDrawerOpen(false);
    }
  };

  const openCreate = () => {
    setFormMode({ kind: 'create', parent: selection });
  };

  const openEdit = () => {
    if (selection) {
      setFormMode({ kind: 'edit', selection });
    }
  };

  if (!profile) {
    return (
      <PageContainer>
        <EmptyState
          title={t('accommodation.workspace.notApplicableTitle')}
          description={t('accommodation.workspace.notApplicableBody')}
        />
      </PageContainer>
    );
  }

  if (buildingsQuery.loading && buildingsQuery.buildings.length === 0) {
    return (
      <PageContainer>
        <LoadingState />
      </PageContainer>
    );
  }

  if (buildingsQuery.error) {
    return (
      <PageContainer>
        <ErrorState
          title={t('common.errors.generic')}
          message={t('common.errors.server')}
          onRetry={() => void buildingsQuery.reload()}
          retryLabel={t('common.retry')}
        />
      </PageContainer>
    );
  }

  const treePane = (
    <Paper
      elevation={0}
      sx={{
        height: '100%',
        borderRadius: `${DASHBOARD_UX.radius}px`,
        border: `1px solid ${s.border}`,
        bgcolor: s.surface,
        boxShadow: s.shadow,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Box sx={{ px: 1.5, pt: 1.25, pb: 0.5 }}>
        <Typography sx={{ ...DASHBOARD_UX.sidebarSection, color: s.textMuted }}>
          {t('accommodation.workspace.hierarchy')}
        </Typography>
      </Box>
      <Box sx={{ px: 1.5, pb: 1.25 }}>
        <TextField
          id="accommodation-search"
          size="small"
          fullWidth
          placeholder={t('accommodation.search.placeholder', {
            defaultValue: 'Search hierarchy...',
          })}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: `${DASHBOARD_UX.buttonRadius}px`,
              bgcolor: s.elevated,
              ...DASHBOARD_UX.body,
            },
          }}
          slotProps={{
            input: {
              startAdornment: (
                <Box sx={{ mr: 1, display: 'flex', color: s.textMuted }}>
                  <Search size={16} />
                </Box>
              ),
            },
          }}
        />
      </Box>
      <Box sx={{ flex: 1, minHeight: 0 }}>
        <HierarchyTree
          spaceId={spaceId}
          buildings={buildingsQuery.buildings}
          profile={profile}
          selection={selection}
          onSelect={handleSelect}
          search={search}
        />
      </Box>
    </Paper>
  );

  /** Selected entity dashboard (illustration, details, actions). */
  const entityDashboard = (
    <EntityInspector
      spaceId={spaceId}
      selection={selection}
      canManageAccommodation={permissions.canManageAccommodation}
      canDeactivateAccommodation={permissions.canDeactivateAccommodation === true}
      canManageOccupancy={permissions.canManageOccupancy}
      onEdit={openEdit}
      onSelect={handleSelect}
      onAddChild={openCreate}
      variant="dashboard"
    />
  );

  /** Immediate children list (or sibling beds when a bed is selected). */
  const childrenList = (
    <Paper
      elevation={0}
      sx={{
        height: '100%',
        p: `${DASHBOARD_UX.cardPadding}px`,
        borderRadius: `${DASHBOARD_UX.radius}px`,
        border: `1px solid ${s.border}`,
        bgcolor: s.surface,
        boxShadow: s.shadow,
        minHeight: 0,
        overflow: 'auto',
      }}
    >
      <CenterWorkspace
        spaceId={spaceId}
        selection={selection}
        profile={profile}
        viewMode={viewMode}
        canManage={permissions.canManageAccommodation}
        canDeactivate={permissions.canDeactivateAccommodation === true}
        onSelect={handleSelect}
        onAdd={openCreate}
        onEditEntity={(sel) => setFormMode({ kind: 'edit', selection: sel })}
        panelRole="children"
      />
    </Paper>
  );

  const inventoryPanel = (
    <RoomInventoryPanel
      spaceId={spaceId}
      canManage={permissions.canManageAccommodation}
      showUnits={Boolean(profile?.showUnits || profile?.showUnitsOnFloor)}
      onSelect={handleSelect}
      onEditEntity={(sel) => setFormMode({ kind: 'edit', selection: sel })}
      onAddBed={(roomSelection) =>
        setFormMode({ kind: 'create', parent: roomSelection })
      }
      opsFocus={opsFocus}
      focusedBedIds={focusedBedIds}
      onClearOpsFocus={() => setOpsFocus(null)}
    />
  );

  // Cards view = mock full-width room inventory (no hierarchy columns).
  // Table view keeps the classic 3-column workspace.
  const useInventoryLayout = viewMode === 'cards';
  const bedLeaf = selection?.type === 'bed';
  const centerPane = useInventoryLayout
    ? inventoryPanel
    : bedLeaf
      ? childrenList
      : entityDashboard;
  const rightPane = useInventoryLayout
    ? null
    : bedLeaf
      ? entityDashboard
      : childrenList;

  return (
    <PageContainer gap={0}>
      <Stack spacing={`${DASHBOARD_UX.sectionGap}px`} sx={{ width: '100%' }}>
        <PageHeader
          title={t('navigation.rooms')}
          description={t('accommodation.workspace.description')}
          breadcrumbs={[
            { label: permissions.space?.spaceName ?? t('navigation.space') },
            { label: t('navigation.rooms') },
          ]}
          actions={
            <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap', alignItems: 'center' }}>
              <ToggleButtonGroup
                size="small"
                exclusive
                value={viewMode}
                onChange={(_, value: ViewMode | null) => {
                  if (value) setViewMode(value);
                }}
                aria-label={t('accommodation.workspace.viewMode')}
                sx={{
                  '& .MuiToggleButton-root': {
                    minHeight: DASHBOARD_UX.buttonHeight,
                    height: DASHBOARD_UX.buttonHeight,
                    borderRadius: `${DASHBOARD_UX.buttonRadius}px`,
                    px: 1,
                  },
                }}
              >
                <ToggleButton value="cards" aria-label={t('accommodation.workspace.layoutView', { defaultValue: 'Layout view' })}>
                  <LayoutGrid size={16} />
                </ToggleButton>
                <ToggleButton value="table" aria-label={t('accommodation.workspace.listView', { defaultValue: 'List view' })}>
                  <List size={16} />
                </ToggleButton>
              </ToggleButtonGroup>
              <Tooltip title={t('common.refresh')}>
                <IconButton
                  onClick={() => {
                    void buildingsQuery.reload();
                    void dashboard.reload();
                  }}
                  aria-label={t('common.refresh')}
                  size="small"
                >
                  <RefreshCw size={16} />
                </IconButton>
              </Tooltip>
              {permissions.canManageOccupancy ? (
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => navigate(spaceOccupancyWizardPath(spaceId, 'ALLOCATE'))}
                  sx={dashOutlinedButtonSx}
                >
                  {t('occupancy.actions.allocate')}
                </Button>
              ) : null}
              {permissions.canManageAccommodation ? (
                <>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<Wand2 size={14} />}
                    onClick={() => navigate(spaceAccommodationQuickSetupPath(spaceId))}
                    sx={dashOutlinedButtonSx}
                  >
                    {t('accommodation.home.quickSetup')}
                  </Button>
                  <Button
                    size="small"
                    variant="contained"
                    startIcon={<Plus size={14} />}
                    onClick={() => setFormMode({ kind: 'create', parent: null })}
                    sx={dashContainedButtonSx}
                  >
                    {t('accommodation.home.addBuildingManually')}
                  </Button>
                </>
              ) : null}
            </Stack>
          }
        />

        {buildingsQuery.buildings.length === 0 ? (
          <AccommodationEmptySetup
            spaceId={spaceId}
            spaceType={spaceType}
            canManage={permissions.canManageAccommodation}
            canDrillOccupancy={
              permissions.canViewSpaceOccupancies === true || permissions.canManageOccupancy
            }
            onStartSetup={() => navigate(spaceAccommodationQuickSetupPath(spaceId))}
            onAddManually={() => setFormMode({ kind: 'create', parent: null })}
          />
        ) : (
          <Stack spacing={`${DASHBOARD_UX.sectionGap}px`} sx={{ width: '100%' }}>
            {dashboard.accommodationOperations ? (
              <AccommodationOpsWidget
                spaceId={spaceId}
                operations={dashboard.accommodationOperations}
                canDrillDown={canDrillOccupancy}
                columns={4}
                onSelectMetric={handleSelectOpsMetric}
                selectedMetricId={selectedOpsMetricId}
              />
            ) : null}

            {useInventoryLayout ? (
              <Box sx={{ width: '100%', minHeight: { xs: 480, md: 'calc(100vh - 260px)' } }}>
                {inventoryPanel}
              </Box>
            ) : (
              <Stack spacing={`${DASHBOARD_UX.cardGap}px`} sx={{ width: '100%' }}>
                <AccommodationPathBar
                  spaceId={spaceId}
                  selection={selection}
                  buildings={buildingsQuery.buildings}
                  onSelect={handleSelect}
                  onEdit={
                    permissions.canManageAccommodation
                      ? (next) => setFormMode({ kind: 'edit', selection: next })
                      : undefined
                  }
                />
                <Box
                  sx={{
                    display: 'grid',
                    gap: `${DASHBOARD_UX.cardGap}px`,
                    minHeight: { xs: 480, md: 'calc(100vh - 260px)' },
                    gridTemplateColumns: isMdDown
                      ? '1fr'
                      : isLgDown
                        ? 'minmax(0, 1fr) minmax(0, 1fr)'
                        : 'repeat(3, minmax(0, 1fr))',
                  }}
                >
                  {isMdDown ? (
                    <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
                      <Button
                        size="small"
                        startIcon={<Settings2 size={14} />}
                        onClick={() => setTreeDrawerOpen(true)}
                        sx={dashOutlinedButtonSx}
                      >
                        {t('accommodation.workspace.hierarchy')}
                      </Button>
                      {selection ? (
                        <Button
                          size="small"
                          onClick={() => setChildrenDrawerOpen(true)}
                          sx={dashOutlinedButtonSx}
                        >
                          {bedLeaf
                            ? t('accommodation.workspace.details', { defaultValue: 'Details' })
                            : t('accommodation.workspace.children', { defaultValue: 'Children' })}
                        </Button>
                      ) : null}
                    </Stack>
                  ) : (
                    <Box sx={{ minHeight: 0 }}>{treePane}</Box>
                  )}

                  <Box sx={{ minHeight: 0, overflow: 'hidden' }}>{centerPane}</Box>

                  {!isLgDown && rightPane ? (
                    <Box sx={{ minHeight: 0, overflow: 'hidden' }}>{rightPane}</Box>
                  ) : null}
                </Box>
              </Stack>
            )}
          </Stack>
        )}
      </Stack>

      <AppDrawer open={treeDrawerOpen} onClose={() => setTreeDrawerOpen(false)} width={320} anchor="left">
        <Box sx={{ height: '100%' }}>{treePane}</Box>
      </AppDrawer>

      <AppDrawer
        open={childrenDrawerOpen && isLgDown && !useInventoryLayout}
        onClose={() => setChildrenDrawerOpen(false)}
        width={400}
      >
        {rightPane}
      </AppDrawer>

      <EntityFormDrawer
        open={Boolean(formMode)}
        spaceId={spaceId}
        spaceType={spaceType}
        profile={profile}
        mode={formMode}
        defaultLayoutMode={profile.layoutMode}
        onClose={() => setFormMode(null)}
      />
    </PageContainer>
  );
}
