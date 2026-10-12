import { Box, IconButton, Paper, Stack, Tooltip, Typography, useTheme } from '@mui/material';
import { ChevronRight, DoorOpen, Pencil, Plus, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { dashSurfaces } from '@/modules/dashboard/theme/dashboardUx';
import { colors } from '@/shared/theme/colors';
import { semanticSurface, type SemanticTone } from '@/shared/theme/semantic';
import type { AccommodationStatus, BedSpaceListItemResponse } from '@/shared/types/accommodation';
import { BedPricingDisplay } from './BedPricingDisplay';
import { OccupiedBedPaymentFace } from './OccupiedBedPaymentFace';
import { HierarchyEditMenu } from './HierarchyEditMenu';
import type { TreeSelection } from './HierarchyTree';
import { getBedIllustration } from '../illustrations/illustrationAssets';
import { formatBedDisplayLabel } from '../utils/formatBedDisplayLabel';
import {
  roomGroupAvailableCount,
  roomInventoryPathCrumbs,
  type BedRoomGroup,
  type RoomPathLevel,
} from '../utils/groupBedsByRoom';

/** Beds share the row and wrap to two columns when the room card is wide enough. */

function statusTone(status: AccommodationStatus | string): SemanticTone {
  switch (status) {
    case 'AVAILABLE':
      return 'success';
    case 'OCCUPIED':
      return 'danger';
    case 'RESERVED':
      return 'warning';
    case 'MAINTENANCE':
      return 'neutral';
    case 'BLOCKED':
      return 'neutral';
    default:
      return 'neutral';
  }
}

function StatusDotBadge({
  label,
  tone,
}: {
  label: string;
  tone: SemanticTone;
}) {
  const theme = useTheme();
  const surface = semanticSurface(tone, theme.palette.mode);

  return (
    <Box
      component="span"
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0.6,
        height: 22,
        px: 1,
        borderRadius: 999,
        bgcolor: surface.bg,
        color: surface.fg,
        border: `1px solid ${surface.border}`,
        fontSize: 11,
        fontWeight: 700,
        lineHeight: 1,
        whiteSpace: 'nowrap',
      }}
    >
      <Box
        component="span"
        sx={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          bgcolor: surface.fg,
          flexShrink: 0,
        }}
      />
      {label}
    </Box>
  );
}

type RoomInventoryBedCardProps = {
  spaceId?: string;
  group: BedRoomGroup;
  bed: BedSpaceListItemResponse;
  canManage: boolean;
  showUnit?: boolean;
  onSelect: (selection: TreeSelection) => void;
  onEdit: (selection: TreeSelection) => void;
  onViewBed: (bed: BedSpaceListItemResponse) => void;
};

