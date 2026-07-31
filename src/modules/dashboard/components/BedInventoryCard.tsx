import { Box, Button, Stack, Typography, useTheme } from '@mui/material';
import { BedDouble, Bookmark, Building2, CalendarCheck, UserPlus } from 'lucide-react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { DASHBOARD_UX, dashSurfaces } from '@/modules/dashboard/theme/dashboardUx';
import { StatusChip, type StatusChipTone } from '@/shared/components/StatusChip';
import { colors } from '@/shared/theme/colors';
import { dashContainedButtonSx, dashOutlinedButtonSx } from '@/shared/theme/dashButtonSx';
import type { BedSpaceListItem } from '../api/dashboardDrilldownApi';

function statusTone(status: string): StatusChipTone {
  switch (status) {
    case 'AVAILABLE':
      return 'success';
    case 'RESERVED':
      return 'info';
    case 'OCCUPIED':
      return 'error';
    case 'MAINTENANCE':
    case 'BLOCKED':
      return 'warning';
    default:
      return 'neutral';
  }
}

type BedInventoryCardProps = {
  bed: BedSpaceListItem;
  canManageOccupancy: boolean;
  onAllocate?: () => void;
  onReserve?: () => void;
  onMoveIn?: () => void;
};

/** Modern vacant-bed card — Allocate / Reserve (AVAILABLE) or Move-in (RESERVED). */
export function BedInventoryCard({
  bed,
  canManageOccupancy,
  onAllocate,
  onReserve,
  onMoveIn,
}: BedInventoryCardProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);

  const location = [bed.floorName, bed.unitName, bed.roomName].filter(Boolean).join(' · ');
  const isAvailable = bed.status === 'AVAILABLE';
  const isReserved = bed.status === 'RESERVED';

  let actions: ReactNode = null;
  if (canManageOccupancy && isAvailable && onAllocate && onReserve) {
    actions = (
      <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
        <Button
          size="small"
          variant="contained"
          startIcon={<UserPlus size={14} />}
          onClick={onAllocate}
          sx={dashContainedButtonSx}
        >
          {t('occupancy.actions.allocate')}
        </Button>
        <Button
          size="small"
          variant="outlined"
          startIcon={<Bookmark size={14} />}
          onClick={onReserve}
          sx={dashOutlinedButtonSx}
        >
          {t('occupancy.actions.reserve')}
        </Button>
      </Stack>
    );
  } else if (canManageOccupancy && isReserved && onMoveIn) {
    actions = (
      <Button
        size="small"
        variant="contained"
        startIcon={<CalendarCheck size={14} />}
        onClick={onMoveIn}
        sx={dashContainedButtonSx}
      >
        {t('occupancy.actions.moveIn')}
      </Button>
    );
  }

  return (
    <Box
      sx={{
        height: '100%',
        borderRadius: `${DASHBOARD_UX.radius}px`,
        border: `1px solid ${s.border}`,
        bgcolor: s.surface,
        boxShadow: s.shadow,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        transition: DASHBOARD_UX.transition,
        '&:hover': { boxShadow: s.shadowHover, borderColor: colors.primary },
      }}
    >
      <Stack spacing={1.25} sx={{ p: `${DASHBOARD_UX.cardPadding}px`, flex: 1 }}>
        <Stack direction="row" spacing={1.25} sx={{ alignItems: 'flex-start' }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: `${DASHBOARD_UX.iconWellRadius}px`,
              bgcolor: `${colors.primary}1A`,
              color: colors.primaryDark,
              display: 'grid',
              placeItems: 'center',
              flexShrink: 0,
            }}
          >
            <BedDouble size={18} />
          </Box>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography sx={{ ...DASHBOARD_UX.cardTitle, color: s.textPrimary }} noWrap>
              {t('accommodation.beds.bedLabel', {
                defaultValue: 'Bed {{label}}',
                label: bed.label,
              })}
            </Typography>
            <StatusChip
              label={t(`accommodation.status.${bed.status}`, { defaultValue: bed.status })}
              tone={statusTone(bed.status)}
            />
          </Box>
        </Stack>

        <Stack spacing={0.5}>
          {bed.buildingName ? (
            <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center' }}>
              <Building2 size={14} color={s.textMuted} />
              <Typography sx={{ ...DASHBOARD_UX.body, color: s.textSecondary }} noWrap>
                {bed.buildingName}
              </Typography>
            </Stack>
          ) : null}
          {location ? (
            <Typography sx={{ ...DASHBOARD_UX.metricCaption, color: s.textMuted }} noWrap>
              {location}
            </Typography>
          ) : null}
        </Stack>

        {actions ? <Box sx={{ mt: 'auto', pt: 0.5 }}>{actions}</Box> : null}
      </Stack>
    </Box>
  );
}
