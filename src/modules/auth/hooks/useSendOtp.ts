import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ApiError } from '@/shared/api/errors';
import { authApi } from '../api/authApi';

type UseSendOtpResult = {
  sendOtp: (mobileNumber: string) => Promise<boolean>;
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
};

export function useSendOtp(): UseSendOtpResult {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendOtp = useCallback(
    async (mobileNumber: string): Promise<boolean> => {
      setIsLoading(true);
      setError(null);
      try {
        await authApi.sendOtp({ mobileNumber });
        return true;
      } catch (err) {
        const message =
          err instanceof ApiError ? err.message : t('common.errors.sendOtp');
        setError(message);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [t],
  );

  return { sendOtp, isLoading, error, clearError: () => setError(null) };
}
