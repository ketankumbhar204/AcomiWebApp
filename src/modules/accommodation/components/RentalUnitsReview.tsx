import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Building2, ChevronRight, Grid2x2, Plus, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSnackbar } from 'notistack';
import { EntityPhoto } from '@/shared/components/files/EntityPhoto';
import { EmptyState } from '@/shared/components/EmptyState';
import { ErrorState } from '@/shared/components/ErrorState';
import { LoadingState } from '@/shared/components/LoadingState';
import { StatusChip, type StatusChipTone } from '@/shared/components/StatusChip';
import { colors, pastels } from '@/shared/theme/colors';
import { dashContainedButtonSx, dashOutlinedButtonSx } from '@/shared/theme/dashButtonSx';
import type {
  AccommodationStatus,
  BuildingResponse,
  UnitListItemResponse,
} from '@/shared/types/accommodation';
import type { SpaceType } from '@/shared/types/space';
import { accommodationApi } from '../api/accommodationApi';
import { useBuildingSummary, useUnits } from '../hooks/useAccommodation';
import { getBuildingIllustration } from '../illustrations/illustrationAssets';
import { EntityActionsMenu } from './EntityActionsMenu';
import type { TreeSelection } from './HierarchyTree';

const MAX_BULK_UNITS = 50;

const LEGEND = [
  { key: 'available', color: '#22C55E', label: 'Available' },
  { key: 'occupied', color: '#2563EB', label: 'Occupied' },
  { key: 'reserved', color: '#F97316', label: 'Reserved' },
  { key: 'maintenance', color: '#7C3AED', label: 'Maintenance' },
  { key: 'blocked', color: '#EF4444', label: 'Blocked' },
  { key: 'inactive', color: '#94A3B8', label: 'Inactive' },
] as const;

type RentalUnitsReviewProps = {
  spaceId: string;
  spaceType: SpaceType;
  buildings: BuildingResponse[];
  selectedBuildingId?: string;
  canManage: boolean;
  canDeactivate: boolean;
  onSelectBuilding: (buildingId: string) => void;
  onViewUnit: (buildingId: string, unitId: string) => void;
  onAddUnit: (buildingId: string) => void;
  onEditUnit: (selection: TreeSelection) => void;
  /** Limits the unit grid when a property-operations card is selected. */
  statusFilter?: AccommodationStatus | null;
};

