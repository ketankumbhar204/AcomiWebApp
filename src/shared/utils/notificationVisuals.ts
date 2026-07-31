import type { LucideIcon } from 'lucide-react';
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  CreditCard,
  Info,
  MailPlus,
  MessageSquareWarning,
  UserRound,
  UtensilsCrossed,
  Wallet,
} from 'lucide-react';
import type { NotificationCategory } from '@/shared/types/dashboard';

export function getNotificationCategoryColor(category: NotificationCategory | string): string {
  switch (category) {
    case 'SUCCESS':
      return '#059669';
    case 'WARNING':
      return '#D97706';
    case 'ACTION_REQUIRED':
      return '#B45309';
    case 'ERROR':
      return '#DC2626';
    case 'INFORMATION':
    default:
      return '#2563EB';
  }
}

export function getNotificationIcon(
  type: string,
  category: NotificationCategory | string,
): LucideIcon {
  if (type.startsWith('PAYMENT')) {
    return type === 'PAYMENT_APPROVED' ? Wallet : CreditCard;
  }
  if (type.startsWith('COMPLAINT')) {
    return MessageSquareWarning;
  }
  if (
    type.startsWith('MEAL') ||
    type.startsWith('MENU') ||
    type === 'SUBSCRIPTION_ACTIVATION_PENDING'
  ) {
    return UtensilsCrossed;
  }
  if (
    type.startsWith('MOVE_') ||
    type.startsWith('RESERVATION') ||
    type === 'VACANT_RESERVED_BED' ||
    type === 'EXPIRED_RESERVATION'
  ) {
    return CalendarClock;
  }
  if (type === 'PENDING_INVITATION' || type === 'INVITATION_ACCEPTED') {
    return MailPlus;
  }
  if (
    type === 'TENANT_PROFILE_INCOMPLETE' ||
    type === 'TENANT_PROFILE_COMPLETED' ||
    type === 'MISSING_KYC_DOCUMENTS' ||
    type === 'MISSING_ADDRESS_PROOF'
  ) {
    return UserRound;
  }

  switch (category) {
    case 'SUCCESS':
      return CheckCircle2;
    case 'WARNING':
    case 'ACTION_REQUIRED':
    case 'ERROR':
      return AlertTriangle;
    case 'INFORMATION':
    default:
      return Info;
  }
}

export type NotificationFilterId =
  | 'all'
  | 'unread'
  | 'action'
  | 'billing'
  | 'meals'
  | 'general';

export function notificationMatchesFilter(
  filter: NotificationFilterId,
  type: string,
  category: NotificationCategory | string,
  isUnread: boolean,
): boolean {
  switch (filter) {
    case 'all':
      return true;
    case 'unread':
      return isUnread;
    case 'action':
      return category === 'ACTION_REQUIRED' || category === 'ERROR';
    case 'billing':
      return type.startsWith('PAYMENT') || type === 'SUBSCRIPTION_ACTIVATION_PENDING';
    case 'meals':
      return type.startsWith('MEAL') || type.startsWith('MENU');
    case 'general':
      return (
        !type.startsWith('PAYMENT') &&
        !type.startsWith('MEAL') &&
        !type.startsWith('MENU') &&
        type !== 'SUBSCRIPTION_ACTIVATION_PENDING'
      );
    default:
      return true;
  }
}
