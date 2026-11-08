import { formatBedDisplayLabel } from './formatBedDisplayLabel';

type Translate = (key: string, options?: Record<string, string>) => string;

const defaultT: Translate = (key, options) => {
  if (key === 'occupancy.section.bed') {
    return options?.defaultValue ?? 'Bed';
  }
  if (key === 'accommodation.listItem.bed') {
    return `Bed ${options?.label ?? ''}`.trim();
  }
  return options?.defaultValue ?? key;
};

/**
 * Primary inventory title for occupancy wizard / review summaries.
 * Never shows a bare bed letter ("A") — uses "Bed A".
 */
export function formatOccupancyInventoryTitle(
  input: {
    bedName?: string | null;
    roomName?: string | null;
    unitName?: string | null;
    buildingName?: string | null;
    spaceName?: string | null;
    displayPathShort?: string | null;
  },
  t: Translate = defaultT,
): string {
  if (input.bedName?.trim()) {
    return formatBedDisplayLabel(input.bedName, t);
  }
  if (input.roomName?.trim()) {
    return withTypePrefix(input.roomName, /^(room)\b/i, 'Room');
  }
  if (input.unitName?.trim()) {
    return withTypePrefix(input.unitName, /^(unit|apartment|flat|apt\.?)\b/i, 'Unit');
  }
  if (input.displayPathShort?.trim()) {
    const short = input.displayPathShort.trim();
    if (/^[A-Za-z0-9-]{1,4}$/.test(short) && !/^(bed|room|unit)\b/i.test(short)) {
      return formatBedDisplayLabel(short, t);
    }
    return short;
  }
  if (input.buildingName?.trim()) {
    return input.buildingName.trim();
  }
  if (input.spaceName?.trim()) {
    return input.spaceName.trim();
  }
  return '—';
}

function withTypePrefix(raw: string, alreadyPrefixed: RegExp, prefix: string): string {
  const trimmed = raw.trim();
  if (!trimmed) {
    return prefix;
  }
  if (alreadyPrefixed.test(trimmed)) {
    return trimmed;
  }
  return `${prefix} ${trimmed}`;
}
