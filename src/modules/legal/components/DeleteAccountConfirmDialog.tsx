import {
  Button,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Typography,
  useTheme,
} from '@mui/material';
import { TriangleAlert } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { AuthErrorBanner } from '@/modules/auth/components/AuthErrorBanner';
import { DASHBOARD_UX, dashSurfaces } from '@/modules/dashboard/theme/dashboardUx';
import { dashContainedButtonSx, dashOutlinedButtonSx } from '@/shared/theme/dashButtonSx';

type DeleteAccountConfirmDialogProps = {
  open: boolean;
  confirmed: boolean;
  deleting: boolean;
  canDelete: boolean;
  error: string | null;
  onConfirmedChange: (confirmed: boolean) => void;
  onCancel: () => void;
  onDelete: () => void;
};

export function DeleteAccountConfirmDialog({
  open,
  confirmed,
  deleting,
  canDelete,
  error,
  onConfirmedChange,
  onCancel,
  onDelete,
}: DeleteAccountConfirmDialogProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);

  return (
    <Dialog
      open={open}
      onClose={deleting ? undefined : onCancel}
      maxWidth="sm"
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
      <DialogTitle sx={{ ...DASHBOARD_UX.cardTitle, color: s.textPrimary, pb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
        <TriangleAlert size={18} color={theme.palette.error.main} />
        {t('legal.deleteAccount.heading')}
      </DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        {error ? <AuthErrorBanner message={error} /> : null}
        <Typography sx={{ ...DASHBOARD_UX.body, color: theme.palette.error.main, fontWeight: 600 }}>
          {t('legal.deleteAccount.permanentWarning')}
        </Typography>
        <Typography sx={{ ...DASHBOARD_UX.body, color: s.textSecondary }}>
          {t('legal.deleteAccount.whatIsDeleted')}
        </Typography>
        <Typography sx={{ ...DASHBOARD_UX.body, color: s.textSecondary }}>
          {t('legal.deleteAccount.whatIsRetained')}
        </Typography>
        <FormControlLabel
          control={
            <Checkbox
              checked={confirmed}
              onChange={(event) => onConfirmedChange(event.target.checked)}
              disabled={deleting}
            />
          }
          label={t('legal.deleteAccount.confirmLabel')}
        />
      </DialogContent>
      <DialogActions sx={{ px: 2.5, pb: 2, gap: 1 }}>
        <Button onClick={onCancel} disabled={deleting} sx={dashOutlinedButtonSx}>
          {t('common.cancel')}
        </Button>
        <Button
          variant="contained"
          color="error"
          onClick={onDelete}
          disabled={!canDelete}
          startIcon={deleting ? <CircularProgress size={16} color="inherit" /> : undefined}
          sx={dashContainedButtonSx}
        >
          {deleting ? t('common.pleaseWait') : t('legal.deleteAccount.submit')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
