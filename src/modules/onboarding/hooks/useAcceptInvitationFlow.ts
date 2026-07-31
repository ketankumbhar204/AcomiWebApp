import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { invitationApi } from '@/modules/onboarding/api/invitationApi';
import { requiresProfileCompletion } from '@/modules/onboarding/utils/profileCompletion';
import { ApiError } from '@/shared/api/errors';
import { ROUTES, spaceDashboardPath } from '@/routes/paths';
import type { SpaceMembershipResponse } from '@/shared/types/space';
import { useAuthStore } from '@/store/authStore';
import { useSpaceStore } from '@/store/spaceStore';

export function useAcceptInvitationFlow() {
  const navigate = useNavigate();
  const userId = useAuthStore((state) => state.userId);
  const user = useAuthStore((state) => state.user);
  const refreshUser = useAuthStore((state) => state.refreshUser);
  const loadMySpaces = useSpaceStore((state) => state.loadMySpaces);
  const switchSpace = useSpaceStore((state) => state.switchSpace);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const acceptInvitation = useCallback(
    async (invitationId: string): Promise<SpaceMembershipResponse | null> => {
      if (!userId) {
        setError('common.errors.authRequired');
        return null;
      }

      setIsSubmitting(true);
      setError(null);

      try {
        const membership = await invitationApi.acceptInvitation(invitationId, { userId });
        await loadMySpaces();
        const refreshedUser = (await refreshUser()) ?? user;
        const mySpaces = useSpaceStore.getState().mySpaces;
        await switchSpace(membership.spaceId);

        if (requiresProfileCompletion(refreshedUser, mySpaces)) {
          navigate(ROUTES.completeProfile, { replace: true });
        } else {
          navigate(spaceDashboardPath(membership.spaceId), { replace: true });
        }

        return membership;
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'membership.errors.accept');
        return null;
      } finally {
        setIsSubmitting(false);
      }
    },
    [loadMySpaces, navigate, refreshUser, switchSpace, user, userId],
  );

  const clearError = useCallback(() => setError(null), []);

  return { acceptInvitation, isSubmitting, error, clearError };
}
