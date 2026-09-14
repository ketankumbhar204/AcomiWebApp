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

/** fieldKey → Excel header, or null when unmapped. */
export type PropertyBulkImportMapping = Record<PropertyBulkImportFieldKey, string | null>;

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
