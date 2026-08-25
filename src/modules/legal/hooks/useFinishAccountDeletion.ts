import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { queryClient } from '@/app/providers/queryClient';
import { ROUTES } from '@/routes/paths';
import { useAuthStore } from '@/store/authStore';
import { useRegistrationDraftStore } from '@/store/registrationDraftStore';
import { useSpaceStore } from '@/store/spaceStore';

export function useFinishAccountDeletion() {
  const navigate = useNavigate();
  const clearSession = useAuthStore((state) => state.clearSession);
  const clearSpaces = useSpaceStore((state) => state.clearSpaces);
  const clearDraft = useRegistrationDraftStore((state) => state.clear);

  return useCallback(() => {
    clearDraft();
    clearSession();
    clearSpaces();
    queryClient.clear();
    navigate(ROUTES.login, { replace: true, state: { accountDeleted: true } });
  }, [clearDraft, clearSession, clearSpaces, navigate]);
}
