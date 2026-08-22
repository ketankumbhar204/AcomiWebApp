import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ApiError } from '@/shared/api/errors';
import { useAuthStore } from '@/store/authStore';
import { useRegistrationDraftStore } from '@/store/registrationDraftStore';
import { authApi } from '../api/authApi';
import { mapRegistrationTokenError } from '../utils/otpAuthErrors';

type UseLoginResult = {
  login: (mobileNumber: string, password: string) => Promise<boolean>;
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
};

export function useLogin(): UseLoginResult {
  const { t } = useTranslation();
  const setSession = useAuthStore((state) => state.setSession);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = useCallback(
    async (mobileNumber: string, password: string): Promise<boolean> => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await authApi.login({ mobileNumber, password });
        setSession(result.user, result.accessToken);
        return true;
      } catch (err) {
        setError(mapPasswordAuthError(err, t, 'login'));
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [setSession, t],
  );

  return { login, isLoading, error, clearError: () => setError(null) };
}

type UseRegisterResult = {
  register: (payload: {
    fullName: string;
    mobileNumber: string;
    password: string;
    confirmPassword: string;
    verificationToken?: string;
  }) => Promise<boolean>;
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
};

export function useRegister(): UseRegisterResult {
  const { t } = useTranslation();
  const setSession = useAuthStore((state) => state.setSession);
  const clearDraft = useRegistrationDraftStore((state) => state.clear);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const register = useCallback(
    async (payload: {
      fullName: string;
      mobileNumber: string;
      password: string;
      confirmPassword: string;
      verificationToken?: string;
    }): Promise<boolean> => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await authApi.register(payload);
        clearDraft();
        setSession(result.user, result.accessToken);
        return true;
      } catch (err) {
        setError(mapPasswordAuthError(err, t, 'register'));
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [clearDraft, setSession, t],
  );

  return { register, isLoading, error, clearError: () => setError(null) };
}

function mapPasswordAuthError(
  err: unknown,
  t: (key: string) => string,
  mode: 'login' | 'register',
): string {
  if (err instanceof ApiError) {
    if (err.isNetworkError) {
      return t('common.errors.network');
    }
    if (mode === 'login' && err.status === 401) {
      return t('common.errors.invalidCredentials');
    }
    if (mode === 'register') {
      if (err.status >= 500) {
        return t('common.errors.server');
      }
      return mapRegistrationTokenError(err);
    }
    if (err.status >= 500) {
      return t('common.errors.server');
    }
    if (err.message.toLowerCase().includes('inactive')) {
      return t('common.errors.accountDisabled');
    }
    return err.message || t('common.errors.generic');
  }
  return t('common.errors.generic');
}
