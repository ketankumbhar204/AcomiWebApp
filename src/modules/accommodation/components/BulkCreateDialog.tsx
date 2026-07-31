import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSnackbar } from 'notistack';
import { dashContainedButtonSx, dashOutlinedButtonSx } from '@/shared/theme/dashButtonSx';
import { accommodationApi } from '../api/accommodationApi';
import type { BedLabelStyle, RoomType } from '@/shared/types/accommodation';

const MAX_BULK_BEDS = 20;
const MAX_BULK_ROOMS = 30;

type BulkCreateDialogProps =
  | {
      mode: 'beds';
      open: boolean;
      spaceId: string;
      roomId: string;
      parentLabel: string;
      onClose: () => void;
    }
  | {
      mode: 'rooms';
      open: boolean;
      spaceId: string;
      parentType: 'floor' | 'unit';
      parentId: string;
      parentLabel: string;
      onClose: () => void;
    };

/**
 * Bulk create beds or rooms — mirrors mobile BulkBedsModal / BulkRoomsModal.
 */
export function BulkCreateDialog(props: BulkCreateDialogProps) {
  const { t } = useTranslation();
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const [count, setCount] = useState('3');
  const [labelStyle, setLabelStyle] = useState<BedLabelStyle>('ALPHA');
  const [roomType, setRoomType] = useState<RoomType>('SHARED');
  const [capacity, setCapacity] = useState('2');
  const [bedsPerRoom, setBedsPerRoom] = useState('2');
  const [fieldError, setFieldError] = useState<string | null>(null);

  useEffect(() => {
    if (props.open) {
      setCount('3');
      setLabelStyle('ALPHA');
      setRoomType('SHARED');
      setCapacity('2');
      setBedsPerRoom('2');
      setFieldError(null);
    }
  }, [props.open]);

  const mutation = useMutation({
    mutationFn: async () => {
      const parsed = Number(count);
      if (props.mode === 'beds') {
        if (!Number.isFinite(parsed) || parsed < 1 || parsed > MAX_BULK_BEDS) {
          throw new Error(t('accommodation.bulk.errors.bedCount'));
        }
        return accommodationApi.bulkCreateBeds(props.spaceId, props.roomId, {
          count: parsed,
          labelStyle,
        });
      }
      const cap = Number(capacity);
      const beds = Number(bedsPerRoom);
      if (!Number.isFinite(parsed) || parsed < 1 || parsed > MAX_BULK_ROOMS) {
        throw new Error(t('accommodation.bulk.errors.roomCount'));
      }
      if (!Number.isFinite(cap) || cap < 1 || !Number.isFinite(beds) || beds < 1) {
        throw new Error(t('accommodation.bulk.rooms.capacityRequired'));
      }
      const body = {
        count: parsed,
        roomType,
        capacity: cap,
        bedsPerRoom: beds,
      };
      return props.parentType === 'floor'
        ? accommodationApi.bulkCreateRoomsUnderFloor(props.spaceId, props.parentId, body)
        : accommodationApi.bulkCreateRoomsUnderUnit(props.spaceId, props.parentId, body);
    },
    onSuccess: async (result) => {
      if (props.mode === 'beds' && 'bedsCreated' in result) {
        enqueueSnackbar(
          t('accommodation.bulk.beds.success', { count: result.bedsCreated }),
          { variant: 'success' },
        );
      } else if ('roomsCreated' in result) {
        enqueueSnackbar(
          t('accommodation.bulk.rooms.success', {
            rooms: result.roomsCreated,
            beds: result.bedsCreated,
          }),
          { variant: 'success' },
        );
      }
      await queryClient.invalidateQueries({ queryKey: ['rooms-by-floor', props.spaceId] });
      await queryClient.invalidateQueries({ queryKey: ['rooms-by-unit', props.spaceId] });
      await queryClient.invalidateQueries({ queryKey: ['beds', props.spaceId] });
      await queryClient.invalidateQueries({ queryKey: ['floors', props.spaceId] });
      await queryClient.invalidateQueries({ queryKey: ['units', props.spaceId] });
      await queryClient.invalidateQueries({ queryKey: ['units-by-floor', props.spaceId] });
      await queryClient.invalidateQueries({ queryKey: ['buildings', props.spaceId] });
      await queryClient.invalidateQueries({ queryKey: ['building-summary', props.spaceId] });
      props.onClose();
    },
    onError: (err) => {
      const message = err instanceof Error ? err.message : t('common.errors.generic');
      setFieldError(message);
      enqueueSnackbar(message, { variant: 'error' });
    },
  });

  return (
    <Dialog open={props.open} onClose={mutation.isPending ? undefined : props.onClose} fullWidth maxWidth="xs">
      <DialogTitle>
        {props.mode === 'beds'
          ? t('accommodation.bulk.beds.title', { defaultValue: 'Bulk add beds' })
          : t('accommodation.bulk.rooms.title', { defaultValue: 'Bulk add rooms' })}
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {props.parentLabel}
        </Typography>
        <Stack spacing={2} sx={{ pt: 0.5 }}>
          <TextField
            label={
              props.mode === 'beds'
                ? t('accommodation.bulk.beds.count')
                : t('accommodation.bulk.rooms.count')
            }
            value={count}
            onChange={(e) => setCount(e.target.value)}
            placeholder="e.g. 4"
            type="number"
            slotProps={{
              htmlInput: { min: 1, max: props.mode === 'beds' ? MAX_BULK_BEDS : MAX_BULK_ROOMS },
            }}
            fullWidth
            size="small"
          />
          {props.mode === 'beds' ? (
            <FormControl fullWidth size="small">
              <InputLabel id="bed-label-style">{t('accommodation.bulk.beds.labelStyle')}</InputLabel>
              <Select
                labelId="bed-label-style"
                label={t('accommodation.bulk.beds.labelStyle')}
                value={labelStyle}
                onChange={(e) => setLabelStyle(e.target.value as BedLabelStyle)}
              >
                <MenuItem value="ALPHA">{t('accommodation.bulk.beds.labelStyle_ALPHA')}</MenuItem>
                <MenuItem value="NUMERIC">{t('accommodation.bulk.beds.labelStyle_NUMERIC')}</MenuItem>
              </Select>
            </FormControl>
          ) : (
            <>
              <FormControl fullWidth size="small">
                <InputLabel id="bulk-room-type">{t('accommodation.roomType.label')}</InputLabel>
                <Select
                  labelId="bulk-room-type"
                  label={t('accommodation.roomType.label')}
                  value={roomType}
                  onChange={(e) => setRoomType(e.target.value as RoomType)}
                >
                  <MenuItem value="PRIVATE">{t('accommodation.roomType.PRIVATE')}</MenuItem>
                  <MenuItem value="SHARED">{t('accommodation.roomType.SHARED')}</MenuItem>
                  <MenuItem value="DORMITORY">{t('accommodation.roomType.DORMITORY')}</MenuItem>
                </Select>
              </FormControl>
              <TextField
                label={t('accommodation.rooms.capacity')}
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                placeholder="e.g. 2"
                type="number"
                fullWidth
                size="small"
              />
              <TextField
                label={t('accommodation.bulk.rooms.bedsPerRoom')}
                value={bedsPerRoom}
                onChange={(e) => setBedsPerRoom(e.target.value)}
                placeholder="e.g. 2"
                type="number"
                fullWidth
                size="small"
              />
            </>
          )}
          {fieldError ? (
            <Typography variant="caption" color="error">
              {fieldError}
            </Typography>
          ) : null}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={props.onClose} disabled={mutation.isPending} sx={dashOutlinedButtonSx}>
          {t('common.cancel')}
        </Button>
        <Button
          variant="contained"
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending}
          sx={dashContainedButtonSx}
        >
          {t('accommodation.bulk.confirm')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
