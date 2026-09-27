import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import type { DashboardAccommodationOperations } from '@/shared/types/dashboard';
import { spaceBedInventoryPath, spaceOccupancyListPath, spacePaymentsPath } from '@/routes/paths';
import { DashboardSection } from './DashboardSection';
import { OccupancyStatusBoard, type OccupancyChipModel } from './OccupancyStatusBoard';

/** Metric ids used by Property operations cards. */
export type AccommodationOpsMetricId =
  | 'occupied'
  | 'vacant'
  | 'reserved'
  | 'moveIns'
  | 'pendingPay';

type AccommodationOpsWidgetProps = {
  spaceId: string;
  operations: DashboardAccommodationOperations;
  canDrillDown: boolean;
  /** Kept for callers; occupancy now always stacks donut + chips like the public site. */
  columns?: 2 | 4;
  /**
   * When set (Rooms page), metrics call this instead of navigating Occupied/Vacant/Reserved/Move-ins/Pending.
   * Omit on Dashboard to keep existing drill-down navigation (including Pending → Payments).
   */
  onSelectMetric?: (id: AccommodationOpsMetricId) => void;
  /** Highlights the active Rooms ops focus card. */
  selectedMetricId?: AccommodationOpsMetricId | null;
};

/** Property operations — public OccupancyCard layout plus Move-ins / Pending filters. */
export function AccommodationOpsWidget({
  spaceId,
  operations,
  canDrillDown,
  onSelectMetric,
  selectedMetricId = null,
}: AccommodationOpsWidgetProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const roomsFilterMode = typeof onSelectMetric === 'function';
  const reservedBeds = operations.reservedBeds ?? 0;
  const totalBeds = operations.occupiedBeds + operations.vacantBeds + reservedBeds;

  const bind = (
    id: AccommodationOpsMetricId,
    navigateTo: () => void,
  ): (() => void) | undefined => {
    if (roomsFilterMode && onSelectMetric) {
      return () => onSelectMetric(id);
    }
    if (id === 'pendingPay' || canDrillDown) {
      return navigateTo;
    }
    return undefined;
  };

  const statusChips: OccupancyChipModel[] = [
    {
      id: 'occupied',
      label: t('dashboard.accommodationOperations.occupied'),
      value: operations.occupiedBeds,
      tone: 'occupied',
      selected: selectedMetricId === 'occupied',
      onClick: bind('occupied', () => navigate(spaceOccupancyListPath(spaceId, 'active'))),
    },
    {
      id: 'vacant',
      label: t('dashboard.accommodationOperations.vacant'),
      value: operations.vacantBeds,
      tone: 'vacant',
      selected: selectedMetricId === 'vacant',
      onClick: bind('vacant', () => navigate(spaceBedInventoryPath(spaceId, 'AVAILABLE'))),
    },
    {
      id: 'reserved',
      label: t('dashboard.accommodationOperations.reserved'),
      value: reservedBeds,
      tone: 'reserved',
      selected: selectedMetricId === 'reserved',
      onClick: bind('reserved', () => navigate(spaceBedInventoryPath(spaceId, 'RESERVED'))),
    },
  ];

  const extraChips: OccupancyChipModel[] = [
    {
      id: 'moveIns',
      label: t('dashboard.accommodationOperations.moveInsThisMonth'),
      value: operations.moveInsThisMonth,
      tone: 'info',
      selected: selectedMetricId === 'moveIns',
      onClick: bind('moveIns', () => navigate(spaceOccupancyListPath(spaceId, 'moveInsThisMonth'))),
    },
    {
      id: 'pendingPay',
      label: t('dashboard.accommodationOperations.pendingPayments'),
      value: operations.pendingPaymentsCount,
      tone: 'warning',
      selected: selectedMetricId === 'pendingPay',
      onClick: bind('pendingPay', () =>
        navigate(spacePaymentsPath(spaceId, undefined, { filter: 'pending' })),
      ),
    },
  ];

  return (
    <DashboardSection
      title={t('dashboard.accommodationOperations.title')}
      subtitle={t('dashboard.accommodationOperations.bedsSub')}
    >
      <OccupancyStatusBoard
        occupied={operations.occupiedBeds}
        total={totalBeds}
        statusChips={statusChips}
        extraChips={extraChips}
      />
    </DashboardSection>
  );
}
