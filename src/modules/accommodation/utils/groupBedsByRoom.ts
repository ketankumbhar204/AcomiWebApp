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

export type RoomPathLevel = 'building' | 'floor' | 'unit' | 'room';

export type RoomPathCrumb = {
  level: RoomPathLevel;
  label: string;
};

/** Building › Floor › Unit › Room crumbs used as edit links in inventory headers. */
export function roomInventoryPathCrumbs(
  group: BedRoomGroup,
  options?: { includeUnit?: boolean },
): RoomPathCrumb[] {
  const includeUnit = options?.includeUnit ?? Boolean(group.unitId);
  const crumbs: RoomPathCrumb[] = [];
  const building = group.buildingName?.trim();
  if (building) {
    crumbs.push({ level: 'building', label: building });
  }
  const floor = group.floorName?.trim();
  if (group.floorId && floor) {
    crumbs.push({ level: 'floor', label: floor });
  }
  const unit = group.unitName?.trim();
  if (includeUnit && group.unitId && unit) {
    crumbs.push({ level: 'unit', label: unit });
  }
  const room = group.roomName?.trim();
  if (room) {
    crumbs.push({ level: 'room', label: room });
  }
  return crumbs;
}

/** Building-scoped path for room cards (matches mock: B1 > Floor 1 > Room 101). */
export function formatRoomInventoryPath(group: BedRoomGroup): string {
  return roomInventoryPathSegments(group).join(' > ');
}

/** Path segments for icon separators in the inventory UI. */
export function roomInventoryPathSegments(
  group: BedRoomGroup,
  options?: { includeUnit?: boolean },
): string[] {
  return roomInventoryPathCrumbs(group, options).map((crumb) => crumb.label);
}

export function roomGroupAvailableCount(group: BedRoomGroup): number {
  return group.beds.filter((bed) => bed.status === 'AVAILABLE').length;
}
