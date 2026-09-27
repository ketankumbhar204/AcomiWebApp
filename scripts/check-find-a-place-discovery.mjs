/**
 * Contract tests for authenticated Find a place discovery.
 * Keep in sync with public website /places and /meals.
 * Usage: node scripts/check-find-a-place-discovery.mjs
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => readFileSync(join(root, rel), 'utf8');

function buildDiscoverSearchParams(params = {}) {
  const query = new URLSearchParams();
  const search = params.search?.trim();
  const location = params.location?.trim();
  if (search) query.set('search', search);
  if (location) query.set('location', location);
  if (params.type) query.set('type', params.type);
  for (const type of params.types ?? []) {
    if (type) query.append('types', type);
  }
  if (params.minRent != null) query.set('minRent', String(params.minRent));
  if (params.maxRent != null) query.set('maxRent', String(params.maxRent));
  for (const code of params.amenities ?? []) {
    const trimmed = code.trim();
    if (trimmed) query.append('amenities', trimmed);
  }
  query.set('page', String(params.page ?? 0));
  query.set('size', String(params.size ?? 20));
  query.set('sort', params.sort ?? 'newest');
  return query;
}

function buildLocationSearchParams(input) {
  const params = {
    q: input.q.trim(),
    limit: input.limit ?? 20,
  };
  if (input.state?.trim()) params.state = input.state.trim();
  if (input.district?.trim()) params.district = input.district.trim();
  if (input.taluk?.trim()) params.taluk = input.taluk.trim();
  return params;
}

function shouldPromptDiscoverLocation(input) {
  if (!input.routeReady || input.hasLocation || input.skip) return false;
  return input.promptedFor !== input.category;
}

test('discover query sends location separately from search and pages at 20', () => {
  const query = buildDiscoverSearchParams({
    location: 'Aundh',
    search: 'Girls',
    types: ['PG', 'HOSTEL', 'CO_LIVING', 'RENTAL'],
    minRent: 5000,
    maxRent: 15000,
    page: 0,
  });
  assert.equal(query.get('location'), 'Aundh');
  assert.equal(query.get('search'), 'Girls');
  assert.deepEqual(query.getAll('types'), ['PG', 'HOSTEL', 'CO_LIVING', 'RENTAL']);
  assert.equal(query.get('minRent'), '5000');
  assert.equal(query.get('size'), '20');
  assert.equal(query.has('pincode'), false);
});

test('mess discover uses type=MESS and never sends minRent', () => {
  const query = buildDiscoverSearchParams({
    location: 'Hinjewadi',
    search: 'tiffin',
    type: 'MESS',
    page: 1,
  });
  assert.equal(query.get('type'), 'MESS');
  assert.equal(query.get('location'), 'Hinjewadi');
  assert.equal(query.get('search'), 'tiffin');
  assert.equal(query.has('minRent'), false);
  assert.equal(query.get('page'), '1');
});

test('location search keeps ranking context and does not invent locations.json', () => {
  const params = buildLocationSearchParams({
    q: 'Aundh',
    state: 'MAHARASHTRA',
    district: 'Pune',
    taluk: 'Haveli',
  });
  assert.equal(params.q, 'Aundh');
  assert.equal(params.state, 'MAHARASHTRA');
  assert.equal(params.district, 'Pune');
  assert.equal(params.taluk, 'Haveli');
  assert.equal(JSON.stringify(params).includes('locations.json'), false);
});

test('prompts for location once per tab when none is selected', () => {
  assert.equal(
    shouldPromptDiscoverLocation({
      routeReady: true,
      hasLocation: false,
      category: 'places',
      promptedFor: null,
    }),
    true,
  );
  assert.equal(
    shouldPromptDiscoverLocation({
      routeReady: true,
      hasLocation: true,
      category: 'places',
      promptedFor: null,
    }),
    false,
  );
  assert.equal(
    shouldPromptDiscoverLocation({
      routeReady: true,
      hasLocation: false,
      category: 'mess',
      promptedFor: 'places',
    }),
    true,
  );
  assert.equal(
    shouldPromptDiscoverLocation({
      routeReady: true,
      hasLocation: false,
      category: 'places',
      promptedFor: null,
      skip: true,
    }),
    false,
  );
});

test('Find a place sources stay aligned with the public website', () => {
  const page = read('src/modules/onboarding/pages/FindAPlacePage.tsx');
  const api = read('src/shared/api/spaceDiscoverApi.ts');
  const locations = read('src/shared/api/locationsApi.ts');
  const filters = read('src/modules/onboarding/utils/discoverFilterModel.ts');
  const modal = read('src/modules/onboarding/components/LocationSelectModal.tsx');

  assert.match(page, /LocationSelectModal/);
  assert.match(page, /shouldPromptDiscoverLocation/);
  assert.match(page, /useInfiniteQuery/);
  assert.match(page, /DISCOVER_PAGE_SIZE/);
  assert.match(page, /minRent: isMess \? null/);
  assert.doesNotMatch(page, /locations\.json/);
  assert.doesNotMatch(page, /PUNE_DISCOVER_LOCALITIES/);
  assert.doesNotMatch(page, /cityPune/);
  assert.doesNotMatch(page, /FETCH_SIZE/);

  assert.match(api, /buildDiscoverSearchParams/);
  assert.match(api, /\/spaces\/discover/);
  assert.doesNotMatch(api, /locations\.json/);

  assert.match(locations, /\/locations\/search/);
  assert.match(locations, /buildLocationSearchParams/);
  assert.doesNotMatch(locations, /locations\.json/);

  assert.match(modal, /locationsApi/);
  assert.match(modal, /rankingContext/);
  assert.doesNotMatch(filters, /PUNE_DISCOVER_LOCALITIES/);
  assert.doesNotMatch(filters, /minMeal/);
  assert.doesNotMatch(filters, /minRating/);
});
