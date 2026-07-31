import type {
  ComplaintCategory,
  ComplaintPriority,
  ComplaintStatus,
} from '@/shared/types/complaints';
import type { MembershipRole, SpaceType } from '@/shared/types/space';
import type { StatusChipTone } from '@/shared/components/StatusChip';

const TENANT_CATEGORIES: ComplaintCategory[] = [
  'MAINTENANCE',
  'HOUSEKEEPING',
  'FOOD',
  'BILLING',
  'SAFETY',
  'OTHER',
];

const MESS_CATEGORIES: ComplaintCategory[] = [
  'FOOD_QUALITY',
  'FOOD_SERVICE',
  'BILLING',
  'SERVICE',
  'OTHER',
];

const FOOD_CATEGORIES: ComplaintCategory[] = ['FOOD', 'FOOD_QUALITY', 'FOOD_SERVICE'];

export function categoriesForSpaceType(spaceType: SpaceType | undefined): ComplaintCategory[] {
  if (spaceType === 'MESS') {
    return MESS_CATEGORIES;
  }
  return TENANT_CATEGORIES;
}

export function isFoodCategory(category: ComplaintCategory): boolean {
  return FOOD_CATEGORIES.includes(category);
}

export function canManageComplaints(role: MembershipRole | undefined): boolean {
  return role === 'OWNER' || role === 'MANAGER';
}

export function canRaiseComplaint(
  role: MembershipRole | undefined,
  permissionFlag?: boolean,
): boolean {
  if (permissionFlag === true) {
    return true;
  }
  return role === 'OWNER' || role === 'MANAGER' || role === 'TENANT' || role === 'CUSTOMER';
}

export function statusLabelKey(status: ComplaintStatus | string): string {
  return `complaints.status.${status}`;
}

export function priorityLabelKey(priority: ComplaintPriority | string): string {
  return `complaints.priority.${priority}`;
}

export function categoryLabelKey(category: ComplaintCategory | string): string {
  return `complaints.category.${category}`;
}

export function timelineEventLabelKey(eventType: string): string {
  return `complaints.timelineEvent.${eventType}`;
}

export function formatComplaintDateTime(value?: string | null): string {
  if (!value) {
    return '—';
  }
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

export function formatComplaintDate(value?: string | null): string {
  if (!value) {
    return '—';
  }
  try {
    return new Date(value).toLocaleDateString();
  } catch {
    return value;
  }
}

export function complaintStatusTone(status?: ComplaintStatus | string | null): StatusChipTone {
  switch (status) {
    case 'OPEN':
      return 'success';
    case 'IN_PROGRESS':
      return 'warning';
    case 'RESOLVED':
      return 'info';
    case 'CLOSED':
      return 'neutral';
    case 'CANCELLED':
      return 'error';
    default:
      return 'default';
  }
}

export function complaintPriorityTone(priority?: ComplaintPriority | string | null): StatusChipTone {
  switch (priority) {
    case 'LOW':
      return 'neutral';
    case 'MEDIUM':
      return 'warning';
    case 'HIGH':
    case 'URGENT':
      return 'error';
    default:
      return 'default';
  }
}

export function complaintInitials(name?: string | null): string {
  if (!name?.trim()) return '?';
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

const AVATAR_ACCENTS = ['#7C3AED', '#3B82F6', '#059669', '#F59E0B', '#EC4899', '#128C7E'] as const;

export function complaintAvatarAccent(seed?: string | null): string {
  if (!seed) return AVATAR_ACCENTS[0];
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash + seed.charCodeAt(i) * (i + 1)) % AVATAR_ACCENTS.length;
  }
  return AVATAR_ACCENTS[hash] ?? AVATAR_ACCENTS[0];
}
