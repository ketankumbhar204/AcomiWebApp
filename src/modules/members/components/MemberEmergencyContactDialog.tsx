import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
  useTheme,
} from '@mui/material';
import { useSnackbar } from 'notistack';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DASHBOARD_UX, dashSurfaces } from '@/modules/dashboard/theme/dashboardUx';
import { dashContainedButtonSx, dashOutlinedButtonSx } from '@/shared/theme/dashButtonSx';
import type { MemberDetailsResponse } from '@/shared/types/member';
import { useMemberMutations } from '../hooks/useMembers';

type MemberEmergencyContactDialogProps = {
  open: boolean;
  spaceId: string;
  member: MemberDetailsResponse;
  onClose: () => void;
};

export function MemberEmergencyContactDialog({
  open,
  spaceId,
  member,
  onClose,
}: MemberEmergencyContactDialogProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);
  const { enqueueSnackbar } = useSnackbar();
  const { updateEmergencyContact } = useMemberMutations(spaceId);

  const [name, setName] = useState(member.emergencyContactName ?? '');
  const [relation, setRelation] = useState(member.emergencyContactRelation ?? '');
  const [mobile, setMobile] = useState(member.emergencyContactMobile ?? '');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setName(member.emergencyContactName ?? '');
      setRelation(member.emergencyContactRelation ?? '');
      setMobile(member.emergencyContactMobile ?? '');
      setError(null);
    }
  }, [
    open,
    member.emergencyContactName,
    member.emergencyContactRelation,
    member.emergencyContactMobile,
  ]);

  const handleSave = async () => {
    if (!name.trim()) {
      setError(t('membership.emergency.nameRequired'));
      return;
    }
    if (!relation.trim()) {
      setError(t('membership.emergency.relationRequired'));
      return;
    }
    if (!mobile.trim()) {
      setError(t('membership.emergency.mobileRequired'));
      return;
    }

    try {
      await updateEmergencyContact.mutateAsync({
        memberId: member.memberId,
        body: {
          emergencyContactName: name.trim(),
          emergencyContactRelation: relation.trim(),
          emergencyContactMobile: mobile.trim(),
        },
      });
      enqueueSnackbar(t('membership.emergency.successToast'), { variant: 'success' });
      onClose();
    } catch (err) {
      enqueueSnackbar(err instanceof Error ? err.message : t('common.errors.generic'), {
        variant: 'error',
      });
    }
  };

  return (
    <Dialog
      open={open}
      onClose={() => {
        if (!updateEmergencyContact.isPending) {
          onClose();
        }
      }}
      maxWidth="xs"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            borderRadius: `${DASHBOARD_UX.radius}px`,
            border: `1px solid ${s.border}`,
            boxShadow: s.shadowHover,
          },
        },
      }}
    >
      <DialogTitle sx={{ ...DASHBOARD_UX.cardTitle, color: s.textPrimary }}>
        {t('membership.emergency.edit')}
      </DialogTitle>
      <DialogContent>
        <Stack spacing={1.5} sx={{ pt: 0.5 }}>
          <TextField
            size="small"
            fullWidth
            label={t('membership.emergency.name')}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('membership.emergency.namePlaceholder')}
          />
          <TextField
            size="small"
            fullWidth
            label={t('membership.emergency.relation')}
            value={relation}
            onChange={(e) => setRelation(e.target.value)}
            placeholder={t('membership.emergency.relationPlaceholder')}
          />
          <TextField
            size="small"
            fullWidth
            label={t('membership.emergency.mobile')}
            value={mobile}
            onChange={(e) => setMobile(e.target.value)}
            placeholder={t('membership.emergency.mobilePlaceholder')}
          />
          {error ? (
            <Typography sx={{ ...DASHBOARD_UX.caption, color: 'error.main' }}>{error}</Typography>
          ) : null}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 2.5, pb: 2, gap: 1 }}>
        <Button
          onClick={onClose}
          disabled={updateEmergencyContact.isPending}
          sx={dashOutlinedButtonSx}
        >
          {t('common.cancel')}
        </Button>
        <Button
          variant="contained"
          onClick={() => void handleSave()}
          disabled={updateEmergencyContact.isPending}
          sx={dashContainedButtonSx}
        >
          {t('common.save')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
