export type StayLocationLine = {
  labelKey:
    | 'occupancy.section.building'
    | 'occupancy.section.floor'
    | 'occupancy.section.unit'
    | 'occupancy.section.room'
    | 'occupancy.section.bed';
  value: string;
};

export type StayRecord = {
  buildingName?: string | null;
  floorName?: string | null;
  unitName?: string | null;
  roomName?: string | null;
  bedName?: string | null;
  status?: string | null;
  occupancyStatus?: string | null;
  moveInDate?: string | null;
  actualMoveInAt?: string | null;
  expectedExitDate?: string | null;
  expectedCheckoutDate?: string | null;
  rentSnapshot?: number | null;
  depositSnapshot?: number | null;
  foodEnabled?: boolean;
  foodIncludedInRent?: boolean;
  foodChargeSnapshot?: number | null;
  otherCharges?: { label?: string | null; amount?: number | null; chargeSnapshotId?: string | null }[];
};

function text(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function amount(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

/** Reads stay fields already returned by the member occupancy API. */
export function readStayRecord(value: Record<string, unknown> | null | undefined): StayRecord | null {
  if (!value) {
    return null;
  }
  const charges = Array.isArray(value.otherCharges)
    ? value.otherCharges.flatMap((entry) => {
        if (!entry || typeof entry !== 'object') {
          return [];
        }
        const row = entry as Record<string, unknown>;
        return [
          {
            label: text(row.label),
            amount: amount(row.amount),
            chargeSnapshotId: text(row.chargeSnapshotId),
          },
        ];
      })
    : undefined;

  return {
    buildingName: text(value.buildingName),
    floorName: text(value.floorName),
    unitName: text(value.unitName),
    roomName: text(value.roomName),
    bedName: text(value.bedName),
    status: text(value.status),
    occupancyStatus: text(value.occupancyStatus),
    moveInDate: text(value.moveInDate),
    actualMoveInAt: text(value.actualMoveInAt),
    expectedExitDate: text(value.expectedExitDate),
    expectedCheckoutDate: text(value.expectedCheckoutDate),
    rentSnapshot: amount(value.rentSnapshot),
    depositSnapshot: amount(value.depositSnapshot),
    foodEnabled: value.foodEnabled === true,
    foodIncludedInRent: value.foodIncludedInRent === true,
    foodChargeSnapshot: amount(value.foodChargeSnapshot),
    otherCharges: charges,
  };
}

export function occupancyLocationLines(
  stay: Pick<StayRecord, 'buildingName' | 'floorName' | 'unitName' | 'roomName' | 'bedName'> | null,
): StayLocationLine[] {
  if (!stay) {
    return [];
  }
  const candidates: StayLocationLine[] = [
    { labelKey: 'occupancy.section.building', value: stay.buildingName?.trim() ?? '' },
    { labelKey: 'occupancy.section.floor', value: stay.floorName?.trim() ?? '' },
    { labelKey: 'occupancy.section.unit', value: stay.unitName?.trim() ?? '' },
    { labelKey: 'occupancy.section.room', value: stay.roomName?.trim() ?? '' },
    { labelKey: 'occupancy.section.bed', value: stay.bedName?.trim() ?? '' },
  ];
  return candidates.filter((line) => line.value.length > 0);
}

export function labeledStayLocation(
  stay: Pick<StayRecord, 'buildingName' | 'floorName' | 'unitName' | 'roomName' | 'bedName'> | null,
  labelFor: (key: StayLocationLine['labelKey']) => string,
): string {
  const lines = occupancyLocationLines(stay);
  if (lines.length === 0) {
    return '';
  }
  return lines.map((line) => `${labelFor(line.labelKey)}: ${line.value}`).join(' · ');
}

/** Inclusive calendar days from move-in through today. */
export function occupiedDayCount(moveInDate?: string | null): number | null {
  if (!moveInDate) {
    return null;
  }
  const start = new Date(moveInDate.slice(0, 10) + 'T00:00:00');
  if (Number.isNaN(start.getTime())) {
    return null;
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (today.getTime() < start.getTime()) {
    return null;
  }
  return Math.floor((today.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)) + 1;
}

export function hasStayContent(stay: StayRecord | null): boolean {
  if (!stay) {
    return false;
  }
  return Boolean(
    stay.buildingName ||
      stay.floorName ||
      stay.unitName ||
      stay.roomName ||
      stay.bedName ||
      stay.status ||
      stay.occupancyStatus ||
      stay.moveInDate ||
      stay.rentSnapshot != null,
  );
}

export function stayExitDate(stay: StayRecord | null): string | null {
  return stay?.expectedExitDate ?? stay?.expectedCheckoutDate ?? null;
}

/**
 * Recurring monthly amount. Deposit is excluded.
 * Matches mobile computeOccupancyMonthlyTotal: rent, plus food only when food is a separate charge.
 */
export function stayMonthlyTotal(stay: StayRecord | null): number | null {
  if (!stay || stay.rentSnapshot == null) {
    return null;
  }
  if (stay.foodIncludedInRent || !stay.foodEnabled) {
    return stay.rentSnapshot;
  }
  return stay.rentSnapshot + (stay.foodChargeSnapshot ?? 0);
}