function RoomInventoryBedCard({
  spaceId,
  group,
  bed,
  canManage,
  showUnit = false,
  onSelect,
  onEdit,
  onViewBed,
}: RoomInventoryBedCardProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);
  const rent = bed.defaultRent;
  const deposit = bed.defaultDeposit;
  const tone = statusTone(bed.status);
  const surface = semanticSurface(tone, theme.palette.mode);

  const bedSelection: TreeSelection = {
    type: 'bed',
    buildingId: bed.buildingId,
    roomId: bed.roomId,
    bedId: bed.bedId,
    floorId: bed.floorId ?? undefined,
    unitId: bed.unitId ?? undefined,
  };

  return (
    <Paper
      elevation={0}
      onClick={() => {
        onSelect(bedSelection);
        onViewBed(bed);
      }}
      sx={{
        width: '100%',
        minWidth: 0,
        height: '100%',
        p: 1.5,
        borderRadius: 2.5,
        border: `1px solid ${surface.border}`,
        bgcolor: surface.bg,
        cursor: 'pointer',
        boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)',
        transition: 'border-color 120ms ease, box-shadow 120ms ease',
        '&:hover': {
          borderColor: surface.fg,
          boxShadow: s.shadowHover,
        },
      }}
    >
      <Stack spacing={1.5}>
        <Stack direction="row" spacing={1.25} sx={{ alignItems: 'flex-start' }}>
          <Box
            sx={{
              width: 52,
              height: 52,
              borderRadius: 2,
              overflow: 'hidden',
              bgcolor: surface.iconBg,
              flexShrink: 0,
              display: 'grid',
              placeItems: 'center',
              p: 0.5,
            }}
          >
            <Box
              component="img"
              src={getBedIllustration(bed.status as AccommodationStatus)}
              alt=""
              sx={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />
          </Box>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Stack direction="row" spacing={0.5} sx={{ alignItems: 'flex-start' }}>
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography
                  sx={{
                    fontSize: 15,
                    fontWeight: 700,
                    letterSpacing: '-0.01em',
                    color: s.textPrimary,
                    lineHeight: 1.25,
                  }}
                  noWrap
                >
                  {formatBedDisplayLabel(bed.label, t)}
                </Typography>
                <Box sx={{ mt: 0.75 }}>
                  <StatusDotBadge
                    label={t(`accommodation.status.${bed.status}`, { defaultValue: bed.status })}
                    tone={tone}
                  />
                </Box>
              </Box>
              <Stack direction="row" spacing={0.25} sx={{ alignItems: 'center', flexShrink: 0 }}>
                {canManage ? (
                  <Box onClick={(event) => event.stopPropagation()}>
                    <HierarchyEditMenu
                      group={group}
                      canEdit={canManage}
                      showUnit={showUnit}
                      bedId={bed.bedId}
                      onEdit={onEdit}
                    />
                  </Box>
                ) : null}
                <ChevronRight size={18} color={s.textMuted} strokeWidth={2.2} aria-hidden />
              </Stack>
            </Stack>
          </Box>
        </Stack>

        {bed.status === 'OCCUPIED' ? (
          <OccupiedBedPaymentFace spaceId={spaceId} bedId={bed.bedId} />
        ) : (
          <BedPricingDisplay rent={rent} deposit={deposit} layout="rows" />
        )}
      </Stack>
    </Paper>
  );
}

function AddBedCard({ onClick }: { onClick: () => void }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);
  const mint = theme.palette.mode === 'dark' ? s.elevated : '#F0FDF4';

  return (
    <Paper
      elevation={0}
      component="button"
      type="button"
      onClick={onClick}
      sx={{
        width: '100%',
        minWidth: 0,
        height: '100%',
        minHeight: 148,
        p: 2,
        borderRadius: 2.5,
        border: `1.5px dashed ${colors.primary}`,
        bgcolor: mint,
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 1,
        color: colors.primary,
        font: 'inherit',
        textAlign: 'center',
        transition: 'background-color 120ms ease, border-color 120ms ease',
        '&:hover': {
          bgcolor: theme.palette.mode === 'dark' ? s.hover : '#DCFCE7',
          borderColor: colors.success,
        },
      }}
    >
      <Box
        sx={{
          width: 40,
          height: 40,
          borderRadius: '50%',
          bgcolor: colors.primary,
          color: '#fff',
          display: 'grid',
          placeItems: 'center',
          boxShadow: '0 4px 10px rgba(37, 211, 102, 0.28)',
        }}
      >
        <Plus size={22} strokeWidth={2.6} />
      </Box>
      <Box>
        <Typography
          sx={{
            fontSize: 14,
            fontWeight: 700,
            color: colors.success,
            lineHeight: 1.2,
          }}
        >
          {t('accommodation.workspace.addBed', { defaultValue: 'Add Bed' })}
        </Typography>
        <Typography
          sx={{
            mt: 0.5,
            fontSize: 11,
            fontWeight: 500,
            color: s.textSecondary,
            lineHeight: 1.35,
            maxWidth: 140,
          }}
        >
          {t('accommodation.workspace.addBedHint', {
            defaultValue: 'Add another bed to this room',
          })}
        </Typography>
      </Box>
    </Paper>
  );
}

