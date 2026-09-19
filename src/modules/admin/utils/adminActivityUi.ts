import type { AdminActivityType } from '@/shared/types/admin';

/** Accent colors aligned to Activity Figma mock. */
const ACCENTS: Record<AdminActivityType, { bg: string; fg: string }> = {
  NEW_ENQUIRY: { bg: '#DCFCE7', fg: '#16A34A' },
  ENQUIRY_SHARED: { bg: '#F3E8FF', fg: '#7C3AED' },
  ENQUIRY_REJECTED: { bg: '#F3E8FF', fg: '#7C3AED' },
  NEW_USER_REGISTRATION: { bg: '#DBEAFE', fg: '#2563EB' },
  NEW_PROPERTY_REGISTRATION: { bg: '#FFEDD5', fg: '#EA580C' },
  NEW_PROPERTY_LISTED: { bg: '#FFEDD5', fg: '#EA580C' },
  LEAD_CLAIMED_PROPERTY: { bg: '#FFEDD5', fg: '#C2410C' },
  NEW_MESS_REGISTRATION: { bg: '#FFEDD5', fg: '#EA580C' },
  NEW_MESS_LISTED: { bg: '#FFEDD5', fg: '#EA580C' },
  LEAD_CLAIMED_MESS: { bg: '#FFEDD5', fg: '#C2410C' },
  ADDRESS_SAVED: { bg: '#FEE2E2', fg: '#DC2626' },
};

export function adminActivityAccent(type: AdminActivityType): { bg: string; fg: string } {
  return ACCENTS[type] ?? { bg: '#F1F5F9', fg: '#475569' };
}

export function formatAdminRelativeTime(iso: string, now = Date.now()): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '—';
  const diffSec = Math.round((now - then) / 1000);
  if (diffSec < 45) return 'Just now';
  const diffMin = Math.round(diffSec / 60);
  if (diffMin < 60) return `${diffMin} min ago`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `${diffHr} hour${diffHr === 1 ? '' : 's'} ago`;
  const diffDay = Math.round(diffHr / 24);
  if (diffDay === 1) return 'Yesterday';
  if (diffDay < 7) return `${diffDay} days ago`;
  return new Date(iso).toLocaleDateString();
}

/** Figma activity card timestamp: "Today, 5:42 PM" or "Sep 09, 2026, 6:45 PM". */
export function formatAdminActivityCardTime(iso: string, now = new Date()): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  const time = date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  const startToday = new Date(now);
  startToday.setHours(0, 0, 0, 0);
  const startThat = new Date(date);
  startThat.setHours(0, 0, 0, 0);
  const dayDiff = Math.round((startToday.getTime() - startThat.getTime()) / 86_400_000);
  if (dayDiff === 0) return `Today, ${time}`;
  if (dayDiff === 1) return `Yesterday, ${time}`;
  const day = date.toLocaleDateString(undefined, {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  });
  return `${day}, ${time}`;
}

export type AdminDashboardDateRangeKey = '7d' | '30d' | '60d' | '90d' | 'custom';

export type AdminDashboardTrendMetric =
  | 'ENQUIRIES'
  | 'REGISTERED_USERS'
  | 'PROPERTY_REGISTRATIONS'
  | 'MESS_REGISTRATIONS'
  | 'PROPERTY_SPACES'
  | 'MESS_SPACES'
  | 'OWNERS'
  | 'SAVED_ADDRESSES'
  | 'CREDIT_PAYMENTS';

export const ADMIN_DASHBOARD_TREND_METRICS: AdminDashboardTrendMetric[] = [
  'ENQUIRIES',
  'REGISTERED_USERS',
  'PROPERTY_REGISTRATIONS',
  'MESS_REGISTRATIONS',
  'PROPERTY_SPACES',
  'MESS_SPACES',
  'OWNERS',
  'SAVED_ADDRESSES',
  'CREDIT_PAYMENTS',
];

function toIsoDate(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function adminDashboardDateRange(
  key: Exclude<AdminDashboardDateRangeKey, 'custom'>,
): { from: string; to: string } {
  const to = new Date();
  const from = new Date();
  const days = key === '7d' ? 6 : key === '30d' ? 29 : key === '60d' ? 59 : 89;
  from.setHours(0, 0, 0, 0);
  from.setDate(from.getDate() - days);
  to.setHours(0, 0, 0, 0);
  return {
    from: toIsoDate(from),
    to: toIsoDate(to),
  };
}

export function defaultCustomDashboardRange(): { from: string; to: string } {
  return adminDashboardDateRange('7d');
}
