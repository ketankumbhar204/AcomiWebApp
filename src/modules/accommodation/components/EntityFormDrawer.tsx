import {
  Box,
  Button,
  CircularProgress,
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
  useTheme,
} from '@mui/material';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSnackbar } from 'notistack';
import { AppDrawer } from '@/shared/components/AppDrawer';
import { DASHBOARD_UX, dashSurfaces } from '@/modules/dashboard/theme/dashboardUx';
import { StickyFooter } from '@/shared/components/StickyFooter';
import { dashContainedButtonSx, dashOutlinedButtonSx } from '@/shared/theme/dashButtonSx';
import { useSpacePermissions } from '@/shared/hooks/useSpacePermissions';
import type {
  AccommodationStatus,
  PropertyLayoutMode,
  RoomType,
} from '@/shared/types/accommodation';
import type { SpaceType } from '@/shared/types/space';
import {
  suggestBuildingCode,
  suggestBuildingName,
} from '@/shared/utils/suggestBuildingDefaults';
import {
  selectableLayoutModes,
  type AccommodationUiProfile,
} from '../utils/accommodationProfile';
import { accommodationApi } from '../api/accommodationApi';
import { useAccommodationMutations, useBuildings } from '../hooks/useAccommodation';
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

const fieldSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: `${DASHBOARD_UX.buttonRadius}px`,
    bgcolor: 'background.paper',
  },
} as const;

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
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);
  const { enqueueSnackbar } = useSnackbar();
  const mutations = useAccommodationMutations(spaceId);
  const permissions = useSpacePermissions(spaceId);
  const spaceName = permissions.space?.spaceName ?? '';

  const createParent = mode.kind === 'create' ? mode.parent : null;
  const editSelection = mode.kind === 'edit' ? mode.selection : null;
  const entityType =
    mode.kind === 'edit'
      ? editSelection!.type === 'bed'
        ? 'bed'
        : editSelection!.type
      : childEntityType(createParent, profile);

  const { buildings, loading: buildingsLoading } = useBuildings(
    spaceId,
    mode.kind === 'create' && entityType === 'building',
  );
  const buildingDefaultsAppliedRef = useRef(false);

  const layoutOptions = selectableLayoutModes(spaceType ?? 'PG');

  const [loading, setLoading] = useState(mode.kind === 'edit');
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

  useEffect(() => {
    if (
      mode.kind !== 'create' ||
      entityType !== 'building' ||
      buildingDefaultsAppliedRef.current ||
      buildingsLoading
    ) {
      return;
    }
    setName(suggestBuildingName(spaceName));
    setCode(suggestBuildingCode(buildings.length));
    buildingDefaultsAppliedRef.current = true;
  }, [buildings.length, buildingsLoading, entityType, mode.kind, spaceName]);

  useEffect(() => {
    if (mode.kind !== 'edit' || !editSelection) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    void (async () => {
      try {
        if (editSelection.type === 'building') {
          const building = await accommodationApi.getBuilding(spaceId, editSelection.buildingId);
          if (cancelled) return;
          setName(building.name ?? '');
          setCode(building.code ?? '');
          if (building.layoutMode) {
            setLayoutMode(building.layoutMode);
          }
        } else if (editSelection.type === 'floor') {
          const floor = await accommodationApi.getFloor(spaceId, editSelection.floorId);
          if (cancelled) return;
          setName(floor.name ?? '');
          setFloorNumber(String(floor.floorNumber ?? 0));
        } else if (editSelection.type === 'unit') {
          const unit = await accommodationApi.getUnit(spaceId, editSelection.unitId);
          if (cancelled) return;
          setName(unit.name ?? '');
          setUnitNumber(unit.unitNumber ?? '');
          if (unit.status) setStatus(unit.status);
          setDefaultRent(unit.defaultRent != null ? String(unit.defaultRent) : '');
          setDefaultDeposit(unit.defaultDeposit != null ? String(unit.defaultDeposit) : '');
        } else if (editSelection.type === 'room') {
          const room = await accommodationApi.getRoom(spaceId, editSelection.roomId);
          if (cancelled) return;
          setName(room.name ?? '');
          setRoomNumber(room.roomNumber ?? '');
          if (room.roomType) setRoomType(room.roomType);
          setCapacity(String(room.capacity ?? 1));
          if (room.status) setStatus(room.status);
          setDefaultRent(room.defaultRent != null ? String(room.defaultRent) : '');
          setDefaultDeposit(room.defaultDeposit != null ? String(room.defaultDeposit) : '');
        } else if (editSelection.type === 'bed') {
          const bed = await accommodationApi.getBed(spaceId, editSelection.bedId);
          if (cancelled) return;
          setName(bed.name ?? '');
          setBedNumber(bed.bedNumber ?? '');
          if (bed.status) setStatus(bed.status);
          setDefaultRent(bed.defaultRent != null ? String(bed.defaultRent) : '');
          setDefaultDeposit(bed.defaultDeposit != null ? String(bed.defaultDeposit) : '');
        }
      } catch {
        if (!cancelled) {
          enqueueSnackbar(t('common.errors.generic'), { variant: 'error' });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [editSelection, enqueueSnackbar, mode.kind, spaceId, t]);

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

  const subtitleKey =
    mode.kind === 'create'
      ? `accommodation.form.createHint.${entityType}`
      : `accommodation.form.editHint.${entityType}`;

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
              defaultRent: defaultRent ? Number(defaultRent) : null,
              defaultDeposit: defaultDeposit ? Number(defaultDeposit) : null,
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
      <Box
        sx={{
          px: 2.5,
          py: 2,
          borderBottom: `1px solid ${s.border}`,
          bgcolor: s.surface,
        }}
      >
        <Typography sx={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.02em', color: s.textPrimary }}>
          {t(titleKey)}
        </Typography>
        <Typography sx={{ mt: 0.5, fontSize: 13, color: s.textSecondary, lineHeight: 1.4 }}>
          {t(subtitleKey, {
            defaultValue:
              mode.kind === 'edit'
                ? 'Update details for this item in your property hierarchy.'
                : 'Add this item to your property hierarchy.',
          })}
        </Typography>
      </Box>

      <Box sx={{ flex: 1, overflow: 'auto', px: 2.5, py: 2.5, bgcolor: s.pageBg }}>
        {loading ? (
          <Box sx={{ display: 'grid', placeItems: 'center', minHeight: 220 }}>
            <CircularProgress size={28} />
          </Box>
        ) : (
          <Stack
            spacing={2}
            sx={{
              p: 2,
              borderRadius: 2.5,
              border: `1px solid ${s.border}`,
              bgcolor: s.surface,
              boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
            }}
          >
            {entityType === 'building' ? (
              <>
                <TextField
                  label={t('accommodation.fields.name')}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t('accommodation.buildings.namePlaceholderSpace', {
                    defaultValue: 'Uses your space name by default',
                  })}
                  required
                  fullWidth
                  sx={fieldSx}
                />
                <TextField
                  label={t('accommodation.fields.code')}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder={t('accommodation.buildings.codePlaceholderBld', {
                    defaultValue: 'e.g. BLD 1',
                  })}
                  fullWidth
                  sx={fieldSx}
                />
                <FormControl fullWidth>
                  {layoutOptions.length > 1 ? (
                    <PropertyLayoutModePicker
                      value={layoutMode}
                      onChange={setLayoutMode}
                      options={layoutOptions}
                      variant="compact"
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
                  placeholder={t('accommodation.floors.namePlaceholder')}
                  fullWidth
                  sx={fieldSx}
                />
                <TextField
                  label={t('accommodation.floors.floorNumberLabel', { defaultValue: 'Floor number' })}
                  value={floorNumber}
                  onChange={(e) => setFloorNumber(e.target.value)}
                  placeholder="e.g. 0"
                  type="number"
                  required
                  fullWidth
                  sx={fieldSx}
                />
              </>
            ) : null}

            {entityType === 'unit' ? (
              <>
                <TextField
                  label={t('accommodation.fields.name')}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t('accommodation.units.namePlaceholder')}
                  required
                  fullWidth
                  sx={fieldSx}
                />
                <TextField
                  label={t('accommodation.units.unitNumberLabel', { defaultValue: 'Unit number' })}
                  value={unitNumber}
                  onChange={(e) => setUnitNumber(e.target.value)}
                  placeholder={t('accommodation.units.unitNumberPlaceholder')}
                  fullWidth
                  sx={fieldSx}
                />
                <FormControl fullWidth>
                  <InputLabel>{t('accommodation.status.label')}</InputLabel>
                  <Select
                    label={t('accommodation.status.label')}
                    value={status}
                    onChange={(e) => setStatus(e.target.value as AccommodationStatus)}
                  >
                    {STATUSES.map((item) => (
                      <MenuItem key={item} value={item}>
                        {t(`accommodation.status.${item}`)}
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
                      sx={fieldSx}
                    />
                    <TextField
                      label={t('accommodation.fields.defaultDeposit')}
                      value={defaultDeposit}
                      onChange={(e) => setDefaultDeposit(e.target.value)}
                      placeholder="e.g. 15000"
                      type="number"
                      fullWidth
                      sx={fieldSx}
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
                  placeholder={t('accommodation.rooms.namePlaceholder')}
                  required
                  fullWidth
                  sx={fieldSx}
                />
                <TextField
                  label={t('accommodation.rooms.roomNumberLabel', {
                    defaultValue: t('accommodation.rooms.roomNumber'),
                  })}
                  value={roomNumber}
                  onChange={(e) => setRoomNumber(e.target.value)}
                  placeholder="e.g. 101"
                  fullWidth
                  sx={fieldSx}
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
                  sx={fieldSx}
                />
              </>
            ) : null}

            {entityType === 'bed' ? (
              <>
                <TextField
                  label={t('accommodation.fields.name')}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t('accommodation.beds.namePlaceholder')}
                  required
                  fullWidth
                  sx={fieldSx}
                />
                <TextField
                  label={t('accommodation.beds.bedNumberLabel', { defaultValue: 'Bed number' })}
                  value={bedNumber}
                  onChange={(e) => setBedNumber(e.target.value)}
                  placeholder="e.g. A"
                  fullWidth
                  sx={fieldSx}
                />
                <FormControl fullWidth>
                  <InputLabel>{t('accommodation.status.label')}</InputLabel>
                  <Select
                    label={t('accommodation.status.label')}
                    value={status}
                    onChange={(e) => setStatus(e.target.value as AccommodationStatus)}
                  >
                    {STATUSES.filter((item) => item !== 'OCCUPIED' && item !== 'RESERVED').map(
                      (item) => (
                        <MenuItem key={item} value={item}>
                          {t(`accommodation.status.${item}`)}
                        </MenuItem>
                      ),
                    )}
                  </Select>
                </FormControl>
                <TextField
                  label={t('accommodation.fields.defaultRent')}
                  value={defaultRent}
                  onChange={(e) => setDefaultRent(e.target.value)}
                  placeholder="e.g. 4500"
                  type="number"
                  fullWidth
                  sx={fieldSx}
                />
                <TextField
                  label={t('accommodation.fields.defaultDeposit')}
                  value={defaultDeposit}
                  onChange={(e) => setDefaultDeposit(e.target.value)}
                  placeholder="e.g. 9000"
                  type="number"
                  fullWidth
                  sx={fieldSx}
                />
              </>
            ) : null}

            {error ? <FormHelperText error>{error}</FormHelperText> : null}
          </Stack>
        )}
      </Box>

      <StickyFooter
        sx={{
          bgcolor: s.surface,
          borderTop: `1px solid ${s.border}`,
          boxShadow: '0 -4px 16px rgba(15, 23, 42, 0.04)',
        }}
      >
        <Button onClick={onClose} disabled={saving || loading} sx={dashOutlinedButtonSx}>
          {t('common.cancel')}
        </Button>
        <Button
          variant="contained"
          onClick={() => void handleSubmit()}
          disabled={saving || loading}
          sx={dashContainedButtonSx}
        >
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
