import { Box, Button, Stack, Typography, useTheme } from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Copy, Plus, Power, SquarePen } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useSnackbar } from 'notistack';
import { ConfirmDialog } from '@/shared/components/ConfirmDialog';
import { DASHBOARD_UX, dashSurfaces } from '@/modules/dashboard/theme/dashboardUx';
import { dashOutlinedButtonSx } from '@/shared/theme/dashButtonSx';
import { colors } from '@/shared/theme/colors';
import type { AccommodationActionMetadata } from '@/shared/types/accommodation';
import type { TreeSelection } from './HierarchyTree';
import { accommodationLifecycleApi } from '../api/accommodationLifecycleApi';
import {
  occupancyBlocksLifecycle,
  occupancyLifecycleBlockReason,
} from '../utils/lifecycleGuards';
import { DuplicateEntityDialog } from './DuplicateEntityDialog';

type LifecycleKind = 'deactivate' | 'restore' | 'delete';

type AccommodationLifecycleActionsProps = {
  spaceId: string;
  selection: TreeSelection;
  actions?: AccommodationActionMetadata | null;
  sourceName: string;
  isInactive?: boolean;
  /** When OCCUPIED/RESERVED, hide deactivate and delete. */
  status?: string | null;
  canEdit: boolean;
  canDeactivate: boolean;
  onEdit: () => void;
  onAddChild?: () => void;
  /** Figma-style icon quick-action grid */
  variant?: 'stack' | 'quick';
  onChanged: () => void;
  onDuplicated: (next: TreeSelection) => void;
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
 * Owner lifecycle controls — mirrors mobile `AccommodationLifecycleActions` + Duplicate menus.
 */
export function AccommodationLifecycleActions({
  spaceId,
  selection,
  actions,
  sourceName,
  isInactive = false,
  status = null,
  canEdit,
  canDeactivate,
  onEdit,
  onAddChild,
  variant = 'stack',
  onChanged,
  onDuplicated,
}: AccommodationLifecycleActionsProps) {
  const { t } = useTranslation();
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);
  const [confirmKind, setConfirmKind] = useState<LifecycleKind | null>(null);
  const [duplicateOpen, setDuplicateOpen] = useState(false);

  const occupied = occupancyBlocksLifecycle(status);
  const showDeactivate = Boolean(canDeactivate && actions?.canDeactivate && !occupied);
  const showRestore = Boolean(canDeactivate && actions?.canRestore);
  const showDelete = Boolean(canDeactivate && actions?.canDelete && !occupied);
  const showDeleteHint = Boolean(
    (occupied || (canDeactivate && actions && !actions.canDelete)) &&
      (actions?.deleteReason || occupied),
  );
  const blockedHint = showDeleteHint
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

  const addChildLabel =
    selection.type === 'floor'
      ? t('accommodation.workspace.addChild')
      : selection.type === 'unit'
        ? t('accommodation.workspace.addChild')
        : selection.type === 'room'
          ? t('accommodation.workspace.addChild')
          : t('accommodation.workspace.addChild');

  const mutation = useMutation({
    mutationFn: (kind: LifecycleKind) => runLifecycle(spaceId, selection, kind),
    onSuccess: async () => {
      enqueueSnackbar(t('common.saved', { defaultValue: 'Saved' }), { variant: 'success' });
      await queryClient.invalidateQueries({ queryKey: ['buildings', spaceId] });
      await queryClient.invalidateQueries({ queryKey: ['floors', spaceId] });
      await queryClient.invalidateQueries({ queryKey: ['units', spaceId] });
      await queryClient.invalidateQueries({ queryKey: ['rooms', spaceId] });
      await queryClient.invalidateQueries({ queryKey: ['beds', spaceId] });
      onChanged();
      setConfirmKind(null);
    },
    onError: (err) => {
      enqueueSnackbar(err instanceof Error ? err.message : t('common.errors.generic'), {
        variant: 'error',
      });
    },
  });

  if (!actions && !canEdit) {
    return null;
  }

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

  const dialogs = (
    <>
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
            onDuplicated(next);
            onChanged();
          }}
        />
      ) : null}
    </>
  );

  if (variant === 'quick') {
    const cells: Array<{
      id: string;
      label: string;
      icon: ReactNode;
      onClick: () => void;
      danger?: boolean;
    }> = [];

    if (canEdit) {
      cells.push({
        id: 'edit',
        label: t('accommodation.actions.edit'),
        icon: <SquarePen size={16} />,
        onClick: onEdit,
      });
    }
    if (canEdit && onAddChild) {
      cells.push({
        id: 'add',
        label: addChildLabel,
        icon: <Plus size={16} />,
        onClick: onAddChild,
      });
    }
    if (canDuplicate) {
      cells.push({
        id: 'duplicate',
        label: duplicateActionLabel,
        icon: <Copy size={16} />,
        onClick: () => setDuplicateOpen(true),
      });
    }
    if (showDeactivate) {
      cells.push({
        id: 'deactivate',
        label: t('accommodation.lifecycle.deactivateConfirm'),
        icon: <Power size={16} />,
        onClick: () => setConfirmKind('deactivate'),
        danger: true,
      });
    }
    if (showRestore) {
      cells.push({
        id: 'restore',
        label: t('accommodation.lifecycle.activateConfirm'),
        icon: <Power size={16} />,
        onClick: () => setConfirmKind('restore'),
      });
    }

    return (
      <Box>
        <Typography sx={{ ...DASHBOARD_UX.metricLabel, color: s.textMuted, mb: 1 }}>
          {t('accommodation.workspace.quickActions', { defaultValue: 'Quick actions' })}
        </Typography>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: `repeat(${Math.min(cells.length || 1, 4)}, minmax(0, 1fr))`,
            gap: 1,
          }}
        >
          {cells.map((cell) => (
            <Box
              key={cell.id}
              component="button"
              type="button"
              disabled={mutation.isPending}
              onClick={cell.onClick}
              sx={{
                all: 'unset',
                boxSizing: 'border-box',
                cursor: mutation.isPending ? 'default' : 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 0.75,
                minHeight: 72,
                px: 0.5,
                py: 1,
                borderRadius: `${DASHBOARD_UX.tileRadius}px`,
                border: `1px solid ${cell.danger ? 'rgba(220, 38, 38, 0.35)' : s.border}`,
                bgcolor: s.surface,
                color: cell.danger ? colors.danger : s.textPrimary,
                transition: DASHBOARD_UX.transition,
                ...DASHBOARD_UX.badge,
                textAlign: 'center',
                '&:hover': {
                  boxShadow: s.shadowHover,
                  borderColor: cell.danger ? colors.danger : colors.primary,
                },
              }}
            >
              <Box
                sx={{
                  width: DASHBOARD_UX.iconWell,
                  height: DASHBOARD_UX.iconWell,
                  borderRadius: `${DASHBOARD_UX.iconWellRadius}px`,
                  bgcolor: cell.danger ? 'rgba(220, 38, 38, 0.1)' : `${colors.primary}1A`,
                  color: cell.danger ? colors.danger : colors.primaryDark,
                  display: 'grid',
                  placeItems: 'center',
                }}
              >
                {cell.icon}
              </Box>
              <Typography
                sx={{
                  ...DASHBOARD_UX.metricCaption,
                  color: 'inherit',
                  fontWeight: 600,
                  lineHeight: 1.2,
                }}
              >
                {cell.label}
              </Typography>
            </Box>
          ))}
        </Box>
        {showDelete ? (
          <Button
            color="error"
            variant="text"
            size="small"
            onClick={() => setConfirmKind('delete')}
            disabled={mutation.isPending}
            sx={{ mt: 1, ...dashOutlinedButtonSx }}
          >
            {t('accommodation.lifecycle.deleteConfirm')}
          </Button>
        ) : null}
        {blockedHint ? (
          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
            {blockedHint}
          </Typography>
        ) : null}
        {dialogs}
      </Box>
    );
  }

  return (
    <Box sx={{ mt: 1.5 }}>
      <Stack spacing={1}>
        {canEdit ? (
          <Button variant="outlined" onClick={onEdit} disabled={mutation.isPending} sx={dashOutlinedButtonSx}>
            {t('accommodation.actions.edit')}
          </Button>
        ) : null}
        {canDuplicate ? (
          <Button
            variant="outlined"
            onClick={() => setDuplicateOpen(true)}
            disabled={mutation.isPending}
            sx={dashOutlinedButtonSx}
          >
            {duplicateActionLabel}
          </Button>
        ) : null}
        {showDeactivate ? (
          <Button
            color="warning"
            variant="text"
            onClick={() => setConfirmKind('deactivate')}
            disabled={mutation.isPending}
            sx={dashOutlinedButtonSx}
          >
            {t('accommodation.lifecycle.deactivateConfirm')}
          </Button>
        ) : null}
        {showRestore ? (
          <Button
            variant="outlined"
            onClick={() => setConfirmKind('restore')}
            disabled={mutation.isPending}
            sx={dashOutlinedButtonSx}
          >
            {t('accommodation.lifecycle.activateConfirm')}
          </Button>
        ) : null}
        {showDelete ? (
          <Button
            color="error"
            variant="text"
            onClick={() => setConfirmKind('delete')}
            disabled={mutation.isPending}
            sx={dashOutlinedButtonSx}
          >
            {t('accommodation.lifecycle.deleteConfirm')}
          </Button>
        ) : null}
        {blockedHint ? (
          <Typography variant="caption" color="text.secondary">
            {blockedHint}
          </Typography>
        ) : null}
      </Stack>
      {dialogs}
    </Box>
  );
}
