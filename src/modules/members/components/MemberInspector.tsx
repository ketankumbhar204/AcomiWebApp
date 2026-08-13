import {
  Avatar,
  Box,
  Button,
  Chip,
  Divider,
  Stack,
  Tab,
  Tabs,
  Typography,
  useTheme,
} from '@mui/material';
import { Pencil, Trash2, UserPlus } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DASHBOARD_UX, dashSurfaces } from '@/modules/dashboard/theme/dashboardUx';
import { ConfirmDialog } from '@/shared/components/ConfirmDialog';
import { EmptyState } from '@/shared/components/EmptyState';
import { ErrorState } from '@/shared/components/ErrorState';
import { LoadingState } from '@/shared/components/LoadingState';
import { SidePanel } from '@/shared/components/SidePanel';
import { StatusChip } from '@/shared/components/StatusChip';
import { dashOutlinedButtonSx } from '@/shared/theme/dashButtonSx';
import { useMemberDetails, useMemberMutations } from '../hooks/useMembers';
import { MemberProfilePanel } from './panels/MemberProfilePanel';
import { MemberSubscriptionPanel } from './panels/MemberSubscriptionPanel';
import { MemberOccupancyPanel } from './panels/MemberOccupancyPanel';
import { MemberPaymentsPanel } from './panels/MemberPaymentsPanel';
import { MemberActivityPanel } from './panels/MemberActivityPanel';
import { useSpacePermissions } from '@/shared/hooks/useSpacePermissions';
import { useSnackbar } from 'notistack';
import { colors } from '@/shared/theme/colors';
import {
  getMemberStatusLabelKey,
  memberStatusTone,
} from '../utils/memberStatus';

export type MemberInspectorTab =
  | 'profile'
  | 'subscription'
  | 'accommodation'
  | 'payments'
  | 'occupancy'
  | 'activity';

type MemberInspectorProps = {
  spaceId: string;
  memberId: string;
  onClose: () => void;
  onEdit: () => void;
  onInvite: () => void;
};

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

