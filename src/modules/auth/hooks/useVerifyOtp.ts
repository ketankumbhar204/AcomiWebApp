import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ApiError } from '@/shared/api/errors';
import { useAuthStore } from '@/store/authStore';
import { authApi } from '../api/authApi';

type UseVerifyOtpResult = {
  verifyOtp: (mobileNumber: string, otp: string) => Promise<boolean>;
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
};

export function useVerifyOtp(): UseVerifyOtpResult {
  const { t } = useTranslation();
  const setSession = useAuthStore((state) => state.setSession);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const verifyOtp = useCallback(
    async (mobileNumber: string, otp: string): Promise<boolean> => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await authApi.verifyOtp({ mobileNumber, otp });
        setSession(result.user, result.accessToken);
        return true;
      } catch (err) {
        let message = t('common.errors.generic');
        if (err instanceof ApiError) {
          if (err.status === 400) {
            message = err.message.toLowerCase().includes('inactive')
              ? t('common.errors.accountDisabled')
              : t('common.errors.incorrectOtp');
          } else if (err.isNetworkError) {
            message = t('common.errors.network');
          } else if (err.status >= 500) {
            message = t('common.errors.server');
          } else {
            message = err.message;
          }
        }
        setError(message);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [setSession, t],
  );

  return { verifyOtp, isLoading, error, clearError: () => setError(null) };
}
