import { useAuthStore } from '@/store/authStore';
import type { AuthSessionState } from '@/shared/types/auth';

/** Read-only auth session view for layouts and guards. */
export function useAuthSession(): AuthSessionState {
  const accessToken = useAuthStore((state) => state.accessToken);
  const user = useAuthStore((state) => state.user);
  const userId = useAuthStore((state) => state.userId);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isBootstrapping = useAuthStore((state) => state.isBootstrapping);

  return { accessToken, user, userId, isAuthenticated, isBootstrapping };
}
