import {
  Alert,
  Box,
  Button,
  Stack,
  Typography,
  useTheme,
} from '@mui/material';
import { Building2, MailPlus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { AppLayout } from '@/layouts/AppLayout';
import { useLogout } from '@/modules/auth/hooks/useLogout';
import { IconBadge } from '@/modules/dashboard/components/IconBadge';
import { DASHBOARD_UX, dashSurfaces } from '@/modules/dashboard/theme/dashboardUx';
import { invitationApi } from '@/modules/onboarding/api/invitationApi';
import { useAcceptInvitationFlow } from '@/modules/onboarding/hooks/useAcceptInvitationFlow';
import { getErrorMessage } from '@/shared/api/errors';
import { ContentCard } from '@/shared/components/ContentCard';
import { EmptyState } from '@/shared/components/EmptyState';
import { LoadingState } from '@/shared/components/LoadingState';
import { PageContainer } from '@/shared/components/PageContainer';
import { PageHeader } from '@/shared/components/PageHeader';
import { StatusChip } from '@/shared/components/StatusChip';
import { colors } from '@/shared/theme/colors';
import { dashContainedButtonSx, dashOutlinedButtonSx } from '@/shared/theme/dashButtonSx';
import { ROUTES } from '@/routes/paths';
import { useAuthSession } from '@/shared/hooks/useAuthSession';
import { useSpaceStore } from '@/store/spaceStore';

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

/**
 * Accept invitations — accept-only (no reject for invitees).
 * Reject/cancel remains sender-side via Members module.
 */
export function AcceptInvitationsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const logout = useLogout();
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);
  const { user } = useAuthSession();
  const mySpaces = useSpaceStore((state) => state.mySpaces);
  const { acceptInvitation, isSubmitting, error, clearError } = useAcceptInvitationFlow();
  const [acceptingId, setAcceptingId] = useState<string | null>(null);

  const invitationsQuery = useQuery({
    queryKey: ['my-invitations'],
    queryFn: () => invitationApi.getMyInvitations(),
  });

  useEffect(() => {
    document.title = `${t('onboarding.join.title')} · ${t('common.appName')}`;
  }, [t]);

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

  return (
    <AppLayout
      headerTitle={t('navigation.acceptInvitations')}
      headerSubtitle={user?.fullName?.trim() || user?.mobileNumber || ''}
      headerActions={
        <Stack direction="row" spacing={1}>
          {mySpaces.length > 0 ? (
            <Button
              variant="outlined"
              onClick={() => navigate(ROUTES.mySpaces)}
              sx={dashOutlinedButtonSx}
            >
              {t('navigation.mySpaces')}
            </Button>
          ) : (
            <Button
              variant="outlined"
              onClick={() => navigate(ROUTES.onboarding)}
              sx={dashOutlinedButtonSx}
            >
              {t('onboarding.join.notNow')}
            </Button>
          )}
          <Button variant="outlined" onClick={() => void logout()} sx={dashOutlinedButtonSx}>
            {t('common.logout')}
          </Button>
        </Stack>
      }
      contentDense
      contentMaxWidth={800}
    >
      <PageContainer gap={0}>
        <Stack spacing={`${DASHBOARD_UX.sectionGap}px`} sx={{ width: '100%' }}>
          <PageHeader
            title={t('onboarding.join.pendingHeading')}
            description={t('onboarding.join.pendingSubheading')}
            actions={
              <Button
                variant="outlined"
                onClick={() => void invitationsQuery.refetch()}
                disabled={loading}
                sx={dashOutlinedButtonSx}
              >
                {t('common.refresh')}
              </Button>
            }
          />

          {error ? (
            <Alert severity="error" onClose={clearError}>
              {error.startsWith('membership.') || error.startsWith('common.')
                ? t(error)
                : getErrorMessage(error)}
            </Alert>
          ) : null}

          {loading ? (
            <LoadingState label={t('common.loading')} />
          ) : invitations.length === 0 ? (
            <ContentCard>
              <EmptyState
                icon={<MailPlus size={28} />}
                title={t('onboarding.join.emptyTitle')}
                description={t('onboarding.join.emptyDescription')}
                action={
                  <Button
                    variant="contained"
                    onClick={() => navigate(ROUTES.joinSpace)}
                    sx={dashContainedButtonSx}
                  >
                    {t('navigation.joinSpace')}
                  </Button>
                }
              />
            </ContentCard>
          ) : (
            <Stack spacing={`${DASHBOARD_UX.cardGap}px`}>
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
                          {t('spaces.details.createdAt')}: {formatDate(invite.createdAt)}
                          {' · '}
                          {t('spaces.details.expiresAt', {
                            defaultValue: 'Expires {{date}}',
                            date: formatDate(invite.expiresAt),
                          })}
                        </Typography>
                        <Typography sx={{ ...DASHBOARD_UX.body, color: s.textMuted }}>
                          {t('spaces.details.owner')}: {invite.invitedBy}
                        </Typography>
                      </Box>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
                      <StatusChip label={t(`spaces.roles.${invite.role}`)} tone="info" />
                      <Button
                        variant="contained"
                        disabled={isSubmitting}
                        onClick={() => void handleAccept(invite.invitationId)}
                        aria-busy={acceptingId === invite.invitationId}
                        sx={dashContainedButtonSx}
                      >
                        {acceptingId === invite.invitationId
                          ? t('common.pleaseWait')
                          : t('onboarding.join.accept')}
                      </Button>
                    </Box>
                  </Box>
                </ContentCard>
              ))}
            </Stack>
          )}
        </Stack>
      </PageContainer>
    </AppLayout>
  );
}
