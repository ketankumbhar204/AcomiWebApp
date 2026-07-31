import { Navigate, Outlet } from 'react-router-dom';
import { requiresProfileCompletion } from '@/modules/onboarding/utils/profileCompletion';
import { ROUTES } from '@/routes/paths';
import { useAuthStore } from '@/store/authStore';
import { useSpaceStore } from '@/store/spaceStore';

/**
 * Blocks space shell when the user has TENANT/CUSTOMER membership and an incomplete profile.
 * Same gate as mobile ProfileCompletionGateScreen.
 */
export function ProfileCompletionGate() {
  const user = useAuthStore((state) => state.user);
  const mySpaces = useSpaceStore((state) => state.mySpaces);

  if (requiresProfileCompletion(user, mySpaces)) {
    return <Navigate to={ROUTES.completeProfile} replace />;
  }

  return <Outlet />;
}
