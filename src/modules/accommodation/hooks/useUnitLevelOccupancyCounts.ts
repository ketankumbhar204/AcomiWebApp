import { useCallback, useEffect, useState } from 'react';
import {
  loadUnitLevelOccupancyCounts,
  type UnitOccupancyCounts,
} from '@/modules/accommodation/utils/unitLevelOccupancy';

export function useUnitLevelOccupancyCounts(spaceId: string | null | undefined, enabled: boolean) {
  const [counts, setCounts] = useState<UnitOccupancyCounts | null>(null);
  const [loading, setLoading] = useState(false);

  const reload = useCallback(async () => {
    if (!enabled || !spaceId) {
      setCounts(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      setCounts(await loadUnitLevelOccupancyCounts(spaceId));
    } catch {
      setCounts(null);
    } finally {
      setLoading(false);
    }
  }, [enabled, spaceId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { counts, loading, reload };
}
