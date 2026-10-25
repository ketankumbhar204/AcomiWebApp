import { useCallback, useState } from 'react';
import { useSnackbar } from 'notistack';
import { useTranslation } from 'react-i18next';
import { ApiError } from '@/shared/api/errors';
import { paymentsApi } from '../api/paymentsApi';
import type { SpacePaymentResponse } from '@/shared/types/payments';
import { usePaymentMutations } from './usePayments';
import { canOwnerMarkPaymentReceived, canOwnerSendPaymentReminder } from '../utils/paymentHelpers';
import { firstWhatsAppPhone } from '@/shared/utils/photoRequest';
import { buildPaymentReminderMessage } from '../utils/paymentReminderMessage';
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
  const [reminderQueue, setReminderQueue] = useState<SpacePaymentResponse[]>([]);
  const [reminderMessage, setReminderMessage] = useState('');
  const [reminderNotice, setReminderNotice] = useState('');

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

  const beginReminders = (payments: SpacePaymentResponse[]) => {
    const first = payments[0];
    if (!first) {
      enqueueSnackbar(t('paymentCollection.reminder.noneActionable'), { variant: 'info' });
      return;
    }
    setReminderNotice('');
    setReminderMessage(buildPaymentReminderMessage(first));
    setReminderQueue(payments);
  };

  const confirmReminder = async () => {
    const payment = reminderQueue[0];
    const message = reminderMessage.trim();
    if (!spaceId || !payment || !message) return;
    setProcessingKey(payment.paymentId);
    setProcessingAction('reminder');
    setReminderNotice('');
    try {
      const result = await paymentsApi.sendPaymentReminder(spaceId, payment.paymentId);
      let launch: Awaited<ReturnType<typeof openReminderWhatsApp>> = 'invalid';
      try {
        launch = await openReminderWhatsApp(
          {
            ...result,
            internationalPhone: result.internationalPhone || firstWhatsAppPhone([payment.memberMobile]),
          },
          message,
        );
      } catch {
        launch = 'failed';
      }
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
        setReminderNotice(
          t('paymentCollection.reminder.whatsAppUnavailable', {
            defaultValue:
              'This number can’t be opened in WhatsApp. You can still save the in-app reminder.',
          }),
        );
        enqueueSnackbar(t('paymentCollection.reminder.invalidRecipient'), { variant: 'warning' });
      } else {
        enqueueSnackbar(t('paymentCollection.reminder.whatsAppFailed'), { variant: 'error' });
      }
      if (launch === 'invalid') return;
      const rest = reminderQueue.slice(1);
      setReminderQueue(rest);
      setReminderMessage(rest[0] ? buildPaymentReminderMessage(rest[0]) : '');
    } catch (err) {
      const message =
        err instanceof ApiError && err.status === 409 && err.message
          ? err.message
          : t('paymentCollection.reminder.failed');
      enqueueSnackbar(message, { variant: 'error' });
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
      beginReminders([payment]);
    },
    sendReminderForMember: async (memberId: string) => {
      if (!spaceId) return;
      setProcessingKey(`member:${memberId}`);
      setProcessingAction('reminder');
      try {
        const response = await paymentsApi.listPayments(spaceId, { memberId, month, sync: false });
        setProcessingKey(null);
        setProcessingAction(null);
        beginReminders(reminderEligiblePayments(response.payments ?? []));
      } catch {
        setProcessingKey(null);
        setProcessingAction(null);
        enqueueSnackbar(t('paymentCollection.reminder.failed'), { variant: 'error' });
      }
    },
    reminderDraft: reminderQueue[0] ?? null,
    reminderPhone: firstWhatsAppPhone([reminderQueue[0]?.memberMobile]),
    reminderMessage,
    setReminderMessage,
    reminderNotice,
    confirmReminder: () => void confirmReminder(),
    cancelReminder: () => {
      setReminderQueue([]);
      setReminderNotice('');
    },
    confirmReceived: () => void markPaymentsReceived(confirmPayments),
    cancelConfirm: () => setConfirmPayments([]),
  };
}
