import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Stack,
  Switch,
  TextField,
  Typography,
  useTheme,
} from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DASHBOARD_UX, dashSurfaces } from '@/modules/dashboard/theme/dashboardUx';
import { dashContainedButtonSx, dashOutlinedButtonSx } from '@/shared/theme/dashButtonSx';
import { accommodationApi } from '../api/accommodationApi';
import type { TreeSelection } from './HierarchyTree';

type DuplicateEntityDialogProps = {
  open: boolean;
  spaceId: string;
  selection: TreeSelection;
  sourceName: string;
  onClose: () => void;
  onDuplicated: (next: TreeSelection) => void;
};

async function invalidateAccommodation(queryClient: ReturnType<typeof useQueryClient>, spaceId: string) {
  await queryClient.invalidateQueries({ queryKey: ['buildings', spaceId] });
  await queryClient.invalidateQueries({ queryKey: ['floors', spaceId] });
  await queryClient.invalidateQueries({ queryKey: ['units', spaceId] });
  await queryClient.invalidateQueries({ queryKey: ['rooms', spaceId] });
  await queryClient.invalidateQueries({ queryKey: ['beds', spaceId] });
  await queryClient.invalidateQueries({ queryKey: ['building-summary', spaceId] });
  await queryClient.invalidateQueries({ queryKey: ['rooms-by-floor', spaceId] });
  await queryClient.invalidateQueries({ queryKey: ['rooms-by-unit', spaceId] });
  await queryClient.invalidateQueries({ queryKey: ['units-by-floor', spaceId] });
  await queryClient.invalidateQueries({ predicate: (q) => String(q.queryKey[0]).includes('building') || String(q.queryKey[0]).includes('floor') || String(q.queryKey[0]).includes('room') });
}

/**
 * Duplicate building / floor / room — mirrors mobile Duplicate*Modal + POST .../duplicate.
 */
