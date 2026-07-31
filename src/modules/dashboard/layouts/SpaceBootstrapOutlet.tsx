import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { LoadingFallback } from '@/shared/components/LoadingBoundary';
import { useAuthStore } from '@/store/authStore';
import { useSpaceStore } from '@/store/spaceStore';

/** Loads `/spaces/my` after auth and keeps the selected space in sync. */
export function SpaceBootstrapOutlet() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const loadMySpaces = useSpaceStore((state) => state.loadMySpaces);
  const clearSpaces = useSpaceStore((state) => state.clearSpaces);
  const bootstrapped = useSpaceStore((state) => state.bootstrapped);

  useEffect(() => {
    if (!isAuthenticated) {
      clearSpaces();
      return;
    }
    void loadMySpaces();
  }, [clearSpaces, isAuthenticated, loadMySpaces]);

  if (!bootstrapped) {
    return <LoadingFallback />;
  }

  return <Outlet />;
}
