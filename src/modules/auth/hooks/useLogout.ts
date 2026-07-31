import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { useTranslation } from 'react-i18next';
import { queryClient } from '@/app/providers/queryClient';
import { ROUTES } from '@/routes/paths';
import { useAuthStore } from '@/store/authStore';
import { useSpaceStore } from '@/store/spaceStore';

export function useLogout() {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const { t } = useTranslation();
  const clearSession = useAuthStore((state) => state.clearSession);
  const clearSpaces = useSpaceStore((state) => state.clearSpaces);

  return useCallback(async () => {
    clearSession();
    clearSpaces();
    queryClient.clear();
    enqueueSnackbar(t('common.logout'), { variant: 'info' });
    navigate(ROUTES.login, { replace: true });
  }, [clearSession, clearSpaces, enqueueSnackbar, navigate, t]);
}