export function RentalUnitsReview({
  spaceId,
  spaceType,
  buildings,
  selectedBuildingId,
  canManage,
  canDeactivate,
  onSelectBuilding,
  onViewUnit,
  onAddUnit,
  onEditUnit,
  statusFilter = null,
}: RentalUnitsReviewProps) {
  const { t } = useTranslation();
  const building =
    buildings.find((item) => item.buildingId === selectedBuildingId) ?? buildings[0];
  const summaryQuery = useBuildingSummary(spaceId, building?.buildingId, Boolean(building));
  const unitsQuery = useUnits(spaceId, building?.buildingId, Boolean(building));
  const [search, setSearch] = useState('');
  const [bulkOpen, setBulkOpen] = useState(false);

  const units = unitsQuery.units;
  const visible = useMemo(() => {
    const query = search.trim().toLowerCase();
    return units.filter((unit) => {
      if (statusFilter && unit.status !== statusFilter) return false;
      if (!query) return true;
      return unit.name.toLowerCase().includes(query);
    });
  }, [search, statusFilter, units]);

  const summary = summaryQuery.summary;
  const unitCount = summary?.visibleUnitCount ?? summary?.units ?? units.length;
  const activeUnits = units.filter((unit) => unit.active !== false);
  const occupied = activeUnits.filter((unit) => unit.status === 'OCCUPIED').length;
  const occupancyPercent = unitCount > 0 ? Math.min(100, Math.round((occupied / unitCount) * 100)) : 0;
  const inactive = units.filter((unit) => unit.active === false).length;
  const counts = {
    available: activeUnits.filter((unit) => unit.status === 'AVAILABLE').length,
    occupied,
    reserved: activeUnits.filter((unit) => unit.status === 'RESERVED').length,
    maintenance: activeUnits.filter((unit) => unit.status === 'MAINTENANCE').length,
    blocked: activeUnits.filter((unit) => unit.status === 'BLOCKED').length,
    inactive,
  };
  const typeLabel = t(
    spaceType === 'CORPORATE_STAY' ? 'spaces.types.corporateStay.label' : 'spaces.types.rental.label',
  );

  if (!building) {
    return (
      <EmptyState
        title={t('accommodation.buildings.emptyTitle')}
        description={t('accommodation.buildings.emptyDescription')}
      />
    );
  }

  if ((summaryQuery.loading || unitsQuery.loading) && !summary && units.length === 0) {
    return <LoadingState />;
  }

  if (summaryQuery.error || unitsQuery.error) {
    return (
      <ErrorState
        title={t('common.errors.generic')}
        message={t('accommodation.errors.loadUnits')}
        onRetry={() => {
          void summaryQuery.reload();
          void unitsQuery.reload();
        }}
        retryLabel={t('common.retry')}
      />
    );
  }

  return (
    <Stack spacing={2}>
      <Box
        sx={{
          bgcolor: colors.white,
          border: `1px solid ${colors.border}`,
          borderRadius: 2,
          p: 2,
        }}
      >
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
          <EntityPhoto
            spaceId={spaceId}
            entityId={building.buildingId}
            kind="building"
            fileId={summary?.photoFileId ?? building.photoFileId}
            canEdit={canDeactivate}
            title={building.name}
            height={64}
            compact
            fallback={
              <Box
                component="img"
                src={getBuildingIllustration()}
                alt=""
                sx={{ width: 68, height: 52, objectFit: 'contain' }}
              />
            }
          />
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography sx={{ fontWeight: 700, fontSize: 18 }} noWrap>
              {summary?.name ?? building.name}
            </Typography>
            <Typography sx={{ color: colors.primary, fontWeight: 700, fontSize: 13 }}>
              {typeLabel}
            </Typography>
          </Box>
          <Stack
            direction="row"
            spacing={0.5}
            sx={{
              alignItems: 'center',
              bgcolor: building.active ? colors.lightGreen : colors.surfaceSecondary,
              borderRadius: 99,
              px: 1,
              py: 0.5,
            }}
          >
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: 99,
                bgcolor: building.active ? colors.primary : colors.muted,
              }}
            />
            <Typography sx={{ fontSize: 12, fontWeight: 700, color: colors.success }}>
              {building.active
                ? t('accommodation.active', { defaultValue: 'Active' })
                : t('accommodation.builder.inactive', { defaultValue: 'Inactive' })}
            </Typography>
          </Stack>
        </Stack>
        <Stack direction="row" spacing={2} useFlexGap sx={{ mt: 1.5, flexWrap: 'wrap' }}>
          <CountChip
            icon={Grid2x2}
            label={t('accommodation.builder.summaryUnits', {
              count: unitCount,
              defaultValue: '{{count}} Units',
            })}
          />
        </Stack>
        {buildings.length > 1 ? (
          <Stack direction="row" spacing={1} useFlexGap sx={{ mt: 1.5, flexWrap: 'wrap' }}>
            {buildings.map((item) => (
              <Button
                key={item.buildingId}
                size="small"
                variant={item.buildingId === building.buildingId ? 'contained' : 'outlined'}
                onClick={() => onSelectBuilding(item.buildingId)}
                sx={item.buildingId === building.buildingId ? dashContainedButtonSx : dashOutlinedButtonSx}
              >
                {item.name}
              </Button>
            ))}
          </Stack>
        ) : null}
      </Box>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ alignItems: 'stretch' }}>
        <TextField
          fullWidth
          size="small"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={t('accommodation.builder.searchUnits', {
            defaultValue: 'Search units (e.g. 101, 102, ...)',
          })}
          slotProps={{
            input: {
              startAdornment: (
                <Box sx={{ mr: 1, display: 'flex', color: colors.muted }}>
                  <Search size={16} />
                </Box>
              ),
            },
          }}
        />
        {canManage ? (
          <Button
            variant="contained"
            onClick={() => setBulkOpen(true)}
            startIcon={<Plus size={16} />}
            sx={{ ...dashContainedButtonSx, whiteSpace: 'nowrap', minWidth: 160 }}
          >
            {t('accommodation.bulk.units.action')}
          </Button>
        ) : null}
      </Stack>

      <Box
        sx={{
          bgcolor: colors.white,
          border: `1px solid ${colors.border}`,
          borderRadius: 2,
          p: 2,
        }}
      >
        <Stack direction="row" spacing={2} sx={{ alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <Box>
            <Typography sx={{ fontWeight: 700, fontSize: 18 }}>
              {t('accommodation.builder.unitsOverview', { defaultValue: 'Units Overview' })}
            </Typography>
            <Typography sx={{ color: colors.textSecondary, fontSize: 13, mt: 0.5 }}>
              {t('accommodation.builder.unitOnlyOverviewSubtitle', {
                defaultValue: 'Units only — edit rent and deposit on each unit',
              })}
            </Typography>
          </Box>
          <Stack sx={{ alignItems: 'center' }}>
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                border: `4px solid ${colors.primary}`,
                display: 'grid',
                placeItems: 'center',
                fontWeight: 700,
              }}
            >
              {occupancyPercent}%
            </Box>
            <Typography sx={{ fontSize: 11, color: colors.textSecondary }}>
              {t('accommodation.status.OCCUPIED')}
            </Typography>
          </Stack>
        </Stack>
        <Box
          sx={{
            mt: 2,
            display: 'grid',
            gap: 1,
            gridTemplateColumns: '1fr 1fr',
          }}
        >
          <MetricTile pastel={pastels.green} icon={Grid2x2} value={String(unitCount)} label={t('accommodation.builder.totalUnits', { defaultValue: 'Total Units' })} />
          <MetricTile
            pastel={pastels.orange}
            icon={Building2}
            value={`${occupied} (${occupancyPercent}%)`}
            label={t('accommodation.status.OCCUPIED')}
          />
        </Box>
        <Stack direction="row" useFlexGap spacing={1.5} sx={{ mt: 2, flexWrap: 'wrap' }}>
          {LEGEND.map((item) => (
            <Stack key={item.key} direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
              <Box sx={{ width: 8, height: 8, borderRadius: 99, bgcolor: item.color }} />
              <Typography sx={{ fontSize: 12, color: colors.textSecondary }}>
                {t(`accommodation.builder.legend.${item.key}`, { defaultValue: item.label })} {counts[item.key]}
              </Typography>
            </Stack>
          ))}
        </Stack>
      </Box>

      <Typography sx={{ fontWeight: 700, fontSize: 16 }}>
        {t('accommodation.builder.unitsCount', {
          count: visible.length,
          defaultValue: 'Units ({{count}})',
        })}
      </Typography>

      {visible.length === 0 ? (
        <EmptyState
          title={t('accommodation.units.emptyTitle', { defaultValue: 'No units' })}
          description={
            search || statusFilter
              ? t('accommodation.search.noResults', { defaultValue: 'No units match that search.' })
              : t('accommodation.units.emptyDescriptionUnits', {
                  defaultValue: 'Add a unit to start managing this building.',
                })
          }
          action={
            canManage && !search ? (
              <Button variant="contained" onClick={() => onAddUnit(building.buildingId)} sx={dashContainedButtonSx}>
                {t('accommodation.workspace.addChild')}
              </Button>
            ) : undefined
          }
        />
      ) : (
        <Box
          sx={{
            display: 'grid',
            gap: 1.5,
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: 'repeat(4, 1fr)' },
          }}
        >
          {visible.map((unit) => (
            <UnitCard
              key={unit.unitId}
              spaceId={spaceId}
              buildingId={building.buildingId}
              unit={unit}
              canManage={canManage}
              canDeactivate={canDeactivate}
              onView={() => onViewUnit(building.buildingId, unit.unitId)}
              onEdit={() =>
                onEditUnit({
                  type: 'unit',
                  buildingId: building.buildingId,
                  unitId: unit.unitId,
                })
              }
            />
          ))}
        </Box>
      )}

      <BulkUnitsDialog
        open={bulkOpen}
        spaceId={spaceId}
        buildingId={building.buildingId}
        onClose={() => setBulkOpen(false)}
      />
    </Stack>
  );
}

