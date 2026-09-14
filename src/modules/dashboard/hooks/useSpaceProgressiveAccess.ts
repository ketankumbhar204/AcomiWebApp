import { useMemo } from 'react';
import { useSpacePermissions } from '@/shared/hooks/useSpacePermissions';
import { canManageNotifications } from '@/shared/utils/spaceOperator';
import { useSpaceLifecycle } from '@/spaceLifecycle/useSpaceLifecycle';
import { useSpaceLifecycleSignals } from '@/modules/dashboard/hooks/useSpaceLifecycleSignals';
import type {
  CapabilityAccess,
  CapabilityId,
  SpaceCapabilitiesResult,
} from '@/spaceLifecycle';
import type { SpaceType } from '@/shared/types/space';

export type UseSpaceProgressiveAccessResult = {
  loading: boolean;
  capabilities: SpaceCapabilitiesResult | null;
  getCapability: (id: CapabilityId) => CapabilityAccess | null;
  spaceType: SpaceType | null | undefined;
};

/**
 * Shared progressive-access evaluation for sidebar routes and gates.
 * Reuses lifecycle signals — safe for operators; consumers get no LOCKED modes.
 */
export function useSpaceProgressiveAccess(
  spaceId: string | null | undefined,
): UseSpaceProgressiveAccessResult {
  const permissions = useSpacePermissions(spaceId ?? undefined);
  const spaceType = permissions.space?.spaceType;
  const enabled = Boolean(spaceId) && canManageNotifications(permissions);

  const { context, loading } = useSpaceLifecycleSignals({
    spaceId: spaceId ?? null,
    spaceType,
    permissions,
    enabled,
    pendingActionCount: 0,
    hasOperationalSignal: false,
  });

  const { capabilities, getCapability } = useSpaceLifecycle({
    spaceType,
    context: enabled ? context : null,
    enabled,
  });

  return useMemo(
    () => ({
      loading: enabled && loading,
      capabilities,
      getCapability,
      spaceType,
    }),
    [capabilities, enabled, getCapability, loading, spaceType],
  );
}
