import type {
  AllocateOccupancyRequest,
  AllocationTargetType,
  ReserveOccupancyRequest,
  TransferOccupancyRequest,
} from '@/shared/types/accommodation';
import type { SpaceType } from '@/shared/types/space';

export function getAllowedTargetTypes(spaceType: SpaceType): AllocationTargetType[] {
  switch (spaceType) {
    case 'PG':
    case 'HOSTEL':
      return ['BED'];
    case 'CO_LIVING':
      return ['BED', 'ROOM'];
    case 'RENTAL':
      return ['UNIT'];
    default:
      return [];
  }
}

export function validateTargetSelection(
  spaceType: SpaceType,
  targetType: AllocationTargetType,
  ids: { bedId?: string; roomId?: string; unitId?: string },
): string | null {
  const allowed = getAllowedTargetTypes(spaceType);
  if (!allowed.includes(targetType)) {
    return 'occupancy.errors.invalidTargetType';
  }
  if (targetType === 'BED' && !ids.bedId) {
    return 'occupancy.errors.bedRequired';
  }
  if (targetType === 'ROOM' && !ids.roomId) {
    return 'occupancy.errors.roomRequired';
  }
  if (targetType === 'UNIT' && !ids.unitId) {
    return 'occupancy.errors.unitRequired';
  }
  return null;
}

export function buildAllocateRequest(
  memberId: string,
  spaceType: SpaceType,
  targetType: AllocationTargetType,
  ids: { bedId?: string; roomId?: string; unitId?: string },
  options: {
    rentSnapshot?: number;
    depositSnapshot?: number;
    foodEnabled?: boolean;
    foodChargeSnapshot?: number;
    foodIncludedInRent?: boolean;
    remarks?: string;
    expectedExitDate?: string;
  },
): { body: AllocateOccupancyRequest | null; errorKey: string | null } {
  const errorKey = validateTargetSelection(spaceType, targetType, ids);
  if (errorKey) {
    return { body: null, errorKey };
  }
  return {
    body: {
      memberId,
      targetType,
      bedId: ids.bedId,
      roomId: ids.roomId,
      unitId: ids.unitId,
      rentSnapshot: options.rentSnapshot,
      depositSnapshot: options.depositSnapshot,
      foodEnabled: options.foodEnabled,
      foodChargeSnapshot: options.foodChargeSnapshot,
      foodIncludedInRent: options.foodIncludedInRent,
      remarks: options.remarks,
      expectedExitDate: options.expectedExitDate,
    },
    errorKey: null,
  };
}

export function buildReserveRequest(
  memberId: string,
  spaceType: SpaceType,
  targetType: AllocationTargetType,
  ids: { bedId?: string; roomId?: string; unitId?: string },
  options: { moveInDate: string; expectedExitDate?: string; remarks?: string },
): { body: ReserveOccupancyRequest | null; errorKey: string | null } {
  const errorKey = validateTargetSelection(spaceType, targetType, ids);
  if (errorKey) {
    return { body: null, errorKey };
  }
  if (!options.moveInDate.trim()) {
    return { body: null, errorKey: 'occupancy.errors.moveInDateRequired' };
  }
  return {
    body: {
      memberId,
      targetType,
      bedId: ids.bedId,
      roomId: ids.roomId,
      unitId: ids.unitId,
      moveInDate: options.moveInDate,
      expectedExitDate: options.expectedExitDate,
      remarks: options.remarks,
    },
    errorKey: null,
  };
}

export function buildTransferRequest(
  spaceType: SpaceType,
  targetType: AllocationTargetType,
  ids: { bedId?: string; roomId?: string; unitId?: string },
  options?: { remarks?: string; rentSnapshot?: number; depositSnapshot?: number },
): { body: TransferOccupancyRequest | null; errorKey: string | null } {
  const errorKey = validateTargetSelection(spaceType, targetType, ids);
  if (errorKey) {
    return { body: null, errorKey };
  }
  return {
    body: {
      targetType,
      bedId: ids.bedId,
      roomId: ids.roomId,
      unitId: ids.unitId,
      remarks: options?.remarks,
      rentPolicy: 'KEEP',
      rentSnapshot: options?.rentSnapshot,
      depositSnapshot: options?.depositSnapshot,
    },
    errorKey: null,
  };
}