function CountChip({ icon: Icon, label }: { icon: typeof Building2; label: string }) {
  return (
    <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center', color: colors.textSecondary }}>
      <Icon size={14} />
      <Typography sx={{ fontSize: 13 }}>{label}</Typography>
    </Stack>
  );
}

function MetricTile({
  pastel,
  icon: Icon,
  value,
  label,
}: {
  pastel: { bg: string; border: string; fg: string };
  icon: typeof Building2;
  value: string;
  label: string;
}) {
  return (
    <Box sx={{ bgcolor: pastel.bg, border: `1px solid ${pastel.border}`, borderRadius: 2, p: 1.25 }}>
      <Icon size={16} color={pastel.fg} />
      <Typography sx={{ color: pastel.fg, fontWeight: 700, fontSize: 18, mt: 0.5 }}>{value}</Typography>
      <Typography sx={{ color: colors.textSecondary, fontSize: 12 }}>{label}</Typography>
    </Box>
  );
}

function unitPercent(unit: UnitListItemResponse): number {
  if (unit.active === false) return 0;
  if (unit.status === 'OCCUPIED') return 100;
  if (unit.status === 'RESERVED') return 75;
  if (unit.status === 'MAINTENANCE' || unit.status === 'BLOCKED') return 50;
  return 0;
}

function statusTone(status: AccommodationStatus): StatusChipTone {
  if (status === 'AVAILABLE') return 'success';
  if (status === 'OCCUPIED') return 'info';
  if (status === 'RESERVED') return 'warning';
  if (status === 'BLOCKED') return 'error';
  return 'neutral';
}

