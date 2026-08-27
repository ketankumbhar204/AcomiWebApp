import { useCallback, useState } from 'react';
import { authApi } from '../api/authApi';
import { useRegistrationDraftStore } from '@/store/registrationDraftStore';
import { ApiError } from '@/shared/api/errors';
import type { OtpPurpose, SendOtpResponse } from '@/shared/types/auth';
import { normalizeIndianMobileDigits } from '@/shared/utils/indianMobile';
import { mapOtpRequestError } from '../utils/otpAuthErrors';

type UseSendOtpResult = {
  sendOtp: (mobileNumber: string, purpose?: OtpPurpose) => Promise<SendOtpResponse | null>;
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
};

export function useSendOtp(): UseSendOtpResult {
  const beginOtp = useRegistrationDraftStore((state) => state.beginOtp);
  const markResent = useRegistrationDraftStore((state) => state.markResent);
  const noteCooldown = useRegistrationDraftStore((state) => state.noteCooldown);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendOtp = useCallback(
    async (mobileNumber: string, purpose: OtpPurpose = 'REGISTER'): Promise<SendOtpResponse | null> => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await authApi.sendOtp({
          mobileNumber,
          purpose,
        });
        const current = useRegistrationDraftStore.getState();
        if (current.mobileNumber === mobileNumber && current.purpose === purpose) {
          markResent(result.expiresIn, result.resendAfter);
        } else {
          beginOtp(mobileNumber, result.expiresIn, result.resendAfter, purpose);
        }
        noteCooldown(normalizeIndianMobileDigits(mobileNumber), purpose, result.resendAfter);
        return result;
      } catch (err) {
        if (err instanceof ApiError && err.status === 429 && err.retryAfterSeconds != null) {
          noteCooldown(normalizeIndianMobileDigits(mobileNumber), purpose, err.retryAfterSeconds);
        }
        setError(mapOtpRequestError(err, purpose));
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [beginOtp, markResent, noteCooldown],
  );

  return { sendOtp, isLoading, error, clearError: () => setError(null) };
}
