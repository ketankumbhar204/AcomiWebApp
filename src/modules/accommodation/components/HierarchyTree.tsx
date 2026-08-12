import { Box, Collapse, IconButton, List, ListItemButton, Typography, useTheme } from '@mui/material';
import {
  BedDouble,
  Building2,
  ChevronDown,
  ChevronRight,
  House,
  Layers,
} from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import type { BuildingResponse, FloorListItemResponse, UnitListItemResponse } from '@/shared/types/accommodation';
import type { AccommodationUiProfile } from '../utils/accommodationProfile';
import { useFloors, useUnits, useUnitsByFloor, useRoomsByFloor, useRoomsByUnit } from '../hooks/useAccommodation';
import { colors } from '@/shared/theme/colors';
import { DASHBOARD_UX, dashSurfaces } from '@/modules/dashboard/theme/dashboardUx';
import { ACC_ACCENTS } from '../utils/accommodationAccents';

export type TreeSelection =
  | { type: 'building'; buildingId: string }
  | { type: 'floor'; buildingId: string; floorId: string }
  | { type: 'unit'; buildingId: string; unitId: string; floorId?: string }
  | { type: 'room'; buildingId: string; roomId: string; floorId?: string; unitId?: string }
  | { type: 'bed'; buildingId: string; roomId: string; bedId: string; floorId?: string; unitId?: string };

type HierarchyTreeProps = {
  spaceId: string;
  buildings: BuildingResponse[];
  profile: AccommodationUiProfile;
  selection: TreeSelection | null;
  onSelect: (selection: TreeSelection) => void;
  search?: string;
};

function matchesSearch(label: string, search?: string) {
  if (!search?.trim()) return true;
  return label.toLowerCase().includes(search.trim().toLowerCase());
}

/** Nested children with vertical + L-shaped connectors (Figma hierarchy). */
function TreeBranch({ children, open }: { children: ReactNode; open: boolean }) {
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);
  const line = s.border;

  return (
    <Collapse in={open} timeout="auto" unmountOnExit={false}>
      <Box
        sx={{
          position: 'relative',
          ml: '18px',
          pl: '14px',
          '&::before': {
            content: '""',
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 10,
            width: 0,
            borderLeft: `1.5px solid ${line}`,
          },
          '& > .tree-node': {
            position: 'relative',
            '&::before': {
              content: '""',
              position: 'absolute',
              left: -14,
              top: 18,
              width: 12,
              height: 0,
              borderTop: `1.5px solid ${line}`,
            },
          },
        }}
      >
        {children}
      </Box>
    </Collapse>
  );
}

function TreeRow({
  selected,
  onClick,
  expandable,
  open,
  onToggle,
  icon,
  iconColor,
  label,
  secondary,
}: {
  selected: boolean;
  onClick: () => void;
  expandable?: boolean;
  open?: boolean;
  onToggle?: () => void;
  icon: ReactNode;
  iconColor: string;
  label: string;
  secondary?: string;
}) {
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);

  return (
    <ListItemButton
      selected={selected}
      dense
      onClick={onClick}
      className="tree-node"
      sx={{
        borderRadius: 999,
        mb: 0.35,
        minHeight: 40,
        py: 0.5,
        px: 0.75,
        gap: 0.5,
        '&.Mui-selected': {
          bgcolor: 'rgba(16, 185, 129, 0.14)',
          '&:hover': { bgcolor: 'rgba(16, 185, 129, 0.2)' },
        },
        '&:hover': { bgcolor: theme.palette.mode === 'dark' ? s.elevated : 'rgba(248, 250, 252, 1)' },
      }}
    >
      {expandable ? (
        <IconButton
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            onToggle?.();
          }}
          aria-label={open ? 'Collapse' : 'Expand'}
          aria-expanded={open}
          sx={{ width: 24, height: 24, p: 0, color: s.textMuted }}
        >
          {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </IconButton>
      ) : (
        <Box sx={{ width: 24, flexShrink: 0 }} />
      )}
      <Box sx={{ display: 'flex', color: iconColor, flexShrink: 0 }}>{icon}</Box>
      <Box sx={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 0.75 }}>
        <Typography
          noWrap
          sx={{
            ...DASHBOARD_UX.link,
            color: s.textPrimary,
            flex: 1,
            minWidth: 0,
          }}
        >
          {label}
        </Typography>
        {secondary ? (
          <Typography
            noWrap
            sx={{
              ...DASHBOARD_UX.metricCaption,
              color: s.textMuted,
              flexShrink: 0,
            }}
          >
            {secondary}
          </Typography>
        ) : null}
      </Box>
    </ListItemButton>
  );
}

