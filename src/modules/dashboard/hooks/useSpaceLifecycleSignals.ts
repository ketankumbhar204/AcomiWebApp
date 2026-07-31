import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { accommodationApi } from '@/modules/accommodation/api/accommodationApi';
import { mealsApi } from '@/modules/meals/api/mealsApi';
import { todayIsoDate } from '@/modules/meals/utils/mealDates';
import { memberApi } from '@/modules/members/api/memberApi';
import type { MemberResponse } from '@/shared/types/member';
import type { SpacePermissionsResponse, SpaceType } from '@/shared/types/space';
import { isAccommodationApplicable } from '@/shared/utils/spacePermissions';
import { servingLocationMode } from '@/shared/utils/servingLocationPolicy';
import {
  emptyPredicateContext,
  needsPropertyStructure,
  type MilestoneId,
  type PredicateContext,
} from '@/spaceLifecycle';

function countLifecycleMembers(
  members: MemberResponse[] | null | undefined,
  spaceType: SpaceType,
): number {
  if (!Array.isArray(members)) return 0;
  if (spaceType === 'MESS') {
    return members.filter((m) => m.role === 'CUSTOMER').length;
  }
  return members.length;
}

function summarizeDay(menus: { mealType: string; status: string; options?: { isAvailable?: boolean }[] }[]) {
  let published = 0;
  let modified = 0;
  let planned = 0;
  const types = ['BREAKFAST', 'LUNCH', 'DINNER'] as const;
  for (const mealType of types) {
    const menu = menus.find((row) => row.mealType === mealType);
    const plannedMenu = (menu?.options?.filter((o) => o.isAvailable) ?? []).length > 0;
    if (!plannedMenu) continue;
    planned += 1;
    if (menu?.status === 'PUBLISHED') published += 1;
    else if (menu?.status === 'MODIFIED') modified += 1;
  }
  return { published, modified, planned };
}

export type UseSpaceLifecycleSignalsArgs = {
  spaceId: string | null;
  spaceType: SpaceType | null | undefined;
  permissions: SpacePermissionsResponse;
  enabled: boolean;
  pendingActionCount: number;
  hasOperationalSignal: boolean;
  dismissedOptionalMilestoneIds?: readonly MilestoneId[];
};

/**
 * Loads setup signals for Space Health — same sources as mobile useSpaceLifecycleSignals.
 */
