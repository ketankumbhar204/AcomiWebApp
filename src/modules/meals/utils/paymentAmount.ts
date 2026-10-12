/** Indian grouping for payment amounts, including a real zero. Null means the amount is unknown. */
export function formatPaymentAmount(
  amount: number | null | undefined,
  currencyCode = 'INR',
): string | null {
  if (amount == null || Number.isNaN(Number(amount))) {
    return null;
  }
  const value = Number(amount);
  if (value < 0) {
    return null;
  }
  const code = (currencyCode || 'INR').toUpperCase();
  const text = formatIndianGrouped(value);
  if (code === 'INR') {
    return `₹${text}`;
  }
  return `${code} ${text}`;
}

function formatIndianGrouped(value: number): string {
  const rounded = Math.round(value * 100) / 100;
  const isWhole = Math.abs(rounded - Math.round(rounded)) < 0.001;
  const raw = isWhole ? String(Math.round(rounded)) : rounded.toFixed(2);
  const [whole, fraction] = raw.split('.');
  const grouped = groupIndianDigits(whole ?? '0');
  return fraction ? `${grouped}.${fraction}` : grouped;
}

function groupIndianDigits(whole: string): string {
  if (whole.length <= 3) {
    return whole;
  }
  const last3 = whole.slice(-3);
  const rest = whole.slice(0, -3);
  return `${rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',')},${last3}`;
}
