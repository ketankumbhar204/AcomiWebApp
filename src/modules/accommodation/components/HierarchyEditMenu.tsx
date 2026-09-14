import {
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Tooltip,
} from '@mui/material';
import { Building2, DoorOpen, EllipsisVertical, Layers, SquarePen } from 'lucide-react';
import { useState, type MouseEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { DASHBOARD_UX } from '@/modules/dashboard/theme/dashboardUx';
import type { BedRoomGroup } from '../utils/groupBedsByRoom';
import type { TreeSelection } from './HierarchyTree';

type HierarchyEditMenuProps = {
  group: BedRoomGroup;
  canEdit: boolean;
  /** When set, also offers Edit bed. */
  bedId?: string;
  onEdit: (selection: TreeSelection) => void;
  size?: 'small' | 'medium';
};

/**
 * Room-inventory ⋮ menu: edit building / floor / unit / room (and bed when provided).
 */
export function HierarchyEditMenu({
  group,
  canEdit,
  bedId,
  onEdit,
  size = 'small',
}: HierarchyEditMenuProps) {
  const { t } = useTranslation();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const open = Boolean(anchor);

  if (!canEdit) {
    return null;
  }

  const stop = (event: MouseEvent) => {
    event.stopPropagation();
    event.preventDefault();
  };

  const choose = (selection: TreeSelection) => {
    setAnchor(null);
    onEdit(selection);
  };

  return (
    <>
      <Tooltip title={t('common.actions', { defaultValue: 'Actions' })}>
        <IconButton
          size={size}
          aria-label={t('common.actions', { defaultValue: 'Actions' })}
          aria-haspopup="menu"
          aria-expanded={open}
          onClick={(event) => {
            stop(event);
            setAnchor(event.currentTarget);
          }}
          sx={{
            width: DASHBOARD_UX.buttonHeight,
            height: DASHBOARD_UX.buttonHeight,
            borderRadius: `${DASHBOARD_UX.buttonRadius}px`,
            flexShrink: 0,
          }}
        >
          <EllipsisVertical size={16} />
        </IconButton>
      </Tooltip>

      <Menu
        anchorEl={anchor}
        open={open}
        onClose={() => setAnchor(null)}
        onClick={stop}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{
          paper: {
            sx: { minWidth: 200, borderRadius: `${DASHBOARD_UX.tileRadius}px` },
          },
        }}
      >
        <MenuItem
          onClick={() => choose({ type: 'building', buildingId: group.buildingId })}
        >
          <ListItemIcon>
            <Building2 size={16} />
          </ListItemIcon>
          <ListItemText>
            {t('accommodation.builder.editBuilding', { defaultValue: 'Edit building' })}
          </ListItemText>
        </MenuItem>

        {group.floorId ? (
          <MenuItem
            onClick={() =>
              choose({
                type: 'floor',
                buildingId: group.buildingId,
                floorId: group.floorId!,
              })
            }
          >
            <ListItemIcon>
              <Layers size={16} />
            </ListItemIcon>
            <ListItemText>
              {t('accommodation.builder.editFloor', { defaultValue: 'Edit floor' })}
            </ListItemText>
          </MenuItem>
        ) : null}

        {group.unitId ? (
          <MenuItem
            onClick={() =>
              choose({
                type: 'unit',
                buildingId: group.buildingId,
                unitId: group.unitId!,
                floorId: group.floorId ?? undefined,
              })
            }
          >
            <ListItemIcon>
              <SquarePen size={16} />
            </ListItemIcon>
            <ListItemText>
              {t('accommodation.builder.editUnit', { defaultValue: 'Edit unit' })}
            </ListItemText>
          </MenuItem>
        ) : null}

        <MenuItem
          onClick={() =>
            choose({
              type: 'room',
              buildingId: group.buildingId,
              roomId: group.roomId,
              floorId: group.floorId ?? undefined,
              unitId: group.unitId ?? undefined,
            })
          }
        >
          <ListItemIcon>
            <DoorOpen size={16} />
          </ListItemIcon>
          <ListItemText>
            {t('accommodation.builder.editRoom', { defaultValue: 'Edit room' })}
          </ListItemText>
        </MenuItem>

        {bedId ? (
          <MenuItem
            onClick={() =>
              choose({
                type: 'bed',
                buildingId: group.buildingId,
                roomId: group.roomId,
                bedId,
                floorId: group.floorId ?? undefined,
                unitId: group.unitId ?? undefined,
              })
            }
          >
            <ListItemIcon>
              <SquarePen size={16} />
            </ListItemIcon>
            <ListItemText>
              {t('accommodation.builder.editBed', { defaultValue: 'Edit bed' })}
            </ListItemText>
          </MenuItem>
        ) : null}
      </Menu>
    </>
  );
}
