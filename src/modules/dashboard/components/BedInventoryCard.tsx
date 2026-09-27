import { Box, IconButton, Stack, Typography, useTheme } from '@mui/material';
import { BedDouble, Building2, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { BedPricingDisplay } from '@/modules/accommodation/components/BedPricingDisplay';
import { DASHBOARD_UX, dashSurfaces } from '@/modules/dashboard/theme/dashboardUx';
import { StatusChip, type StatusChipTone } from '@/shared/components/StatusChip';
import { colors } from '@/shared/theme/colors';
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
  onViewBed?: () => void;
};

/** View-only vacant/occupied bed card — open the shared bed dialog to act. */
export function BedInventoryCard({ bed, onViewBed }: BedInventoryCardProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);

  const location = [bed.floorName, bed.unitName, bed.roomName].filter(Boolean).join(' · ');

  return (
    <Box
      onClick={onViewBed}
      sx={{
        height: '100%',
        borderRadius: `${DASHBOARD_UX.radius}px`,
        border: `1px solid ${s.border}`,
        bgcolor: s.surface,
        boxShadow: s.shadow,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        cursor: onViewBed ? 'pointer' : 'default',
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
          {onViewBed ? (
            <IconButton
              size="small"
              aria-label={t('accommodation.beds.viewBed', { defaultValue: 'View bed' })}
              onClick={(event) => {
                event.stopPropagation();
                onViewBed();
              }}
              sx={{ color: s.textMuted }}
            >
              <ChevronRight size={18} />
            </IconButton>
          ) : null}
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

        <BedPricingDisplay rent={bed.defaultRent} deposit={bed.defaultDeposit} />
      </Stack>
    </Box>
  );
}
