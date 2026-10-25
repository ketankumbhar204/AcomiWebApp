import { Box, Paper, Stack, Typography, useTheme } from '@mui/material';
import { ChevronRight, DoorOpen } from 'lucide-react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { BedCardCarousel } from '@/modules/accommodation/components/BedCardCarousel';
import { DASHBOARD_UX, dashSurfaces } from '@/modules/dashboard/theme/dashboardUx';
import { StatusChip } from '@/shared/components/StatusChip';
import type { BedSpaceListItem } from '../api/dashboardDrilldownApi';
import { groupBedInventoryByRoom } from '../utils/groupBedInventoryByRoom';
import { BedInventoryCard, type BedMoveInFace } from './BedInventoryCard';

type BedInventoryRoomSectionsProps = {
  beds: BedSpaceListItem[];
  spaceId?: string;
  moveInsByBedId?: ReadonlyMap<string, BedMoveInFace>;
  onViewBed: (bed: BedSpaceListItem) => void;
};

export function BedInventoryRoomSections({
  beds,
  spaceId,
  moveInsByBedId,
  onViewBed,
}: BedInventoryRoomSectionsProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);
  const groups = useMemo(() => groupBedInventoryByRoom(beds), [beds]);

  return (
    <Stack spacing={1.5} sx={{ width: '100%', minWidth: 0 }}>
      {groups.map((group) => {
        const available = group.beds.filter((bed) => bed.status === 'AVAILABLE').length;
        const label =
          group.crumbs.join(' ') || t('accommodation.beds.title', { defaultValue: 'Beds' });
        return (
          <Paper
            key={group.key}
            elevation={0}
            sx={{
              p: { xs: 1.75, md: 2.25 },
              borderRadius: 3,
              border: `1px solid ${s.border}`,
              bgcolor: s.surface,
              boxShadow: s.shadow,
              minWidth: 0,
              maxWidth: '100%',
            }}
          >
            <Stack spacing={1.5}>
              <Stack
                direction="row"
                spacing={1}
                useFlexGap
                sx={{ alignItems: 'center', flexWrap: 'wrap', minWidth: 0 }}
              >
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: 2,
                    display: 'grid',
                    placeItems: 'center',
                    bgcolor: '#F3E8FF',
                    color: '#7C3AED',
                    border: '1px solid #E9D5FF',
                    flexShrink: 0,
                  }}
                >
                  <DoorOpen size={16} strokeWidth={2} />
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', minWidth: 0, gap: 0.5, flexWrap: 'wrap' }}>
                  {group.crumbs.length > 0 ? (
                    group.crumbs.map((crumb, index) => (
                      <Box
                        key={`${group.key}-${crumb}-${index}`}
                        sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, minWidth: 0 }}
                      >
                        {index > 0 ? (
                          <ChevronRight size={14} strokeWidth={2.2} color={s.textMuted} aria-hidden />
                        ) : null}
                        <Typography
                          sx={{ ...DASHBOARD_UX.cardTitle, color: s.textPrimary, fontSize: 14 }}
                          noWrap
                        >
                          {crumb}
                        </Typography>
                      </Box>
                    ))
                  ) : (
                    <Typography sx={{ ...DASHBOARD_UX.cardTitle, color: s.textPrimary, fontSize: 14 }}>
                      {label}
                    </Typography>
                  )}
                </Box>
                <StatusChip
                  label={t('accommodation.workspace.bedsAvailableCount', {
                    defaultValue: '{{available}}/{{total}} Beds Available',
                    available,
                    total: group.beds.length,
                  })}
                  tone={available > 0 ? 'success' : group.beds.length > 0 ? 'error' : 'neutral'}
                />
              </Stack>
              <BedCardCarousel label={label}>
                {group.beds.map((bed) => (
                  <BedInventoryCard
                    key={bed.bedId}
                    bed={bed}
                    spaceId={spaceId}
                    moveIn={moveInsByBedId?.get(bed.bedId) ?? null}
                    onViewBed={() => onViewBed(bed)}
                  />
                ))}
              </BedCardCarousel>
            </Stack>
          </Paper>
        );
      })}
    </Stack>
  );
}
