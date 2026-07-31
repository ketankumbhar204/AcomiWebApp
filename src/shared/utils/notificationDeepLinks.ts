import type { NavigateFunction } from 'react-router-dom';
import type { PendingActionGroup, SpaceNotification } from '@/shared/types/dashboard';
import { extractIsoDateFromText } from '@/shared/utils/extractIsoDateFromText';
import { isOwnerOnlyNotificationType } from '@/shared/utils/ownerOnlyNotifications';
import { addDaysIso, todayIsoDate } from '@/modules/meals/utils/mealDates';
import {
  ROUTES,
  spaceComplaintsPath,
  spaceMealsPath,
  spaceMealsPlansPath,
  spaceMealsSharePath,
  spaceMembersPath,
  spaceOccupancyListPath,
  spacePaymentsPath,
} from '@/routes/paths';

type NotificationLike = Pick<
  SpaceNotification,
  'notificationType' | 'entityId' | 'actionRoute' | 'message' | 'title'
>;

function tomorrowIsoDate(): string {
  return addDaysIso(todayIsoDate(), 1);
}

/**
 * Central deep-link resolver for inbox notifications and Pending Action groups.
 * Mirrors mobile `utils/notificationDeepLinks.ts` → web routes.
 */
export function navigateFromNotificationType(
  navigate: NavigateFunction,
  spaceId: string,
  notification: NotificationLike,
  isOperator: boolean,
): void {
  if (!isOperator && isOwnerOnlyNotificationType(notification.notificationType)) {
    return;
  }

  const entityId = notification.entityId;
  const tomorrow = tomorrowIsoDate();

  switch (notification.notificationType) {
    case 'PAYMENT_UPDATE_REQUESTED':
    case 'PAYMENT_APPROVED':
    case 'PAYMENT_REJECTED':
    case 'PAYMENT_SUBMITTED':
      if (entityId) {
        navigate(spacePaymentsPath(spaceId, entityId));
      } else {
        navigate(spacePaymentsPath(spaceId));
      }
      return;
    case 'PAYMENT_NEEDS_REVIEW':
      navigate(spacePaymentsPath(spaceId, undefined, { tab: 'submitted' }));
      return;
    case 'PAYMENT_NEEDS_UPDATE':
      navigate(spacePaymentsPath(spaceId, undefined, { tab: 'changesRequested' }));
      return;
    case 'PAYMENT_OVERDUE':
      navigate(spacePaymentsPath(spaceId, undefined, { tab: 'members' }));
      return;
    case 'MENU_NOT_PLANNED':
    case 'MEAL_RESPONSES_BELOW_THRESHOLD':
    case 'MEAL_POLL_NOT_PUBLISHED':
      navigate(spaceMealsPath(spaceId, tomorrow));
      return;
    case 'MENU_DRAFT_PENDING_PUBLISH':
      navigate(spaceMealsSharePath(spaceId, tomorrow));
      return;
    case 'MEAL_POLL_PUBLISHED':
    case 'MEAL_POLL_REMINDER': {
      const menuDate = extractIsoDateFromText(
        notification.message,
        notification.title,
        notification.actionRoute,
      );
      navigate(spaceMealsPath(spaceId, menuDate ?? undefined));
      return;
    }
    case 'SUBSCRIPTION_ACTIVATION_PENDING':
      navigate(spaceMealsPlansPath(spaceId, 'requests'));
      return;
    case 'COMPLAINT_PENDING':
    case 'COMPLAINT_OVERDUE':
    case 'COMPLAINT_CREATED':
    case 'COMPLAINT_COMMENTED':
    case 'COMPLAINT_RESOLVED':
      if (entityId) {
        navigate(spaceComplaintsPath(spaceId, entityId));
      } else {
        navigate(spaceComplaintsPath(spaceId));
      }
      return;
    case 'MOVE_IN_SCHEDULED_TODAY':
    case 'RESERVATION_STARTING_TODAY':
    case 'RESERVATION_CREATED':
    case 'MOVE_IN_COMPLETED':
      navigate(spaceOccupancyListPath(spaceId, 'moveInsThisMonth'));
      return;
    case 'MOVE_OUT_SCHEDULED_TODAY':
    case 'MOVE_OUT_COMPLETED':
    case 'VACANT_RESERVED_BED':
    case 'EXPIRED_RESERVATION':
      navigate(spaceOccupancyListPath(spaceId, 'active'));
      return;
    case 'PENDING_INVITATION':
      if (isOperator) {
        navigate(spaceMembersPath(spaceId));
      } else {
        navigate(ROUTES.acceptInvitations);
      }
      return;
    case 'INVITATION_ACCEPTED':
      navigate(spaceMembersPath(spaceId));
      return;
    case 'TENANT_PROFILE_INCOMPLETE':
    case 'TENANT_PROFILE_COMPLETED':
    case 'MISSING_KYC_DOCUMENTS':
    case 'MISSING_ADDRESS_PROOF':
      navigate(ROUTES.profile);
      return;
    default:
      if (notification.actionRoute === 'PaymentDetail' && entityId) {
        navigate(spacePaymentsPath(spaceId, entityId));
      } else if (notification.actionRoute === 'ComplaintDetail' && entityId) {
        navigate(spaceComplaintsPath(spaceId, entityId));
      } else if (notification.actionRoute === 'Members') {
        navigate(spaceMembersPath(spaceId));
      } else if (notification.actionRoute === 'AcceptInvitations') {
        navigate(ROUTES.acceptInvitations);
      } else if (notification.actionRoute === 'DashboardOccupancyList') {
        navigate(spaceOccupancyListPath(spaceId, 'active'));
      } else if (notification.actionRoute === 'MenuPlanning') {
        navigate(spaceMealsPath(spaceId, tomorrow));
      } else if (notification.actionRoute === 'MenuSharePreview') {
        navigate(spaceMealsSharePath(spaceId, tomorrow));
      } else if (notification.actionRoute === 'SubscriptionActivationRequests') {
        navigate(spaceMealsPlansPath(spaceId, 'requests'));
      }
  }
}

export function navigateFromPendingActionGroup(
  navigate: NavigateFunction,
  spaceId: string,
  group: PendingActionGroup,
  isOperator: boolean,
): void {
  const sample = group.items[0];
  navigateFromNotificationType(
    navigate,
    spaceId,
    {
      notificationType: group.actionType,
      entityId: sample?.entityId,
      actionRoute: group.actionRoute,
      message: sample?.message,
      title: sample?.title ?? group.title,
    },
    isOperator,
  );
}
