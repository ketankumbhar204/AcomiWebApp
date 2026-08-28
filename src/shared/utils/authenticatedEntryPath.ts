import { ROUTES } from '@/routes/paths';
import type { UserResponse } from '@/shared/types/auth';
import { isPlatformAdmin } from '@/store/adminStore';

/** Where to send an authenticated user after login or when leaving guest routes. */
export function authenticatedEntryPath(
  user: UserResponse | null | undefined,
  adminMode: boolean,
): string {
  if (isPlatformAdmin(user?.systemRole) && adminMode) {
    return ROUTES.adminDashboard;
  }
  return ROUTES.root;
}
