import {
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Stack,
  useTheme,
} from '@mui/material';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { DASHBOARD_UX, dashSurfaces } from '@/modules/dashboard/theme/dashboardUx';
import { dashContainedButtonSx, dashOutlinedButtonSx } from '@/shared/theme/dashButtonSx';

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description?: string;
  content?: ReactNode;
  confirmLabel?: string;
  confirmingLabel?: string;
  cancelLabel?: string;
  confirming?: boolean;
  destructive?: boolean;
  maxWidth?: 'xs' | 'sm' | 'md';
  onConfirm: () => void;
  onClose: () => void;
};

export function ConfirmDialog({
  open,
  title,
  description,
  content,
  confirmLabel,
  confirmingLabel,
  cancelLabel,
  confirming = false,
  destructive = false,
  maxWidth = 'xs',
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const resolvedConfirm = confirmLabel ?? t('common.confirm');
  const resolvedCancel = cancelLabel ?? t('common.cancel');
  const actionLabel = confirming ? (confirmingLabel ?? resolvedConfirm) : resolvedConfirm;
  const s = dashSurfaces(theme.palette.mode);

  return (
    <Dialog
      open={open}
      onClose={confirming ? undefined : onClose}
      maxWidth={maxWidth}
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
      {description || content ? (
        <DialogContent>
          {description ? (
            <DialogContentText sx={{ ...DASHBOARD_UX.body, color: s.textSecondary }}>
              {description}
            </DialogContentText>
          ) : null}
          {content}
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
          {confirming ? (
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
              <CircularProgress size={16} color="inherit" />
              <span>{actionLabel}</span>
            </Stack>
          ) : (
            resolvedConfirm
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
