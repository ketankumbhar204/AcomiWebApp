import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Typography,
  useTheme,
} from '@mui/material';
import { useSnackbar } from 'notistack';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DASHBOARD_UX, dashSurfaces } from '@/modules/dashboard/theme/dashboardUx';
import { dashContainedButtonSx, dashOutlinedButtonSx } from '@/shared/theme/dashButtonSx';
import type { MemberStatus } from '@/shared/types/member';
import { useMemberMutations } from '../hooks/useMembers';
import { MEMBER_STATUS_OPTIONS } from '../utils/memberStatus';

type MemberStatusDialogProps = {
  open: boolean;
  spaceId: string;
  memberId: string;
  currentStatus: MemberStatus;
  onClose: () => void;
};

export function MemberStatusDialog({
  open,
  spaceId,
  memberId,
  currentStatus,
  onClose,
}: MemberStatusDialogProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);
  const { enqueueSnackbar } = useSnackbar();
  const { updateMemberStatus } = useMemberMutations(spaceId);
  const [selectedStatus, setSelectedStatus] = useState<MemberStatus | null>(currentStatus);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setSelectedStatus(currentStatus);
      setError(null);
    }
  }, [open, currentStatus]);

  const handleSave = async () => {
    if (!selectedStatus) {
      setError(t('membership.status.required'));
      return;
    }

    try {
      await updateMemberStatus.mutateAsync({
        memberId,
        body: { status: selectedStatus },
      });
      enqueueSnackbar(t('membership.status.successToast'), { variant: 'success' });
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
        if (!updateMemberStatus.isPending) {
          onClose();
        }
      }}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: `${DASHBOARD_UX.radius}px`,
          border: `1px solid ${s.border}`,
          boxShadow: s.shadowHover,
        },
      }}
    >
      <DialogTitle sx={{ ...DASHBOARD_UX.cardTitle, color: s.textPrimary }}>
        {t('membership.status.change')}
      </DialogTitle>
      <DialogContent>
        <Stack spacing={1.5} sx={{ pt: 0.5 }}>
          <Typography sx={{ ...DASHBOARD_UX.caption, color: s.textSecondary }}>
            {t('membership.status.label')}
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {MEMBER_STATUS_OPTIONS.map((status) => (
              <Chip
                key={status}
                label={t(`membership.status.${status}`)}
                clickable
                color={selectedStatus === status ? 'primary' : 'default'}
                variant={selectedStatus === status ? 'filled' : 'outlined'}
                onClick={() => setSelectedStatus(status)}
              />
            ))}
          </Box>
          {error ? (
            <Typography sx={{ ...DASHBOARD_UX.caption, color: 'error.main' }}>{error}</Typography>
          ) : null}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 2.5, pb: 2, gap: 1 }}>
        <Button
          onClick={onClose}
          disabled={updateMemberStatus.isPending}
          sx={dashOutlinedButtonSx}
        >
          {t('common.cancel')}
        </Button>
        <Button
          variant="contained"
          onClick={() => void handleSave()}
          disabled={updateMemberStatus.isPending}
          sx={dashContainedButtonSx}
        >
          {t('common.save')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