function FloorNode({
  spaceId,
  buildingId,
  floor,
  profile,
  selection,
  onSelect,
}: {
  spaceId: string;
  buildingId: string;
  floor: FloorListItemResponse;
  profile: AccommodationUiProfile;
  selection: TreeSelection | null;
  onSelect: (s: TreeSelection) => void;
}) {
  const selectedUnder =
    (selection?.type === 'floor' && selection.floorId === floor.floorId) ||
    (selection &&
      'floorId' in selection &&
      selection.floorId === floor.floorId);

  const [open, setOpen] = useState(Boolean(selectedUnder));
  useEffect(() => {
    if (selectedUnder) setOpen(true);
  }, [selectedUnder]);

  const units = useUnitsByFloor(
    spaceId,
    buildingId,
    floor.floorId,
    profile.showUnitsOnFloor && open,
  );
  const rooms = useRoomsByFloor(
    spaceId,
    floor.floorId,
    profile.showRoomsUnderFloor && open,
  );
  const selected =
    selection?.type === 'floor' &&
    selection.floorId === floor.floorId &&
    selection.buildingId === buildingId;

  const hasChildren =
    (profile.showUnitsOnFloor && units.units.length > 0) ||
    (profile.showRoomsUnderFloor && rooms.rooms.length > 0) ||
    profile.showUnitsOnFloor ||
    profile.showRoomsUnderFloor;

  return (
    <Box>
      <TreeRow
        selected={selected}
        onClick={() => onSelect({ type: 'floor', buildingId, floorId: floor.floorId })}
        expandable={hasChildren}
        open={open}
        onToggle={() => setOpen((v) => !v)}
        icon={<Layers size={16} />}
        iconColor={ACC_ACCENTS.treeFloor}
        label={floor.name}
        secondary={`${floor.available}/${floor.bedCount}`}
      />
      <TreeBranch open={open}>
        {profile.showUnitsOnFloor
          ? units.units.map((unit) => (
              <UnitNode
                key={unit.unitId}
                spaceId={spaceId}
                buildingId={buildingId}
                floorId={floor.floorId}
                unit={unit}
                profile={profile}
                selection={selection}
                onSelect={onSelect}
              />
            ))
          : null}
        {profile.showRoomsUnderFloor
          ? rooms.rooms.map((room) => (
              <RoomNode
                key={room.roomId}
                buildingId={buildingId}
                floorId={floor.floorId}
                roomId={room.roomId}
                roomName={room.name}
                bedCount={room.bedCount}
                availableBeds={room.availableBeds}
                selection={selection}
                onSelect={onSelect}
              />
            ))
          : null}
      </TreeBranch>
    </Box>
  );
}

function UnitNode({
  spaceId,
  buildingId,
  floorId,
  unit,
  profile,
  selection,
  onSelect,
}: {
  spaceId: string;
  buildingId: string;
  floorId?: string;
  unit: UnitListItemResponse;
  profile: AccommodationUiProfile;
  selection: TreeSelection | null;
  onSelect: (s: TreeSelection) => void;
}) {
  const selectedUnder =
    (selection?.type === 'unit' && selection.unitId === unit.unitId) ||
    (selection && 'unitId' in selection && selection.unitId === unit.unitId);

  const [open, setOpen] = useState(Boolean(selectedUnder));
  useEffect(() => {
    if (selectedUnder) setOpen(true);
  }, [selectedUnder]);

  const rooms = useRoomsByUnit(spaceId, unit.unitId, profile.showRoomsUnderUnit && open);
  const selected = selection?.type === 'unit' && selection.unitId === unit.unitId;
  const avail = unit.availableBeds ?? 0;
  const unitFull = unit.bedCount > 0 && avail === 0;

  return (
    <Box>
      <TreeRow
        selected={selected}
        onClick={() => onSelect({ type: 'unit', buildingId, unitId: unit.unitId, floorId })}
        expandable={profile.showRoomsUnderUnit}
        open={open}
        onToggle={() => setOpen((v) => !v)}
        icon={<House size={16} />}
        iconColor={unitFull ? ACC_ACCENTS.treeUnitFull : ACC_ACCENTS.treeUnit}
        label={unit.name}
        secondary={`${avail}/${unit.bedCount}`}
      />
      {profile.showRoomsUnderUnit ? (
        <TreeBranch open={open}>
          {rooms.rooms.map((room) => (
            <RoomNode
              key={room.roomId}
              buildingId={buildingId}
              floorId={floorId}
              unitId={unit.unitId}
              roomId={room.roomId}
              roomName={room.name}
              bedCount={room.bedCount}
              availableBeds={room.availableBeds}
              selection={selection}
              onSelect={onSelect}
            />
          ))}
        </TreeBranch>
      ) : null}
    </Box>
  );
}

