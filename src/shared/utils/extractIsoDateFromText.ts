/**
 * Extract a calendar ISO date (YYYY-MM-DD) from notification text or actionRoute.
 * Mirrors mobile `utils/extractIsoDateFromText.ts`.
 */
export function extractIsoDateFromText(...parts: Array<string | null | undefined>): string | null {
  for (const part of parts) {
    if (!part) {
      continue;
    }
    const match = part.match(/\b(\d{4}-\d{2}-\d{2})\b/);
    if (match?.[1]) {
      return match[1];
    }
  }
  return null;
}
