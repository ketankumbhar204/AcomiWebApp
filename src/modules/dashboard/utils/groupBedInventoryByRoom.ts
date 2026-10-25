import type { BedSpaceListItem } from '../api/dashboardDrilldownApi';

export type DashboardBedRoomGroup = {
  key: string;
  crumbs: string[];
  beds: BedSpaceListItem[];
};

function compareLabels(a?: string | null, b?: string | null): number {
  return (a ?? '').localeCompare(b ?? '', undefined, { sensitivity: 'base' });
}

function crumb(value?: string | null): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

/** Keeps vacant and occupied inventory in the same room sections as the building layout. */
export function groupBedInventoryByRoom(beds: BedSpaceListItem[]): DashboardBedRoomGroup[] {
  const groups = new Map<string, DashboardBedRoomGroup>();

  for (const bed of beds) {
    const key = [
      bed.buildingId ?? '',
      bed.floorId ?? '',
      bed.unitId ?? '',
      bed.roomId ?? bed.roomName ?? bed.bedId,
    ].join(':');
    const existing = groups.get(key);
    if (existing) {
      existing.beds.push(bed);
      continue;
    }
    const crumbs = [bed.buildingName, bed.floorName, bed.unitName, bed.roomName]
      .map(crumb)
      .filter((part): part is string => Boolean(part));
    groups.set(key, { key, crumbs, beds: [bed] });
  }

  const result = Array.from(groups.values());
  for (const group of result) {
    group.beds.sort((a, b) => compareLabels(a.label, b.label));
  }
  result.sort((a, b) => {
    const left = a.beds[0];
    const right = b.beds[0];
    return (
      compareLabels(left?.buildingName, right?.buildingName) ||
      compareLabels(left?.floorName, right?.floorName) ||
      compareLabels(left?.unitName, right?.unitName) ||
      compareLabels(left?.roomName, right?.roomName)
    );
  });
  return result;
}
