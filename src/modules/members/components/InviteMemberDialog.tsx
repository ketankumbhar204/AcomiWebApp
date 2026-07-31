import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
  useTheme,
} from '@mui/material';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSnackbar } from 'notistack';
import { DASHBOARD_UX, dashSurfaces } from '@/modules/dashboard/theme/dashboardUx';
import type { MembershipRole, SpaceType } from '@/shared/types/space';
import { normalizeIndianMobileDigits, isValidIndianMobile } from '@/shared/utils/indianMobile';
import { useAuthSession } from '@/shared/hooks/useAuthSession';
import { dashContainedButtonSx, dashOutlinedButtonSx } from '@/shared/theme/dashButtonSx';
import { useMemberMutations } from '../hooks/useMembers';
import {
  assignableRolesForSpaceType,
  defaultRoleForSpaceType,
  isRoleAssignableInSpace,
} from '../utils/memberRoles';

type InviteMemberDialogProps = {
  open: boolean;
  spaceId: string;
  spaceType?: SpaceType;
  initialMobile?: string;
  initialRole?: MembershipRole;
  memberName?: string;
  onClose: () => void;
};

function InviteMemberForm({
  spaceId,
  spaceType,
  initialMobile = '',
  initialRole,
  memberName,
  onClose,
}: Omit<InviteMemberDialogProps, 'open'>) {
  const { t } = useTranslation();
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);
  const { enqueueSnackbar } = useSnackbar();
  const { user } = useAuthSession();
  const { createInvitation } = useMemberMutations(spaceId);
  const roles = assignableRolesForSpaceType(spaceType);

  const [mobileNumber, setMobileNumber] = useState(initialMobile);
  const [role, setRole] = useState<MembershipRole>(
    initialRole ?? defaultRoleForSpaceType(spaceType),
  );
  const [error, setError] = useState<string | null>(null);

  const handleSend = async () => {
    const digits = normalizeIndianMobileDigits(mobileNumber);
    if (!digits) {
      setError(t('membership.invite.mobileRequired'));
      return;
    }
    if (!isValidIndianMobile(digits)) {
      setError(t('membership.invite.mobileInvalid'));
      return;
    }
    if (!isRoleAssignableInSpace(role, spaceType)) {
      setError(t('membership.invite.roleNotAllowed'));
      return;
    }
    if (!user?.id) {
      setError(t('common.errors.authRequired'));
      return;
    }

    try {
      await createInvitation.mutateAsync({
        spaceId,
        invitedByUserId: user.id,
        mobileNumber: digits,
        role,
      });
      enqueueSnackbar(t('membership.invite.successToast'), { variant: 'success' });
      onClose();
    } catch (err) {
      enqueueSnackbar(err instanceof Error ? err.message : t('common.errors.generic'), {
        variant: 'error',
      });
    }
  };

  return (
    <>
      <DialogTitle sx={{ ...DASHBOARD_UX.sectionHeading, color: s.textPrimary }}>
        {memberName
          ? t('membership.invite.prefillHeading', { name: memberName })
          : t('membership.invite.heading')}
      </DialogTitle>
      <DialogContent>
        <Typography sx={{ ...DASHBOARD_UX.body, color: s.textSecondary, mb: 2 }}>
          {t('membership.invite.subheading')}
        </Typography>
        <Stack spacing={`${DASHBOARD_UX.cardGap}px`} sx={{ pt: 0.5 }}>
          <TextField
            label={t('membership.invite.mobileLabel')}
            value={mobileNumber}
            onChange={(e) => {
              setMobileNumber(normalizeIndianMobileDigits(e.target.value));
              setError(null);
            }}
            error={Boolean(error)}
            helperText={error}
            placeholder="e.g. 9876543210"
            fullWidth
            required
            slotProps={{ htmlInput: { inputMode: 'numeric', maxLength: 10 } }}
          />
          <FormControl fullWidth>
            <InputLabel id="invite-role-label">{t('membership.roles.label')}</InputLabel>
            <Select
              labelId="invite-role-label"
              label={t('membership.roles.label')}
              value={role}
              onChange={(e) => setRole(e.target.value as MembershipRole)}
            >
              {roles.map((option) => (
                <MenuItem key={option} value={option}>
                  {t(`membership.roles.${option.toLowerCase()}.label`, { defaultValue: option })}
                </MenuItem>
              ))}
            </Select>
            <FormHelperText>{t('membership.invite.roleRequired')}</FormHelperText>
          </FormControl>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
        <Button onClick={onClose} sx={dashOutlinedButtonSx}>
          {t('common.cancel')}
        </Button>
        <Button
          variant="contained"
          onClick={() => void handleSend()}
          disabled={createInvitation.isPending}
          sx={dashContainedButtonSx}
        >
          {t('membership.invite.send')}
        </Button>
      </DialogActions>
    </>
  );
}

export function InviteMemberDialog({
  open,
  spaceId,
  spaceType,
  initialMobile = '',
  initialRole,
  memberName,
  onClose,
}: InviteMemberDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      {open ? (
        <InviteMemberForm
          key={`${initialMobile}-${initialRole ?? 'role'}-${memberName ?? 'invite'}`}
          spaceId={spaceId}
          spaceType={spaceType}
          initialMobile={initialMobile}
          initialRole={initialRole}
          memberName={memberName}
          onClose={onClose}
        />
      ) : null}
    </Dialog>
  );
}
