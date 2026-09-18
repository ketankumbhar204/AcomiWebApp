import { BedDouble, IndianRupee, UserPlus, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import type { DashboardAccommodationOperations } from '@/shared/types/dashboard';
import { spaceBedInventoryPath, spaceOccupancyListPath, spacePaymentsPath } from '@/routes/paths';
import { DashboardSection } from './DashboardSection';
import { IconBadge } from './IconBadge';
import { MetricRow } from './MetricRow';
import { DASHBOARD_UX } from '../theme/dashboardUx';

/** Metric ids used by Property operations cards. */
export type AccommodationOpsMetricId = 'occupied' | 'vacant' | 'moveIns' | 'pendingPay';

type AccommodationOpsWidgetProps = {
  spaceId: string;
  operations: DashboardAccommodationOperations;
  canDrillDown: boolean;
  /** 2 = dashboard 2×2 board; 4 = single Rooms strip on md+. */
  columns?: 2 | 4;
  /**
   * When set (Rooms page), all four metrics call this instead of navigating Occupied/Vacant/Move-ins/Pending.
   * Omit on Dashboard to keep existing drill-down navigation (including Pending → Payments).
   */
  onSelectMetric?: (id: AccommodationOpsMetricId) => void;
  /** Highlights the active Rooms ops focus card. */
  selectedMetricId?: AccommodationOpsMetricId | null;
};

/** Figma: Property operations board — 2×2 metrics matching Payment Summary. */
export function AccommodationOpsWidget({
  spaceId,
  operations,
  canDrillDown,
  columns = 2,
  onSelectMetric,
  selectedMetricId = null,
}: AccommodationOpsWidgetProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const roomsFilterMode = typeof onSelectMetric === 'function';

  return (
    <DashboardSection title={t('dashboard.accommodationOperations.title')}>
      <MetricRow
        columns={columns}
        embedded
        minHeight={DASHBOARD_UX.propertyCardMinHeight}
        maxHeight={DASHBOARD_UX.propertyCardMaxHeight}
        items={[
          {
            id: 'occupied',
            label: t('dashboard.accommodationOperations.occupiedBeds'),
            value: operations.occupiedBeds,
            tone: 'success',
            selected: selectedMetricId === 'occupied',
            icon: (
              <IconBadge tone="success">
                <Users />
              </IconBadge>
            ),
            onClick: roomsFilterMode
              ? () => onSelectMetric('occupied')
              : canDrillDown
                ? () => navigate(spaceOccupancyListPath(spaceId, 'active'))
                : undefined,
          },
          {
            id: 'vacant',
            label: t('dashboard.accommodationOperations.vacantBeds'),
            value: operations.vacantBeds,
            tone: 'purple',
            selected: selectedMetricId === 'vacant',
            icon: (
              <IconBadge tone="purple">
                <BedDouble />
              </IconBadge>
            ),
            onClick: roomsFilterMode
              ? () => onSelectMetric('vacant')
              : canDrillDown
                ? () => navigate(spaceBedInventoryPath(spaceId, 'AVAILABLE'))
                : undefined,
          },
          {
            id: 'moveIns',
            label: t('dashboard.accommodationOperations.moveInsThisMonth'),
            value: operations.moveInsThisMonth,
            tone: 'info',
            selected: selectedMetricId === 'moveIns',
            icon: (
              <IconBadge tone="info">
                <UserPlus />
              </IconBadge>
            ),
            onClick: roomsFilterMode
              ? () => onSelectMetric('moveIns')
              : canDrillDown
                ? () => navigate(spaceOccupancyListPath(spaceId, 'moveInsThisMonth'))
                : undefined,
          },
          {
            id: 'pendingPay',
            label: t('dashboard.accommodationOperations.pendingPayments'),
            value: operations.pendingPaymentsCount,
            tone: 'warning',
            selected: selectedMetricId === 'pendingPay',
            icon: (
              <IconBadge tone="warning">
                <IndianRupee />
              </IconBadge>
            ),
            onClick: roomsFilterMode
              ? () => onSelectMetric('pendingPay')
              : () => navigate(spacePaymentsPath(spaceId, undefined, { filter: 'pending' })),
          },
        ]}
      />
    </DashboardSection>
  );
}
