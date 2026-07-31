import {
  Box,
  Button,
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSnackbar } from 'notistack';
import { AppDrawer } from '@/shared/components/AppDrawer';
import { StickyFooter } from '@/shared/components/StickyFooter';
import { dashContainedButtonSx, dashOutlinedButtonSx } from '@/shared/theme/dashButtonSx';
import type {
  AccommodationStatus,
  PropertyLayoutMode,
  RoomType,
} from '@/shared/types/accommodation';
import type { SpaceType } from '@/shared/types/space';
import {
  selectableLayoutModes,
  type AccommodationUiProfile,
} from '../utils/accommodationProfile';
import { useAccommodationMutations } from '../hooks/useAccommodation';
import type { TreeSelection } from './HierarchyTree';
import { PropertyLayoutModePicker } from '../illustrations/PropertyLayoutModePicker';

export type EntityFormMode =
  | { kind: 'create'; parent: TreeSelection | null }
  | { kind: 'edit'; selection: TreeSelection };

type EntityFormDrawerProps = {
  open: boolean;
  spaceId: string;
  spaceType?: SpaceType;
  profile?: AccommodationUiProfile | null;
  mode: EntityFormMode | null;
  defaultLayoutMode?: PropertyLayoutMode;
  onClose: () => void;
};

const STATUSES: AccommodationStatus[] = [
  'AVAILABLE',
  'OCCUPIED',
  'RESERVED',
  'MAINTENANCE',
  'BLOCKED',
];

const ROOM_TYPES: RoomType[] = ['PRIVATE', 'SHARED', 'DORMITORY'];

function childEntityType(
  parent: TreeSelection | null,
  profile?: AccommodationUiProfile | null,
): 'building' | 'floor' | 'unit' | 'room' | 'bed' {
  if (!parent) {
    return 'building';
  }
  switch (parent.type) {
    case 'building':
      if (profile?.showFloors) {
        return 'floor';
      }
      if (profile?.showUnits) {
        return 'unit';
      }
      return 'room';
    case 'floor':
      if (profile?.showUnitsOnFloor) {
        return 'unit';
      }
      return 'room';
    case 'unit':
      return 'room';
    case 'room':
    case 'bed':
      return 'bed';
    default:
      return 'building';
  }
}

