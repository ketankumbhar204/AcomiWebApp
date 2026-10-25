import { whatsAppChatUrl } from '../../../shared/utils/photoRequest';

export type ReminderLaunchResult = 'opened' | 'copied' | 'invalid' | 'failed';

export function reminderWhatsAppTarget(result: {
  messageText?: string | null;
  whatsAppUrl?: string | null;
  internationalPhone?: string | null;
}): { url: string | null; message: string } {
  const message = result.messageText?.trim() ?? '';
  const provided = result.whatsAppUrl?.trim() || null;
  const url =
    provided ||
    (result.internationalPhone && message
      ? whatsAppChatUrl(result.internationalPhone, message)
      : null);
  return { url, message };
}

export async function openReminderWhatsApp(
  result: {
    messageText?: string | null;
    whatsAppUrl?: string | null;
    internationalPhone?: string | null;
  },
  editedMessage?: string | null,
): Promise<ReminderLaunchResult> {
  const edited = editedMessage?.trim();
  const target = edited
    ? {
        url: result.internationalPhone ? whatsAppChatUrl(result.internationalPhone, edited) : null,
        message: edited,
      }
    : reminderWhatsAppTarget(result);
  const { url, message } = target;
  if (!url) {
    if (!message) {
      return 'invalid';
    }
    try {
      await navigator.clipboard.writeText(message);
      return 'copied';
    } catch {
      return 'invalid';
    }
  }
  const popup = window.open(url, '_blank', 'noopener,noreferrer');
  if (popup) {
    return 'opened';
  }
  if (!message) {
    return 'failed';
  }
  try {
    await navigator.clipboard.writeText(`${message}\n${url}`);
    return 'copied';
  } catch {
    return 'failed';
  }
}