export function useSpaceLifecycleSignals({
  spaceId,
  spaceType,
  permissions,
  enabled,
  pendingActionCount,
  hasOperationalSignal,
  dismissedOptionalMilestoneIds = [],
}: UseSpaceLifecycleSignalsArgs) {
  const accommodationApplicable = spaceType ? isAccommodationApplicable(spaceType) : true;
  const isMess = spaceType === 'MESS';
  const shouldLoad = Boolean(spaceId) && enabled && spaceType != null;

  const [buildings, setBuildings] = useState<{ buildingId: string }[]>([]);
  const [buildingsLoading, setBuildingsLoading] = useState(false);
  const [memberCount, setMemberCount] = useState(0);
  const [hasMealLibrary, setHasMealLibrary] = useState(false);
  const [hasTodaysMenuPlanned, setHasTodaysMenuPlanned] = useState(false);
  const [hasMenuShared, setHasMenuShared] = useState(false);
  const [deliveryLocationCount, setDeliveryLocationCount] = useState(0);
  const [structure, setStructure] = useState({ floors: 0, units: 0, rooms: 0, beds: 0 });
  const [extrasLoading, setExtrasLoading] = useState(false);
  const [hasLoadedExtras, setHasLoadedExtras] = useState(false);
  const [loadedSpaceId, setLoadedSpaceId] = useState<string | null>(null);
  const hasLoadedExtrasRef = useRef(false);

  useEffect(() => {
    hasLoadedExtrasRef.current = false;
    setHasLoadedExtras(false);
    setLoadedSpaceId(null);
    if (shouldLoad) setExtrasLoading(true);
  }, [spaceId, shouldLoad]);

  const loadBuildings = useCallback(async () => {
    if (!spaceId || !shouldLoad || !accommodationApplicable) {
      setBuildings([]);
      return;
    }
    setBuildingsLoading(true);
    try {
      const list = await accommodationApi.getBuildings(spaceId).catch(() => []);
      setBuildings(Array.isArray(list) ? list : []);
    } finally {
      setBuildingsLoading(false);
    }
  }, [accommodationApplicable, shouldLoad, spaceId]);

  const loadExtras = useCallback(async () => {
    if (!spaceId || !shouldLoad || !spaceType) {
      setMemberCount(0);
      setHasMealLibrary(false);
      setHasTodaysMenuPlanned(false);
      setHasMenuShared(false);
      setDeliveryLocationCount(0);
      setStructure({ floors: 0, units: 0, rooms: 0, beds: 0 });
      hasLoadedExtrasRef.current = false;
      setHasLoadedExtras(false);
      setLoadedSpaceId(null);
      return;
    }

    setExtrasLoading(true);
    try {
      const buildingIds = accommodationApplicable ? buildings.map((b) => b.buildingId) : [];

      if (accommodationApplicable && buildingIds.length === 0) {
        const members = await memberApi.getMembers(spaceId).catch(() => []);
        setMemberCount(countLifecycleMembers(members, spaceType));
        setHasMealLibrary(false);
        setHasTodaysMenuPlanned(false);
        setHasMenuShared(false);
        setDeliveryLocationCount(0);
        setStructure({ floors: 0, units: 0, rooms: 0, beds: 0 });
        return;
      }

      const needsDelivery = isMess && servingLocationMode(spaceType) === 'delivery';

      const [members, items, combos, summaries, deliveryLocations, todaysMenus] =
        await Promise.all([
          memberApi.getMembers(spaceId).catch(() => []),
          isMess || buildingIds.length > 0
            ? mealsApi.getFoodItems(spaceId).catch(() => [])
            : Promise.resolve([]),
          isMess || buildingIds.length > 0
            ? mealsApi.getMealCombos(spaceId).catch(() => [])
            : Promise.resolve([]),
          buildingIds.length > 0
            ? Promise.all(
                buildingIds.map((buildingId) =>
                  accommodationApi.getBuildingSummary(spaceId, buildingId).catch(() => null),
                ),
              )
            : Promise.resolve([]),
          needsDelivery
            ? mealsApi.getMealDeliveryLocationsManage(spaceId).catch(() => [])
            : Promise.resolve([]),
          isMess
            ? mealsApi.getDailyMenusByDate(spaceId, todayIsoDate()).catch(() => [])
            : Promise.resolve([]),
        ]);

      setMemberCount(countLifecycleMembers(members, spaceType));
      setHasMealLibrary(
        (Array.isArray(items) && items.some((i) => i.isActive)) ||
          (Array.isArray(combos) && combos.some((c) => c.isActive)),
      );

      if (isMess) {
        const menus = Array.isArray(todaysMenus) ? todaysMenus : [];
        const summary = summarizeDay(menus);
        setHasTodaysMenuPlanned(summary.planned > 0);
        setHasMenuShared(summary.published > 0 || summary.modified > 0);
      } else {
        setHasTodaysMenuPlanned(false);
        setHasMenuShared(false);
      }

      setDeliveryLocationCount(Array.isArray(deliveryLocations) ? deliveryLocations.length : 0);

      const valid = summaries.filter((s): s is NonNullable<typeof s> => s != null);
      setStructure(
        valid.length > 0
          ? {
              floors: valid.reduce((n, s) => n + (s.floors ?? 0), 0),
              units: valid.reduce((n, s) => n + (s.units ?? 0), 0),
              rooms: valid.reduce((n, s) => n + (s.rooms ?? 0), 0),
              beds: valid.reduce((n, s) => n + (s.beds ?? 0), 0),
            }
          : { floors: 0, units: 0, rooms: 0, beds: 0 },
      );
    } finally {
      hasLoadedExtrasRef.current = true;
      setLoadedSpaceId(spaceId);
      setHasLoadedExtras(true);
      setExtrasLoading(false);
    }
  }, [accommodationApplicable, buildings, isMess, shouldLoad, spaceId, spaceType]);

  useEffect(() => {
    void loadBuildings();
  }, [loadBuildings]);

  useEffect(() => {
    void loadExtras();
  }, [loadExtras]);

  const refresh = useCallback(async () => {
    await loadBuildings();
    await loadExtras();
  }, [loadBuildings, loadExtras]);

  const signalsReady = useMemo(() => {
    if (!shouldLoad || !spaceType || !spaceId) return false;
    if (accommodationApplicable && buildingsLoading && buildings.length === 0) return false;
    return hasLoadedExtras && loadedSpaceId === spaceId;
  }, [
    accommodationApplicable,
    buildings.length,
    buildingsLoading,
    hasLoadedExtras,
    loadedSpaceId,
    shouldLoad,
    spaceId,
    spaceType,
  ]);

  const context = useMemo((): PredicateContext | null => {
    if (!signalsReady || !spaceType) return null;
    return emptyPredicateContext(spaceType, permissions, {
      spaceExists: true,
      buildingCount: accommodationApplicable ? buildings.length : 0,
      floorCount: structure.floors,
      unitCount: structure.units,
      roomCount: structure.rooms,
      bedCount: structure.beds,
      memberCount,
      hasMealLibrary,
      hasTodaysMenuPlanned,
      hasMenuShared,
      deliveryLocationCount,
      pendingActionCount,
      hasOperationalSignal,
      dismissedOptionalMilestoneIds,
    });
  }, [
    accommodationApplicable,
    buildings.length,
    deliveryLocationCount,
    dismissedOptionalMilestoneIds,
    hasMealLibrary,
    hasMenuShared,
    hasOperationalSignal,
    hasTodaysMenuPlanned,
    memberCount,
    pendingActionCount,
    permissions,
    signalsReady,
    spaceType,
    structure.beds,
    structure.floors,
    structure.rooms,
    structure.units,
  ]);

  const loading =
    shouldLoad &&
    ((accommodationApplicable && buildingsLoading && buildings.length === 0) ||
      (extrasLoading && !hasLoadedExtras));

  return {
    context,
    loading,
    refresh,
    needsPropertyStructure: context ? needsPropertyStructure(context) : false,
  };
}
