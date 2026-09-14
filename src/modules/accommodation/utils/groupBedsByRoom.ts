import type { BedSpaceListItemResponse } from '@/shared/types/accommodation';

export type BedRoomGroup = {
  key: string;
  buildingId: string;
  buildingName: string;
  floorId?: string | null;
  floorName?: string | null;
  unitId?: string | null;
  unitName?: string | null;
  roomId: string;
  roomName: string;
  roomType?: string | null;
  beds: BedSpaceListItemResponse[];
};

function roomKey(bed: BedSpaceListItemResponse): string {
  return [bed.buildingId, bed.floorId ?? 'no-floor', bed.unitId ?? 'no-unit', bed.roomId].join(':');
}

function compareLabels(a?: string | null, b?: string | null): number {
  return (a ?? '').localeCompare(b ?? '', undefined, { sensitivity: 'base' });
}

export function groupBedsByRoom(beds: BedSpaceListItemResponse[]): BedRoomGroup[] {
  const groups = new Map<string, BedRoomGroup>();

  for (const bed of beds) {
    const key = roomKey(bed);
    const existing = groups.get(key);
    if (existing) {
      existing.beds.push(bed);
      if (!existing.roomType && bed.roomType) {
        existing.roomType = String(bed.roomType);
      }
      continue;
    }
    groups.set(key, {
      key,
      buildingId: bed.buildingId,
      buildingName: bed.buildingName,
      floorId: bed.floorId,
      floorName: bed.floorName,
      unitId: bed.unitId,
      unitName: bed.unitName,
      roomId: bed.roomId,
      roomName: bed.roomName,
      roomType: bed.roomType ? String(bed.roomType) : null,
      beds: [bed],
    });
  }

  const result = Array.from(groups.values());
  for (const group of result) {
    group.beds.sort((a, b) => compareLabels(a.label, b.label));
  }
  result.sort(
    (a, b) =>
      compareLabels(a.buildingName, b.buildingName) ||
      compareLabels(a.floorName, b.floorName) ||
      compareLabels(a.unitName, b.unitName) ||
      compareLabels(a.roomName, b.roomName),
  );
  return result;
}

/** Building-scoped path for room cards (matches mock: B1 > Floor 1 > Room 101). */
export function formatRoomInventoryPath(group: BedRoomGroup): string {
  return roomInventoryPathSegments(group).join(' > ');
}

/** Path segments for icon separators in the inventory UI. */
export function roomInventoryPathSegments(group: BedRoomGroup): string[] {
  return [group.buildingName, group.floorName, group.unitName, group.roomName]
    .map((part) => part?.trim())
    .filter((part): part is string => Boolean(part));
}

export function roomGroupAvailableCount(group: BedRoomGroup): number {
  return group.beds.filter((bed) => bed.status === 'AVAILABLE').length;
}
