import type {
  AccommodationStatus,
  AllocationTargetSearchResponse,
} from '@/shared/types/accommodation';

export function wizardNeedsTargetSearch(steps: readonly string[]): boolean {
  return steps.includes('target');
}

export function allocationTargetFromKnownBed(input: {
  bedId: string;
  roomId?: string;
  unitId?: string;
  buildingId?: string;
  bedLabel?: string | null;
  displayPath?: string | null;
  defaultRent?: number | null;
  defaultDeposit?: number | null;
  status?: AccommodationStatus;
}): AllocationTargetSearchResponse {
  const label = input.bedLabel?.trim() || 'Bed';
  const status = input.status ?? 'AVAILABLE';
  return {
    targetType: 'BED',
    targetId: input.bedId,
    buildingId: input.buildingId,
    roomId: input.roomId,
    unitId: input.unitId,
    bedId: input.bedId,
    bedName: label,
    displayPath: input.displayPath?.trim() || label,
    displayPathShort: label,
    status,
    defaultRent: input.defaultRent,
    defaultDeposit: input.defaultDeposit,
    selectable: status === 'AVAILABLE',
    notSelectableReason: status === 'AVAILABLE' ? null : `Target is ${status.toLowerCase()}`,
  };
}
