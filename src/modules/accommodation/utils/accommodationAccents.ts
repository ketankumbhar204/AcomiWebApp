import { occupancyColors } from '@/shared/theme/colors';

/** Accommodation Figma accent palette — overview, tree, inspector. */
export const ACC_ACCENTS = {
  building: occupancyColors.occupied,
  floors: '#8B5CF6',
  units: occupancyColors.partial,
  rooms: occupancyColors.occupied,
  beds: '#6366F1',
  available: occupancyColors.vacant,
  treeFloor: occupancyColors.partial,
  treeUnit: occupancyColors.vacant,
  treeUnitFull: occupancyColors.occupied,
  treeRoom: occupancyColors.vacant,
  treeRoomFull: '#EF4444',
  allocate: '#48BB78',
  allocateBg: '#F0FFF4',
  reserve: '#4299E1',
  reserveBg: '#EBF8FF',
  history: '#9F7AEA',
  historyBg: '#FAF5FF',
  detailIcon: occupancyColors.occupied,
} as const;
