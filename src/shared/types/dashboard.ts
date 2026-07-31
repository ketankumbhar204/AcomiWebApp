import type { SpaceType } from './space';

export type DashboardFinancialSource = 'API' | 'MEAL_ACTIVITY' | 'OCCUPANCY' | 'HYBRID';
export type MealBillingType = 'PAY_PER_MEAL' | 'PREPAID_BALANCE';
export type PrepaidBalanceUnit = 'MEALS' | 'CURRENCY';

export type NotificationPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type NotificationCategory = 'INFORMATION' | 'SUCCESS' | 'WARNING' | 'ACTION_REQUIRED' | 'ERROR';
export type NotificationStatus = 'UNREAD' | 'READ' | 'RESOLVED' | 'DISMISSED';

export interface PrepaidBalanceSummary {
  balanceSold?: number | null;
  balanceConsumed?: number | null;
  balanceRemaining?: number | null;
  amountCollected?: number | null;
  unit?: PrepaidBalanceUnit | null;
  currencyCode?: string | null;
}

export interface DashboardFinancialSummary {
  expectedCharges: number | null;
  collected: number | null;
  underReview?: number | null;
  pending: number | null;
  currencyCode: string;
  source?: DashboardFinancialSource;
  mealBillingType?: MealBillingType;
  prepaidBalance?: PrepaidBalanceSummary | null;
  mixedMealBilling?: boolean | null;
}

export interface DashboardAccommodationOperations {
  occupiedBeds: number;
  vacantBeds: number;
  moveInsThisMonth: number;
  pendingPaymentsCount: number;
}

export interface DashboardMessOperations {
  membersReceivingMeals: number;
  menusPublishedThisMonth: number;
  openPollsCount: number;
  todaysHeadcount: number | null;
  pollRespondedCount: number;
  pollEligibleCount: number;
}

export interface SpaceNotification {
  notificationId: string;
  spaceId: string;
  organizationId?: string | null;
  userId?: string;
  actorId?: string | null;
  entityType?: string;
  title: string;
  message?: string | null;
  notificationType: string;
  category: NotificationCategory;
  priority: NotificationPriority;
  status: NotificationStatus;
  actionLabel?: string | null;
  actionRoute?: string | null;
  entityId?: string | null;
  readAt?: string | null;
  resolvedAt?: string | null;
  deliveryChannels?: string[];
  createdAt: string;
  updatedAt?: string;
}

export interface PendingActionGroup {
  actionType: string;
  title: string;
  actionLabel?: string | null;
  actionRoute?: string | null;
  priority: NotificationPriority;
  count: number;
  items: SpaceNotification[];
}

export interface PendingActionsSummary {
  totalCount: number;
  groups: PendingActionGroup[];
}

export interface DashboardSummaryResponse {
  spaceType: SpaceType;
  month: string;
  financial: DashboardFinancialSummary;
  messOperations?: DashboardMessOperations | null;
  accommodationOperations?: DashboardAccommodationOperations | null;
  attention?: unknown[];
  pendingActions?: PendingActionsSummary | null;
}

export interface NotificationListResponse {
  notifications: SpaceNotification[];
  unreadCount: number;
}

export interface GlobalAttentionItem {
  actionType: string;
  title: string;
  message?: string | null;
  count: number;
  priority: NotificationPriority;
  actionLabel?: string | null;
  actionRoute?: string | null;
  sampleEntityId?: string | null;
}

export interface GlobalAttentionSpace {
  spaceId: string;
  spaceName: string;
  spaceType?: SpaceType | string | null;
  count: number;
  items: GlobalAttentionItem[];
}

export interface GlobalActivityItem {
  notificationId: string;
  spaceId: string;
  spaceName?: string | null;
  notificationType: string;
  category: NotificationCategory;
  title: string;
  message?: string | null;
  actionRoute?: string | null;
  entityId?: string | null;
  createdAt: string;
}

export interface GlobalSpaceStatus {
  spaceId: string;
  spaceName: string;
  spaceType?: SpaceType | string | null;
  membershipRole: string;
  pendingActionCount: number;
  needsAttention: boolean;
}

export interface GlobalDashboardResponse {
  totalAttentionCount: number;
  unreadNotificationCount: number;
  attentionRequired: GlobalAttentionSpace[];
  attentionHasMore: boolean;
  recentActivity: GlobalActivityItem[];
  activityHasMore: boolean;
  spaceSummaries: GlobalSpaceStatus[];
}
