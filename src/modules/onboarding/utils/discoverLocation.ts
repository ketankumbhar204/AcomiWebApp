import type { LocationRecord } from '@/shared/types/location';

export type SelectedDiscoverLocation = {
  location: string;
  district: string;
  state: string;
  cityTaluka: string;
  pincode: string;
};

function titleCaseState(state: string): string {
  return state.toLowerCase().replace(/\b([a-z])/g, (letter) => letter.toUpperCase());
}

export function toSelectedDiscoverLocation(record: LocationRecord): SelectedDiscoverLocation {
  return {
    location: record.location?.trim() ?? '',
    district: record.district?.trim() ?? '',
    state: record.state?.trim() ?? '',
    cityTaluka: record.cityTaluka?.trim() ?? '',
    pincode: record.pincode?.trim() ?? '',
  };
}

export function formatDiscoverLocationLabel(selected: SelectedDiscoverLocation): string {
  const location = selected.location.trim();
  const district = selected.district.trim();
  const state = selected.state.trim();
  if (location && district && location.toLowerCase() !== district.toLowerCase()) {
    return `${location}, ${district}`;
  }
  if (location && district && state) {
    return `${location} · ${district} · ${titleCaseState(state)}`;
  }
  if (location && state && location.toLowerCase() !== state.toLowerCase()) {
    return `${location} · ${titleCaseState(state)}`;
  }
  return location;
}

export function matchLocationRecord(
  results: LocationRecord[],
  selected: Pick<SelectedDiscoverLocation, 'location' | 'pincode'>,
): LocationRecord | undefined {
  const location = selected.location.trim().toLowerCase();
  const pincode = selected.pincode.trim();
  return (
    results.find(
      (record) =>
        record.location.toLowerCase() === location && (!pincode || record.pincode === pincode),
    ) ?? results.find((record) => Boolean(pincode) && record.pincode === pincode)
  );
}

export function locationRecordKey(record: LocationRecord): string {
  return [record.location, record.pincode, record.cityTaluka, record.district].join('|');
}

export function formatDiscoverLocationContext(record: LocationRecord): string {
  const district = record.district?.trim() ?? '';
  const state = record.state?.trim() ?? '';
  if (district && state) {
    return `${district} · ${titleCaseState(state)}`;
  }
  return district || titleCaseState(state);
}

/** Prompt once per Places/Mess tab when the page opens without a location. */
export function shouldPromptDiscoverLocation(input: {
  routeReady: boolean;
  hasLocation: boolean;
  category: string;
  promptedFor: string | null;
  skip?: boolean;
}): boolean {
  if (!input.routeReady || input.hasLocation || input.skip) {
    return false;
  }
  return input.promptedFor !== input.category;
}

export function parseDiscoverUrlState(params: URLSearchParams): {
  selectedLocation: SelectedDiscoverLocation | null;
  query: string;
  category: 'places' | 'mess';
} {
  const location = params.get('location')?.trim() ?? '';
  const tab = params.get('tab')?.trim();
  return {
    selectedLocation: location
      ? {
          location,
          pincode: params.get('pincode')?.trim() ?? '',
          district: params.get('district')?.trim() ?? '',
          state: params.get('state')?.trim() ?? '',
          cityTaluka: params.get('taluk')?.trim() ?? '',
        }
      : null,
    query: params.get('q')?.trim() ?? '',
    category: tab === 'mess' ? 'mess' : 'places',
  };
}

export function buildDiscoverUrlParams(input: {
  category: 'places' | 'mess';
  selectedLocation: SelectedDiscoverLocation | null;
  query: string;
  extras?: URLSearchParams;
}): URLSearchParams {
  const next = new URLSearchParams();
  next.set('tab', input.category);
  const selected = input.selectedLocation;
  if (selected?.location.trim()) {
    next.set('location', selected.location.trim());
    if (selected.pincode.trim()) next.set('pincode', selected.pincode.trim());
    if (selected.district.trim()) next.set('district', selected.district.trim());
    if (selected.state.trim()) next.set('state', selected.state.trim());
    if (selected.cityTaluka.trim()) next.set('taluk', selected.cityTaluka.trim());
  }
  const query = input.query.trim();
  if (query) {
    next.set('q', query);
  }
  const extras = input.extras;
  if (extras) {
    for (const key of ['name', 'space', 'enquire']) {
      const value = extras.get(key)?.trim();
      if (value) {
        next.set(key, value);
      }
    }
  }
  return next;
}