function LivingSpacesTipCard() {
  const { t } = useTranslation();
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);

  return (
    <Paper
      elevation={0}
      sx={{
        width: '100%',
        minWidth: 0,
        height: '100%',
        minHeight: 148,
        p: 2,
        borderRadius: 2.5,
        border: `1px solid ${s.border}`,
        bgcolor: theme.palette.mode === 'dark' ? s.elevated : '#F8FAFC',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        gap: 1,
      }}
    >
      <Box
        component="img"
        src={getBedIllustration('AVAILABLE')}
        alt=""
        sx={{ width: 64, height: 48, objectFit: 'contain', alignSelf: 'flex-start' }}
      />
      <Typography sx={{ fontSize: 13, fontWeight: 700, color: s.textPrimary, lineHeight: 1.3 }}>
        {t('accommodation.workspace.livingSpacesTitle', {
          defaultValue: 'Create comfortable living spaces',
        })}
      </Typography>
      <Typography sx={{ fontSize: 11, fontWeight: 500, color: s.textMuted, lineHeight: 1.4 }}>
        {t('accommodation.workspace.livingSpacesBody', {
          defaultValue: 'Add beds to manage occupancy, rent and deposits easily.',
        })}
      </Typography>
    </Paper>
  );
}

type RoomInventoryCardProps = {
  spaceId: string;
  group: BedRoomGroup;
  canManage: boolean;
  showUnits?: boolean;
  showTipCard?: boolean;
  onSelect: (selection: TreeSelection) => void;
  onEditEntity: (selection: TreeSelection) => void;
  onAddBed: (selection: TreeSelection) => void;
  onViewBed: (bed: BedSpaceListItemResponse) => void;
};

function selectionForPathCrumb(group: BedRoomGroup, level: RoomPathLevel): TreeSelection | null {
  switch (level) {
    case 'building':
      return { type: 'building', buildingId: group.buildingId };
    case 'floor':
      if (!group.floorId) {
        return null;
      }
      return { type: 'floor', buildingId: group.buildingId, floorId: group.floorId };
    case 'unit':
      if (!group.unitId) {
        return null;
      }
      return {
        type: 'unit',
        buildingId: group.buildingId,
        unitId: group.unitId,
        floorId: group.floorId ?? undefined,
      };
    case 'room':
      return {
        type: 'room',
        buildingId: group.buildingId,
        roomId: group.roomId,
        floorId: group.floorId ?? undefined,
        unitId: group.unitId ?? undefined,
      };
    default:
      return null;
  }
}

