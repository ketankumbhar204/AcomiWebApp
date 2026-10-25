import type {
  PropertyBulkImportFieldKey,
  PropertyBulkImportFieldOverrides,
} from '@/shared/types/adminBulkImport';

/** Markers the importer already treats as empty. Display-only; not a new parse rule. */
const BLANK_MARKERS = new Set([
  '-',
  '--',
  '---',
  '—',
  '–',
  '.',
  '_',
  'n/a',
  'na',
  'n.a.',
  'n.a',
  'none',
  'null',
  'nil',
  'blank',
  'empty',
  '?',
]);

export function isImporterBlankMarker(value: string | null | undefined): boolean {
  if (value == null) return true;
  const key = value.trim().toLowerCase();
  return key.length === 0 || BLANK_MARKERS.has(key);
}

/**
 * Value shown inside the preview control.
 * An override, including a cleared empty string, wins.
 * Dropdowns show the existing normalized label when the admin has not edited the cell.
 * Text controls show the Excel value, including a dash the preview already kept.
 */
export function previewCellInputValue(
  raw: string | null | undefined,
  normalized: string | null | undefined,
  override: string | undefined,
  control: 'text' | 'select',
): string {
  if (override !== undefined) return override;
  const original = raw == null ? '' : String(raw);
  if (control === 'select') {
    const canonical = normalized?.trim() ?? '';
    if (canonical) return canonical;
    if (isImporterBlankMarker(original)) return '';
    return original.trim();
  }
  return original;
}

export function selectOptionsWithCurrent(
  options: Array<{ value: string; label: string }>,
  current: string,
): Array<{ value: string; label: string }> {
  const trimmed = current.trim();
  if (!trimmed || options.some((option) => option.value === trimmed)) return options;
  return [{ value: trimmed, label: trimmed }, ...options];
}

/** Keeps an empty string so a cleared cell stays cleared. Null removes the override. */
export function mergeFieldOverride(
  overrides: PropertyBulkImportFieldOverrides,
  rowNumber: number,
  field: PropertyBulkImportFieldKey,
  value: string | null,
): PropertyBulkImportFieldOverrides {
  const key = String(rowNumber);
  const nextRow = { ...(overrides[key] ?? {}) };
  if (value == null) delete nextRow[field];
  else nextRow[field] = value;
  const next = { ...overrides };
  if (Object.keys(nextRow).length === 0) delete next[key];
  else next[key] = nextRow;
  return next;
}
