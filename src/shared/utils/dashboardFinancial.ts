export function currentMonthKey(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
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
    return currencyCode === 'INR' ? `₹${amount}` : `${amount} ${currencyCode}`;
  }
}
