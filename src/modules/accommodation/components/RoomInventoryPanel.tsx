import {
  FormControl,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
  useTheme,
} from '@mui/material';
import { Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DASHBOARD_UX, dashSurfaces } from '@/modules/dashboard/theme/dashboardUx';
import { EmptyState } from '@/shared/components/EmptyState';
import { LoadingState } from '@/shared/components/LoadingState';
import { useSpaceBedSearch } from '../hooks/useAccommodation';
import { groupBedsByRoom, type BedRoomGroup } from '../utils/groupBedsByRoom';
import type { TreeSelection } from './HierarchyTree';
import { RoomInventoryCard } from './RoomInventoryCard';

type AvailabilityFilter = 'ALL' | 'HAS_AVAILABLE' | 'FULL';

type RoomInventoryPanelProps = {
  spaceId: string;
  canManage: boolean;
  /** Visible apartments exist in this layout (not corridor synthetic units). */
  showUnits?: boolean;
  onSelect: (selection: TreeSelection) => void;
  onEditEntity: (selection: TreeSelection) => void;
  onAddBed: (roomSelection: TreeSelection) => void;
};

function uniqueSorted(values: Array<string | null | undefined>): string[] {
  return Array.from(
    new Set(values.map((value) => value?.trim()).filter((value): value is string => Boolean(value))),
  ).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
}

function matchesAvailability(group: BedRoomGroup, filter: AvailabilityFilter): boolean {
  if (filter === 'ALL') return true;
  const available = group.beds.filter((bed) => bed.status === 'AVAILABLE').length;
  if (filter === 'HAS_AVAILABLE') return available > 0;
  return available === 0;
}

