/**
 * Contract tests for listing address / Google Maps helpers.
 * Keep in sync with src/modules/onboarding/utils/listingLocation.ts
 * Usage: node scripts/check-listing-location.mjs
 */
import assert from 'node:assert/strict';
import test from 'node:test';

const PLACEHOLDER_PARTS = new Set(['', '-', '—', '–', ',', 'n/a', 'na']);

function isUsableListingPart(value) {
  if (value == null) return false;
  const trimmed = String(value).trim();
  if (!trimmed) return false;
  return !PLACEHOLDER_PARTS.has(trimmed.toLowerCase());
}

function cleanPart(value) {
  if (!isUsableListingPart(value)) return null;
  return String(value).trim();
}

function uniqueParts(parts) {
  const seen = new Set();
  const out = [];
  for (const part of parts) {
    if (!part) continue;
    const key = part.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(part);
  }
  return out;
}

function formatListingAddress(parts) {
  const addressLine = cleanPart(parts.addressLine);
  const city = cleanPart(parts.city);
  const state = cleanPart(parts.state);
  const pincode = cleanPart(parts.pincode);
  const structured = uniqueParts([
    addressLine,
    city,
    [state, pincode].filter(Boolean).join(' ') || null,
  ]);
  if (structured.length > 0) return structured.join('\n');
  const flattened = cleanPart(parts.address);
  if (!flattened) return null;
  const cleaned = flattened
    .split(',')
    .map((chunk) => chunk.trim())
    .filter((chunk) => isUsableListingPart(chunk));
  return cleaned.length > 0 ? cleaned.join(', ') : null;
}

function toFiniteNumber(value) {
  if (value == null || value === '') return null;
  const numeric = typeof value === 'number' ? value : Number(String(value).trim());
  if (!Number.isFinite(numeric)) return null;
  return numeric;
}

function getGoogleMapsUrl(latitude, longitude) {
  const lat = toFiniteNumber(latitude);
  const lng = toFiniteNumber(longitude);
  if (lat == null || lng == null) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  const query = `${lat},${lng}`;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

function isSafeHttpUrl(value) {
  const trimmed = value?.trim();
  if (!trimmed) return false;
  try {
    const url = new URL(trimmed);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function resolveListingMapsUrl(input) {
  const fromCoords = getGoogleMapsUrl(input.latitude, input.longitude);
  if (fromCoords) return fromCoords;
  if (isSafeHttpUrl(input.mapUrl)) return input.mapUrl.trim();
  return null;
}

function isValidListingPrice(value) {
  const numeric = toFiniteNumber(value);
  return numeric != null && numeric > 0;
}

test('formats a full address without placeholders', () => {
  assert.equal(
    formatListingAddress({
      addressLine: '12, Datta Mandir Road',
      city: 'Wakad',
      state: 'Maharashtra',
      pincode: '411057',
    }),
    '12, Datta Mandir Road\nWakad\nMaharashtra 411057',
  );
});

test('partial address does not insert dash placeholders', () => {
  assert.equal(
    formatListingAddress({
      addressLine: '—',
      city: '',
      state: '-',
      pincode: '110001',
    }),
    '110001',
  );
});

test('falls back to flattened address when structured parts are missing', () => {
  assert.equal(
    formatListingAddress({ address: 'Hinjewadi, Pune' }),
    'Hinjewadi, Pune',
  );
});

test('omits location text when nothing usable exists', () => {
  assert.equal(formatListingAddress({ address: '—, —, —' }), null);
});

test('coordinates produce a Google Maps search URL', () => {
  assert.equal(
    getGoogleMapsUrl(18.6052262, 73.7236231),
    'https://www.google.com/maps/search/?api=1&query=18.6052262%2C73.7236231',
  );
});

test('invalid coordinates do not produce a Maps link', () => {
  assert.equal(getGoogleMapsUrl(91, 73), null);
  assert.equal(getGoogleMapsUrl(18, 181), null);
  assert.equal(getGoogleMapsUrl(null, 73), null);
  assert.equal(getGoogleMapsUrl('abc', 'def'), null);
});

test('existing Map URL is used when coordinates are unavailable', () => {
  assert.equal(
    resolveListingMapsUrl({
      mapUrl: 'https://maps.google.com/?q=Wakad',
    }),
    'https://maps.google.com/?q=Wakad',
  );
});

test('coordinates take priority over an existing Map URL', () => {
  const url = resolveListingMapsUrl({
    latitude: 18.6052262,
    longitude: 73.7236231,
    mapUrl: 'https://maps.google.com/?q=other',
  });
  assert.ok(url?.includes('18.6052262'));
  assert.equal(url?.includes('other'), false);
});

test('no Maps URL when neither coordinates nor a safe Map URL exist', () => {
  assert.equal(resolveListingMapsUrl({ mapUrl: 'javascript:alert(1)' }), null);
  assert.equal(resolveListingMapsUrl({}), null);
});

test('Maps URL does not include owner or private fields', () => {
  const url = getGoogleMapsUrl(18.6052262, 73.7236231);
  assert.equal(url?.includes('owner'), false);
  assert.equal(url?.includes('mobile'), false);
  assert.equal(url?.includes('email'), false);
});

test('zero and missing prices are not valid listing prices', () => {
  assert.equal(isValidListingPrice(0), false);
  assert.equal(isValidListingPrice('0'), false);
  assert.equal(isValidListingPrice(null), false);
  assert.equal(isValidListingPrice(8500), true);
});
