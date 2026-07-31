import {
  Box,
  Button,
  Grid,
  LinearProgress,
  Stack,
  Typography,
  useTheme,
} from '@mui/material';
import { Plus } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { DASHBOARD_UX, dashSurfaces } from '@/modules/dashboard/theme/dashboardUx';
import { StatusChip } from '@/shared/components/StatusChip';
import { EmptyState } from '@/shared/components/EmptyState';
import { LoadingState } from '@/shared/components/LoadingState';
import { DataTable, type DataTableColumn } from '@/shared/components/DataTable';
import { dashContainedButtonSx, dashOutlinedButtonSx } from '@/shared/theme/dashButtonSx';
import type { TreeSelection } from './HierarchyTree';
import { BulkCreateDialog } from './BulkCreateDialog';
import { EntityOccupancyCard } from './EntityOccupancyCard';
import { EntityActionsMenu } from './EntityActionsMenu';
import { WorkspaceSummaryStrip } from './AccommodationOverviewMetrics';
import type { AccommodationUiProfile } from '../utils/accommodationProfile';
import {
  useBeds,
  useBuildingSummary,
  useFloors,
  useRoomsByFloor,
  useRoomsByUnit,
  useUnits,
  useUnitsByFloor,
} from '../hooks/useAccommodation';
import { LayoutIllustration } from '../illustrations/LayoutIllustration';
import {
  getBedIllustration,
  getFloorIllustration,
  getRoomIllustration,
  getUnitIllustration,
  isWideFloorIllustration,
} from '../illustrations/illustrationAssets';
import { occupancyAccent, occupancyRatio } from '../utils/occupancyVisuals';
import { colors } from '@/shared/theme/colors';

/** Exactly 3 cards per row from md up (layout view). */
const CARD_COL = { xs: 12, sm: 6, md: 4 } as const;

type CenterWorkspaceProps = {
  spaceId: string;
  selection: TreeSelection | null;
  profile: AccommodationUiProfile;
  viewMode: 'cards' | 'table';
  canManage: boolean;
  canDeactivate?: boolean;
  onSelect: (selection: TreeSelection) => void;
  onAdd: () => void;
  /** Open edit form for a specific entity (child or current). */
  onEditEntity: (selection: TreeSelection) => void;
  /**
   * `children` — right panel: immediate child cards only (default for redesign).
   * `main` — legacy center that also showed parent header/summary.
   */
  panelRole?: 'main' | 'children';
};

function WorkspaceHeader({
  title,
  occupied,
  total,
  actions,
}: {
  title: string;
  occupied?: number;
  total?: number;
  actions?: ReactNode;
}) {
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);
  const { t } = useTranslation();
  const hasOcc = typeof occupied === 'number' && typeof total === 'number' && total > 0;
  const accent = hasOcc ? occupancyAccent(occupied!, total!) : colors.primary;
  const pct = hasOcc ? occupancyRatio(occupied!, total!) * 100 : 0;

  return (
    <Stack spacing={1} sx={{ mb: 0.5 }}>
      <Stack
        direction="row"
        spacing={1}
        useFlexGap
        sx={{ justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap' }}
      >
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography sx={{ ...DASHBOARD_UX.sectionHeading, color: s.textPrimary }} noWrap>
            {title}
          </Typography>
          {hasOcc ? (
            <Typography sx={{ ...DASHBOARD_UX.body, color: s.textSecondary, mt: 0.25 }}>
              {t('accommodation.workspace.bedsOccupiedOf', {
                defaultValue: '{{occupied}} of {{total}} beds occupied',
                occupied,
                total,
              })}
            </Typography>
          ) : null}
        </Box>
        {actions}
      </Stack>
      {hasOcc ? (
        <LinearProgress
          variant="determinate"
          value={pct}
          sx={{
            height: 8,
            borderRadius: 99,
            bgcolor: theme.palette.mode === 'dark' ? s.elevated : '#F1F5F9',
            '& .MuiLinearProgress-bar': { borderRadius: 99, bgcolor: accent },
          }}
        />
      ) : null}
    </Stack>
  );
}

/** Bottom add action — not an in-grid dashed card. */
function AddEntityButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <Button
      fullWidth
      variant="outlined"
      startIcon={<Plus size={16} />}
      onClick={onClick}
      sx={{
        ...dashOutlinedButtonSx,
        mt: 0.5,
        minHeight: 44,
        borderStyle: 'dashed',
        borderWidth: 1.5,
      }}
    >
      {label}
    </Button>
  );
}

