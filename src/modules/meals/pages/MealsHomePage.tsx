import { useSpacePermissions } from '@/shared/hooks/useSpacePermissions';
import { useParams } from 'react-router-dom';
import { CustomerMealsHomePage } from './CustomerMealsHomePage';
import { MealsPlannerPage } from './MealsPlannerPage';

/**
 * Meals entry — mirrors mobile `MealsHomeScreen` role branching.
 * Consumers (TENANT/CUSTOMER) get activity hub; managers get planner.
 */
export function MealsHomePage() {
  const { spaceId = '' } = useParams<{ spaceId: string }>();
  const permissions = useSpacePermissions(spaceId);
  const canManage = permissions.canManageMeals === true;
  const role = permissions.membershipRole;
  const isCustomerOrTenant = role === 'TENANT' || role === 'CUSTOMER';

  if (isCustomerOrTenant && !canManage) {
    return <CustomerMealsHomePage />;
  }

  return <MealsPlannerPage />;
}
