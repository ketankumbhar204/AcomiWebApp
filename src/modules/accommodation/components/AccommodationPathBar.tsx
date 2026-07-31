import { Box, ButtonBase, Typography, useTheme } from '@mui/material';
import {
  BedDouble,
  Building2,
  ChevronRight,
  DoorOpen,
  House,
  Layers,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { DASHBOARD_UX, dashSurfaces } from '@/modules/dashboard/theme/dashboardUx';
import { colors } from '@/shared/theme/colors';
import type { BuildingResponse } from '@/shared/types/accommodation';
import type { TreeSelection } from './HierarchyTree';
import {
  useBedDetail,
  useFloors,
  useRoomsByFloor,
  useRoomsByUnit,
  useUnits,
  useUnitsByFloor,
} from '../hooks/useAccommodation';

type PathCrumb = {
  id: string;
  label: string;
  icon: ReactNode;
  selection: TreeSelection;
};

type AccommodationPathBarProps = {
  spaceId: string;
  selection: TreeSelection | null;
  buildings: BuildingResponse[];
  onSelect: (next: TreeSelection) => void;
};

/**
 * Persistent drill-path — click any level to navigate without scrolling the hierarchy tree.
 * Matches Accommodation Figma path bar: Building › Floor › Unit › Room › Bed
 */
export function AccommodationPathBar({
  spaceId,
  selection,
  buildings,
  onSelect,
}: AccommodationPathBarProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);

  const buildingId = selection && 'buildingId' in selection ? selection.buildingId : undefined;
  const floorId = selection && 'floorId' in selection ? selection.floorId : undefined;
  const unitId = selection && 'unitId' in selection ? selection.unitId : undefined;
  const roomId =
    selection?.type === 'room' || selection?.type === 'bed' ? selection.roomId : undefined;
  const bedId = selection?.type === 'bed' ? selection.bedId : undefined;

  const building = buildings.find((b) => b.buildingId === buildingId);
  const floors = useFloors(spaceId, buildingId, Boolean(buildingId));
  const floor = floors.floors.find((f) => f.floorId === floorId);

  const unitsOnFloor = useUnitsByFloor(
    spaceId,
    buildingId,
    floorId,
    Boolean(buildingId && floorId && unitId),
  );
  const unitsBuilding = useUnits(
    spaceId,
    buildingId,
    Boolean(buildingId && unitId && !floorId),
  );
  const unit =
    [...unitsOnFloor.units, ...unitsBuilding.units].find((u) => u.unitId === unitId) ??
    undefined;

  const roomsFloor = useRoomsByFloor(spaceId, floorId, Boolean(floorId && roomId && !unitId));
  const roomsUnit = useRoomsByUnit(spaceId, unitId, Boolean(unitId && roomId));
  const room =
    [...roomsFloor.rooms, ...roomsUnit.rooms].find((r) => r.roomId === roomId) ?? undefined;

  const bed = useBedDetail(spaceId, bedId, Boolean(bedId));

  if (!selection || !buildingId) {
    return null;
  }

  const crumbs: PathCrumb[] = [
    {
      id: 'building',
      label: building?.name ?? t('accommodation.buildings.title'),
      icon: <Building2 size={14} />,
      selection: { type: 'building', buildingId },
    },
  ];

  if (floorId) {
    crumbs.push({
      id: 'floor',
      label: floor?.name ?? t('accommodation.floors.title'),
      icon: <Layers size={14} />,
      selection: { type: 'floor', buildingId, floorId },
    });
  }

  if (unitId) {
    crumbs.push({
      id: 'unit',
      label: unit?.name ?? t('accommodation.units.title'),
      icon: <House size={14} />,
      selection: { type: 'unit', buildingId, unitId, floorId },
    });
  }

  if (roomId) {
    crumbs.push({
      id: 'room',
      label: room?.name ?? t('accommodation.rooms.title', { defaultValue: 'Room' }),
      icon: <DoorOpen size={14} />,
      selection: {
        type: 'room',
        buildingId,
        roomId,
        floorId,
        unitId,
      },
    });
  }

  if (bedId) {
    crumbs.push({
      id: 'bed',
      label: bed.bed?.name ?? bed.bed?.bedNumber ?? t('accommodation.beds.title'),
      icon: <BedDouble size={14} />,
      selection: {
        type: 'bed',
        buildingId,
        roomId: roomId!,
        bedId,
        floorId,
        unitId,
      },
    });
  }

  return (
    <Box
      role="navigation"
      aria-label={t('accommodation.workspace.path', { defaultValue: 'Current path' })}
      sx={{
        display: 'flex',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 0.5,
        px: 1.5,
        py: 1,
        borderRadius: `${DASHBOARD_UX.radius}px`,
        border: `1px solid ${s.border}`,
        bgcolor: s.surface,
        boxShadow: s.shadow,
        minHeight: 44,
      }}
    >
      {crumbs.map((crumb, index) => {
        const isLast = index === crumbs.length - 1;
        return (
          <Box key={crumb.id} sx={{ display: 'flex', alignItems: 'center', gap: 0.5, minWidth: 0 }}>
            {index > 0 ? (
              <ChevronRight size={14} color={s.textMuted} aria-hidden />
            ) : null}
            <ButtonBase
              onClick={() => onSelect(crumb.selection)}
              aria-current={isLast ? 'page' : undefined}
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.75,
                px: 1,
                py: 0.5,
                borderRadius: `${DASHBOARD_UX.buttonRadius}px`,
                color: isLast ? colors.primaryDark : s.textSecondary,
                borderBottom: isLast ? `2px solid ${colors.primary}` : '2px solid transparent',
                transition: DASHBOARD_UX.transition,
                '&:hover': {
                  bgcolor: theme.palette.mode === 'dark' ? s.elevated : 'rgba(37, 211, 102, 0.08)',
                  color: colors.primaryDark,
                },
              }}
            >
              <Box sx={{ display: 'flex', color: 'inherit', flexShrink: 0 }}>{crumb.icon}</Box>
              <Typography
                sx={{
                  ...DASHBOARD_UX.body,
                  fontWeight: isLast ? 700 : 500,
                  color: 'inherit',
                  whiteSpace: 'nowrap',
                }}
              >
                {crumb.label}
              </Typography>
            </ButtonBase>
          </Box>
        );
      })}
    </Box>
  );
}