function RoomNode({
  buildingId,
  floorId,
  unitId,
  roomId,
  roomName,
  bedCount,
  availableBeds,
  selection,
  onSelect,
}: {
  buildingId: string;
  floorId?: string;
  unitId?: string;
  roomId: string;
  roomName: string;
  bedCount: number;
  availableBeds: number;
  selection: TreeSelection | null;
  onSelect: (s: TreeSelection) => void;
}) {
  const selected =
    (selection?.type === 'room' && selection.roomId === roomId) ||
    (selection?.type === 'bed' && selection.roomId === roomId);
  const full = bedCount > 0 && availableBeds === 0;

  return (
    <Box>
      <TreeRow
        selected={Boolean(selected)}
        onClick={() => onSelect({ type: 'room', buildingId, roomId, floorId, unitId })}
        icon={<BedDouble size={16} />}
        iconColor={full ? ACC_ACCENTS.treeRoomFull : ACC_ACCENTS.treeRoom}
        label={roomName}
        secondary={`${availableBeds}/${bedCount}`}
      />
    </Box>
  );
}

function BuildingNode({
  spaceId,
  building,
  profile,
  selection,
  onSelect,
  search,
}: {
  spaceId: string;
  building: BuildingResponse;
  profile: AccommodationUiProfile;
  selection: TreeSelection | null;
  onSelect: (s: TreeSelection) => void;
  search?: string;
}) {
  const selectedUnder =
    selection != null && 'buildingId' in selection && selection.buildingId === building.buildingId;

  const [open, setOpen] = useState(true);
  useEffect(() => {
    if (selectedUnder) setOpen(true);
  }, [selectedUnder]);

  const floors = useFloors(spaceId, building.buildingId, profile.showFloors && open);
  const units = useUnits(
    spaceId,
    building.buildingId,
    profile.showUnits && !profile.showUnitsOnFloor && open,
  );
  const selected = selection?.type === 'building' && selection.buildingId === building.buildingId;

  if (search?.trim() && !matchesSearch(building.name, search)) {
    return null;
  }

  return (
    <Box sx={{ mb: 0.5 }}>
      <TreeRow
        selected={selected}
        onClick={() => onSelect({ type: 'building', buildingId: building.buildingId })}
        expandable
        open={open}
        onToggle={() => setOpen((v) => !v)}
        icon={<Building2 size={16} />}
        iconColor={ACC_ACCENTS.building}
        label={building.name}
        secondary={building.layoutMode}
      />
      <TreeBranch open={open}>
        {profile.showFloors
          ? floors.floors.map((floor) => (
              <FloorNode
                key={floor.floorId}
                spaceId={spaceId}
                buildingId={building.buildingId}
                floor={floor}
                profile={profile}
                selection={selection}
                onSelect={onSelect}
              />
            ))
          : null}
        {profile.showUnits && !profile.showUnitsOnFloor
          ? units.units.map((unit) => (
              <UnitNode
                key={unit.unitId}
                spaceId={spaceId}
                buildingId={building.buildingId}
                unit={unit}
                profile={profile}
                selection={selection}
                onSelect={onSelect}
              />
            ))
          : null}
      </TreeBranch>
    </Box>
  );
}

export function HierarchyTree({
  spaceId,
  buildings,
  profile,
  selection,
  onSelect,
  search,
}: HierarchyTreeProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <Box sx={{ flex: 1, overflow: 'auto', px: 1, pb: 0.5 }}>
        {buildings.length === 0 ? (
          <Typography sx={{ ...DASHBOARD_UX.body, color: s.textSecondary, p: 2 }}>
            {t('accommodation.home.emptyTitle')}
          </Typography>
        ) : (
          <List dense disablePadding>
            {buildings.map((building) => (
              <BuildingNode
                key={building.buildingId}
                spaceId={spaceId}
                building={building}
                profile={profile}
                selection={selection}
                onSelect={onSelect}
                search={search}
              />
            ))}
          </List>
        )}
      </Box>
      <Box
        sx={{
          p: 1,
          borderTop: `1px solid ${s.border}`,
          display: 'flex',
          gap: 1,
          alignItems: 'center',
        }}
      >
        <BedDouble size={14} color={colors.muted} />
        <Typography sx={{ ...DASHBOARD_UX.metricCaption, color: s.textSecondary }}>
          {t('accommodation.workspace.treeHint')}
        </Typography>
      </Box>
    </Box>
  );
}