/** Full-width room cards with horizontal bed carousels (web mock). */
export function RoomInventoryPanel({
  spaceId,
  canManage,
  showUnits = false,
  onSelect,
  onEditEntity,
  onAddBed,
}: RoomInventoryPanelProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);
  const [query, setQuery] = useState('');
  const [buildingFilter, setBuildingFilter] = useState('ALL');
  const [floorFilter, setFloorFilter] = useState('ALL');
  const [availabilityFilter, setAvailabilityFilter] = useState<AvailabilityFilter>('ALL');

  const bedsQuery = useSpaceBedSearch({
    spaceId,
    query,
    enabled: Boolean(spaceId),
  });

  const roomGroups = useMemo(() => groupBedsByRoom(bedsQuery.items), [bedsQuery.items]);

  const buildingOptions = useMemo(
    () => uniqueSorted(roomGroups.map((group) => group.buildingName)),
    [roomGroups],
  );

  const floorOptions = useMemo(() => {
    const scoped =
      buildingFilter === 'ALL'
        ? roomGroups
        : roomGroups.filter((group) => group.buildingName === buildingFilter);
    return uniqueSorted(scoped.map((group) => group.floorName));
  }, [buildingFilter, roomGroups]);

  const filteredGroups = useMemo(() => {
    return roomGroups.filter((group) => {
      if (buildingFilter !== 'ALL' && group.buildingName !== buildingFilter) return false;
      if (floorFilter !== 'ALL' && (group.floorName ?? '') !== floorFilter) return false;
      return matchesAvailability(group, availabilityFilter);
    });
  }, [availabilityFilter, buildingFilter, floorFilter, roomGroups]);

  const bedTotal = useMemo(
    () => filteredGroups.reduce((sum, group) => sum + group.beds.length, 0),
    [filteredGroups],
  );

  const selectSx = {
    minWidth: { xs: '100%', sm: 140 },
    bgcolor: s.surface,
    borderRadius: `${DASHBOARD_UX.buttonRadius}px`,
    '& .MuiOutlinedInput-notchedOutline': { borderColor: s.border },
    ...DASHBOARD_UX.body,
  } as const;

  if (bedsQuery.loading && roomGroups.length === 0) {
    return <LoadingState />;
  }

  return (
    <Stack spacing={1.75} sx={{ width: '100%' }}>
      <Stack
        direction={{ xs: 'column', lg: 'row' }}
        spacing={1.25}
        useFlexGap
        sx={{
          alignItems: { xs: 'stretch', lg: 'center' },
          p: 1.5,
          borderRadius: 2.5,
          border: `1px solid ${s.border}`,
          bgcolor: s.surface,
          boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
        }}
      >
        <TextField
          size="small"
          placeholder={t('accommodation.search.roomsBedsUnits', {
            defaultValue: 'Search rooms, beds or units...',
          })}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          sx={{
            flex: '1 1 260px',
            minWidth: 0,
            '& .MuiOutlinedInput-root': {
              borderRadius: `${DASHBOARD_UX.buttonRadius}px`,
              bgcolor: s.elevated,
              ...DASHBOARD_UX.body,
            },
          }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <Search size={16} color={s.textMuted} />
                </InputAdornment>
              ),
            },
          }}
        />

        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1}
          useFlexGap
          sx={{ alignItems: { xs: 'stretch', sm: 'center' }, flexWrap: 'wrap' }}
        >
          <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 140 } }}>
            <InputLabel id="rooms-building-filter">
              {t('accommodation.filters.building', { defaultValue: 'Building' })}
            </InputLabel>
            <Select
              labelId="rooms-building-filter"
              label={t('accommodation.filters.building', { defaultValue: 'Building' })}
              value={buildingFilter}
              onChange={(event) => {
                setBuildingFilter(event.target.value);
                setFloorFilter('ALL');
              }}
              sx={selectSx}
            >
              <MenuItem value="ALL">{t('common.all', { defaultValue: 'All' })}</MenuItem>
              {buildingOptions.map((name) => (
                <MenuItem key={name} value={name}>
                  {name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 140 } }}>
            <InputLabel id="rooms-floor-filter">
              {t('accommodation.filters.floor', { defaultValue: 'Floor' })}
            </InputLabel>
            <Select
              labelId="rooms-floor-filter"
              label={t('accommodation.filters.floor', { defaultValue: 'Floor' })}
              value={floorFilter}
              onChange={(event) => setFloorFilter(event.target.value)}
              sx={selectSx}
            >
              <MenuItem value="ALL">{t('common.all', { defaultValue: 'All' })}</MenuItem>
              {floorOptions.map((name) => (
                <MenuItem key={name} value={name}>
                  {name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 150 } }}>
            <InputLabel id="rooms-availability-filter">
              {t('accommodation.filters.availability', { defaultValue: 'Availability' })}
            </InputLabel>
            <Select
              labelId="rooms-availability-filter"
              label={t('accommodation.filters.availability', { defaultValue: 'Availability' })}
              value={availabilityFilter}
              onChange={(event) => setAvailabilityFilter(event.target.value as AvailabilityFilter)}
              sx={selectSx}
            >
              <MenuItem value="ALL">{t('common.all', { defaultValue: 'All' })}</MenuItem>
              <MenuItem value="HAS_AVAILABLE">
                {t('accommodation.filters.hasAvailable', { defaultValue: 'Has available beds' })}
              </MenuItem>
              <MenuItem value="FULL">
                {t('accommodation.filters.full', { defaultValue: 'Fully occupied' })}
              </MenuItem>
            </Select>
          </FormControl>
        </Stack>

        <Typography
          sx={{
            ml: { lg: 'auto' },
            fontSize: 13,
            fontWeight: 600,
            color: s.textMuted,
            whiteSpace: 'nowrap',
            alignSelf: { xs: 'flex-start', lg: 'center' },
          }}
        >
          {t('accommodation.workspace.roomsBedsCount', {
            defaultValue: '{{rooms}} Rooms • {{beds}} Beds',
            rooms: filteredGroups.length,
            beds: bedTotal,
          })}
        </Typography>
      </Stack>

      {filteredGroups.length === 0 ? (
        <EmptyState
          title={t('accommodation.rooms.emptyTitle', { defaultValue: 'No rooms yet' })}
          description={t('accommodation.rooms.emptyDescription', {
            defaultValue: 'Add floors and rooms, or run Quick Setup to create inventory.',
          })}
        />
      ) : (
        filteredGroups.map((group, index) => (
          <RoomInventoryCard
            key={group.key}
            spaceId={spaceId}
            group={group}
            canManage={canManage}
            showTipCard={index === 0 && canManage}
            showUnits={showUnits}
            onSelect={onSelect}
            onEditEntity={onEditEntity}
            onAddBed={onAddBed}
            onPricingSaved={() => void bedsQuery.reload()}
          />
        ))
      )}
    </Stack>
  );
}
