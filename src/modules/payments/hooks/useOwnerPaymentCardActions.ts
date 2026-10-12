import { useCallback, useState } from 'react';
import { useSnackbar } from 'notistack';
import { useTranslation } from 'react-i18next';
import { paymentsApi } from '../api/paymentsApi';
import type { SpacePaymentResponse } from '@/shared/types/payments';
import { usePaymentMutations } from './usePayments';
import { canOwnerMarkPaymentReceived, canOwnerSendPaymentReminder } from '../utils/paymentHelpers';
import { openReminderWhatsApp } from '../utils/paymentReminderLaunch';

export function receivablePayments(payments: SpacePaymentResponse[]): SpacePaymentResponse[] {
  return payments.filter((payment) => canOwnerMarkPaymentReceived(payment.paymentStatus ?? payment.status));
}

export function reminderEligiblePayments(payments: SpacePaymentResponse[]): SpacePaymentResponse[] {
  return payments.filter((payment) => canOwnerSendPaymentReminder(payment.reminderEligible));
}

type ProcessingAction = 'received' | 'reminder';

export function useOwnerPaymentCardActions(spaceId: string | undefined, month: string) {
  const { t } = useTranslation();
  const { enqueueSnackbar } = useSnackbar();
  const mutations = usePaymentMutations(spaceId);
  const [processingKey, setProcessingKey] = useState<string | null>(null);
  const [processingAction, setProcessingAction] = useState<ProcessingAction | null>(null);
  const [confirmPayments, setConfirmPayments] = useState<SpacePaymentResponse[]>([]);

  const isProcessing = useCallback(
    (key: string, action: ProcessingAction) => processingKey === key && processingAction === action,
    [processingAction, processingKey],
  );

  const markPaymentsReceived = async (payments: SpacePaymentResponse[]) => {
    const first = payments[0];
    if (!spaceId || !first) return;
    const key = payments.length === 1 ? first.paymentId : `member:${first.memberId}`;
    setProcessingKey(key);
    setProcessingAction('received');
    try {
      for (const payment of payments) {
        await mutations.markReceived.mutateAsync(payment.paymentId);
      }
      setConfirmPayments([]);
      enqueueSnackbar(t('paymentCollection.received.success'), { variant: 'success' });
    } catch {
      enqueueSnackbar(t('paymentCollection.received.failed'), { variant: 'error' });
    } finally {
      setProcessingKey(null);
      setProcessingAction(null);
    }
  };

  const sendReminders = async (payments: SpacePaymentResponse[], key: string) => {
    if (!spaceId) return;
    if (payments.length === 0) {
      enqueueSnackbar(t('paymentCollection.reminder.noneActionable'), { variant: 'info' });
      return;
    }
    setProcessingKey(key);
    setProcessingAction('reminder');
    try {
      for (const payment of payments) {
        const result = await paymentsApi.sendPaymentReminder(spaceId, payment.paymentId);
        const launch = await openReminderWhatsApp(result);
        if (result.inAppFailureCode === 'NOTIFICATION_FAILED') {
          enqueueSnackbar(t('paymentCollection.reminder.notificationFailed'), { variant: 'error' });
        } else if (result.inAppFailureCode === 'MEMBER_NOT_ON_ACOMI') {
          enqueueSnackbar(t('paymentCollection.reminder.memberNotOnAcomi'), { variant: 'warning' });
        } else if (result.inAppRecorded && launch !== 'opened') {
          enqueueSnackbar(t('paymentCollection.reminder.inAppSaved'), { variant: 'success' });
        }
        if (launch === 'opened') {
          enqueueSnackbar(
            t(
              result.inAppRecorded
                ? 'paymentCollection.reminder.openedWhatsApp'
                : 'paymentCollection.reminder.whatsAppReady',
            ),
            { variant: 'success' },
          );
        } else if (launch === 'copied') {
          enqueueSnackbar(t('paymentCollection.reminder.copied'), { variant: 'warning' });
        } else if (launch === 'invalid') {
          enqueueSnackbar(t('paymentCollection.reminder.invalidRecipient'), { variant: 'error' });
        } else {
          enqueueSnackbar(t('paymentCollection.reminder.whatsAppFailed'), { variant: 'error' });
        }
      }
    } catch {
      enqueueSnackbar(t('paymentCollection.reminder.failed'), { variant: 'error' });
    } finally {
      setProcessingKey(null);
      setProcessingAction(null);
    }
  };

  return {
    confirmPayments,
    receivedConfirmLoading: processingAction === 'received' && confirmPayments.length > 0 && processingKey != null,
    isProcessing,
    requestReceivedForPayment: (payment: SpacePaymentResponse) => setConfirmPayments([payment]),
    requestReceivedForMember: async (memberId: string, memberName: string) => {
      if (!spaceId) return;
      setProcessingKey(`member:${memberId}`);
      setProcessingAction('received');
      try {
        const response = await paymentsApi.listPayments(spaceId, { memberId, month, sync: false });
        const targets = receivablePayments(response.payments ?? []);
        if (targets.length === 0) {
          enqueueSnackbar(t('paymentCollection.received.noneActionable', { name: memberName }), {
            variant: 'info',
          });
          return;
        }
        setConfirmPayments(targets);
      } catch {
        enqueueSnackbar(t('paymentCollection.received.failed'), { variant: 'error' });
      } finally {
        setProcessingKey(null);
        setProcessingAction(null);
      }
    },
    sendReminderForPayment: (payment: SpacePaymentResponse) => {
      void sendReminders([payment], payment.paymentId);
    },
    sendReminderForMember: async (memberId: string) => {
      if (!spaceId) return;
      setProcessingKey(`member:${memberId}`);
      setProcessingAction('reminder');
      try {
        const response = await paymentsApi.listPayments(spaceId, { memberId, month, sync: false });
        setProcessingKey(null);
        setProcessingAction(null);
        await sendReminders(reminderEligiblePayments(response.payments ?? []), `member:${memberId}`);
      } catch {
        setProcessingKey(null);
        setProcessingAction(null);
        enqueueSnackbar(t('paymentCollection.reminder.failed'), { variant: 'error' });
      }
    },
    confirmReceived: () => void markPaymentsReceived(confirmPayments),
    cancelConfirm: () => setConfirmPayments([]),
  };
}
