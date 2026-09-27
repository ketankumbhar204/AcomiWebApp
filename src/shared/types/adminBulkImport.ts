/** Field keys must match backend `PropertyBulkImportField` enum names. */
export const PROPERTY_BULK_IMPORT_FIELDS = [
  'PROPERTY_TYPE',
  'PROPERTY_NAME',
  'OWNER_NAME',
  'MOBILE_NUMBER',
  'ALTERNATE_MOBILE_NUMBER',
  'CONTACT_3',
  'ADDRESS_LINE',
  'CITY',
  'STATE',
  'PINCODE',
  'MAP_URL',
  'STARTING_PRICE',
  'GENDER',
  'SHARING',
  'AMENITIES',
  'FOOD_INCLUDED',
  'LATITUDE',
  'LONGITUDE',
  'TEST_LEAD',
] as const;

export type PropertyBulkImportFieldKey = (typeof PROPERTY_BULK_IMPORT_FIELDS)[number];

export function normalizeBulkImportHeader(header: string): string {
  return header
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ');
}

const MAP_URL_HEADER_ALIASES = new Set([
  'google maps link',
  'google map link',
  'google maps url',
  'google maps',
  'maps link',
  'map url',
  'map link',
  'maps url',
  'gmap',
  'gmaps',
]);

export function isExactExcelHeaderMatch(
  header: string,
  field: PropertyBulkImportFieldKey,
  fieldLabel: string,
): boolean {
  const normalized = normalizeBulkImportHeader(header);
  if (normalized === normalizeBulkImportHeader(fieldLabel)) {
    return true;
  }
  return field === 'MAP_URL' && MAP_URL_HEADER_ALIASES.has(normalized);
}

/** Fills unmapped fields when an Excel header matches the Acomi field label or MAP_URL aliases. */
export function applyExcelHeaderFallbacks(
  mapping: PropertyBulkImportMapping,
  headers: string[],
  fieldLabel: (field: PropertyBulkImportFieldKey) => string,
): PropertyBulkImportMapping {
  const next: PropertyBulkImportMapping = { ...mapping };
  const used = new Set(
    Object.values(next)
      .filter((header): header is string => Boolean(header))
      .map(normalizeBulkImportHeader),
  );

  for (const field of PROPERTY_BULK_IMPORT_FIELDS) {
    if (next[field]) continue;
    const match = headers.find((header) => {
      const normalized = normalizeBulkImportHeader(header);
      return !used.has(normalized) && isExactExcelHeaderMatch(header, field, fieldLabel(field));
    });
    if (match) {
      next[field] = match;
      used.add(normalizeBulkImportHeader(match));
    }
  }
  return next;
}

/** fieldKey → Excel header, or null when unmapped. */
export type PropertyBulkImportMapping = Record<PropertyBulkImportFieldKey, string | null>;

/** Excel row number → field key → replacement value used only for parse/import. */
export type PropertyBulkImportFieldOverrides = Record<
  string,
  Partial<Record<PropertyBulkImportFieldKey, string>>
>;

function normalizeFieldKey(value: string): string {
  return value.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
}

export function previewErrorAppliesToField(
  errorField: string | undefined,
  field: PropertyBulkImportFieldKey,
): boolean {
  if (!errorField) return false;
  return errorField === field || normalizeFieldKey(errorField) === normalizeFieldKey(field);
}

function overrideClearsError(
  errorField: string | undefined,
  rowOverrides: Partial<Record<PropertyBulkImportFieldKey, string>>,
): boolean {
  if (!errorField) return false;
  for (const [field, value] of Object.entries(rowOverrides)) {
    if (!value) continue;
    if (field === errorField || normalizeFieldKey(field) === normalizeFieldKey(errorField)) {
      return true;
    }
  }
  return false;
}

export function remainingPreviewErrors(
  row: PropertyBulkImportPreviewRow,
  overrides: PropertyBulkImportFieldOverrides,
): PropertyBulkImportFieldError[] {
  const rowOverrides = overrides[String(row.rowNumber)] ?? {};
  return (row.errors ?? []).filter((error) => !overrideClearsError(error.field, rowOverrides));
}

export function effectivePreviewStatus(
  row: PropertyBulkImportPreviewRow,
  overrides: PropertyBulkImportFieldOverrides,
): string {
  if (row.status === 'INVALID' && remainingPreviewErrors(row, overrides).length === 0) {
    return 'VALID';
  }
  return row.status;
}

export type PropertyBulkImportPreviewStatus = 'VALID' | 'INVALID' | 'BLANK' | 'DUPLICATE';

export type PropertyBulkImportResultStatus =
  | 'CONVERTED'
  | 'IMPORTED'
  | 'FAILED'
  | 'BLANK'
  | 'INVALID'
  | 'SKIPPED';

export interface PropertyBulkImportFieldError {
  field: string;
  message: string;
}

export interface PropertyBulkImportDuplicateMatch {
  confidence: 'HIGH' | 'MEDIUM' | string;
  source: 'IN_FILE' | 'EXISTING_PROPERTY' | 'EXISTING_MESS' | 'EXISTING_SPACE' | string;
  matchedRowNumber?: number | null;
  matchedReference?: string | null;
  matchedSpaceId?: string | null;
  matchedName?: string | null;
  reason?: string | null;
}

export interface PropertyBulkImportAnalyzeResponse {
  headers: string[];
  suggestedMapping: Partial<Record<PropertyBulkImportFieldKey, string | null>>;
  dataRowCount: number;
  sampleRows: Array<Record<string, string>>;
}

export interface PropertyBulkImportPreviewRow {
  rowNumber: number;
  status: PropertyBulkImportPreviewStatus | string;
  values: Record<string, string>;
  errors: PropertyBulkImportFieldError[];
  duplicateMatch?: PropertyBulkImportDuplicateMatch | null;
}

export interface PropertyBulkImportPreviewResponse {
  totalRows: number;
  valid: number;
  invalid: number;
  blank: number;
  duplicate?: number;
  rows: PropertyBulkImportPreviewRow[];
}

export interface PropertyBulkImportResultRow {
  rowNumber: number;
  status: PropertyBulkImportResultStatus | string;
  /** PROPERTY | MESS when classified. */
  targetKind?: string | null;
  reference?: string | null;
  spaceId?: string | null;
  spaceName?: string | null;
  converted?: boolean | null;
  conversionError?: string | null;
  errors: PropertyBulkImportFieldError[];
  duplicateMatch?: PropertyBulkImportDuplicateMatch | null;
}

export interface PropertyBulkImportResultResponse {
  totalRows: number;
  imported: number;
  converted?: number;
  importedOnly?: number;
  failed: number;
  blankSkipped: number;
  duplicateSkipped?: number;
  rows: PropertyBulkImportResultRow[];
}
