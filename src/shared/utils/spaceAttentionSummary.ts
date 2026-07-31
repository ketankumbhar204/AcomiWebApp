import type { PendingActionsSummary } from '@/shared/types/dashboard';

export type SpaceAttentionItem = {
  actionType: string;
  title: string;
  detail?: string | null;
};

export type SpaceAttentionSummary = {
  totalCount: number;
  items: SpaceAttentionItem[];
  primary: SpaceAttentionItem | null;
  moreCount: number;
};

const MAX_VISIBLE_ITEMS = 2;

const TENANT_ATTENTION_PRIORITY: Record<string, number> = {
  PAYMENT_UPDATE_REQUESTED: 10,
  PAYMENT_OVERDUE: 15,
  PAYMENT_NEEDS_UPDATE: 18,
  PAYMENT_REJECTED: 20,
  MEAL_POLL_PUBLISHED: 30,
  MEAL_POLL_REMINDER: 35,
  TENANT_PROFILE_INCOMPLETE: 40,
  MISSING_KYC_DOCUMENTS: 45,
  MISSING_ADDRESS_PROOF: 50,
  COMPLAINT_COMMENTED: 60,
  COMPLAINT_RESOLVED: 65,
  PENDING_INVITATION: 70,
  PAYMENT_APPROVED: 80,
  INVITATION_ACCEPTED: 90,
};

const MEAL_ATTENTION_TYPES = new Set([
  'MEAL_POLL_PUBLISHED',
  'MEAL_POLL_REMINDER',
]);

function priorityFor(type: string): number {
  return TENANT_ATTENTION_PRIORITY[type] ?? 500;
}

function itemDetail(group: PendingActionsSummary['groups'][number]): string | null {
  const first = group.items?.[0];
  const message = first?.message?.trim();
  if (message) return message;
  return group.actionLabel?.trim() || null;
}

function selectVisibleAttentionGroups(
  groups: PendingActionsSummary['groups'],
  maxVisible = MAX_VISIBLE_ITEMS,
): PendingActionsSummary['groups'] {
  if (groups.length === 0 || maxVisible <= 0) return [];

  const seen = new Set<string>();
  const unique = groups.filter((group) => {
    if (seen.has(group.actionType)) return false;
    seen.add(group.actionType);
    return true;
  });

  const sorted = unique.sort(
    (a, b) => priorityFor(a.actionType) - priorityFor(b.actionType),
  );

  if (sorted.length === 1 || maxVisible === 1) {
    return sorted.slice(0, 1);
  }

  const first = sorted[0]!;
  const remaining = sorted.slice(1);
  const mealInRemaining = remaining.find((group) => MEAL_ATTENTION_TYPES.has(group.actionType));
  const second = mealInRemaining ?? remaining[0];
  return second ? [first, second] : [first];
}

/** Compact attention summary for customer/tenant My Spaces cards (mobile parity). */
export function buildSpaceAttentionSummary(
  summary: PendingActionsSummary | null | undefined,
): SpaceAttentionSummary {
  if (!summary || summary.totalCount <= 0 || summary.groups.length === 0) {
    return { totalCount: 0, items: [], primary: null, moreCount: 0 };
  }

  const visibleGroups = selectVisibleAttentionGroups(summary.groups);
  const items = visibleGroups.map((group) => ({
    actionType: group.actionType,
    title: group.title,
    detail: itemDetail(group),
  }));

  return {
    totalCount: summary.totalCount,
    items,
    primary: items[0] ?? null,
    moreCount: Math.max(0, summary.totalCount - items.length),
  };
}
