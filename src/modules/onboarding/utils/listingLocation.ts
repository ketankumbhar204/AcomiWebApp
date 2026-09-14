export type ListingAddressParts = {
  addressLine?: string | null;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
  address?: string | null;
};

export type ListingMapsInput = {
  latitude?: number | string | null;
  longitude?: number | string | null;
  mapUrl?: string | null;
};

const PLACEHOLDER_PARTS = new Set(['', '-', '—', '–', ',', 'n/a', 'na']);

export function isUsableListingPart(value: string | null | undefined): value is string {
  if (value == null) return false;
  const trimmed = value.trim();
  if (!trimmed) return false;
  return !PLACEHOLDER_PARTS.has(trimmed.toLowerCase());
}

function cleanPart(value: string | null | undefined): string | null {
  if (!isUsableListingPart(value)) return null;
  return value.trim();
}

function uniqueParts(parts: Array<string | null>): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const part of parts) {
    if (!part) continue;
    const key = part.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(part);
  }
  return out;
}

/**
 * Builds a multi-line address from available components.
 * Never inserts "-" placeholders for missing city/state/pincode.
 */
export function formatListingAddress(parts: ListingAddressParts): string | null {
  const addressLine = cleanPart(parts.addressLine);
  const city = cleanPart(parts.city);
  const state = cleanPart(parts.state);
  const pincode = cleanPart(parts.pincode);

  const structured = uniqueParts([
    addressLine,
    city,
    [state, pincode].filter(Boolean).join(' ') || null,
  ]);
  if (structured.length > 0) {
    return structured.join('\n');
  }

  const flattened = cleanPart(parts.address);
  if (!flattened) return null;
  const cleaned = flattened
    .split(',')
    .map((chunk) => chunk.trim())
    .filter((chunk) => isUsableListingPart(chunk));
  return cleaned.length > 0 ? cleaned.join(', ') : null;
}

export function hasListingLocation(
  parts: ListingAddressParts,
  maps: ListingMapsInput,
): boolean {
  return Boolean(formatListingAddress(parts) || resolveListingMapsUrl(maps));
}

function toFiniteNumber(value: number | string | null | undefined): number | null {
  if (value == null || value === '') return null;
  const numeric = typeof value === 'number' ? value : Number(String(value).trim());
  if (!Number.isFinite(numeric)) return null;
  return numeric;
}

export function getGoogleMapsUrl(
  latitude: number | string | null | undefined,
  longitude: number | string | null | undefined,
): string | null {
  const lat = toFiniteNumber(latitude);
  const lng = toFiniteNumber(longitude);
  if (lat == null || lng == null) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  const query = `${lat},${lng}`;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

export function isSafeHttpUrl(value: string | null | undefined): value is string {
  const trimmed = value?.trim();
  if (!trimmed) return false;
  try {
    const url = new URL(trimmed);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

export function resolveListingMapsUrl(input: ListingMapsInput): string | null {
  const fromCoords = getGoogleMapsUrl(input.latitude, input.longitude);
  if (fromCoords) return fromCoords;
  if (isSafeHttpUrl(input.mapUrl)) return input.mapUrl.trim();
  return null;
}

export function isValidListingPrice(value: number | string | null | undefined): boolean {
  const numeric = toFiniteNumber(value);
  return numeric != null && numeric > 0;
}

export function formatListingPriceInr(value: number | string | null | undefined): string | null {
  if (!isValidListingPrice(value)) return null;
  const numeric = toFiniteNumber(value);
  if (numeric == null) return null;
  return `₹${Math.round(numeric).toLocaleString('en-IN')}`;
}

export function humanizeAmenityCode(code: string | null | undefined): string | null {
  const trimmed = code?.trim();
  if (!trimmed) return null;
  return trimmed
    .toLowerCase()
    .split('_')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
