import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
} from '@mui/material';
import { useTranslation } from 'react-i18next';

type PaymentReminderComposerProps = {
  open: boolean;
  memberName: string;
  phone: string | null;
  message: string;
  notice: string;
  submitting: boolean;
  onChangeMessage: (value: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
};

export function PaymentReminderComposer({
  open,
  memberName,
  phone,
  message,
  notice,
  submitting,
  onChangeMessage,
  onCancel,
  onConfirm,
}: PaymentReminderComposerProps) {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onClose={submitting ? undefined : onCancel} fullWidth maxWidth="xs">
      <DialogTitle sx={{ fontWeight: 700 }}>
        {t('paymentCollection.reminder.composeTitle', { defaultValue: 'Send reminder' })}
      </DialogTitle>
      <DialogContent>
        <Typography sx={{ fontWeight: 600, mb: 1.5 }}>{memberName}</Typography>
        <TextField
          label={t('spaces.findPlace.photoRequestMessage', { defaultValue: 'Message' })}
          value={message}
          onChange={(event) => onChangeMessage(event.target.value)}
          multiline
          minRows={5}
          fullWidth
          disabled={submitting}
        />
        {phone ? (
          <Typography sx={{ mt: 1.5, fontSize: 13 }} color="text.secondary">
            +{phone}
          </Typography>
        ) : (
          <Typography sx={{ mt: 1.5, fontSize: 13 }} color="text.secondary">
            {t('paymentCollection.reminder.whatsAppUnavailable', {
              defaultValue:
                'This number can’t be opened in WhatsApp. You can still save the in-app reminder.',
            })}
          </Typography>
        )}
        {notice ? (
          <Typography sx={{ mt: 1.5, fontSize: 13 }} color="text.secondary">
            {notice}
          </Typography>
        ) : null}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onCancel} disabled={submitting} sx={{ textTransform: 'none' }}>
          {t('common.cancel', { defaultValue: 'Cancel' })}
        </Button>
        <Button
          variant="contained"
          onClick={onConfirm}
          disabled={submitting || !message.trim()}
          sx={{ textTransform: 'none', fontWeight: 700 }}
        >
          {t('paymentCollection.reminder.send', { defaultValue: 'Send reminder' })}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
