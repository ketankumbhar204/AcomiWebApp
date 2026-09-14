import { Box, Button } from '@mui/material';
import { Lock } from 'lucide-react';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { EmptyState } from '@/shared/components/EmptyState';
import type { SpaceType } from '@/shared/types/space';
import {
  navigateHealthAction,
  type CapabilityAccess,
  type SetupNavigationTarget,
} from '@/spaceLifecycle';
import { useSpacePermissions } from '@/shared/hooks/useSpacePermissions';
import { spaceDashboardPath } from '@/routes/paths';
import { DASHBOARD_UX } from '@/modules/dashboard/theme/dashboardUx';

export type LockedCapabilityPanelProps = {
  title: string;
  description: string;
  ctaLabel?: string | null;
  unlockTarget?: SetupNavigationTarget | null;
  spaceId: string;
  spaceType?: SpaceType | null;
  showBackToDashboard?: boolean;
};

/** Progressive access locked full-page state (web parity with LockedCapabilityScreen). */
export function LockedCapabilityPanel({
  title,
  description,
  ctaLabel,
  unlockTarget,
  spaceId,
  spaceType,
  showBackToDashboard = true,
}: LockedCapabilityPanelProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const permissions = useSpacePermissions(spaceId);

  const onUnlock = useCallback(() => {
    if (!unlockTarget) return;
    navigateHealthAction(
      { kind: 'setupTarget', target: unlockTarget },
      {
        navigate,
        spaceId,
        spaceType,
        canViewAccommodation: permissions.canViewAccommodation,
        canManageMembers: permissions.canManageMembers,
      },
    );
  }, [
    navigate,
    permissions.canManageMembers,
    permissions.canViewAccommodation,
    spaceId,
    spaceType,
    unlockTarget,
  ]);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 360,
        px: 2,
        py: 4,
      }}
    >
      <EmptyState
        title={title}
        description={description}
        icon={<Lock size={DASHBOARD_UX.iconSize * 1.75} strokeWidth={1.75} />}
        action={
          <Box sx={{ mt: 0.5, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.25 }}>
            {ctaLabel && unlockTarget ? (
              <Button variant="contained" onClick={onUnlock}>
                {ctaLabel}
              </Button>
            ) : null}
            {showBackToDashboard ? (
              <Button
                variant="text"
                onClick={() => navigate(spaceDashboardPath(spaceId))}
              >
                {t('permissions.noAccess.backToDashboard', {
                  defaultValue: 'Back to dashboard',
                })}
              </Button>
            ) : null}
          </Box>
        }
      />
    </Box>
  );
}

export type LockedCapabilityFromAccessProps = {
  access: CapabilityAccess;
  featureTitle: string;
  spaceId: string;
  spaceType?: SpaceType | null;
};

export function LockedCapabilityFromAccess({
  access,
  featureTitle,
  spaceId,
  spaceType,
}: LockedCapabilityFromAccessProps) {
  const { t } = useTranslation();
  const description = access.reasonKey
    ? t(access.reasonKey)
    : t('spaceLifecycle.capabilities.genericLocked');
  const ctaLabel = access.ctaLabelKey ? t(access.ctaLabelKey) : null;

  return (
    <LockedCapabilityPanel
      title={featureTitle}
      description={description}
      ctaLabel={ctaLabel}
      unlockTarget={access.unlockTarget}
      spaceId={spaceId}
      spaceType={spaceType}
    />
  );
}
