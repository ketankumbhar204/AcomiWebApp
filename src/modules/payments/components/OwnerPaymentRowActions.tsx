import type { ReactNode } from 'react';
import { Box, Button, CircularProgress, Stack, useMediaQuery, useTheme } from '@mui/material';
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
  const theme = useTheme();
  const stackActions = useMediaQuery(theme.breakpoints.down('md'));
  if (!showReceived && !showReminder) {
    return null;
  }

  const buttonSx = {
    minHeight: 32,
    height: 32,
    width: stackActions ? '100%' : 'auto',
    flexShrink: 0,
    whiteSpace: 'nowrap',
    px: 1.25,
    justifyContent: 'center',
  };

  return (
    <Stack
      direction={stackActions ? 'column' : 'row'}
      spacing={1}
      onClick={(event) => event.stopPropagation()}
      onKeyDown={(event) => event.stopPropagation()}
      sx={{
        width: stackActions ? 168 : 'auto',
        minWidth: stackActions ? 168 : 0,
        maxWidth: stackActions ? 168 : 'none',
        flexWrap: 'nowrap',
        alignItems: 'center',
        justifyContent: 'flex-end',
      }}
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
          sx={{ ...dashContainedButtonSx, ...buttonSx, bgcolor: colors.primaryDark }}
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
          sx={{ ...dashOutlinedButtonSx, ...buttonSx }}
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
