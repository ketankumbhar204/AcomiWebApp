import type {
  InventoryItem,
  InventoryItemListFilter,
  InventoryProfileKind,
  InventoryStockStatus,
  InventoryUnit,
} from '@/shared/types/inventory';
import type { SpaceType } from '@/shared/types/space';
import type { StatusChipTone } from '@/shared/components/StatusChip';

export function getInventoryProfileKind(spaceType: SpaceType | undefined): InventoryProfileKind {
  if (spaceType === 'MESS') {
    return 'FOOD';
  }
  if (spaceType === 'RENTAL') {
    return 'FURNITURE';
  }
  return 'ASSET';
}

export function defaultUnitsForSpace(spaceType: SpaceType | undefined): InventoryUnit[] {
  const kind = getInventoryProfileKind(spaceType);
  if (kind === 'FOOD') {
    return ['KG', 'LITRE', 'DOZEN', 'PACKET', 'PIECE'];
  }
  if (kind === 'FURNITURE') {
    return ['PIECE', 'SET', 'PACKET'];
  }
  return ['PIECE', 'SET', 'PACKET', 'METRE'];
}

export function availableStock(item: InventoryItem): number {
  return Math.max(0, item.currentStock - item.reservedStock);
}

export function deriveInventoryStockStatus(item: InventoryItem): InventoryStockStatus {
  if (item.statusOverride === 'DISCONTINUED' || item.statusOverride === 'INACTIVE') {
    return item.statusOverride;
  }
  const available = availableStock(item);
  if (available <= 0) {
    return 'OUT_OF_STOCK';
  }
  if (item.minimumStock > 0 && available <= Math.max(1, Math.floor(item.minimumStock * 0.5))) {
    return 'CRITICAL';
  }
  if (item.minimumStock > 0 && available <= item.minimumStock) {
    return 'LOW';
  }
  return 'HEALTHY';
}

export function matchesStockFilter(
  item: InventoryItem,
  filter: InventoryItemListFilter,
): boolean {
  const status = deriveInventoryStockStatus(item);
  switch (filter) {
    case 'ALL':
      return true;
    case 'HEALTHY':
      return status === 'HEALTHY';
    case 'LOW':
      return status === 'LOW';
    case 'CRITICAL':
      return status === 'CRITICAL' || status === 'OUT_OF_STOCK';
    case 'OUT_OF_STOCK':
      return status === 'OUT_OF_STOCK';
    case 'ATTENTION':
      return status === 'LOW' || status === 'CRITICAL' || status === 'OUT_OF_STOCK';
    default:
      return true;
  }
}

export function formatInventoryUnit(unit: InventoryUnit): string {
  switch (unit) {
    case 'KG':
      return 'kg';
    case 'LITRE':
      return 'L';
    case 'PIECE':
      return 'pcs';
    case 'PACKET':
      return 'pkt';
    case 'DOZEN':
      return 'dz';
    case 'METRE':
      return 'm';
    case 'SET':
      return 'set';
    default:
      return unit.toLowerCase();
  }
}

export function formatStockQty(value: number, unit: InventoryUnit): string {
  const rounded = Number.isInteger(value) ? String(value) : value.toFixed(2);
  return `${rounded} ${formatInventoryUnit(unit)}`;
}

export function statusLabelKey(status: InventoryStockStatus | string): string {
  return `inventory.status.${status}`;
}

export function txnLabelKey(type: string): string {
  return `inventory.txn.${type}`;
}

export function formatInventoryDateTime(value?: string | null): string {
  if (!value) {
    return '—';
  }
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

export function inventoryStockStatusTone(
  status?: InventoryStockStatus | string | null,
): StatusChipTone {
  switch (status) {
    case 'HEALTHY':
      return 'success';
    case 'LOW':
      return 'warning';
    case 'CRITICAL':
    case 'OUT_OF_STOCK':
      return 'error';
    case 'DISCONTINUED':
    case 'INACTIVE':
      return 'neutral';
    default:
      return 'default';
  }
}

const AVATAR_ACCENTS = ['#7C3AED', '#3B82F6', '#059669', '#F59E0B', '#EC4899', '#128C7E'] as const;

export function inventoryAvatarAccent(seed?: string | null): string {
  if (!seed) return AVATAR_ACCENTS[0];
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash + seed.charCodeAt(i) * (i + 1)) % AVATAR_ACCENTS.length;
  }
  return AVATAR_ACCENTS[hash] ?? AVATAR_ACCENTS[0];
}
