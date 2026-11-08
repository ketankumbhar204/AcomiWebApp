import { useCallback, useState } from 'react';
import { ReservationCancellationDialog } from '../components/ReservationCancellationDialog';

export function useReservationCancellationDialog(
  spaceId: string | undefined,
  onCancelled?: () => void,
) {
  const [occupancyId, setOccupancyId] = useState<string | null>(null);

  const openCancelReservation = useCallback((nextOccupancyId: string | null | undefined) => {
    if (!nextOccupancyId) {
      return;
    }
    setOccupancyId(nextOccupancyId);
  }, []);

  const dialog =
    spaceId && occupancyId ? (
      <ReservationCancellationDialog
        open={Boolean(occupancyId)}
        spaceId={spaceId}
        occupancyId={occupancyId}
        onClose={() => setOccupancyId(null)}
        onCancelled={() => {
          setOccupancyId(null);
          onCancelled?.();
        }}
      />
    ) : null;

  return { openCancelReservation, cancellationDialog: dialog };
}