export function CenterWorkspace({
  spaceId,
  selection,
  profile,
  viewMode,
  canManage,
  canDeactivate = false,
  onSelect,
  onAdd,
  onEditEntity,
  panelRole = 'children',
}: CenterWorkspaceProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const surfaces = dashSurfaces(theme.palette.mode);
  const [bulkOpen, setBulkOpen] = useState(false);
  const buildingId = selection && 'buildingId' in selection ? selection.buildingId : undefined;
  const floorId = selection && 'floorId' in selection ? selection.floorId : undefined;
  const unitId = selection && 'unitId' in selection ? selection.unitId : undefined;
  const roomId =
    selection && selection.type === 'room'
      ? selection.roomId
      : selection?.type === 'bed'
        ? selection.roomId
        : undefined;

  const summary = useBuildingSummary(spaceId, buildingId, Boolean(buildingId));
  const floors = useFloors(
    spaceId,
    buildingId,
    Boolean(buildingId) && (selection?.type === 'building' || selection?.type === 'floor'),
  );
  const units = useUnits(
    spaceId,
    buildingId,
    selection?.type === 'building' && profile.showUnits && !profile.showUnitsOnFloor,
  );
  const floorUnits = useUnitsByFloor(
    spaceId,
    buildingId,
    floorId,
    selection?.type === 'floor' && profile.showUnitsOnFloor,
  );
  const roomsFloor = useRoomsByFloor(
    spaceId,
    floorId,
    selection?.type === 'floor' && profile.showRoomsUnderFloor,
  );
  const roomsUnit = useRoomsByUnit(
    spaceId,
    unitId,
    selection?.type === 'unit' && profile.showRoomsUnderUnit,
  );
  const beds = useBeds(spaceId, roomId, selection?.type === 'room' || selection?.type === 'bed');

  const unitsForMeta = useUnitsByFloor(
    spaceId,
    buildingId,
    selection?.type === 'unit' ? selection.floorId : undefined,
    selection?.type === 'unit' && Boolean(selection.floorId),
  );

  if (!selection) {
    return (
      <EmptyState
        title={t('accommodation.workspace.selectTitle')}
        description={t('accommodation.workspace.selectBody')}
      />
    );
  }

  // Bed is a leaf: keep showing sibling beds (parent room list) so the list can
  // stay in center while bed details move to the right panel.

  const canBulk =
    canManage &&
    (selection.type === 'floor' || selection.type === 'unit' || selection.type === 'room');

  const currentFloor =
    selection.type === 'floor'
      ? floors.floors.find((f) => f.floorId === selection.floorId)
      : undefined;

  const floorLabel =
    selection.type === 'floor'
      ? currentFloor?.name ?? t('accommodation.floors.title')
      : '';
  const unitLabel =
    selection.type === 'unit'
      ? [...units.units, ...floorUnits.units, ...unitsForMeta.units].find(
          (u) => u.unitId === selection.unitId,
        )?.name ?? t('accommodation.units.title')
      : '';
  const roomLabel =
    selection.type === 'room'
      ? [...roomsFloor.rooms, ...roomsUnit.rooms].find((r) => r.roomId === selection.roomId)?.name ??
        t('accommodation.rooms.title', { defaultValue: 'Room' })
      : '';

  const addLabel =
    selection.type === 'room' || selection.type === 'bed'
      ? t('accommodation.workspace.addBed', { defaultValue: '+ Add Bed' })
      : selection.type === 'unit' || (selection.type === 'floor' && profile.showRoomsUnderFloor)
        ? t('accommodation.workspace.addRoom', { defaultValue: '+ Add Room' })
        : selection.type === 'floor' && profile.showUnitsOnFloor
          ? t('accommodation.workspace.addUnit', { defaultValue: '+ Add Unit' })
          : selection.type === 'building' && profile.showFloors
            ? t('accommodation.workspace.addFloor', { defaultValue: '+ Add Floor' })
            : t('accommodation.workspace.addChild');

  const bulkDialog = canBulk ? (
    selection.type === 'room' ? (
      <BulkCreateDialog
        mode="beds"
        open={bulkOpen}
        spaceId={spaceId}
        roomId={selection.roomId}
        parentLabel={roomLabel}
        onClose={() => setBulkOpen(false)}
      />
    ) : (
      <BulkCreateDialog
        mode="rooms"
        open={bulkOpen}
        spaceId={spaceId}
        parentType={selection.type}
        parentId={selection.type === 'floor' ? selection.floorId : selection.unitId}
        parentLabel={selection.type === 'floor' ? floorLabel : unitLabel}
        onClose={() => setBulkOpen(false)}
      />
    )
  ) : null;

  const wrap = (node: ReactNode) => (
    <>
      {node}
      {bulkDialog}
    </>
  );

  const headerActions = canManage ? (
    <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
      {canBulk ? (
        <Button size="small" variant="outlined" onClick={() => setBulkOpen(true)} sx={dashOutlinedButtonSx}>
          {selection.type === 'room'
            ? t('accommodation.bulk.beds.action')
            : t('accommodation.bulk.rooms.action')}
        </Button>
      ) : null}
      <Button size="small" startIcon={<Plus size={14} />} onClick={onAdd} sx={dashContainedButtonSx}>
        {addLabel}
      </Button>
    </Stack>
  ) : null;

  const bottomAdd = canManage ? <AddEntityButton label={addLabel} onClick={onAdd} /> : null;

  const entityMenu = (
    sel: TreeSelection,
    name: string,
    opts?: { isInactive?: boolean; status?: string | null },
  ) =>
    canManage || canDeactivate ? (
      <EntityActionsMenu
        spaceId={spaceId}
        selection={sel}
        sourceName={name}
        isInactive={opts?.isInactive}
        status={opts?.status}
        canEdit={canManage}
        canDeactivate={canDeactivate}
        onEdit={() => onEditEntity(sel)}
        onDuplicated={onSelect}
      />
    ) : null;

  const childrenOnly = panelRole === 'children';
  const childCol = childrenOnly ? ({ xs: 12 } as const) : CARD_COL;

  const childrenTitle =
    selection.type === 'building'
      ? profile.showFloors
        ? t('accommodation.floors.title')
        : t('accommodation.units.title')
      : selection.type === 'floor'
        ? profile.showUnitsOnFloor
          ? t('accommodation.units.title')
          : t('accommodation.rooms.title')
        : selection.type === 'unit'
          ? t('accommodation.rooms.title')
          : t('accommodation.beds.title');

  if (selection.type === 'building') {
    if (summary.loading && !summary.summary) {
      return wrap(<LoadingState />);
    }
    const s = summary.summary;
    const occupied = s?.occupied ?? 0;
    const totalBeds = s?.beds ?? 0;
    const floorList = floors.floors;
    const unitList = units.units;

    return wrap(
      <Stack spacing={2}>
        <WorkspaceHeader
          title={childrenOnly ? childrenTitle : (s?.name ?? t('accommodation.buildings.title'))}
          occupied={childrenOnly ? undefined : occupied}
          total={childrenOnly ? undefined : totalBeds}
          actions={headerActions}
        />
        {profile.showFloors ? (
          viewMode === 'cards' ? (
            <Stack spacing={1.5}>
              {floorList.length === 0 ? (
                <EmptyState
                  title={t('accommodation.floors.emptyTitle')}
                  description={t('accommodation.floors.emptyDescription')}
                  action={bottomAdd}
                />
              ) : (
                <>
                  <Grid container spacing={1.5}>
                    {floorList.map((floor) => {
                      const occ = Math.max(0, floor.bedCount - floor.available);
                      const layoutMode = s?.layoutMode ?? profile.layoutMode;
                      const corridorFloors = isWideFloorIllustration(layoutMode);
                      return (
                        <Grid key={floor.floorId} size={corridorFloors || childrenOnly ? 12 : CARD_COL}>
                          <EntityOccupancyCard
                            title={floor.name}
                            occupied={occ}
                            total={floor.bedCount}
                            occupancyLabel={t('accommodation.workspace.occupiedFraction', {
                              defaultValue: '{{occupied}}/{{total}} Occupied',
                              occupied: occ,
                              total: floor.bedCount,
                            })}
                            dense={corridorFloors}
                            menu={entityMenu(
                              {
                                type: 'floor',
                                buildingId: selection.buildingId,
                                floorId: floor.floorId,
                              },
                              floor.name,
                              { isInactive: floor.active === false },
                            )}
                            illustration={
                              <LayoutIllustration
                                src={getFloorIllustration(layoutMode)}
                                size="floor"
                                wide={corridorFloors}
                                alt=""
                              />
                            }
                            onClick={() =>
                              onSelect({
                                type: 'floor',
                                buildingId: selection.buildingId,
                                floorId: floor.floorId,
                              })
                            }
                          />
                        </Grid>
                      );
                    })}
                  </Grid>
                  {bottomAdd}
                </>
              )}
            </Stack>
          ) : (
            <Stack spacing={1.5}>
              <DataTable
                columns={[
                  {
                    id: 'name',
                    header: t('accommodation.fields.name'),
                    accessor: (r) => r.name,
                    primary: true,
                  },
                  {
                    id: 'rooms',
                    header: t('accommodation.setup.summary.rooms'),
                    accessor: (r) => r.roomCount,
                  },
                  {
                    id: 'beds',
                    header: t('accommodation.setup.summary.beds'),
                    accessor: (r) => r.bedCount,
                  },
                  {
                    id: 'occupied',
                    header: t('accommodation.status.OCCUPIED'),
                    accessor: (r) => Math.max(0, r.bedCount - r.available),
                  },
                  {
                    id: 'avail',
                    header: t('accommodation.status.AVAILABLE'),
                    accessor: (r) => r.available,
                  },
                  {
                    id: 'actions',
                    header: '',
                    width: 52,
                    align: 'right',
                    accessor: (r) =>
                      entityMenu(
                        {
                          type: 'floor',
                          buildingId: selection.buildingId,
                          floorId: r.floorId,
                        },
                        r.name,
                        { isInactive: r.active === false, status: r.status },
                      ),
                  },
                ]}
                rows={floorList.map((f) => ({ ...f, id: f.floorId }))}
                onRowClick={(row) =>
                  onSelect({ type: 'floor', buildingId: selection.buildingId, floorId: row.floorId })
                }
                emptyTitle={t('accommodation.floors.emptyTitle')}
              />
              {bottomAdd}
            </Stack>
          )
        ) : null}
        {profile.showUnits && !profile.showUnitsOnFloor ? (
          viewMode === 'cards' ? (
            <Stack spacing={1.5}>
              {unitList.length === 0 ? (
                <EmptyState
                  title={t('accommodation.units.emptyTitle', { defaultValue: 'No units' })}
                  description={t('accommodation.units.emptyDescription', {
                    defaultValue: 'Add a unit to organize rooms in this building.',
                  })}
                  action={bottomAdd}
                />
              ) : (
                <>
                  <Grid container spacing={1.5}>
                    {unitList.map((unit) => {
                      const avail = unit.availableBeds ?? 0;
                      const occ = Math.max(0, unit.bedCount - avail);
                      return (
                        <Grid key={unit.unitId} size={childCol}>
                          <EntityOccupancyCard
                            title={unit.name}
                            occupied={occ}
                            total={unit.bedCount}
                            occupancyLabel={t('accommodation.workspace.occupiedFraction', {
                              defaultValue: '{{occupied}}/{{total}} Occupied',
                              occupied: occ,
                              total: unit.bedCount,
                            })}
                            illustration={
                              <LayoutIllustration
                                src={getUnitIllustration(unit.roomCount, unit.bedCount)}
                                size="unit"
                                alt=""
                              />
                            }
                            trailing={<StatusChip label={t(`accommodation.status.${unit.status}`)} />}
                            menu={entityMenu(
                              {
                                type: 'unit',
                                buildingId: selection.buildingId,
                                unitId: unit.unitId,
                              },
                              unit.name,
                              { isInactive: unit.active === false, status: unit.status },
                            )}
                            onClick={() =>
                              onSelect({
                                type: 'unit',
                                buildingId: selection.buildingId,
                                unitId: unit.unitId,
                              })
                            }
                          />
                        </Grid>
                      );
                    })}
                  </Grid>
                  {bottomAdd}
                </>
              )}
            </Stack>
          ) : (
            <Stack spacing={1.5}>
              <DataTable
                columns={[
                  {
                    id: 'name',
                    header: t('accommodation.fields.name'),
                    accessor: (r) => r.name,
                    primary: true,
                  },
                  {
                    id: 'status',
                    header: t('accommodation.fields.status'),
                    accessor: (r) => <StatusChip label={t(`accommodation.status.${r.status}`)} />,
                  },
                  {
                    id: 'rooms',
                    header: t('accommodation.setup.summary.rooms'),
                    accessor: (r) => r.roomCount,
                  },
                  {
                    id: 'beds',
                    header: t('accommodation.setup.summary.beds'),
                    accessor: (r) => r.bedCount,
                  },
                  {
                    id: 'avail',
                    header: t('accommodation.status.AVAILABLE'),
                    accessor: (r) => r.availableBeds ?? 0,
                  },
                  {
                    id: 'actions',
                    header: '',
                    width: 52,
                    align: 'right',
                    accessor: (r) =>
                      entityMenu(
                        {
                          type: 'unit',
                          buildingId: selection.buildingId,
                          unitId: r.unitId,
                        },
                        r.name,
                        { isInactive: r.active === false, status: r.status },
                      ),
                  },
                ]}
                rows={unitList.map((u) => ({ ...u, id: u.unitId }))}
                onRowClick={(row) =>
                  onSelect({
                    type: 'unit',
                    buildingId: selection.buildingId,
                    unitId: row.unitId,
                  })
                }
                emptyTitle={t('accommodation.units.emptyTitle', { defaultValue: 'No units' })}
              />
              {bottomAdd}
            </Stack>
          )
        ) : null}
        {!childrenOnly ? (
          <WorkspaceSummaryStrip
            title={t('accommodation.workspace.summary', { defaultValue: 'Building summary' })}
            items={[
              { id: 'floors', label: t('accommodation.setup.summary.floors'), value: s?.floors ?? 0 },
              { id: 'units', label: t('accommodation.setup.summary.units'), value: s?.units ?? 0 },
              { id: 'rooms', label: t('accommodation.setup.summary.rooms'), value: s?.rooms ?? 0 },
              { id: 'beds', label: t('accommodation.setup.summary.beds'), value: s?.beds ?? 0 },
              { id: 'avail', label: t('accommodation.status.AVAILABLE'), value: s?.available ?? 0 },
            ]}
          />
        ) : null}
      </Stack>,
    );
  }

  if (selection.type === 'floor') {
    const roomList = profile.showRoomsUnderFloor ? roomsFloor.rooms : [];
    const unitList = profile.showUnitsOnFloor ? floorUnits.units : [];
    const floorName = currentFloor?.name ?? t('accommodation.floors.title');
    const bedTotal =
      currentFloor?.bedCount ??
      unitList.reduce((n, u) => n + u.bedCount, 0) +
        roomList.reduce((n, r) => n + r.bedCount, 0);
    const bedAvail =
      currentFloor?.available ??
      unitList.reduce((n, u) => n + (u.availableBeds ?? 0), 0) +
        roomList.reduce((n, r) => n + r.availableBeds, 0);
    const bedOcc = Math.max(0, bedTotal - bedAvail);
    const roomCount =
      currentFloor?.roomCount ??
      unitList.reduce((n, u) => n + u.roomCount, 0) + roomList.length;

    return wrap(
      <Stack spacing={2}>
        <WorkspaceHeader
          title={childrenOnly ? childrenTitle : floorName}
          occupied={childrenOnly ? undefined : bedOcc}
          total={childrenOnly ? undefined : bedTotal}
          actions={headerActions}
        />
        {unitList.length > 0 ? (
          viewMode === 'cards' ? (
            <Stack spacing={1.5}>
              <Grid container spacing={1.5}>
                {unitList.map((unit) => {
                  const avail = unit.availableBeds ?? 0;
                  const occ = Math.max(0, unit.bedCount - avail);
                  return (
                    <Grid key={unit.unitId} size={childCol}>
                      <EntityOccupancyCard
                        title={unit.name}
                        occupied={occ}
                        total={unit.bedCount}
                        occupancyLabel={t('accommodation.workspace.occupiedFraction', {
                          defaultValue: '{{occupied}}/{{total}} Occupied',
                          occupied: occ,
                          total: unit.bedCount,
                        })}
                        illustration={
                          <LayoutIllustration
                            src={getUnitIllustration(unit.roomCount, unit.bedCount)}
                            size="unit"
                            alt=""
                          />
                        }
                        menu={entityMenu(
                          {
                            type: 'unit',
                            buildingId: selection.buildingId,
                            unitId: unit.unitId,
                            floorId: selection.floorId,
                          },
                          unit.name,
                          { isInactive: unit.active === false, status: unit.status },
                        )}
                        onClick={() =>
                          onSelect({
                            type: 'unit',
                            buildingId: selection.buildingId,
                            unitId: unit.unitId,
                            floorId: selection.floorId,
                          })
                        }
                      />
                    </Grid>
                  );
                })}
              </Grid>
              {bottomAdd}
            </Stack>
          ) : (
            <Stack spacing={1.5}>
              <DataTable
                columns={[
                  {
                    id: 'name',
                    header: t('accommodation.fields.name'),
                    accessor: (r) => r.name,
                    primary: true,
                  },
                  {
                    id: 'status',
                    header: t('accommodation.fields.status'),
                    accessor: (r) => <StatusChip label={t(`accommodation.status.${r.status}`)} />,
                  },
                  {
                    id: 'rooms',
                    header: t('accommodation.setup.summary.rooms'),
                    accessor: (r) => r.roomCount,
                  },
                  {
                    id: 'beds',
                    header: t('accommodation.setup.summary.beds'),
                    accessor: (r) => r.bedCount,
                  },
                  {
                    id: 'avail',
                    header: t('accommodation.status.AVAILABLE'),
                    accessor: (r) => r.availableBeds ?? 0,
                  },
                  {
                    id: 'actions',
                    header: '',
                    width: 52,
                    align: 'right',
                    accessor: (r) =>
                      entityMenu(
                        {
                          type: 'unit',
                          buildingId: selection.buildingId,
                          unitId: r.unitId,
                          floorId: selection.floorId,
                        },
                        r.name,
                        { isInactive: r.active === false, status: r.status },
                      ),
                  },
                ]}
                rows={unitList.map((u) => ({ ...u, id: u.unitId }))}
                onRowClick={(row) =>
                  onSelect({
                    type: 'unit',
                    buildingId: selection.buildingId,
                    unitId: row.unitId,
                    floorId: selection.floorId,
                  })
                }
                emptyTitle={t('accommodation.units.emptyTitle', { defaultValue: 'No units' })}
              />
              {bottomAdd}
            </Stack>
          )
        ) : null}
        {roomList.length > 0 ? (
          viewMode === 'cards' ? (
            <Stack spacing={1.5}>
              <Grid container spacing={1.5}>
                {roomList.map((room) => {
                  const occ = Math.max(0, room.bedCount - room.availableBeds);
                  return (
                    <Grid key={room.roomId} size={childCol}>
                      <EntityOccupancyCard
                        title={room.name}
                        occupied={occ}
                        total={room.bedCount}
                        subtitle={t(`accommodation.roomType.${room.roomType}`, {
                          defaultValue: room.roomType,
                        })}
                        occupancyLabel={t('accommodation.workspace.occupiedFraction', {
                          defaultValue: '{{occupied}}/{{total}} Occupied',
                          occupied: occ,
                          total: room.bedCount,
                        })}
                        illustration={
                          <LayoutIllustration
                            src={getRoomIllustration(Math.max(room.bedCount, 1))}
                            size="room"
                            alt=""
                          />
                        }
                        menu={entityMenu(
                          {
                            type: 'room',
                            buildingId: selection.buildingId,
                            roomId: room.roomId,
                            floorId: selection.floorId,
                          },
                          room.name,
                          { isInactive: room.active === false },
                        )}
                        onClick={() =>
                          onSelect({
                            type: 'room',
                            buildingId: selection.buildingId,
                            roomId: room.roomId,
                            floorId: selection.floorId,
                          })
                        }
                      />
                    </Grid>
                  );
                })}
              </Grid>
              {bottomAdd}
            </Stack>
          ) : (
            <Stack spacing={1.5}>
              <DataTable
                columns={[
                  {
                    id: 'name',
                    header: t('accommodation.fields.name'),
                    accessor: (r) => r.name,
                    primary: true,
                  },
                  {
                    id: 'type',
                    header: t('accommodation.roomType.label'),
                    accessor: (r) =>
                      t(`accommodation.roomType.${r.roomType}`, { defaultValue: r.roomType }),
                  },
                  {
                    id: 'beds',
                    header: t('accommodation.setup.summary.beds'),
                    accessor: (r) => r.bedCount,
                  },
                  {
                    id: 'occupied',
                    header: t('accommodation.status.OCCUPIED'),
                    accessor: (r) => Math.max(0, r.bedCount - r.availableBeds),
                  },
                  {
                    id: 'avail',
                    header: t('accommodation.status.AVAILABLE'),
                    accessor: (r) => r.availableBeds,
                  },
                  {
                    id: 'actions',
                    header: '',
                    width: 52,
                    align: 'right',
                    accessor: (r) =>
                      entityMenu(
                        {
                          type: 'room',
                          buildingId: selection.buildingId,
                          roomId: r.roomId,
                          floorId: selection.floorId,
                        },
                        r.name,
                        { isInactive: r.active === false, status: r.status },
                      ),
                  },
                ]}
                rows={roomList.map((r) => ({ ...r, id: r.roomId }))}
                onRowClick={(row) =>
                  onSelect({
                    type: 'room',
                    buildingId: selection.buildingId,
                    roomId: row.roomId,
                    floorId: selection.floorId,
                  })
                }
                emptyTitle={t('accommodation.rooms.emptyTitle', { defaultValue: 'No rooms' })}
              />
              {bottomAdd}
            </Stack>
          )
        ) : null}
        {unitList.length === 0 && roomList.length === 0 && viewMode === 'cards' ? (
          <EmptyState
            title={
              profile.showUnitsOnFloor
                ? t('accommodation.units.emptyTitle', { defaultValue: 'No units' })
                : t('accommodation.rooms.emptyTitle', { defaultValue: 'No rooms' })
            }
            description={
              profile.showUnitsOnFloor
                ? t('accommodation.units.emptyDescription', {
                    defaultValue: 'Add a unit to organize rooms on this floor.',
                  })
                : t('accommodation.rooms.emptyDescription', {
                    defaultValue: 'Create the first room for this floor.',
                  })
            }
            action={bottomAdd}
          />
        ) : null}
        {unitList.length === 0 && roomList.length === 0 && viewMode !== 'cards' ? bottomAdd : null}
        {!childrenOnly ? (
          <WorkspaceSummaryStrip
            title={t('accommodation.workspace.floorSummary', { defaultValue: 'Floor summary' })}
            items={[
              { id: 'units', label: t('accommodation.setup.summary.units'), value: unitList.length },
              { id: 'rooms', label: t('accommodation.setup.summary.rooms'), value: roomCount },
              { id: 'beds', label: t('accommodation.setup.summary.beds'), value: bedTotal },
              { id: 'occ', label: t('accommodation.status.OCCUPIED'), value: bedOcc },
              { id: 'avail', label: t('accommodation.status.AVAILABLE'), value: bedAvail },
            ]}
          />
        ) : null}
      </Stack>,
    );
  }

  if (selection.type === 'unit') {
    const unitMeta = [...units.units, ...floorUnits.units, ...unitsForMeta.units].find(
      (u) => u.unitId === selection.unitId,
    );
    const bedTotal = unitMeta?.bedCount ?? roomsUnit.rooms.reduce((n, r) => n + r.bedCount, 0);
    const bedAvail =
      unitMeta?.availableBeds ?? roomsUnit.rooms.reduce((n, r) => n + r.availableBeds, 0);
    const bedOcc = Math.max(0, bedTotal - bedAvail);

    return wrap(
      <Stack spacing={2}>
        <WorkspaceHeader
          title={childrenOnly ? childrenTitle : (unitMeta?.name ?? t('accommodation.units.title'))}
          occupied={childrenOnly ? undefined : bedOcc}
          total={childrenOnly ? undefined : bedTotal}
          actions={headerActions}
        />
        {viewMode === 'cards' ? (
          <Stack spacing={1.5}>
            {roomsUnit.rooms.length === 0 ? (
              <EmptyState
                title={t('accommodation.rooms.emptyTitle', { defaultValue: 'No rooms' })}
                description={t('accommodation.rooms.emptyDescription', {
                  defaultValue: 'Create the first room for this unit.',
                })}
                action={bottomAdd}
              />
            ) : (
              <>
                <Grid container spacing={1.5}>
                  {roomsUnit.rooms.map((room) => {
                    const occ = Math.max(0, room.bedCount - room.availableBeds);
                    return (
                      <Grid key={room.roomId} size={childCol}>
                        <EntityOccupancyCard
                          title={room.name}
                          occupied={occ}
                          total={room.bedCount}
                          occupancyLabel={t('accommodation.workspace.occupiedFraction', {
                            defaultValue: '{{occupied}}/{{total}} Occupied',
                            occupied: occ,
                            total: room.bedCount,
                          })}
                          illustration={
                            <LayoutIllustration
                              src={getRoomIllustration(Math.max(room.bedCount, 1))}
                              size="room"
                              alt=""
                            />
                          }
                          menu={entityMenu(
                            {
                              type: 'room',
                              buildingId: selection.buildingId,
                              roomId: room.roomId,
                              unitId: selection.unitId,
                              floorId: selection.floorId,
                            },
                            room.name,
                            { isInactive: room.active === false },
                          )}
                          onClick={() =>
                            onSelect({
                              type: 'room',
                              buildingId: selection.buildingId,
                              roomId: room.roomId,
                              unitId: selection.unitId,
                              floorId: selection.floorId,
                            })
                          }
                        />
                      </Grid>
                    );
                  })}
                </Grid>
                {bottomAdd}
              </>
            )}
          </Stack>
        ) : (
          <Stack spacing={1.5}>
            <DataTable
              columns={[
                {
                  id: 'name',
                  header: t('accommodation.fields.name'),
                  accessor: (r) => r.name,
                  primary: true,
                },
                {
                  id: 'type',
                  header: t('accommodation.roomType.label'),
                  accessor: (r) =>
                    t(`accommodation.roomType.${r.roomType}`, { defaultValue: r.roomType }),
                },
                {
                  id: 'beds',
                  header: t('accommodation.setup.summary.beds'),
                  accessor: (r) => r.bedCount,
                },
                {
                  id: 'occupied',
                  header: t('accommodation.status.OCCUPIED'),
                  accessor: (r) => Math.max(0, r.bedCount - r.availableBeds),
                },
                {
                  id: 'avail',
                  header: t('accommodation.status.AVAILABLE'),
                  accessor: (r) => r.availableBeds,
                },
                {
                  id: 'actions',
                  header: '',
                  width: 52,
                  align: 'right',
                  accessor: (r) =>
                    entityMenu(
                      {
                        type: 'room',
                        buildingId: selection.buildingId,
                        roomId: r.roomId,
                        unitId: selection.unitId,
                        floorId: selection.floorId,
                      },
                      r.name,
                      { isInactive: r.active === false },
                    ),
                },
              ]}
              rows={roomsUnit.rooms.map((r) => ({ ...r, id: r.roomId }))}
              onRowClick={(row) =>
                onSelect({
                  type: 'room',
                  buildingId: selection.buildingId,
                  roomId: row.roomId,
                  unitId: selection.unitId,
                  floorId: selection.floorId,
                })
              }
              emptyTitle={t('accommodation.rooms.emptyTitle', { defaultValue: 'No rooms' })}
            />
            {bottomAdd}
          </Stack>
        )}
        {!childrenOnly ? (
          <WorkspaceSummaryStrip
            items={[
              {
                id: 'rooms',
                label: t('accommodation.setup.summary.rooms'),
                value: roomsUnit.rooms.length,
              },
              { id: 'beds', label: t('accommodation.setup.summary.beds'), value: bedTotal },
              { id: 'occ', label: t('accommodation.status.OCCUPIED'), value: bedOcc },
              { id: 'avail', label: t('accommodation.status.AVAILABLE'), value: bedAvail },
            ]}
          />
        ) : null}
      </Stack>,
    );
  }

  if (selection.type === 'room' || selection.type === 'bed') {
    const roomMeta = [...roomsFloor.rooms, ...roomsUnit.rooms].find((r) => r.roomId === roomId);
    const bedTotal = roomMeta?.bedCount ?? beds.beds.length;
    const bedAvail =
      roomMeta?.availableBeds ?? beds.beds.filter((b) => b.status === 'AVAILABLE').length;
    const bedOcc = Math.max(0, bedTotal - bedAvail);

    const bedRows = beds.beds.map((bed) => ({ ...bed, id: bed.bedId }));
    const columns: DataTableColumn<(typeof bedRows)[number]>[] = [
      {
        id: 'label',
        header: t('accommodation.beds.title'),
        accessor: (row) => row.label,
        primary: true,
      },
      {
        id: 'status',
        header: t('accommodation.fields.status'),
        accessor: (row) => <StatusChip label={t(`accommodation.status.${row.status}`)} />,
      },
      {
        id: 'actions',
        header: '',
        width: 52,
        align: 'right',
        accessor: (row) =>
          entityMenu(
            {
              type: 'bed',
              buildingId: selection.buildingId,
              roomId: roomId!,
              bedId: row.bedId,
              floorId: 'floorId' in selection ? selection.floorId : undefined,
              unitId: 'unitId' in selection ? selection.unitId : undefined,
            },
            row.label,
            { isInactive: row.active === false, status: row.status },
          ),
      },
    ];

    return wrap(
      <Stack spacing={2}>
        <WorkspaceHeader
          title={childrenOnly ? childrenTitle : (roomMeta?.name ?? t('accommodation.beds.title'))}
          occupied={childrenOnly ? undefined : bedOcc}
          total={childrenOnly ? undefined : bedTotal}
          actions={headerActions}
        />
        {viewMode === 'cards' ? (
          <Stack spacing={1.5}>
            {beds.beds.length === 0 ? (
              <EmptyState
                title={t('accommodation.beds.emptyTitle')}
                description={t('accommodation.beds.emptyDescription')}
                action={bottomAdd}
              />
            ) : (
              <>
                <Grid container spacing={1.5}>
                  {beds.beds.map((bed) => {
                    const isOcc = bed.status === 'OCCUPIED' || bed.status === 'RESERVED';
                    return (
                      <Grid key={bed.bedId} size={childCol}>
                        <EntityOccupancyCard
                          title={bed.label}
                          occupied={isOcc ? 1 : 0}
                          total={1}
                          occupancyLabel={t(`accommodation.status.${bed.status}`)}
                          selected={selection.type === 'bed' && selection.bedId === bed.bedId}
                          illustration={
                            <LayoutIllustration src={getBedIllustration(bed.status)} size="bed" alt="" />
                          }
                          trailing={<StatusChip label={t(`accommodation.status.${bed.status}`)} />}
                          menu={entityMenu(
                            {
                              type: 'bed',
                              buildingId: selection.buildingId,
                              roomId: roomId!,
                              bedId: bed.bedId,
                              floorId:
                                selection.type === 'room' || selection.type === 'bed'
                                  ? selection.floorId
                                  : undefined,
                              unitId:
                                selection.type === 'room' || selection.type === 'bed'
                                  ? selection.unitId
                                  : undefined,
                            },
                            bed.label,
                            { isInactive: bed.active === false, status: bed.status },
                          )}
                          onClick={() =>
                            onSelect({
                              type: 'bed',
                              buildingId: selection.buildingId,
                              roomId: roomId!,
                              bedId: bed.bedId,
                              floorId:
                                selection.type === 'room' || selection.type === 'bed'
                                  ? selection.floorId
                                  : undefined,
                              unitId:
                                selection.type === 'room' || selection.type === 'bed'
                                  ? selection.unitId
                                  : undefined,
                            })
                          }
                        />
                      </Grid>
                    );
                  })}
                </Grid>
                {bottomAdd}
              </>
            )}
          </Stack>
        ) : (
          <Stack spacing={1.5}>
            <DataTable
              columns={columns}
              rows={bedRows}
              loading={beds.loading}
              onRowClick={(row) =>
                onSelect({
                  type: 'bed',
                  buildingId: selection.buildingId,
                  roomId: roomId!,
                  bedId: row.bedId,
                  floorId: 'floorId' in selection ? selection.floorId : undefined,
                  unitId: 'unitId' in selection ? selection.unitId : undefined,
                })
              }
              emptyTitle={t('accommodation.beds.emptyTitle')}
            />
            {bottomAdd}
          </Stack>
        )}
      </Stack>,
    );
  }

  return wrap(<Box sx={{ color: surfaces.textMuted }} />);
}
