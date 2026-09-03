type Translate = (key: string, options?: Record<string, string>) => string;

/** Present bedNumber/label as "Bed A" without inventing a new identifier field. */
export function formatBedDisplayLabel(
  label: string | undefined | null,
  t: Translate,
): string {
  const trimmed = label?.trim();
  if (!trimmed) {
    return t('occupancy.section.bed', { defaultValue: 'Bed' });
  }
  if (/^(bed|lower|middle|upper|top|bottom)\b/i.test(trimmed)) {
    return trimmed;
  }
  return t('accommodation.listItem.bed', { label: trimmed });
}
