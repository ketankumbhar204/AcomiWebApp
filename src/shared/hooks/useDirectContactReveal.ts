import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { enquiryApi } from '@/shared/api/enquiryApi';
import { inquiryCreditsApi } from '@/shared/api/inquiryCreditsApi';
import { ApiError } from '@/shared/api/errors';
import { directContactDecision } from '@/shared/utils/contactViewQuota';
import type { OwnerContactResponse } from '@/shared/types/enquiry';
import { useAuthStore } from '@/store/authStore';
import { markContactViewed, useContactViewed } from './useAlreadyInquired';

export type DirectRevealPhase =
  | 'idle'
  | 'checking'
  | 'revealing'
  | 'revealed'
  | 'disabled'
  | 'exhausted'
  | 'error';

const inflight = new Map<string, Promise<OwnerContactResponse | DirectRevealPhase>>();

export function useDirectContactReveal(spaceId: string | null | undefined, enabled: boolean) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const contactViewed = useContactViewed(spaceId);
  const queryClient = useQueryClient();
  const [contact, setContact] = useState<OwnerContactResponse | null>(null);
  const [phase, setPhase] = useState<DirectRevealPhase>('idle');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!enabled || !spaceId || !isAuthenticated || contactViewed || contact) return;
    let cancelled = false;
    setPhase('checking');
    const existing = inflight.get(spaceId);
    const run =
      existing ??
      (async () => {
        try {
          const quota = await inquiryCreditsApi.getQuota();
          const decision = directContactDecision(quota);
          if (decision !== 'reveal') return decision;
          const created = await enquiryApi.create(spaceId, { deliveryChannel: 'VIEW_HERE' });
          markContactViewed(queryClient, created.spaceId || spaceId, created.deliveredAt || created.requestedAt);
          return created.ownerContact ?? { available: false };
        } catch (err) {
          const code = err instanceof ApiError ? err.errorCode : undefined;
          if (code === 'VIEW_HERE_DISABLED') return 'disabled' as const;
          if (code === 'VIEW_HERE_LIMIT_REACHED') return 'exhausted' as const;
          return 'error' as const;
        }
      })();
    if (!existing) inflight.set(spaceId, run);
    void run.then((result) => {
      if (result === 'disabled' || result === 'exhausted' || result === 'error') {
        inflight.delete(spaceId);
      }
      if (cancelled) return;
      if (result && typeof result === 'object') {
        setContact(result);
        setPhase('revealed');
        return;
      }
      setPhase(result === 'disabled' || result === 'exhausted' || result === 'error' ? result : 'error');
    });
    return () => {
      cancelled = true;
    };
  }, [attempt, contact, contactViewed, enabled, isAuthenticated, queryClient, spaceId]);

  return {
    contact,
    phase,
    retry: () => setAttempt((value) => value + 1),
  };
}
