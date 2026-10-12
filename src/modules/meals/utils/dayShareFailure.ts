const failedKeys = new Set<string>();

function key(spaceId: string, menuDate: string): string {
  return `${spaceId}:${menuDate}`;
}

export function markDayShareFailed(spaceId: string, menuDate: string): void {
  failedKeys.add(key(spaceId, menuDate));
}

export function clearDayShareFailed(spaceId: string, menuDate: string): void {
  failedKeys.delete(key(spaceId, menuDate));
}

export function isDayShareFailed(spaceId: string, menuDate: string): boolean {
  return failedKeys.has(key(spaceId, menuDate));
}
