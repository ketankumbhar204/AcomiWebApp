import type { ReactNode } from 'react';
import { Box, Button, CircularProgress, Stack } from '@mui/material';
import { Check, Send } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { colors } from '@/shared/theme/colors';
import { dashContainedButtonSx, dashOutlinedButtonSx } from '@/shared/theme/dashButtonSx';

type OwnerPaymentRowActionsProps = {
  showReceived: boolean;
  showReminder: boolean;
  receivedLoading?: boolean;
  reminderLoading?: boolean;
  disabled?: boolean;
  onReceived: () => void;
  onReminder: () => void;
};

export function OwnerPaymentRowActions({
  showReceived,
  showReminder,
  receivedLoading = false,
  reminderLoading = false,
  disabled = false,
  onReceived,
  onReminder,
}: OwnerPaymentRowActionsProps) {
  const { t } = useTranslation();
  if (!showReceived && !showReminder) {
    return null;
  }

  return (
    <Stack
      direction="row"
      spacing={1}
      onClick={(event) => event.stopPropagation()}
      onKeyDown={(event) => event.stopPropagation()}
      sx={{ flexWrap: 'wrap', justifyContent: 'flex-end' }}
    >
      {showReceived ? (
        <Button
          size="small"
          variant="contained"
          disabled={disabled || reminderLoading || receivedLoading}
          onClick={(event) => {
            event.stopPropagation();
            onReceived();
          }}
          startIcon={
            receivedLoading ? <CircularProgress size={14} color="inherit" /> : <Check size={14} />
          }
          sx={{ ...dashContainedButtonSx, minHeight: 36, px: 1.25, bgcolor: colors.primaryDark }}
        >
          {t('paymentCollection.received.action')}
        </Button>
      ) : null}
      {showReminder ? (
        <Button
          size="small"
          variant="outlined"
          disabled={disabled || receivedLoading || reminderLoading}
          onClick={(event) => {
            event.stopPropagation();
            onReminder();
          }}
          startIcon={
            reminderLoading ? <CircularProgress size={14} color="inherit" /> : <Send size={14} />
          }
          sx={{ ...dashOutlinedButtonSx, minHeight: 36, px: 1.25 }}
        >
          {t('paymentCollection.reminder.send')}
        </Button>
      ) : null}
    </Stack>
  );
}

export function OwnerPaymentRowActionsWrap({ children }: { children: ReactNode }) {
  return <Box sx={{ minWidth: 220 }}>{children}</Box>;
}
