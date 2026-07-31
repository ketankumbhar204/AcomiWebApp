import { useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { spaceApi } from '@/modules/onboarding/api/spaceApi';
import { ApiError } from '@/shared/api/errors';
import type { CreateSpaceRequest, SpaceResponse } from '@/shared/types/space';
import { useAuthStore } from '@/store/authStore';

export type CreateSpaceInput = Omit<CreateSpaceRequest, 'ownerId'>;

export function useCreateSpace() {
  const { t } = useTranslation();
  const userId = useAuthStore((state) => state.userId);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inFlightRef = useRef(false);

  const createSpace = useCallback(
    async (payload: CreateSpaceInput): Promise<SpaceResponse | null> => {
      if (!userId) {
        setError(t('common.errors.authRequired'));
        return null;
      }
      if (inFlightRef.current) {
        return null;
      }

      inFlightRef.current = true;
      setIsSubmitting(true);
      setError(null);

      try {
        return await spaceApi.createSpace({ ...payload, ownerId: userId });
      } catch (err) {
        setError(
          err instanceof ApiError ? err.message : t('common.errors.createSpace'),
        );
        return null;
      } finally {
        inFlightRef.current = false;
        setIsSubmitting(false);
      }
    },
    [t, userId],
  );

  const clearError = useCallback(() => setError(null), []);

  return { createSpace, isSubmitting, error, clearError };
}
