import { formatPaymentStayLabel, type StayLayoutMode } from '@/shared/utils/stayTrail';

export type MemberStayParts = {
  occupancyId?: string | null;
  memberId: string;
  buildingId?: string | null;
  status?: string | null;
  vacatedAt?: string | null;
  buildingName?: string | null;
  floorName?: string | null;
  unitName?: string | null;
  roomName?: string | null;
  bedName?: string | null;
};

export type MemberStayOptions = {
  multipleBuildings?: boolean;
  layoutByBuildingId?: ReadonlyMap<string, StayLayoutMode>;
};

export function stayLabelForMember(
  memberId: string,
  rows: MemberStayParts[],
  options?: MemberStayOptions,
): string | null {
  const mine = rows.filter((row) => row.memberId === memberId);
  const active = mine.find((row) => row.status === 'ACTIVE');
  const vacated = mine
    .filter((row) => row.status === 'VACATED')
    .sort((left, right) => (right.vacatedAt ?? '').localeCompare(left.vacatedAt ?? ''))[0];
  return labelForParts(active ?? vacated, options);
}

export type StayTrailIndex = {
  byOccupancyId: ReadonlyMap<string, string>;
  byMemberId: ReadonlyMap<string, string>;
};

function labelForParts(
  parts: MemberStayParts | null | undefined,
  options?: MemberStayOptions,
): string | null {
  if (!parts) {
    return null;
  }
  return formatPaymentStayLabel({
    layoutMode: parts.buildingId ? options?.layoutByBuildingId?.get(parts.buildingId) : undefined,
    buildingName: parts.buildingName,
    floorName: parts.floorName,
    unitName: parts.unitName,
    roomName: parts.roomName,
    bedName: parts.bedName,
  });
}

/** One label per occupancy, and one current label per member. */
export function buildStayTrailIndex(
  rows: MemberStayParts[],
  options?: MemberStayOptions,
): StayTrailIndex {
  const byOccupancyId = new Map<string, string>();
  rows.forEach((row) => {
    const label = labelForParts(row, options);
    if (row.occupancyId && label) {
      byOccupancyId.set(row.occupancyId, label);
    }
  });
  const byMemberId = new Map<string, string>();
  new Set(rows.map((row) => row.memberId)).forEach((memberId) => {
    const label = stayLabelForMember(memberId, rows, options);
    if (label) {
      byMemberId.set(memberId, label);
    }
  });
  return { byOccupancyId, byMemberId };
}

/** Payment rows prefer the occupancy on the payment, then the member's current stay. */
export function stayLabelFromIndex(
  index: StayTrailIndex | null | undefined,
  source: { occupancyId?: string | null; memberId?: string | null },
): string | null {
  if (!index) {
    return null;
  }
  if (source.occupancyId) {
    const exact = index.byOccupancyId.get(source.occupancyId);
    if (exact) {
      return exact;
    }
  }
  if (source.memberId) {
    return index.byMemberId.get(source.memberId) ?? null;
  }
  return null;
}
