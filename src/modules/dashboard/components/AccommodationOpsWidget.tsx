import { BedDouble, IndianRupee, UserPlus, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import type { DashboardAccommodationOperations } from '@/shared/types/dashboard';
import { spaceBedInventoryPath, spaceOccupancyListPath, spacePaymentsPath } from '@/routes/paths';
import { DashboardSection } from './DashboardSection';
import { IconBadge } from './IconBadge';
import { MetricRow } from './MetricRow';
import { DASHBOARD_UX } from '../theme/dashboardUx';

type AccommodationOpsWidgetProps = {
  spaceId: string;
  operations: DashboardAccommodationOperations;
  canDrillDown: boolean;
};

/** Figma: Property operations board — 2×2 metrics matching Payment Summary. */
export function AccommodationOpsWidget({
  spaceId,
  operations,
  canDrillDown,
}: AccommodationOpsWidgetProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <DashboardSection title={t('dashboard.accommodationOperations.title')}>
      <MetricRow
        columns={2}
        embedded
        minHeight={DASHBOARD_UX.propertyCardMinHeight}
        maxHeight={DASHBOARD_UX.propertyCardMaxHeight}
        items={[
          {
            id: 'occupied',
            label: t('dashboard.accommodationOperations.occupiedBeds'),
            value: operations.occupiedBeds,
            tone: 'success',
            icon: (
              <IconBadge tone="success">
                <Users />
              </IconBadge>
            ),
            onClick: canDrillDown
              ? () => navigate(spaceOccupancyListPath(spaceId, 'active'))
              : undefined,
          },
          {
            id: 'vacant',
            label: t('dashboard.accommodationOperations.vacantBeds'),
            value: operations.vacantBeds,
            tone: 'purple',
            icon: (
              <IconBadge tone="purple">
                <BedDouble />
              </IconBadge>
            ),
            onClick: canDrillDown
              ? () => navigate(spaceBedInventoryPath(spaceId, 'AVAILABLE'))
              : undefined,
          },
          {
            id: 'moveIns',
            label: t('dashboard.accommodationOperations.moveInsThisMonth'),
            value: operations.moveInsThisMonth,
            tone: 'info',
            icon: (
              <IconBadge tone="info">
                <UserPlus />
              </IconBadge>
            ),
            onClick: canDrillDown
              ? () => navigate(spaceOccupancyListPath(spaceId, 'moveInsThisMonth'))
              : undefined,
          },
          {
            id: 'pendingPay',
            label: t('dashboard.accommodationOperations.pendingPayments'),
            value: operations.pendingPaymentsCount,
            tone: 'warning',
            icon: (
              <IconBadge tone="warning">
                <IndianRupee />
              </IconBadge>
            ),
            onClick: () => navigate(spacePaymentsPath(spaceId, undefined, { tab: 'members' })),
          },
        ]}
      />
    </DashboardSection>
  );
}
