import { useCallback, useState } from 'react';
import { authApi } from '../api/authApi';
import { useRegistrationDraftStore } from '@/store/registrationDraftStore';
import type { OtpPurpose, VerifyOtpResponse } from '@/shared/types/auth';
import { mapOtpVerifyError } from '../utils/otpAuthErrors';

type UseVerifyOtpResult = {
  verifyOtp: (
    mobileNumber: string,
    otp: string,
    purpose?: OtpPurpose,
  ) => Promise<VerifyOtpResponse | null>;
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
};

export function useVerifyOtp(): UseVerifyOtpResult {
  const setVerified = useRegistrationDraftStore((state) => state.setVerified);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const verifyOtp = useCallback(
    async (
      mobileNumber: string,
      otp: string,
      purpose: OtpPurpose = 'REGISTER',
    ): Promise<VerifyOtpResponse | null> => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await authApi.verifyOtp({
          mobileNumber,
          otp,
          purpose,
        });
        setVerified(result.verificationToken, result.expiresIn);
        return result;
      } catch (err) {
        setError(mapOtpVerifyError(err));
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [setVerified],
  );

  return { verifyOtp, isLoading, error, clearError: () => setError(null) };
}
