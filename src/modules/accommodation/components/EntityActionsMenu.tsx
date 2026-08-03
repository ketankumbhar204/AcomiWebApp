import {
  CircularProgress,
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Tooltip,
  Typography,
} from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Copy, EllipsisVertical, Power, SquarePen, Trash2 } from 'lucide-react';
import { useState, type MouseEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { useSnackbar } from 'notistack';
import { ConfirmDialog } from '@/shared/components/ConfirmDialog';
import { DASHBOARD_UX } from '@/modules/dashboard/theme/dashboardUx';
import { colors } from '@/shared/theme/colors';
import type { AccommodationActionMetadata, AccommodationStatus } from '@/shared/types/accommodation';
import type { TreeSelection } from './HierarchyTree';
import { accommodationApi } from '../api/accommodationApi';
import { accommodationLifecycleApi } from '../api/accommodationLifecycleApi';
import {
  occupancyBlocksLifecycle,
  occupancyLifecycleBlockReason,
} from '../utils/lifecycleGuards';
import { DuplicateEntityDialog } from './DuplicateEntityDialog';

type LifecycleKind = 'deactivate' | 'restore' | 'delete';

type EntityActionsMenuProps = {
  spaceId: string;
  selection: TreeSelection;
  sourceName: string;
  /** Prefer passing detail `actions` when known; otherwise loaded on menu open (mobile parity). */
  actions?: AccommodationActionMetadata | null;
  /** List/detail status — blocks deactivate/delete when OCCUPIED or RESERVED. */
  status?: AccommodationStatus | string | null;
  isInactive?: boolean;
  canEdit: boolean;
  canDeactivate: boolean;
  onEdit: () => void;
  onChanged?: () => void;
  onDuplicated?: (next: TreeSelection) => void;
  size?: 'small' | 'medium';
};

type LoadedLifecycle = {
  actions?: AccommodationActionMetadata;
  status?: AccommodationStatus | string;
};

function entityIds(selection: TreeSelection) {
  return {
    buildingId: 'buildingId' in selection ? selection.buildingId : undefined,
    floorId: selection.type === 'floor' ? selection.floorId : undefined,
    unitId: selection.type === 'unit' ? selection.unitId : undefined,
    roomId:
      selection.type === 'room' || selection.type === 'bed' ? selection.roomId : undefined,
    bedId: selection.type === 'bed' ? selection.bedId : undefined,
  };
}

/** Same as mobile `loadEntityActions` — lifecycle flags come from detail APIs only. */
async function loadEntityLifecycle(
  spaceId: string,
  selection: TreeSelection,
): Promise<LoadedLifecycle> {
  const ids = entityIds(selection);
  switch (selection.type) {
    case 'building': {
      if (!ids.buildingId) return {};
      const building = await accommodationApi.getBuilding(spaceId, ids.buildingId);
      return { actions: building.actions };
    }
    case 'floor': {
      if (!ids.floorId) return {};
      const floor = await accommodationApi.getFloor(spaceId, ids.floorId);
      return { actions: floor.actions };
    }
    case 'unit': {
      if (!ids.unitId) return {};
      const unit = await accommodationApi.getUnit(spaceId, ids.unitId);
      return { actions: unit.actions, status: unit.status };
    }
    case 'room': {
      if (!ids.roomId) return {};
      const room = await accommodationApi.getRoom(spaceId, ids.roomId);
      return { actions: room.actions, status: room.status };
    }
    case 'bed': {
      if (!ids.bedId) return {};
      const bed = await accommodationApi.getBed(spaceId, ids.bedId);
      return { actions: bed.actions, status: bed.status };
    }
    default:
      return {};
  }
}

async function runLifecycle(
  spaceId: string,
  selection: TreeSelection,
  kind: LifecycleKind,
): Promise<void> {
  const ids = entityIds(selection);
  const api = accommodationLifecycleApi;

  switch (selection.type) {
    case 'building':
      if (!ids.buildingId) return;
      if (kind === 'deactivate') return api.deactivateBuilding(spaceId, ids.buildingId);
      if (kind === 'restore') return api.restoreBuilding(spaceId, ids.buildingId);
      return api.deleteBuilding(spaceId, ids.buildingId);
    case 'floor':
      if (!ids.floorId) return;
      if (kind === 'deactivate') return api.deactivateFloor(spaceId, ids.floorId);
      if (kind === 'restore') return api.restoreFloor(spaceId, ids.floorId);
      return api.deleteFloor(spaceId, ids.floorId);
    case 'unit':
      if (!ids.unitId) return;
      if (kind === 'deactivate') return api.deactivateUnit(spaceId, ids.unitId);
      if (kind === 'restore') return api.restoreUnit(spaceId, ids.unitId);
      return api.deleteUnit(spaceId, ids.unitId);
    case 'room':
      if (!ids.roomId) return;
      if (kind === 'deactivate') return api.deactivateRoom(spaceId, ids.roomId);
      if (kind === 'restore') return api.restoreRoom(spaceId, ids.roomId);
      return api.deleteRoom(spaceId, ids.roomId);
    case 'bed':
      if (!ids.bedId) return;
      if (kind === 'deactivate') return api.deactivateBed(spaceId, ids.bedId);
      if (kind === 'restore') return api.restoreBed(spaceId, ids.bedId);
      return api.deleteBed(spaceId, ids.bedId);
    default:
      return;
  }
}

/**
 * Overflow (⋮) menu — mirrors mobile BuilderRowLifecycleMenu:
 * deactivate / delete only when API `actions` allows them; otherwise show deleteReason.
 */
export function EntityActionsMenu({
  spaceId,
  selection,
  sourceName,
  actions: actionsProp,
  status: statusProp,
  isInactive = false,
  canEdit,
  canDeactivate,
  onEdit,
  onChanged,
  onDuplicated,
  size = 'small',
}: EntityActionsMenuProps) {
  const { t } = useTranslation();
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const [confirmKind, setConfirmKind] = useState<LifecycleKind | null>(null);
  const [duplicateOpen, setDuplicateOpen] = useState(false);
  const [resolvedActions, setResolvedActions] = useState<AccommodationActionMetadata | null | undefined>(
    actionsProp,
  );
  const [resolvedStatus, setResolvedStatus] = useState<AccommodationStatus | string | null | undefined>(
    statusProp,
  );
  const [loadingActions, setLoadingActions] = useState(false);

  const open = Boolean(anchor);

  const actions = resolvedActions ?? actionsProp ?? null;
  const entityStatus = resolvedStatus ?? statusProp ?? null;
  const occupied = occupancyBlocksLifecycle(entityStatus);

  // Trust API flags, then block lifecycle when entity is occupied/reserved.
  const showDeactivate = Boolean(canDeactivate && actions?.canDeactivate && !occupied);
  const showRestore = Boolean(canDeactivate && actions?.canRestore);
  const showDelete = Boolean(canDeactivate && actions?.canDelete && !occupied);
  const blockedHint =
    occupied || (canDeactivate && actions && !actions.canDelete && actions.deleteReason)
      ? occupancyLifecycleBlockReason(
          actions?.deleteReason,
          t('accommodation.lifecycle.occupiedBlockHint', {
            defaultValue: 'Cannot deactivate or delete while this entity is occupied or reserved.',
          }),
        )
      : null;

  const canDuplicate =
    canEdit &&
    !isInactive &&
    !occupied &&
    (selection.type === 'building' ||
      selection.type === 'floor' ||
      selection.type === 'room');

  const duplicateActionLabel =
    selection.type === 'building'
      ? t('accommodation.duplicate.building.action')
      : selection.type === 'floor'
        ? t('accommodation.duplicate.floor.action')
        : t('accommodation.duplicate.room.action');

  const mutation = useMutation({
    mutationFn: (kind: LifecycleKind) => runLifecycle(spaceId, selection, kind),
    onSuccess: async () => {
      enqueueSnackbar(t('common.saved', { defaultValue: 'Saved' }), { variant: 'success' });
      await queryClient.invalidateQueries({ queryKey: ['buildings', spaceId] });
      await queryClient.invalidateQueries({ queryKey: ['floors', spaceId] });
      await queryClient.invalidateQueries({ queryKey: ['units', spaceId] });
      await queryClient.invalidateQueries({ queryKey: ['rooms', spaceId] });
      await queryClient.invalidateQueries({ queryKey: ['beds', spaceId] });
      await queryClient.invalidateQueries({ queryKey: ['building-summary', spaceId] });
      onChanged?.();
      setConfirmKind(null);
      setResolvedActions(undefined);
      setResolvedStatus(undefined);
    },
    onError: (err) => {
      enqueueSnackbar(err instanceof Error ? err.message : t('common.errors.generic'), {
        variant: 'error',
      });
    },
  });

  if (!canEdit && !canDeactivate) {
    return null;
  }

  const stop = (e: MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
  };

  const openMenu = async (e: MouseEvent<HTMLElement>) => {
    stop(e);
    setAnchor(e.currentTarget);

    // Always refresh flags + status from detail API (list rows omit `actions`).
    setLoadingActions(true);
    try {
      const loaded = await loadEntityLifecycle(spaceId, selection);
      setResolvedActions(loaded.actions ?? null);
      if (loaded.status != null) {
        setResolvedStatus(loaded.status);
      }

      const nextOccupied = occupancyBlocksLifecycle(loaded.status ?? statusProp);
      const nextActions = loaded.actions;
      const onlyBlocked =
        canDeactivate &&
        nextOccupied &&
        !canEdit &&
        !(
          canEdit &&
          !isInactive &&
          (selection.type === 'building' ||
            selection.type === 'floor' ||
            selection.type === 'room')
        );

      if (onlyBlocked) {
        const reason = occupancyLifecycleBlockReason(
          nextActions?.deleteReason,
          t('accommodation.lifecycle.occupiedBlockHint', {
            defaultValue: 'Cannot deactivate or delete while this entity is occupied or reserved.',
          }),
        );
        setAnchor(null);
        enqueueSnackbar(reason, { variant: 'info' });
      }
    } catch (err) {
      enqueueSnackbar(err instanceof Error ? err.message : t('common.errors.generic'), {
        variant: 'error',
      });
    } finally {
      setLoadingActions(false);
    }
  };

  const confirmCopy =
    confirmKind === 'delete'
      ? {
          title: t('accommodation.lifecycle.deleteTitle'),
          description: t('accommodation.lifecycle.deleteMessage'),
          confirmLabel: t('accommodation.lifecycle.deleteConfirm'),
        }
      : confirmKind === 'restore'
        ? {
            title: t('accommodation.lifecycle.activateTitle', {
              defaultValue: t('accommodation.lifecycle.activateConfirm'),
            }),
            description: t('accommodation.lifecycle.activateMessage', {
              defaultValue: t('accommodation.lifecycle.activateConfirm'),
            }),
            confirmLabel: t('accommodation.lifecycle.activateConfirm'),
          }
        : {
            title: t('accommodation.lifecycle.deactivateTitle'),
            description: t('accommodation.lifecycle.deactivateMessage'),
            confirmLabel: t('accommodation.lifecycle.deactivateConfirm'),
          };

  return (
    <>
      <Tooltip title={t('common.actions', { defaultValue: 'Actions' })}>
        <IconButton
          size={size}
          aria-label={t('common.actions', { defaultValue: 'Actions' })}
          aria-haspopup="menu"
          aria-expanded={open}
          onClick={(e) => void openMenu(e)}
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
            sx: { minWidth: 220, maxWidth: 320, borderRadius: `${DASHBOARD_UX.tileRadius}px` },
          },
        }}
      >
        {loadingActions ? (
          <MenuItem disabled>
            <ListItemIcon>
              <CircularProgress size={16} />
            </ListItemIcon>
            <ListItemText>{t('common.loading', { defaultValue: 'Loading…' })}</ListItemText>
          </MenuItem>
        ) : (
          <>
            {canEdit ? (
              <MenuItem
                onClick={() => {
                  setAnchor(null);
                  onEdit();
                }}
              >
                <ListItemIcon>
                  <SquarePen size={16} />
                </ListItemIcon>
                <ListItemText>{t('accommodation.actions.edit')}</ListItemText>
              </MenuItem>
            ) : null}

            {canDuplicate ? (
              <MenuItem
                onClick={() => {
                  setAnchor(null);
                  setDuplicateOpen(true);
                }}
              >
                <ListItemIcon>
                  <Copy size={16} />
                </ListItemIcon>
                <ListItemText>{duplicateActionLabel}</ListItemText>
              </MenuItem>
            ) : null}

            {showDeactivate ? (
              <MenuItem
                onClick={() => {
                  setAnchor(null);
                  setConfirmKind('deactivate');
                }}
                sx={{ color: colors.danger }}
              >
                <ListItemIcon sx={{ color: 'inherit' }}>
                  <Power size={16} />
                </ListItemIcon>
                <ListItemText>{t('accommodation.lifecycle.deactivateConfirm')}</ListItemText>
              </MenuItem>
            ) : null}

            {showRestore ? (
              <MenuItem
                onClick={() => {
                  setAnchor(null);
                  setConfirmKind('restore');
                }}
              >
                <ListItemIcon>
                  <Power size={16} />
                </ListItemIcon>
                <ListItemText>{t('accommodation.lifecycle.activateConfirm')}</ListItemText>
              </MenuItem>
            ) : null}

            {showDelete ? (
              <MenuItem
                onClick={() => {
                  setAnchor(null);
                  setConfirmKind('delete');
                }}
                sx={{ color: colors.danger }}
              >
                <ListItemIcon sx={{ color: 'inherit' }}>
                  <Trash2 size={16} />
                </ListItemIcon>
                <ListItemText>{t('accommodation.lifecycle.deleteConfirm')}</ListItemText>
              </MenuItem>
            ) : null}

            {blockedHint && !showDeactivate && !showDelete ? (
              <MenuItem disabled sx={{ opacity: 1, whiteSpace: 'normal', alignItems: 'flex-start' }}>
                <ListItemText
                  primary={
                    <Typography
                      color="text.secondary"
                      sx={{ ...DASHBOARD_UX.smallCaption, whiteSpace: 'normal' }}
                    >
                      {blockedHint}
                    </Typography>
                  }
                />
              </MenuItem>
            ) : null}
          </>
        )}
      </Menu>

      <ConfirmDialog
        open={confirmKind != null}
        title={confirmCopy.title}
        description={confirmCopy.description}
        confirmLabel={confirmCopy.confirmLabel}
        cancelLabel={t('common.cancel')}
        destructive={confirmKind === 'delete' || confirmKind === 'deactivate'}
        confirming={mutation.isPending}
        onClose={() => setConfirmKind(null)}
        onConfirm={() => {
          if (confirmKind) mutation.mutate(confirmKind);
        }}
      />

      {canDuplicate ? (
        <DuplicateEntityDialog
          open={duplicateOpen}
          spaceId={spaceId}
          selection={selection}
          sourceName={sourceName}
          onClose={() => setDuplicateOpen(false)}
          onDuplicated={(next) => {
            onDuplicated?.(next);
            onChanged?.();
          }}
        />
      ) : null}
    </>
  );
}
