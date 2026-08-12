import { Box, Button, Stack, Typography } from '@mui/material';
import {
  ArrowRightLeft,
  BedDouble,
  Building2,
  CalendarDays,
  CircleCheck,
  DoorOpen,
  Hash,
  Heart,
  History,
  House,
  Layers,
  LogOut,
  Power,
  SquarePen,
  UserPlus,
  UserRound,
  Users,
  Wallet,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { SidePanel } from '@/shared/components/SidePanel';
import { StatusChip } from '@/shared/components/StatusChip';
import { LoadingState } from '@/shared/components/LoadingState';
import { EmptyState } from '@/shared/components/EmptyState';
import { DASHBOARD_UX } from '@/modules/dashboard/theme/dashboardUx';
import { dashOutlinedButtonSx } from '@/shared/theme/dashButtonSx';
import { colors } from '@/shared/theme/colors';
import { spaceMemberPath, spaceOccupancyWizardPath } from '@/routes/paths';
import type { TreeSelection } from './HierarchyTree';
import { AccommodationLifecycleActions } from './AccommodationLifecycleActions';
import { EntityActionsMenu } from './EntityActionsMenu';
import { InspectorDetailsList, PastelQuickActions } from './InspectorDetailsList';
import type { AccommodationActionMetadata } from '@/shared/types/accommodation';
import {
  useBedDetail,
  useBuildingSummary,
  useRoomDetail,
} from '../hooks/useAccommodation';
import { accommodationApi } from '../api/accommodationApi';
import { occupancyApi } from '../api/occupancyApi';
import { LayoutIllustration } from '../illustrations/LayoutIllustration';
import {
  getBedIllustration,
  getBuildingIllustration,
  getFloorIllustration,
  getRoomIllustration,
  getUnitIllustration,
  isWideFloorIllustration,
} from '../illustrations/illustrationAssets';
import { ACC_ACCENTS } from '../utils/accommodationAccents';

type EntityInspectorProps = {
  spaceId: string;
  selection: TreeSelection | null;
  canManageAccommodation: boolean;
  canDeactivateAccommodation?: boolean;
  canManageOccupancy: boolean;
  onEdit: () => void;
  onClose?: () => void;
  onSelect: (next: TreeSelection) => void;
  onAddChild?: () => void;
  /**
   * `dashboard` — center “selected entity” panel (wider, no close).
   * `side` — legacy narrow inspector chrome.
   */
  variant?: 'side' | 'dashboard';
};

function DetailTable({
  rows,
}: {
  rows: Array<{ label: string; value?: string | number | null | ReactNode; icon?: ReactNode }>;
}) {
  return <InspectorDetailsList rows={rows} />;
}

export function EntityInspector({
  spaceId,
  selection,
  canManageAccommodation,
  canDeactivateAccommodation = false,
  canManageOccupancy,
  onEdit,
  onClose,
  onSelect,
  onAddChild,
  variant = 'side',
}: EntityInspectorProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const buildingId = selection && 'buildingId' in selection ? selection.buildingId : undefined;
  const floorId = selection && 'floorId' in selection ? selection.floorId : undefined;
  const unitId = selection && 'unitId' in selection ? selection.unitId : undefined;
  const roomId =
    selection?.type === 'room' || selection?.type === 'bed' ? selection.roomId : undefined;
  const bedId = selection?.type === 'bed' ? selection.bedId : undefined;

  const summary = useBuildingSummary(
    spaceId,
    buildingId,
    Boolean(buildingId) &&
      (selection?.type === 'building' ||
        selection?.type === 'floor' ||
        selection?.type === 'bed' ||
        selection?.type === 'room'),
  );
  const buildingQuery = useQuery({
    queryKey: ['building', spaceId, buildingId],
    queryFn: () => accommodationApi.getBuilding(spaceId, buildingId!),
    enabled: Boolean(buildingId),
  });
  const floorQuery = useQuery({
    queryKey: ['floor', spaceId, floorId],
    queryFn: () => accommodationApi.getFloor(spaceId, floorId!),
    enabled: Boolean(floorId),
  });
  const unitQuery = useQuery({
    queryKey: ['unit', spaceId, unitId],
    queryFn: () => accommodationApi.getUnit(spaceId, unitId!),
    enabled: Boolean(unitId),
  });
  const room = useRoomDetail(spaceId, roomId, selection?.type === 'room' || selection?.type === 'bed');
  const bed = useBedDetail(spaceId, bedId, selection?.type === 'bed');

  const occupancyId = bed.bed?.occupant?.occupancyId;
  const occupancyQuery = useQuery({
    queryKey: ['occupancy', spaceId, occupancyId],
    queryFn: () => occupancyApi.getOccupancy(spaceId, occupancyId!),
    enabled: Boolean(occupancyId),
  });

  if (!selection) {
    return (
      <SidePanel
        framed
        title={
          variant === 'dashboard'
            ? t('accommodation.workspace.selectedEntity', { defaultValue: 'Selected' })
            : t('accommodation.workspace.inspector')
        }
        onClose={variant === 'dashboard' ? undefined : onClose}
      >
        <EmptyState
          title={t('accommodation.workspace.selectTitle')}
          description={t('accommodation.workspace.selectBody')}
        />
      </SidePanel>
    );
  }

  const openWizard = (
    mode: 'ALLOCATE' | 'RESERVE' | 'TRANSFER' | 'VACATE' | 'MOVE_IN',
    extra?: { occupancyId?: string; memberId?: string },
  ) => {
    navigate(
      spaceOccupancyWizardPath(spaceId, mode, {
        buildingId,
        roomId,
        bedId,
        unitId: selection.type === 'unit' ? selection.unitId : selection.type === 'bed' || selection.type === 'room' ? selection.unitId : undefined,
        occupancyId: extra?.occupancyId ?? occupancyId,
        memberId: extra?.memberId ?? bed.bed?.occupant?.memberId,
      }),
    );
  };

  let title = t('accommodation.workspace.inspector');
  let subtitle: string | undefined;
  let body: ReactNode = <LoadingState />;
  let footer: ReactNode;
  let lifecycleActions: AccommodationActionMetadata | null | undefined;
  let isInactive = false;

  if (selection.type === 'building') {
    if (!summary.loading || summary.summary) {
      const s = summary.summary;
      title = s?.name ?? buildingQuery.data?.name ?? t('accommodation.buildings.title');
      subtitle = s?.layoutMode ? t(`accommodation.layoutMode.${s.layoutMode}`) : undefined;
      lifecycleActions = s?.actions ?? buildingQuery.data?.actions;
      isInactive = (s?.active ?? buildingQuery.data?.active) === false;
      body = (
        <Stack spacing={1.5}>
          <LayoutIllustration src={getBuildingIllustration()} size="building" alt="" />
          <DetailTable
            rows={[
              {
                label: t('accommodation.fields.code'),
                value: s?.code,
                icon: <Hash size={16} />,
              },
              {
                label: t('accommodation.setup.summary.floors'),
                value: s?.floors,
                icon: <Layers size={16} />,
              },
              {
                label: t('accommodation.setup.summary.units'),
                value: s?.units,
                icon: <House size={16} />,
              },
              {
                label: t('accommodation.setup.summary.rooms'),
                value: s?.rooms,
                icon: <DoorOpen size={16} />,
              },
              {
                label: t('accommodation.setup.summary.beds'),
                value: s?.beds,
                icon: <BedDouble size={16} />,
              },
              {
                label: t('accommodation.status.AVAILABLE'),
                value: s?.available,
                icon: <Heart size={16} />,
              },
              {
                label: t('accommodation.status.OCCUPIED'),
                value: s?.occupied,
                icon: <UserRound size={16} />,
              },
            ]}
          />
        </Stack>
      );
    }
  } else if (selection.type === 'floor') {
    const floor = floorQuery.data;
    if (!floorQuery.isLoading || floor) {
      title = floor?.name ?? t('accommodation.floors.title');
      lifecycleActions = floor?.actions;
      isInactive = floor?.active === false;
      body = (
        <Stack spacing={1.5}>
          <LayoutIllustration
            src={getFloorIllustration(summary.summary?.layoutMode ?? buildingQuery.data?.layoutMode)}
            size="floor"
            wide={isWideFloorIllustration(
              summary.summary?.layoutMode ?? buildingQuery.data?.layoutMode,
            )}
            alt=""
          />
          <DetailTable
            rows={[
              {
                label: t('accommodation.floors.floorNumber'),
                value: floor?.floorNumber,
                icon: <Hash size={16} />,
              },
              {
                label: t('accommodation.fields.status'),
                value: floor?.active
                  ? t('common.active')
                  : t('accommodation.inactive.deactivated'),
                icon: <Power size={16} />,
              },
            ]}
          />
        </Stack>
      );
    }
  } else if (selection.type === 'unit') {
    const unit = unitQuery.data;
    if (!unitQuery.isLoading || unit) {
      title = unit?.name ?? t('accommodation.units.title');
      lifecycleActions = unit?.actions;
      body = (
        <Stack spacing={1.5}>
          <LayoutIllustration src={getUnitIllustration(0, 0)} size="unit" alt="" />
          {unit?.status ? <StatusChip label={t(`accommodation.status.${unit.status}`)} /> : null}
          <DetailTable
            rows={[
              {
                label: t('accommodation.units.unitNumber'),
                value: unit?.unitNumber,
                icon: <Hash size={16} />,
              },
              {
                label: t('accommodation.fields.defaultRent'),
                value: unit?.defaultRent,
                icon: <Wallet size={16} />,
              },
              {
                label: t('accommodation.fields.defaultDeposit'),
                value: unit?.defaultDeposit,
                icon: <Wallet size={16} />,
              },
            ]}
          />
        </Stack>
      );
      if (canManageOccupancy && unit?.status === 'AVAILABLE') {
        footer = (
          <Stack spacing={1}>
            <Button
              variant="contained"
              startIcon={<CircleCheck size={16} />}
              onClick={() => openWizard('ALLOCATE')}
            >
              {t('occupancy.actions.allocate')}
            </Button>
            <Button
              variant="outlined"
              startIcon={<CalendarDays size={16} />}
              onClick={() => openWizard('RESERVE')}
            >
              {t('occupancy.actions.reserve')}
            </Button>
          </Stack>
        );
      }
    }
  } else if (selection.type === 'room') {
    if (!room.loading || room.room) {
      const r = room.room;
      title = r?.name ?? t('accommodation.rooms.title');
      lifecycleActions = r?.actions;
      isInactive = r?.active === false;
      body = (
        <Stack spacing={1.5}>
          <LayoutIllustration
            src={getRoomIllustration(Math.max(r?.capacity ?? 1, 1))}
            size="room"
            alt=""
          />
          {r?.status ? <StatusChip label={t(`accommodation.status.${r.status}`)} /> : null}
          <DetailTable
            rows={[
              {
                label: t('accommodation.rooms.roomNumber'),
                value: r?.roomNumber,
                icon: <Hash size={16} />,
              },
              {
                label: t('accommodation.roomType.label'),
                value: r?.roomType ? t(`accommodation.roomType.${r.roomType}`) : null,
                icon: <DoorOpen size={16} />,
              },
              {
                label: t('accommodation.rooms.capacity'),
                value: r?.capacity,
                icon: <Users size={16} />,
              },
            ]}
          />
        </Stack>
      );
    }
  } else if (selection.type === 'bed') {
    if (!bed.loading || bed.bed) {
      const b = bed.bed;
      title = b?.name ?? t('accommodation.beds.title');
      subtitle = undefined;
      lifecycleActions = b?.actions;
      isInactive = b?.active === false;
      const occ = occupancyQuery.data;
      const roomName = room.room?.name;
      const unitName = unitQuery.data?.name;
      const floorName = floorQuery.data?.name;
      const buildingName = buildingQuery.data?.name ?? summary.summary?.name;
      const locationLine = [roomName, unitName].filter(Boolean).join(' • ');

      body = (
        <Stack spacing={1.5}>
          <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
            <Box
              sx={{
                width: 88,
                height: 88,
                borderRadius: `${DASHBOARD_UX.tileRadius}px`,
                bgcolor: 'action.hover',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                flexShrink: 0,
              }}
            >
              {b?.status ? (
                <LayoutIllustration src={getBedIllustration(b.status)} size="bed" alt="" />
              ) : null}
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography sx={{ ...DASHBOARD_UX.cardTitle, mb: 0.5 }}>
                {b?.name ?? title}
              </Typography>
              {b?.status ? <StatusChip label={t(`accommodation.status.${b.status}`)} /> : null}
              {b?.occupant?.memberName ? (
                <Typography sx={{ ...DASHBOARD_UX.link, mt: 0.75 }}>
                  {b.occupant.memberName}
                </Typography>
              ) : null}
              {locationLine ? (
                <Typography sx={{ ...DASHBOARD_UX.metricCaption, color: 'text.secondary', mt: 0.25 }}>
                  {locationLine}
                </Typography>
              ) : null}
            </Box>
          </Stack>

          <InspectorDetailsList
            rows={[
              {
                label: t('accommodation.beds.bedType', { defaultValue: 'Bed Type' }),
                value: t('accommodation.beds.shared', { defaultValue: 'Shared' }),
                icon: <BedDouble size={16} />,
              },
              {
                label: t('accommodation.rooms.capacity'),
                value: 1,
                icon: <Users size={16} />,
              },
              {
                label: t('accommodation.rooms.title', { defaultValue: 'Room' }),
                value: roomName,
                icon: <DoorOpen size={16} />,
              },
              {
                label: t('accommodation.units.title'),
                value: unitName,
                icon: <House size={16} />,
              },
              {
                label: t('accommodation.floors.title'),
                value: floorName,
                icon: <Layers size={16} />,
              },
              {
                label: t('accommodation.buildings.formEyebrow', { defaultValue: 'Building' }),
                value: buildingName,
                icon: <Building2 size={16} />,
              },
              {
                label: t('occupancy.section.moveInDate'),
                value: occ?.moveInDate ?? occ?.actualMoveInAt,
                icon: <CalendarDays size={16} />,
              },
            ]}
          />
        </Stack>
      );

      if (canManageOccupancy && b) {
        const pastelActions = [];
        if (b.status === 'AVAILABLE') {
          pastelActions.push(
            {
              id: 'allocate',
              label: t('occupancy.actions.allocate'),
              icon: <UserPlus size={18} />,
              color: ACC_ACCENTS.allocate,
              bgcolor: ACC_ACCENTS.allocateBg,
              onClick: () => openWizard('ALLOCATE'),
            },
            {
              id: 'reserve',
              label: t('occupancy.actions.reserve'),
              icon: <CalendarDays size={18} />,
              color: ACC_ACCENTS.reserve,
              bgcolor: ACC_ACCENTS.reserveBg,
              onClick: () => openWizard('RESERVE'),
            },
          );
        }
        if (b.status === 'RESERVED' && occupancyId) {
          pastelActions.push(
            {
              id: 'movein',
              label: t('occupancy.actions.moveIn'),
              icon: <CircleCheck size={18} />,
              color: ACC_ACCENTS.allocate,
              bgcolor: ACC_ACCENTS.allocateBg,
              onClick: () => openWizard('MOVE_IN', { occupancyId }),
            },
            {
              id: 'cancel',
              label: t('occupancy.actions.cancelReservation'),
              icon: <LogOut size={18} />,
              color: '#DD6B20',
              bgcolor: colors.warningTint,
              onClick: () => openWizard('VACATE', { occupancyId }),
            },
          );
        }
        if (b.status === 'OCCUPIED' && occupancyId) {
          pastelActions.push(
            {
              id: 'transfer',
              label: t('occupancy.actions.transfer'),
              icon: <ArrowRightLeft size={18} />,
              color: ACC_ACCENTS.reserve,
              bgcolor: ACC_ACCENTS.reserveBg,
              onClick: () => openWizard('TRANSFER', { occupancyId }),
            },
            {
              id: 'vacate',
              label: t('occupancy.actions.vacate'),
              icon: <LogOut size={18} />,
              color: '#E53E3E',
              bgcolor: colors.errorTint,
              onClick: () => openWizard('VACATE', { occupancyId }),
            },
          );
        }
        if (b.occupant?.memberId) {
          pastelActions.push({
            id: 'history',
            label: t('accommodation.workspace.viewHistory', { defaultValue: 'View History' }),
            icon: <History size={18} />,
            color: ACC_ACCENTS.history,
            bgcolor: ACC_ACCENTS.historyBg,
            onClick: () => navigate(spaceMemberPath(spaceId, b.occupant!.memberId)),
          });
        }

        footer = (
          <PastelQuickActions
            title={t('accommodation.workspace.quickActions', { defaultValue: 'Quick Actions' })}
            actions={pastelActions}
          />
        );
      }
    }
  }

  const lifecycleFooter =
    canManageAccommodation || canDeactivateAccommodation ? (
      <AccommodationLifecycleActions
        spaceId={spaceId}
        selection={selection}
        actions={lifecycleActions}
        sourceName={title}
        isInactive={isInactive}
        status={
          selection.type === 'bed'
            ? bed.bed?.status
            : selection.type === 'room'
              ? room.room?.status
              : selection.type === 'unit'
                ? unitQuery.data?.status
                : null
        }
        canEdit={selection.type === 'bed' ? false : canManageAccommodation}
        canDeactivate={canDeactivateAccommodation}
        onEdit={onEdit}
        onAddChild={
          selection.type !== 'bed' && selection.type !== 'building' ? onAddChild : undefined
        }
        variant={selection.type === 'bed' ? 'stack' : 'quick'}
        onChanged={() => {
          void summary.reload();
          void buildingQuery.refetch();
          void floorQuery.refetch();
          void unitQuery.refetch();
          void room.reload();
          void bed.reload();
        }}
        onDuplicated={onSelect}
      />
    ) : null;

  return (
    <SidePanel
      framed
      title={title}
      subtitle={subtitle}
      onClose={variant === 'dashboard' ? undefined : onClose}
      actions={
        <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
          {canManageAccommodation ? (
            <Button size="small" startIcon={<SquarePen size={14} />} onClick={onEdit} sx={dashOutlinedButtonSx}>
              {t('accommodation.actions.edit')}
            </Button>
          ) : null}
          <EntityActionsMenu
            spaceId={spaceId}
            selection={selection}
            sourceName={title}
            actions={lifecycleActions}
            isInactive={isInactive}
            status={
              selection.type === 'bed'
                ? bed.bed?.status
                : selection.type === 'room'
                  ? room.room?.status
                  : selection.type === 'unit'
                    ? unitQuery.data?.status
                    : null
            }
            canEdit={canManageAccommodation}
            canDeactivate={canDeactivateAccommodation}
            onEdit={onEdit}
            onDuplicated={onSelect}
            onChanged={() => {
              void summary.reload();
              void buildingQuery.refetch();
              void floorQuery.refetch();
              void unitQuery.refetch();
              void room.reload();
              void bed.reload();
            }}
          />
        </Stack>
      }
      footer={
        footer || lifecycleFooter ? (
          <Stack spacing={1.5}>
            {footer}
            {lifecycleFooter}
          </Stack>
        ) : undefined
      }
    >
      {body}
    </SidePanel>
  );
}
