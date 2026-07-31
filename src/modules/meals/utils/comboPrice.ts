/** Price helpers — parity with mobile `utils/comboPrice.ts` (presentation + validation). */

const INR_SYMBOL = '₹';

export function hasComboPrice(price?: number | null): boolean {
  return price != null && Number.isFinite(price) && price > 0;
}

export function parsePriceInput(text: string): number | null {
  const trimmed = text.trim().replace(INR_SYMBOL, '').replace(/,/g, '');
  if (!trimmed) {
    return null;
  }
  const value = Number(trimmed);
  if (Number.isNaN(value)) {
    return null;
  }
  return value;
}

/** Returns `invalid` | `nonPositive` | null (ok / empty). */
export function validatePriceInput(text: string): 'invalid' | 'nonPositive' | null {
  const trimmed = text.trim();
  if (!trimmed) {
    return null;
  }
  const value = parsePriceInput(trimmed);
  if (value == null) {
    return 'invalid';
  }
  if (value <= 0) {
    return 'nonPositive';
  }
  return null;
}
