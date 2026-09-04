import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  useTheme,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { DASHBOARD_UX, dashSurfaces } from '@/modules/dashboard/theme/dashboardUx';
import { dashContainedButtonSx, dashOutlinedButtonSx } from '@/shared/theme/dashButtonSx';

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirming?: boolean;
  destructive?: boolean;
  onConfirm: () => void;
  onClose: () => void;
};

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel,
  confirming = false,
  destructive = false,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const resolvedConfirm = confirmLabel ?? t('common.confirm');
  const resolvedCancel = cancelLabel ?? t('common.cancel');
  const s = dashSurfaces(theme.palette.mode);

  return (
    <Dialog
      open={open}
      onClose={confirming ? undefined : onClose}
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
      <DialogTitle sx={{ ...DASHBOARD_UX.cardTitle, color: s.textPrimary, pb: 1 }}>
        {title}
      </DialogTitle>
      {description ? (
        <DialogContent>
          <DialogContentText sx={{ ...DASHBOARD_UX.body, color: s.textSecondary }}>
            {description}
          </DialogContentText>
        </DialogContent>
      ) : null}
      <DialogActions sx={{ px: 2.5, pb: 2, gap: 1, flexWrap: 'wrap' }}>
        <Button onClick={onClose} disabled={confirming} sx={dashOutlinedButtonSx}>
          {resolvedCancel}
        </Button>
        <Button
          variant="contained"
          color={destructive ? 'error' : 'primary'}
          onClick={onConfirm}
          disabled={confirming}
          sx={dashContainedButtonSx}
        >
          {resolvedConfirm}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
