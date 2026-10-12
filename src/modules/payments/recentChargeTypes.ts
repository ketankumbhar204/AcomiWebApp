const MAX_RECENT = 4;

function storageKey(spaceId: string): string {
  return `acomi.recentChargeTypes.${spaceId}`;
}

export function readRecentChargeTypeIds(spaceId: string): string[] {
  if (!spaceId || typeof localStorage === 'undefined') {
    return [];
  }
  try {
    const raw = localStorage.getItem(storageKey(spaceId));
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter((id): id is string => typeof id === 'string').slice(0, MAX_RECENT);
  } catch {
    return [];
  }
}

export function rememberChargeType(spaceId: string, typeId: string): void {
  if (!spaceId || !typeId || typeof localStorage === 'undefined') {
    return;
  }
  const next = [typeId, ...readRecentChargeTypeIds(spaceId).filter((id) => id !== typeId)].slice(
    0,
    MAX_RECENT,
  );
  localStorage.setItem(storageKey(spaceId), JSON.stringify(next));
}
