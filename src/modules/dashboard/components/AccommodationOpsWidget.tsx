import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import type { DashboardAccommodationOperations } from '@/shared/types/dashboard';
import { spaceAccommodationPath, spaceBedInventoryPath, spacePaymentsPath } from '@/routes/paths';
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
  /** Unit-only spaces count units. Bed spaces keep the existing labels. */
  occupancyEntity?: 'beds' | 'units';
};

/** Property operations — public OccupancyCard layout plus Move-ins / Pending filters. */
export function AccommodationOpsWidget({
  spaceId,
  operations,
  canDrillDown,
  onSelectMetric,
  selectedMetricId = null,
  occupancyEntity = 'beds',
}: AccommodationOpsWidgetProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const roomsFilterMode = typeof onSelectMetric === 'function';
  const unitLevel = occupancyEntity === 'units';
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
      label: unitLevel
        ? t('dashboard.accommodationOperations.occupiedUnits', { defaultValue: 'Occupied units' })
        : t('dashboard.accommodationOperations.occupied'),
      value: operations.occupiedBeds,
      tone: 'occupied',
      selected: selectedMetricId === 'occupied',
      onClick: bind('occupied', () =>
        navigate(
          unitLevel
            ? `${spaceAccommodationPath(spaceId)}?unitStatus=OCCUPIED`
            : spaceBedInventoryPath(spaceId, 'OCCUPIED'),
        ),
      ),
    },
    {
      id: 'vacant',
      label: unitLevel
        ? t('dashboard.accommodationOperations.availableUnits', { defaultValue: 'Available units' })
        : t('dashboard.accommodationOperations.vacant'),
      value: operations.vacantBeds,
      tone: 'vacant',
      selected: selectedMetricId === 'vacant',
      onClick: bind('vacant', () =>
        navigate(
          unitLevel
            ? `${spaceAccommodationPath(spaceId)}?unitStatus=AVAILABLE`
            : spaceBedInventoryPath(spaceId, 'AVAILABLE'),
        ),
      ),
    },
    {
      id: 'reserved',
      label: t('dashboard.accommodationOperations.reserved'),
      value: reservedBeds,
      tone: 'reserved',
      selected: selectedMetricId === 'reserved',
      onClick: bind('reserved', () =>
        navigate(
          unitLevel
            ? `${spaceAccommodationPath(spaceId)}?unitStatus=RESERVED`
            : spaceBedInventoryPath(spaceId, 'RESERVED'),
        ),
      ),
    },
  ];

  const extraChips: OccupancyChipModel[] = [
    {
      id: 'moveIns',
      label: t('dashboard.accommodationOperations.moveInsThisMonth'),
      value: operations.moveInsThisMonth,
      tone: 'info',
      selected: selectedMetricId === 'moveIns',
      onClick: bind('moveIns', () =>
        navigate(
          unitLevel
            ? spaceAccommodationPath(spaceId)
            : spaceBedInventoryPath(spaceId, 'OCCUPIED', { focus: 'moveIns' }),
        ),
      ),
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
      subtitle={
        unitLevel
          ? t('dashboard.accommodationOperations.unitsSub', { defaultValue: 'Unit occupancy' })
          : t('dashboard.accommodationOperations.bedsSub')
      }
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