function EntityFormBody({
  spaceId,
  spaceType,
  profile,
  mode,
  defaultLayoutMode,
  onClose,
}: {
  spaceId: string;
  spaceType?: SpaceType;
  profile?: AccommodationUiProfile | null;
  mode: EntityFormMode;
  defaultLayoutMode?: PropertyLayoutMode;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const { enqueueSnackbar } = useSnackbar();
  const mutations = useAccommodationMutations(spaceId);

  const createParent = mode.kind === 'create' ? mode.parent : null;
  const editSelection = mode.kind === 'edit' ? mode.selection : null;
  const entityType =
    mode.kind === 'edit'
      ? editSelection!.type === 'bed'
        ? 'bed'
        : editSelection!.type
      : childEntityType(createParent, profile);

  const layoutOptions = selectableLayoutModes(spaceType ?? 'PG');

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [layoutMode, setLayoutMode] = useState<PropertyLayoutMode>(
    defaultLayoutMode ?? layoutOptions[0] ?? 'CORRIDOR_PG',
  );
  const [floorNumber, setFloorNumber] = useState('0');
  const [unitNumber, setUnitNumber] = useState('');
  const [roomNumber, setRoomNumber] = useState('');
  const [bedNumber, setBedNumber] = useState('');
  const [capacity, setCapacity] = useState('1');
  const [roomType, setRoomType] = useState<RoomType>('SHARED');
  const [status, setStatus] = useState<AccommodationStatus>('AVAILABLE');
  const [defaultRent, setDefaultRent] = useState('');
  const [defaultDeposit, setDefaultDeposit] = useState('');
  const [error, setError] = useState<string | null>(null);

  const saving =
    mutations.createBuilding.isPending ||
    mutations.updateBuilding.isPending ||
    mutations.createFloor.isPending ||
    mutations.updateFloor.isPending ||
    mutations.createUnit.isPending ||
    mutations.createUnitOnFloor.isPending ||
    mutations.updateUnit.isPending ||
    mutations.createRoomUnderFloor.isPending ||
    mutations.createRoomUnderUnit.isPending ||
    mutations.updateRoom.isPending ||
    mutations.createBed.isPending ||
    mutations.updateBed.isPending;

  const titleKey =
    mode.kind === 'create'
      ? `accommodation.form.create.${entityType}`
      : `accommodation.form.edit.${entityType}`;

  const handleSubmit = async () => {
    setError(null);
    if (!name.trim() && entityType !== 'floor') {
      setError(t('accommodation.form.nameRequired'));
      return;
    }

    try {
      if (mode.kind === 'create') {
        if (entityType === 'building') {
          await mutations.createBuilding.mutateAsync({
            name: name.trim(),
            code: code.trim() || null,
            layoutMode,
          });
        } else if (entityType === 'floor' && createParent?.type === 'building') {
          await mutations.createFloor.mutateAsync({
            buildingId: createParent.buildingId,
            body: {
              name: name.trim() || `Floor ${floorNumber}`,
              floorNumber: Number(floorNumber) || 0,
            },
          });
        } else if (entityType === 'unit' && createParent) {
          const body = {
            name: name.trim(),
            unitNumber: unitNumber.trim() || name.trim(),
            status,
          };
          if (createParent.type === 'floor') {
            await mutations.createUnitOnFloor.mutateAsync({
              buildingId: createParent.buildingId,
              floorId: createParent.floorId,
              body,
            });
          } else if (createParent.type === 'building') {
            await mutations.createUnit.mutateAsync({
              buildingId: createParent.buildingId,
              body,
            });
          }
        } else if (entityType === 'room' && createParent) {
          const body = {
            name: name.trim(),
            roomNumber: roomNumber.trim() || name.trim(),
            roomType,
            capacity: Number(capacity) || 1,
            status,
          };
          if (createParent.type === 'floor') {
            await mutations.createRoomUnderFloor.mutateAsync({
              floorId: createParent.floorId,
              body,
            });
          } else if (createParent.type === 'unit') {
            await mutations.createRoomUnderUnit.mutateAsync({
              unitId: createParent.unitId,
              body,
            });
          }
        } else if (entityType === 'bed' && createParent && 'roomId' in createParent) {
          await mutations.createBed.mutateAsync({
            roomId: createParent.roomId,
            body: {
              name: name.trim(),
              bedNumber: bedNumber.trim() || name.trim(),
              status,
            },
          });
        }
        enqueueSnackbar(t('accommodation.form.createSuccess'), { variant: 'success' });
      } else if (editSelection) {
        if (editSelection.type === 'building') {
          await mutations.updateBuilding.mutateAsync({
            buildingId: editSelection.buildingId,
            body: { name: name.trim(), code: code.trim() || null, layoutMode },
          });
        } else if (editSelection.type === 'floor') {
          await mutations.updateFloor.mutateAsync({
            buildingId: editSelection.buildingId,
            floorId: editSelection.floorId,
            body: {
              name: name.trim() || `Floor ${floorNumber}`,
              floorNumber: Number(floorNumber) || 0,
            },
          });
        } else if (editSelection.type === 'unit') {
          await mutations.updateUnit.mutateAsync({
            unitId: editSelection.unitId,
            body: {
              name: name.trim(),
              unitNumber: unitNumber.trim() || name.trim(),
              status,
              defaultRent: defaultRent ? Number(defaultRent) : null,
              defaultDeposit: defaultDeposit ? Number(defaultDeposit) : null,
            },
          });
        } else if (editSelection.type === 'room') {
          await mutations.updateRoom.mutateAsync({
            roomId: editSelection.roomId,
            body: {
              name: name.trim(),
              roomNumber: roomNumber.trim() || name.trim(),
              roomType,
              capacity: Number(capacity) || 1,
              status,
              defaultRent: defaultRent ? Number(defaultRent) : null,
              defaultDeposit: defaultDeposit ? Number(defaultDeposit) : null,
            },
          });
        } else if (editSelection.type === 'bed') {
          await mutations.updateBed.mutateAsync({
            roomId: editSelection.roomId,
            bedId: editSelection.bedId,
            body: {
              name: name.trim(),
              bedNumber: bedNumber.trim() || name.trim(),
              status,
              defaultRent: defaultRent ? Number(defaultRent) : null,
              defaultDeposit: defaultDeposit ? Number(defaultDeposit) : null,
            },
          });
        }
        enqueueSnackbar(t('accommodation.form.updateSuccess'), { variant: 'success' });
      }
      onClose();
    } catch {
      enqueueSnackbar(t('common.errors.generic'), { variant: 'error' });
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          {t(titleKey)}
        </Typography>
      </Box>
      <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
        <Stack spacing={2}>
          {entityType === 'building' ? (
            <>
              <TextField
                label={t('accommodation.fields.name')}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('accommodation.buildings.namePlaceholder')}
                required
                fullWidth
              />
              <TextField
                label={t('accommodation.fields.code')}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder={t('accommodation.buildings.codePlaceholder')}
                fullWidth
              />
              <FormControl fullWidth>
                {layoutOptions.length > 1 ? (
                  <PropertyLayoutModePicker
                    value={layoutMode}
                    onChange={setLayoutMode}
                    options={layoutOptions}
                  />
                ) : (
                  <>
                    <InputLabel>{t('accommodation.layoutMode.label')}</InputLabel>
                    <Select
                      label={t('accommodation.layoutMode.label')}
                      value={layoutMode}
                      onChange={(e) => setLayoutMode(e.target.value as PropertyLayoutMode)}
                    >
                      {layoutOptions.map((opt) => (
                        <MenuItem key={opt} value={opt}>
                          {t(`accommodation.layoutMode.${opt}`)}
                        </MenuItem>
                      ))}
                    </Select>
                  </>
                )}
              </FormControl>
            </>
          ) : null}

          {entityType === 'floor' ? (
            <>
              <TextField
                label={t('accommodation.fields.name')}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Ground Floor"
                fullWidth
              />
              <TextField
                label={t('accommodation.floors.floorNumber')}
                value={floorNumber}
                onChange={(e) => setFloorNumber(e.target.value)}
                placeholder="e.g. 0"
                type="number"
                required
                fullWidth
              />
            </>
          ) : null}

          {entityType === 'unit' ? (
            <>
              <TextField
                label={t('accommodation.fields.name')}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Flat 2A"
                required
                fullWidth
              />
              <TextField
                label={t('accommodation.units.unitNumber')}
                value={unitNumber}
                onChange={(e) => setUnitNumber(e.target.value)}
                placeholder="e.g. 2A"
                fullWidth
              />
              <FormControl fullWidth>
                <InputLabel>{t('accommodation.status.label')}</InputLabel>
                <Select
                  label={t('accommodation.status.label')}
                  value={status}
                  onChange={(e) => setStatus(e.target.value as AccommodationStatus)}
                >
                  {STATUSES.map((s) => (
                    <MenuItem key={s} value={s}>
                      {t(`accommodation.status.${s}`)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              {mode.kind === 'edit' ? (
                <>
                  <TextField
                    label={t('accommodation.fields.defaultRent')}
                    value={defaultRent}
                    onChange={(e) => setDefaultRent(e.target.value)}
                    placeholder="e.g. 8500"
                    type="number"
                    fullWidth
                  />
                  <TextField
                    label={t('accommodation.fields.defaultDeposit')}
                    value={defaultDeposit}
                    onChange={(e) => setDefaultDeposit(e.target.value)}
                    placeholder="e.g. 15000"
                    type="number"
                    fullWidth
                  />
                </>
              ) : null}
            </>
          ) : null}

          {entityType === 'room' ? (
            <>
              <TextField
                label={t('accommodation.fields.name')}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Room 101"
                required
                fullWidth
              />
              <TextField
                label={t('accommodation.rooms.roomNumber')}
                value={roomNumber}
                onChange={(e) => setRoomNumber(e.target.value)}
                placeholder="e.g. 101"
                fullWidth
              />
              <FormControl fullWidth>
                <InputLabel>{t('accommodation.roomType.label')}</InputLabel>
                <Select
                  label={t('accommodation.roomType.label')}
                  value={roomType}
                  onChange={(e) => setRoomType(e.target.value as RoomType)}
                >
                  {ROOM_TYPES.map((rt) => (
                    <MenuItem key={rt} value={rt}>
                      {t(`accommodation.roomType.${rt}`)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                label={t('accommodation.rooms.capacity')}
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                placeholder="e.g. 2"
                type="number"
                fullWidth
              />
            </>
          ) : null}

          {entityType === 'bed' ? (
            <>
              <TextField
                label={t('accommodation.fields.name')}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Bed A"
                required
                fullWidth
              />
              <TextField
                label={t('accommodation.beds.bedNumber')}
                value={bedNumber}
                onChange={(e) => setBedNumber(e.target.value)}
                placeholder="e.g. A"
                fullWidth
              />
              <FormControl fullWidth>
                <InputLabel>{t('accommodation.status.label')}</InputLabel>
                <Select
                  label={t('accommodation.status.label')}
                  value={status}
                  onChange={(e) => setStatus(e.target.value as AccommodationStatus)}
                >
                  {STATUSES.filter((s) => s !== 'OCCUPIED' && s !== 'RESERVED').map((s) => (
                    <MenuItem key={s} value={s}>
                      {t(`accommodation.status.${s}`)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              {mode.kind === 'edit' ? (
                <>
                  <TextField
                    label={t('accommodation.fields.defaultRent')}
                    value={defaultRent}
                    onChange={(e) => setDefaultRent(e.target.value)}
                    placeholder="e.g. 4500"
                    type="number"
                    fullWidth
                  />
                  <TextField
                    label={t('accommodation.fields.defaultDeposit')}
                    value={defaultDeposit}
                    onChange={(e) => setDefaultDeposit(e.target.value)}
                    placeholder="e.g. 9000"
                    type="number"
                    fullWidth
                  />
                </>
              ) : null}
            </>
          ) : null}

          {error ? <FormHelperText error>{error}</FormHelperText> : null}
        </Stack>
      </Box>
      <StickyFooter>
        <Button onClick={onClose} disabled={saving} sx={dashOutlinedButtonSx}>
          {t('common.cancel')}
        </Button>
        <Button variant="contained" onClick={() => void handleSubmit()} disabled={saving} sx={dashContainedButtonSx}>
          {t('common.save')}
        </Button>
      </StickyFooter>
    </Box>
  );
}

export function EntityFormDrawer({
  open,
  spaceId,
  spaceType,
  profile,
  mode,
  defaultLayoutMode,
  onClose,
}: EntityFormDrawerProps) {
  return (
    <AppDrawer open={open} onClose={onClose} width={480}>
      {open && mode ? (
        <EntityFormBody
          key={`${mode.kind}-${JSON.stringify(mode)}`}
          spaceId={spaceId}
          spaceType={spaceType}
          profile={profile}
          mode={mode}
          defaultLayoutMode={defaultLayoutMode}
          onClose={onClose}
        />
      ) : null}
    </AppDrawer>
  );
}