export function MemberInspector({
  spaceId,
  memberId,
  onClose,
  onEdit,
  onInvite,
}: MemberInspectorProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);
  const { enqueueSnackbar } = useSnackbar();
  const permissions = useSpacePermissions(spaceId);
  const { member, loading, error, reload } = useMemberDetails(spaceId, memberId);
  const { removeMember } = useMemberMutations(spaceId);
  const [tab, setTab] = useState<MemberInspectorTab>('profile');
  const [confirmRemove, setConfirmRemove] = useState(false);

  const canEdit = permissions.canManageMembers && member?.role !== 'OWNER';
  const canRemove = permissions.canRemoveMember && member?.role !== 'OWNER';
  const canInvite =
    permissions.canManageMembers &&
    member != null &&
    member.role !== 'OWNER' &&
    member.membershipId == null;

  const handleRemove = async () => {
    try {
      await removeMember.mutateAsync(memberId);
      enqueueSnackbar(t('membership.members.remove'), { variant: 'success' });
      setConfirmRemove(false);
      onClose();
    } catch (err) {
      enqueueSnackbar(err instanceof Error ? err.message : t('common.errors.generic'), {
        variant: 'error',
      });
    }
  };

  if (loading && !member) {
    return (
      <SidePanel title={t('membership.details.eyebrow')} onClose={onClose}>
        <LoadingState />
      </SidePanel>
    );
  }

  if (error || !member) {
    return (
      <SidePanel title={t('membership.details.eyebrow')} onClose={onClose}>
        <ErrorState
          title={t('common.errors.generic')}
          message={error instanceof Error ? error.message : t('common.errors.generic')}
          onRetry={() => void reload()}
        />
      </SidePanel>
    );
  }

  return (
    <>
      <SidePanel
        title={member.fullName}
        subtitle={member.mobileNumber}
        onClose={onClose}
        actions={
          <Stack direction="row" spacing={0.5}>
            {canInvite ? (
              <Button
                size="small"
                startIcon={<UserPlus size={14} />}
                onClick={onInvite}
                sx={dashOutlinedButtonSx}
              >
                {t('membership.invite.headerAction')}
              </Button>
            ) : null}
            {canEdit ? (
              <Button
                size="small"
                startIcon={<Pencil size={14} />}
                onClick={onEdit}
                sx={dashOutlinedButtonSx}
              >
                {t('membership.details.edit')}
              </Button>
            ) : null}
            {canRemove ? (
              <Button
                size="small"
                color="error"
                startIcon={<Trash2 size={14} />}
                onClick={() => setConfirmRemove(true)}
                sx={dashOutlinedButtonSx}
              >
                {t('membership.members.remove')}
              </Button>
            ) : null}
          </Stack>
        }
      >
        <Stack spacing={`${DASHBOARD_UX.cardGap}px`}>
          <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
            <Avatar
              sx={{
                bgcolor: colors.lightGreen,
                color: colors.primaryDark,
                width: 40,
                height: 40,
                ...DASHBOARD_UX.caption,
              }}
            >
              {initials(member.fullName)}
            </Avatar>
            <Box sx={{ minWidth: 0 }}>
              <Typography sx={{ ...DASHBOARD_UX.cardTitle, color: s.textPrimary }} noWrap>
                {member.fullName}
              </Typography>
              <Stack direction="row" spacing={0.75} useFlexGap sx={{ flexWrap: 'wrap', mt: 0.5 }}>
                <StatusChip label={member.role} tone="info" />
                <StatusChip
                  label={t(getMemberStatusLabelKey(member.status))}
                  tone={memberStatusTone(member.status)}
                />
                {member.linkedUser ? (
                  <Chip size="small" label={t('membership.members.onAcomi')} />
                ) : (
                  <Chip size="small" variant="outlined" label={t('membership.members.notOnAcomiYet')} />
                )}
              </Stack>
            </Box>
          </Box>

          <Tabs
            value={tab}
            onChange={(_, value: MemberInspectorTab) => setTab(value)}
            variant="scrollable"
            scrollButtons="auto"
            aria-label={t('membership.detailTabs.profile')}
            sx={{
              minHeight: DASHBOARD_UX.buttonHeight,
              '& .MuiTab-root': {
                minHeight: DASHBOARD_UX.buttonHeight,
                ...DASHBOARD_UX.button,
                textTransform: 'none',
              },
            }}
          >
            <Tab value="profile" label={t('membership.detailTabs.profile')} />
            <Tab value="subscription" label={t('membership.detailTabs.meals')} />
            <Tab value="accommodation" label={t('membership.workspace.accommodation')} />
            <Tab value="payments" label={t('membership.workspace.payments')} />
            <Tab value="occupancy" label={t('membership.workspace.occupancy')} />
            <Tab value="activity" label={t('membership.detailTabs.history')} />
          </Tabs>
          <Divider sx={{ borderColor: s.border }} />

          {tab === 'profile' ? (
            <MemberProfilePanel member={member} spaceId={spaceId} canEdit={canEdit} />
          ) : null}
          {tab === 'subscription' ? (
            <MemberSubscriptionPanel
              spaceId={spaceId}
              member={member}
              onChangeBilling={canEdit ? onEdit : undefined}
            />
          ) : null}
          {tab === 'accommodation' ? (
            <MemberOccupancyPanel spaceId={spaceId} memberId={memberId} mode="current" />
          ) : null}
          {tab === 'payments' ? (
            <MemberPaymentsPanel spaceId={spaceId} memberId={memberId} />
          ) : null}
          {tab === 'occupancy' ? (
            <MemberOccupancyPanel spaceId={spaceId} memberId={memberId} mode="history" />
          ) : null}
          {tab === 'activity' ? (
            <MemberActivityPanel spaceId={spaceId} memberId={memberId} />
          ) : null}
        </Stack>
      </SidePanel>

      <ConfirmDialog
        open={confirmRemove}
        title={t('membership.remove.title')}
        description={t('membership.remove.message')}
        confirmLabel={t('membership.remove.confirm')}
        cancelLabel={t('common.cancel')}
        destructive
        confirming={removeMember.isPending}
        onConfirm={() => void handleRemove()}
        onClose={() => setConfirmRemove(false)}
      />
    </>
  );
}

export function MemberInspectorEmpty() {
  const { t } = useTranslation();
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);
  return (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderLeft: `1px solid ${s.border}`,
        bgcolor: s.surface,
        p: `${DASHBOARD_UX.sectionPadding}px`,
      }}
    >
      <EmptyState
        title={t('membership.workspace.selectTitle')}
        description={t('membership.workspace.selectBody')}
      />
    </Box>
  );
}
