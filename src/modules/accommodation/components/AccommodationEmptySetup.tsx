import { Box, Stack, Typography, useTheme } from '@mui/material';
import { Building2, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { OccupancyStatusBoard } from '@/modules/dashboard/components/OccupancyStatusBoard';
import { useSpaceDashboard } from '@/modules/dashboard/hooks/useSpaceDashboard';
import { DASHBOARD_UX, dashSurfaces } from '@/modules/dashboard/theme/dashboardUx';
import { ContentCard } from '@/shared/components/ContentCard';
import { spaceBedInventoryPath, spaceOccupancyListPath } from '@/routes/paths';
import type { SpaceType } from '@/shared/types/space';
import { SetupActionCard } from './SetupActionCard';

type AccommodationEmptySetupProps = {
  spaceId: string;
  spaceType?: SpaceType;
  canManage: boolean;
  canDrillOccupancy: boolean;
  onStartSetup: () => void;
  onAddManually: () => void;
};

export function AccommodationEmptySetup({
  spaceId,
  spaceType,
  canManage,
  canDrillOccupancy,
  onStartSetup,
  onAddManually,
}: AccommodationEmptySetupProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);
  const navigate = useNavigate();
  const dashboard = useSpaceDashboard(spaceId, spaceType, Boolean(spaceId && spaceType));
  const operations = dashboard.accommodationOperations;

  return (
    <Stack spacing={2} sx={{ width: '100%' }}>
      <ContentCard>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'flex-start' }}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: '10px',
              bgcolor: theme.palette.mode === 'dark' ? s.elevated : 'rgba(18, 140, 126, 0.12)',
              display: 'grid',
              placeItems: 'center',
              flexShrink: 0,
            }}
          >
            <Building2 size={18} strokeWidth={2.1} color="#128C7E" />
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ ...DASHBOARD_UX.sectionHeading, color: s.textPrimary }}>
              {t('accommodation.home.welcomeTitle')}
            </Typography>
            <Typography sx={{ ...DASHBOARD_UX.body, color: s.textSecondary, mt: 0.5 }}>
              {t('accommodation.home.welcomeSubtitle')}
            </Typography>
          </Box>
        </Stack>
      </ContentCard>

      {canManage ? (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
            gap: 1.5,
          }}
        >
          <SetupActionCard
            title={t('accommodation.home.quickSetup')}
            subtitle={t('accommodation.home.quickSetupSubtitle')}
            description={t('accommodation.home.quickSetupDescription')}
            icon={Sparkles}
            accent="purple"
            onClick={onStartSetup}
          />
          <SetupActionCard
            title={t('accommodation.home.addBuildingManually')}
            subtitle={t('accommodation.home.addBuildingSubtitle')}
            description={t('accommodation.home.addBuildingDescription')}
            icon={Building2}
            accent="blue"
            onClick={onAddManually}
          />
        </Box>
      ) : null}

      {operations ? (
        <Box>
          <Typography sx={{ ...DASHBOARD_UX.caption, color: s.textMuted, mb: 1 }}>
            {t('accommodation.home.operationsGlance')}
          </Typography>
          <OccupancyStatusBoard
            occupied={operations.occupiedBeds}
            total={
              operations.occupiedBeds + operations.vacantBeds + (operations.reservedBeds ?? 0)
            }
            statusChips={[
              {
                id: 'occupied',
                label: t('dashboard.accommodationOperations.occupied'),
                value: operations.occupiedBeds,
                tone: 'occupied',
                onClick: canDrillOccupancy
                  ? () => navigate(spaceOccupancyListPath(spaceId, 'active'))
                  : undefined,
              },
              {
                id: 'vacant',
                label: t('dashboard.accommodationOperations.vacant'),
                value: operations.vacantBeds,
                tone: 'vacant',
                onClick: canDrillOccupancy
                  ? () => navigate(spaceBedInventoryPath(spaceId, 'AVAILABLE'))
                  : undefined,
              },
              {
                id: 'reserved',
                label: t('dashboard.accommodationOperations.reserved'),
                value: operations.reservedBeds ?? 0,
                tone: 'reserved',
                onClick: canDrillOccupancy
                  ? () => navigate(spaceBedInventoryPath(spaceId, 'RESERVED'))
                  : undefined,
              },
            ]}
          />
        </Box>
      ) : null}
    </Stack>
  );
}