export function RoomInventoryCard({
  spaceId,
  group,
  canManage,
  showUnits = false,
  showTipCard = false,
  onSelect,
  onEditEntity,
  onAddBed,
  onViewBed,
}: RoomInventoryCardProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);

  const available = roomGroupAvailableCount(group);
  const pathCrumbs = roomInventoryPathCrumbs(group, { includeUnit: showUnits && Boolean(group.unitId) });
  const roomTypeLabel = group.roomType
    ? t(`accommodation.roomType.${group.roomType}`, { defaultValue: String(group.roomType) })
    : null;

  const roomSelection: TreeSelection = {
    type: 'room',
    buildingId: group.buildingId,
    roomId: group.roomId,
    floorId: group.floorId ?? undefined,
    unitId: group.unitId ?? undefined,
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 1.75, md: 2.25 },
        borderRadius: 3,
        border: `1px solid ${s.border}`,
        bgcolor: s.surface,
        boxShadow: '0 2px 12px rgba(15, 23, 42, 0.045)',
      }}
    >
      <Stack spacing={2}>
        <Stack
          direction="row"
          spacing={1.25}
          useFlexGap
          sx={{
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            rowGap: 1.25,
          }}
        >
          <Stack
            direction="row"
            spacing={1.25}
            useFlexGap
            sx={{
              alignItems: 'center',
              minWidth: 0,
              flex: '1 1 320px',
              cursor: 'pointer',
              flexWrap: 'wrap',
              rowGap: 1,
            }}
            onClick={() => onSelect(roomSelection)}
          >
            <Box
              sx={{
                width: 42,
                height: 42,
                borderRadius: 2,
                display: 'grid',
                placeItems: 'center',
                bgcolor: '#F3E8FF',
                color: '#7C3AED',
                border: '1px solid #E9D5FF',
                flexShrink: 0,
              }}
            >
              <DoorOpen size={18} strokeWidth={2} />
            </Box>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                minWidth: 0,
                maxWidth: '100%',
                gap: 0.75,
                overflow: 'hidden',
              }}
            >
              {pathCrumbs.map((crumb, index) => (
                <Box
                  key={`${crumb.level}-${crumb.label}`}
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 0.75,
                    minWidth: 0,
                    flexShrink: index === pathCrumbs.length - 1 ? 1 : 0,
                  }}
                >
                  {index > 0 ? (
                    <ChevronRight
                      size={16}
                      strokeWidth={2.2}
                      aria-hidden
                      style={{ flexShrink: 0, color: s.textMuted, opacity: 0.85 }}
                    />
                  ) : null}
                  <Typography
                    component="button"
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      event.preventDefault();
                      const selection = selectionForPathCrumb(group, crumb.level);
                      if (!selection) {
                        return;
                      }
                      if (canManage) {
                        onEditEntity(selection);
                        return;
                      }
                      onSelect(selection);
                    }}
                    sx={{
                      all: 'unset',
                      cursor: 'pointer',
                      fontSize: { xs: 15, md: 16 },
                      fontWeight: 700,
                      letterSpacing: '-0.015em',
                      color: colors.info,
                      lineHeight: 1.3,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      textDecoration: 'underline',
                      textUnderlineOffset: '3px',
                      '&:hover': { color: colors.primaryDark },
                    }}
                  >
                    {crumb.label}
                  </Typography>
                </Box>
              ))}
            </Box>
            <StatusDotBadge
              label={t('accommodation.workspace.bedsAvailableCount', {
                defaultValue: '{{available}}/{{total}} Beds Available',
                available,
                total: group.beds.length,
              })}
              tone={available > 0 ? 'success' : group.beds.length > 0 ? 'danger' : 'neutral'}
            />
            {roomTypeLabel ? (
              <Stack
                direction="row"
                spacing={0.6}
                sx={{ alignItems: 'center', color: s.textSecondary, flexShrink: 0 }}
              >
                <Users size={15} strokeWidth={2} />
                <Typography
                  sx={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: s.textSecondary,
                  }}
                  noWrap
                >
                  {t('accommodation.workspace.roomTypeLabel', {
                    defaultValue: '{{type}} Room',
                    type: roomTypeLabel,
                  })}
                </Typography>
              </Stack>
            ) : null}
          </Stack>

          <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center', flexShrink: 0 }}>
            {canManage ? (
              <Tooltip title={t('accommodation.rooms.editTitle', { defaultValue: 'Edit Room' })}>
                <IconButton
                  size="small"
                  aria-label={t('accommodation.rooms.editTitle', { defaultValue: 'Edit Room' })}
                  onClick={() => onEditEntity(roomSelection)}
                  sx={{
                    width: 34,
                    height: 34,
                    borderRadius: 2,
                    color: colors.info,
                    border: '1px solid #93C5FD',
                    bgcolor: '#EFF6FF',
                    '&:hover': {
                      borderColor: colors.info,
                      bgcolor: '#DBEAFE',
                    },
                  }}
                >
                  <Pencil size={15} strokeWidth={2.2} />
                </IconButton>
              </Tooltip>
            ) : null}
            {canManage ? (
              <HierarchyEditMenu
                group={group}
                canEdit={canManage}
                showUnit={showUnits && Boolean(group.unitId)}
                onEdit={onEditEntity}
              />
            ) : null}
          </Stack>
        </Stack>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 240px), 1fr))',
            gap: 1.5,
            alignItems: 'stretch',
          }}
        >
          {group.beds.map((bed) => (
            <RoomInventoryBedCard
              key={bed.bedId}
              spaceId={spaceId}
              group={group}
              bed={bed}
              canManage={canManage}
              showUnit={showUnits}
              onSelect={onSelect}
              onEdit={onEditEntity}
              onViewBed={onViewBed}
            />
          ))}
          {canManage ? <AddBedCard onClick={() => onAddBed(roomSelection)} /> : null}
          {showTipCard ? <LivingSpacesTipCard /> : null}
        </Box>
      </Stack>
    </Paper>
  );
}