export function DuplicateEntityDialog({
  open,
  spaceId,
  selection,
  sourceName,
  onClose,
  onDuplicated,
}: DuplicateEntityDialogProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();

  const mode = selection.type;
  const [targetName, setTargetName] = useState('');
  const [targetCode, setTargetCode] = useState('');
  const [floorNumber, setFloorNumber] = useState('');
  const [floorName, setFloorName] = useState('');
  const [renumberRooms, setRenumberRooms] = useState(true);
  const [targetRoomNumber, setTargetRoomNumber] = useState('');
  const [fieldError, setFieldError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }
    setFieldError(null);
    setTargetName(`${sourceName} (Copy)`);
    setTargetCode('');
    setFloorNumber('');
    setFloorName('');
    setRenumberRooms(true);
    setTargetRoomNumber('');
  }, [open, sourceName]);

  const mutation = useMutation({
    mutationFn: async () => {
      if (mode === 'building' && selection.type === 'building') {
        const name = targetName.trim();
        if (!name) {
          throw new Error(t('accommodation.duplicate.building.nameRequired'));
        }
        return {
          kind: 'building' as const,
          result: await accommodationApi.duplicateBuilding(spaceId, selection.buildingId, {
            targetBuildingName: name,
            targetBuildingCode: targetCode.trim() || undefined,
          }),
        };
      }
      if (mode === 'floor' && selection.type === 'floor') {
        const parsed = Number(floorNumber);
        if (!Number.isFinite(parsed)) {
          throw new Error(t('accommodation.duplicate.floor.numberRequired'));
        }
        return {
          kind: 'floor' as const,
          buildingId: selection.buildingId,
          result: await accommodationApi.duplicateFloor(
            spaceId,
            selection.buildingId,
            selection.floorId,
            {
              targetFloorNumber: parsed,
              targetName: floorName.trim() || undefined,
              renumberRooms,
            },
          ),
        };
      }
      if (mode === 'room' && selection.type === 'room') {
        return {
          kind: 'room' as const,
          buildingId: selection.buildingId,
          floorId: selection.floorId,
          unitId: selection.unitId,
          result: await accommodationApi.duplicateRoom(spaceId, selection.roomId, {
            targetRoomNumber: targetRoomNumber.trim() || undefined,
          }),
        };
      }
      throw new Error(t('common.errors.generic'));
    },
    onSuccess: async (payload) => {
      await invalidateAccommodation(queryClient, spaceId);
      if (payload.kind === 'building') {
        enqueueSnackbar(t('accommodation.duplicate.building.success'), { variant: 'success' });
        onDuplicated({ type: 'building', buildingId: payload.result.buildingId });
      } else if (payload.kind === 'floor') {
        enqueueSnackbar(t('accommodation.duplicate.floor.success'), { variant: 'success' });
        onDuplicated({
          type: 'floor',
          buildingId: payload.buildingId,
          floorId: payload.result.floorId,
        });
      } else {
        enqueueSnackbar(t('accommodation.duplicate.room.success'), { variant: 'success' });
        onDuplicated({
          type: 'room',
          buildingId: payload.buildingId,
          roomId: payload.result.roomId,
          floorId: payload.floorId,
          unitId: payload.unitId,
        });
      }
      onClose();
    },
    onError: (err) => {
      const fallback =
        mode === 'building'
          ? t('accommodation.duplicate.errors.building')
          : mode === 'floor'
            ? t('accommodation.duplicate.errors.floor')
            : t('accommodation.duplicate.errors.room');
      const message = err instanceof Error ? err.message : fallback;
      setFieldError(message);
      enqueueSnackbar(message, { variant: 'error' });
    },
  });

  if (mode !== 'building' && mode !== 'floor' && mode !== 'room') {
    return null;
  }

  const title =
    mode === 'building'
      ? t('accommodation.duplicate.building.title')
      : mode === 'floor'
        ? t('accommodation.duplicate.floor.title')
        : t('accommodation.duplicate.room.title');

  const hint =
    mode === 'building'
      ? t('accommodation.duplicate.building.hint', { name: sourceName })
      : mode === 'floor'
        ? t('accommodation.duplicate.floor.hint', { name: sourceName })
        : t('accommodation.duplicate.room.hint', { name: sourceName });

  return (
    <Dialog
      open={open}
      onClose={mutation.isPending ? undefined : onClose}
      fullWidth
      maxWidth="xs"
      slotProps={{
        paper: {
          sx: {
            borderRadius: `${DASHBOARD_UX.radius}px`,
            border: `1px solid ${s.border}`,
            boxShadow: s.shadowHover,
          },
        },
      }}
    >
      <DialogTitle sx={{ ...DASHBOARD_UX.cardTitle, color: s.textPrimary }}>{title}</DialogTitle>
      <DialogContent>
        <Typography sx={{ ...DASHBOARD_UX.body, color: s.textSecondary, mb: 2 }}>{hint}</Typography>
        <Stack spacing={1.5} sx={{ pt: 0.5 }}>
          {mode === 'building' ? (
            <>
              <TextField
                size="small"
                fullWidth
                label={t('accommodation.duplicate.building.targetName')}
                value={targetName}
                onChange={(e) => setTargetName(e.target.value)}
                placeholder="e.g. Building 1 (Copy)"
                error={Boolean(fieldError && !targetName.trim())}
              />
              <TextField
                size="small"
                fullWidth
                label={t('accommodation.fields.code')}
                value={targetCode}
                onChange={(e) => setTargetCode(e.target.value)}
                placeholder={t('accommodation.buildings.codePlaceholder')}
              />
            </>
          ) : null}
          {mode === 'floor' ? (
            <>
              <TextField
                size="small"
                fullWidth
                type="number"
                label={t('accommodation.duplicate.floor.targetNumber')}
                value={floorNumber}
                onChange={(e) => setFloorNumber(e.target.value)}
                placeholder="e.g. 2"
              />
              <TextField
                size="small"
                fullWidth
                label={t('accommodation.fields.name')}
                value={floorName}
                onChange={(e) => setFloorName(e.target.value)}
                placeholder="e.g. First Floor"
              />
              <Box
                sx={{
                  px: 1.5,
                  py: 1,
                  border: `1px solid ${renumberRooms ? theme.palette.primary.main : s.border}`,
                  borderRadius: `${DASHBOARD_UX.tileRadius}px`,
                  bgcolor: renumberRooms ? 'action.selected' : s.elevated,
                }}
              >
                <FormControlLabel
                  control={
                    <Switch
                      checked={renumberRooms}
                      onChange={(_, checked) => setRenumberRooms(checked)}
                      size="small"
                    />
                  }
                  label={
                    <Box>
                      <Typography sx={{ ...DASHBOARD_UX.body, color: s.textPrimary }}>
                        {t('accommodation.duplicate.floor.renumber')}
                      </Typography>
                      <Typography sx={{ ...DASHBOARD_UX.caption, color: s.textMuted }}>
                        {t('accommodation.duplicate.floor.renumberHint')}
                      </Typography>
                    </Box>
                  }
                />
              </Box>
            </>
          ) : null}
          {mode === 'room' ? (
            <TextField
              size="small"
              fullWidth
              label={t('accommodation.duplicate.room.targetNumber')}
              value={targetRoomNumber}
              onChange={(e) => setTargetRoomNumber(e.target.value)}
              placeholder="e.g. 102"
            />
          ) : null}
          {fieldError ? (
            <Typography sx={{ ...DASHBOARD_UX.caption, color: 'error.main' }}>{fieldError}</Typography>
          ) : null}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 2.5, pb: 2, gap: 1 }}>
        <Button onClick={onClose} disabled={mutation.isPending} sx={dashOutlinedButtonSx}>
          {t('common.cancel')}
        </Button>
        <Button
          variant="contained"
          onClick={() => {
            setFieldError(null);
            mutation.mutate();
          }}
          disabled={mutation.isPending}
          sx={dashContainedButtonSx}
        >
          {t('accommodation.duplicate.confirm')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