function UnitCard({
  spaceId,
  buildingId,
  unit,
  canManage,
  canDeactivate,
  onView,
  onEdit,
}: {
  spaceId: string;
  buildingId: string;
  unit: UnitListItemResponse;
  canManage: boolean;
  canDeactivate: boolean;
  onView: () => void;
  onEdit: () => void;
}) {
  const { t } = useTranslation();
  const inactive = unit.active === false;
  return (
    <Stack
      spacing={1}
      sx={{
        bgcolor: colors.white,
        border: `1px solid ${colors.border}`,
        borderRadius: 2,
        p: 1.5,
        opacity: inactive ? 0.7 : 1,
      }}
    >
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
        <Box
          sx={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            bgcolor: pastels.green.bg,
            display: 'grid',
            placeItems: 'center',
            color: pastels.green.fg,
          }}
        >
          <Building2 size={16} />
        </Box>
        <Typography sx={{ fontWeight: 700, flex: 1 }} noWrap>
          {unit.name}
        </Typography>
        {canManage || canDeactivate ? (
          <EntityActionsMenu
            spaceId={spaceId}
            selection={{ type: 'unit', buildingId, unitId: unit.unitId }}
            sourceName={unit.name}
            isInactive={inactive}
            status={unit.status}
            canEdit={canManage}
            canDeactivate={canDeactivate}
            onEdit={onEdit}
          />
        ) : null}
      </Stack>
      <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
        {inactive ? (
          <StatusChip label={t('accommodation.inactive.deactivated')} tone="neutral" />
        ) : (
          <StatusChip label={t(`accommodation.status.${unit.status}`)} tone={statusTone(unit.status)} />
        )}
        <Typography sx={{ fontSize: 12, fontWeight: 700, color: colors.textSecondary }}>
          {unitPercent(unit)}%
        </Typography>
      </Stack>
      <Button
        variant="outlined"
        onClick={onView}
        endIcon={<ChevronRight size={16} />}
        sx={{ ...dashOutlinedButtonSx, borderColor: colors.primary, color: colors.primary }}
      >
        {t('accommodation.layout.dashboard.viewDetails', { defaultValue: 'View details' })}
      </Button>
    </Stack>
  );
}

function BulkUnitsDialog({
  open,
  spaceId,
  buildingId,
  onClose,
}: {
  open: boolean;
  spaceId: string;
  buildingId: string;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const [count, setCount] = useState('5');
  const [startNumber, setStartNumber] = useState('');
  const [status, setStatus] = useState<AccommodationStatus>('AVAILABLE');

  const mutation = useMutation({
    mutationFn: async () => {
      const parsed = Number(count);
      if (!Number.isFinite(parsed) || parsed < 1 || parsed > MAX_BULK_UNITS) {
        throw new Error(t('accommodation.bulk.errors.unitCount'));
      }
      return accommodationApi.bulkCreateUnits(spaceId, buildingId, {
        count: parsed,
        startUnitNumber: startNumber.trim() || undefined,
        defaultStatus: status,
      });
    },
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({ queryKey: ['units', spaceId, buildingId] });
      await queryClient.invalidateQueries({ queryKey: ['building-summary', spaceId, buildingId] });
      enqueueSnackbar(t('accommodation.bulk.units.success', { count: result.unitsCreated }), {
        variant: 'success',
      });
      onClose();
    },
    onError: (error: Error) => {
      enqueueSnackbar(error.message || t('accommodation.bulk.errors.units'), { variant: 'error' });
    },
  });

  return (
    <Dialog open={open} onClose={mutation.isPending ? undefined : onClose} fullWidth maxWidth="xs">
      <DialogTitle>{t('accommodation.bulk.units.title')}</DialogTitle>
      <DialogContent>
        <Stack spacing={1.5} sx={{ pt: 1 }}>
          <TextField
            label={t('accommodation.bulk.units.count')}
            value={count}
            onChange={(event) => setCount(event.target.value)}
            type="number"
          />
          <TextField
            label={t('accommodation.bulk.units.startNumber')}
            value={startNumber}
            onChange={(event) => setStartNumber(event.target.value)}
            placeholder={t('accommodation.bulk.autoNumber')}
          />
          <TextField
            select
            label={t('accommodation.fields.status')}
            value={status}
            onChange={(event) => setStatus(event.target.value as AccommodationStatus)}
          >
            {(['AVAILABLE', 'OCCUPIED', 'RESERVED', 'MAINTENANCE', 'BLOCKED'] as const).map((item) => (
              <MenuItem key={item} value={item}>
                {t(`accommodation.status.${item}`)}
              </MenuItem>
            ))}
          </TextField>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={mutation.isPending} sx={dashOutlinedButtonSx}>
          {t('common.cancel')}
        </Button>
        <Button
          variant="contained"
          disabled={mutation.isPending}
          onClick={() => mutation.mutate()}
          sx={dashContainedButtonSx}
        >
          {t('accommodation.bulk.confirm')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
