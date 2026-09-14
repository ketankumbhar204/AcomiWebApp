import {
  Alert,
  Box,
  Button,
  Stack,
  Typography,
  useTheme,
} from '@mui/material';
import { Building2, MailPlus } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { IconBadge } from '@/modules/dashboard/components/IconBadge';
import { DASHBOARD_UX, dashSurfaces } from '@/modules/dashboard/theme/dashboardUx';
import { invitationApi } from '@/modules/onboarding/api/invitationApi';
import { useAcceptInvitationFlow } from '@/modules/onboarding/hooks/useAcceptInvitationFlow';
import { getErrorMessage } from '@/shared/api/errors';
import { ContentCard } from '@/shared/components/ContentCard';
import { EmptyState } from '@/shared/components/EmptyState';
import { LoadingState } from '@/shared/components/LoadingState';
import { StatusChip } from '@/shared/components/StatusChip';
import { colors } from '@/shared/theme/colors';
import { dashContainedButtonSx, dashOutlinedButtonSx } from '@/shared/theme/dashButtonSx';

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

type PendingInvitationsPanelProps = {
  /** Compact empty state for Member Home; fuller copy for My Spaces. */
  compactEmpty?: boolean;
  /**
   * When true (default), hide the whole section if there are no pending invites.
   * Owners should not see an empty “Have an invitation?” block.
   */
  hideWhenEmpty?: boolean;
};

/**
 * Shared pending-invitation list for Member Home and My Spaces.
 * Invitee accept only — DELETE cancel is owner/manager-side (no invitee reject API).
 */
export function PendingInvitationsPanel({
  compactEmpty = true,
  hideWhenEmpty = true,
}: PendingInvitationsPanelProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);
  const { acceptInvitation, isSubmitting, error, clearError } = useAcceptInvitationFlow();
  const [acceptingId, setAcceptingId] = useState<string | null>(null);

  const invitationsQuery = useQuery({
    queryKey: ['my-invitations'],
    queryFn: () => invitationApi.getMyInvitations(),
  });

  const invitations = invitationsQuery.data ?? [];
  const loading = invitationsQuery.isLoading;

  const handleAccept = async (invitationId: string) => {
    setAcceptingId(invitationId);
    try {
      await acceptInvitation(invitationId);
    } finally {
      setAcceptingId(null);
    }
  };

  if (hideWhenEmpty && !loading && invitations.length === 0) {
    return null;
  }

  return (
    <Stack spacing={1.5} sx={{ width: '100%' }}>
      <Typography
        sx={{
          fontSize: '0.72rem',
          fontWeight: 800,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: colors.teal,
        }}
      >
        {t('onboarding.memberHome.inviteSection')}
      </Typography>

      {error ? (
        <Alert severity="error" onClose={clearError}>
          {error.startsWith('membership.') || error.startsWith('common.')
            ? t(error)
            : getErrorMessage(error)}
        </Alert>
      ) : null}

      {loading ? (
        <LoadingState label={t('common.loading')} minHeight={120} />
      ) : invitations.length === 0 ? (
        <ContentCard>
          <EmptyState
            icon={<MailPlus size={compactEmpty ? 22 : 28} />}
            title={t('onboarding.memberHome.emptyTitle')}
            description={t('onboarding.memberHome.emptyDescription')}
            action={
              <Button
                variant="outlined"
                size="small"
                onClick={() => void invitationsQuery.refetch()}
                sx={dashOutlinedButtonSx}
              >
                {t('onboarding.join.refresh')}
              </Button>
            }
          />
        </ContentCard>
      ) : (
        <Stack spacing={1.25}>
          {invitations.length > 1 ? (
            <Typography sx={{ ...DASHBOARD_UX.body, color: s.textSecondary }}>
              {t('onboarding.memberHome.pendingCount', { count: invitations.length })}
            </Typography>
          ) : null}
          {invitations.map((invite) => (
            <ContentCard key={invite.invitationId}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: 2,
                  flexWrap: 'wrap',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.25, minWidth: 0, flex: 1 }}>
                  <IconBadge accent={colors.primaryDark}>
                    <Building2 />
                  </IconBadge>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography sx={{ ...DASHBOARD_UX.cardTitle, color: s.textPrimary }}>
                      {invite.spaceName}
                    </Typography>
                    <Typography sx={{ ...DASHBOARD_UX.body, color: s.textSecondary, mt: 0.25 }}>
                      {t(
                        `spaces.types.${invite.spaceType === 'CO_LIVING' ? 'coLiving' : invite.spaceType.toLowerCase()}.label`,
                        { defaultValue: invite.spaceType },
                      )}
                      {' · '}
                      {t(`spaces.roles.${invite.role}`)}
                    </Typography>
                    <Typography sx={{ ...DASHBOARD_UX.body, color: s.textMuted, mt: 0.5 }}>
                      {t('onboarding.memberHome.inviteHint')}
                    </Typography>
                    <Typography sx={{ ...DASHBOARD_UX.body, color: s.textMuted, mt: 0.25 }}>
                      {t('spaces.details.owner')}: {invite.invitedBy}
                      {' · '}
                      {t('spaces.details.expiresAt', {
                        defaultValue: 'Expires {{date}}',
                        date: formatDate(invite.expiresAt),
                      })}
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0, flexWrap: 'wrap' }}>
                  <StatusChip label={t('onboarding.memberHome.pendingBadge')} tone="warning" />
                  <Button
                    variant="contained"
                    disabled={isSubmitting}
                    onClick={() => void handleAccept(invite.invitationId)}
                    sx={{
                      ...dashContainedButtonSx,
                      bgcolor: colors.primaryDark,
                      '&:hover': { bgcolor: colors.primaryHover },
                    }}
                  >
                    {acceptingId === invite.invitationId
                      ? t('common.loading')
                      : t('onboarding.join.accept')}
                  </Button>
                </Box>
              </Box>
            </ContentCard>
          ))}
        </Stack>
      )}
    </Stack>
  );
}
