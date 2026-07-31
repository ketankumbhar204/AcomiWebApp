import { canViewOperationalDashboard } from './dashboardFinancial';

export function isSpaceOperator(permissions: {
  canManageMembers?: boolean;
  canManageMeals?: boolean;
  canManageOccupancy?: boolean;
  canViewSpaceOccupancies?: boolean;
}): boolean {
  return canViewOperationalDashboard({
    canManageMembers: permissions.canManageMembers === true,
    canManageMeals: permissions.canManageMeals === true,
    canManageOccupancy: permissions.canManageOccupancy === true,
    canViewSpaceOccupancies: permissions.canViewSpaceOccupancies === true,
  });
}

export function canManageNotifications(
  permissions: Parameters<typeof isSpaceOperator>[0],
): boolean {
  return isSpaceOperator(permissions);
}
