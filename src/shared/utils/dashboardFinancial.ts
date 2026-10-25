export function currentMonthKey(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/** Calendar month step. YYYY-MM sorts and compares lexicographically. */
export function shiftMonthKey(month: string, delta: number): string {
  const [year, monthNum] = month.split('-').map(Number);
  if (!year || !monthNum) {
    return currentMonthKey();
  }
  return currentMonthKey(new Date(year, monthNum - 1 + delta, 1));
}

export function isFutureMonth(month: string, today = new Date()): boolean {
  return month > currentMonthKey(today);
}

export function formatMonthYear(month: string, locale?: string): string {
  const [year, monthNum] = month.split('-').map(Number);
  if (!year || !monthNum) {
    return month;
  }
  return new Date(year, monthNum - 1, 1).toLocaleDateString(locale, {
    month: 'long',
    year: 'numeric',
  });
}

export function canManagePayments(role: string | undefined): boolean {
  return role === 'OWNER' || role === 'MANAGER';
}

export function canViewOperationalDashboard(input: {
  canManageMembers: boolean;
  canManageMeals: boolean;
  canManageOccupancy: boolean;
  canViewSpaceOccupancies: boolean;
}): boolean {
  return (
    input.canManageMembers ||
    input.canManageMeals ||
    input.canManageOccupancy ||
    input.canViewSpaceOccupancies
  );
}

export function formatCurrency(
  amount: number | null | undefined,
  currencyCode = 'INR',
): string {
  if (amount == null || Number.isNaN(amount)) {
    return currencyCode === 'INR' ? '₹0' : `0 ${currencyCode}`;
  }
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: currencyCode || 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    const whole = Math.round(amount);
    return currencyCode === 'INR' ? `₹${whole}` : `${whole} ${currencyCode}`;
  }
}
