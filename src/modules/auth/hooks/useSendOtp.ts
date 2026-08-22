import { useCallback, useState } from 'react';
import { authApi } from '../api/authApi';
import { useRegistrationDraftStore } from '@/store/registrationDraftStore';
import type { SendOtpResponse } from '@/shared/types/auth';
import { mapOtpRequestError } from '../utils/otpAuthErrors';

type UseSendOtpResult = {
  sendOtp: (mobileNumber: string) => Promise<SendOtpResponse | null>;
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
};

export function useSendOtp(): UseSendOtpResult {
  const beginOtp = useRegistrationDraftStore((state) => state.beginOtp);
  const markResent = useRegistrationDraftStore((state) => state.markResent);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendOtp = useCallback(
    async (mobileNumber: string): Promise<SendOtpResponse | null> => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await authApi.sendOtp({
          mobileNumber,
          purpose: 'REGISTER',
        });
        const currentMobile = useRegistrationDraftStore.getState().mobileNumber;
        if (currentMobile === mobileNumber) {
          markResent(result.expiresIn, result.resendAfter);
        } else {
          beginOtp(mobileNumber, result.expiresIn, result.resendAfter);
        }
        return result;
      } catch (err) {
        setError(mapOtpRequestError(err));
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [beginOtp, markResent],
  );

  return { sendOtp, isLoading, error, clearError: () => setError(null) };
}
